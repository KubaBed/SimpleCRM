import { ImapFlow } from 'imapflow'
import { createSupabaseClient } from '../_lib/supabase.js'

const DEFAULT_SKIP_PATTERNS = 'noreply,no-reply,donotreply,mailer-daemon,postmaster,notifications,notification,alerts,alert,billing,newsletter'

function getSkipPatterns() {
  return (process.env.SKIP_EMAIL_PATTERNS || DEFAULT_SKIP_PATTERNS)
    .split(',')
    .map(p => p.trim().toLowerCase())
    .filter(Boolean)
}

function shouldSkipEmail(email) {
  const lower = email.toLowerCase()
  return getSkipPatterns().some(pattern => lower.includes(pattern))
}

export default async function handler(req, res) {
  const authHeader = req.headers.authorization
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const supabase = createSupabaseClient()
  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
    logger: false,
  })

  let processed = 0
  let created = 0
  const errors = []

  try {
    await client.connect()
    const lock = await client.getMailboxLock('INBOX')

    try {
      // Gmail-side filter: forwardowane maile na workshift.pl, nieprzeczytane
      const uids = await client.search(
        { gmailRaw: 'to:(workshift.pl) is:unread' },
        { uid: true }
      )

      if (!uids || uids.length === 0) {
        return res.status(200).json({ processed: 0, created: 0, errors: [] })
      }

      for await (const msg of client.fetch(
        uids,
        { envelope: true, source: false },
        { uid: true }
      )) {
        const messageId = msg.envelope?.messageId
        const fromObj = msg.envelope?.from?.[0]
        const subject = msg.envelope?.subject || ''
        const fromEmail = fromObj?.address?.toLowerCase() || ''
        const fromName = fromObj?.name || ''

        if (!messageId || !fromEmail) continue

        // Skip systemowe maile (noreply, notifications, billing, etc.)
        if (shouldSkipEmail(fromEmail)) {
          processed++
          continue
        }

        // Idempotency — skip jeśli już przetworzony
        const { data: existing } = await supabase
          .from('email_tracking')
          .select('id')
          .eq('message_id', messageId)
          .maybeSingle()

        if (existing) {
          processed++
          continue
        }

        // Upsert leada po emailu
        const { data: existingLead } = await supabase
          .from('leads')
          .select('id')
          .eq('email', fromEmail)
          .maybeSingle()

        let leadId = existingLead?.id

        if (!leadId) {
          const nameParts = (fromName || fromEmail).split(' ')
          const firstName = nameParts[0] || fromEmail
          const lastName = nameParts.slice(1).join(' ') || ''

          const { data: newLead, error } = await supabase
            .from('leads')
            .insert({
              first_name: firstName,
              last_name: lastName,
              email: fromEmail,
              source: 'Email',
              stage: 'nowy',
            })
            .select()
            .single()

          if (error) {
            errors.push({ messageId, error: error.message })
            continue
          }

          leadId = newLead.id
          created++

          await supabase.from('activities').insert({
            lead_id: leadId,
            type: 'created',
            description: `Lead utworzony automatycznie z maila: "${subject}"`,
          })
        } else {
          // Istniejący lead — log activity, ale bez tworzenia duplikatu
          await supabase.from('activities').insert({
            lead_id: leadId,
            type: 'email_received',
            description: `Otrzymany mail: "${subject}"`,
          })
        }

        await supabase.from('email_tracking').insert({
          message_id: messageId,
          from_email: fromEmail,
          subject,
          lead_id: leadId,
        })

        processed++
      }
    } finally {
      lock.release()
    }

    await client.logout()
    return res.status(200).json({ processed, created, errors })
  } catch (error) {
    console.error('Email check failed:', error)
    try { await client.logout() } catch {}
    return res.status(500).json({ error: error.message })
  }
}
