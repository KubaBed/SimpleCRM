import { createSupabaseClient } from '../_lib/supabase.js'

export default async function handler(req, res) {
  const authHeader = req.headers.authorization
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const supabase = createSupabaseClient()

  try {
    const user = process.env.GMAIL_USER
    const pass = process.env.GMAIL_APP_PASSWORD
    const auth = Buffer.from(`${user}:${pass}`).toString('base64')

    const listRes = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread+in:inbox&maxResults=10',
      { headers: { Authorization: `Basic ${auth}` } }
    )
    const listData = await listRes.json()
    const messages = listData.messages || []

    for (const msg of messages) {
      const detailRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject`,
        { headers: { Authorization: `Basic ${auth}` } }
      )
      const detail = await detailRes.json()
      const headers = detail.payload?.headers || []
      const fromHeader = headers.find(h => h.name === 'From')
      const subjectHeader = headers.find(h => h.name === 'Subject')
      const from = fromHeader?.value || ''
      const subject = subjectHeader?.value || ''
      const fromEmail = from.match(/<(.+?)>/)?.[1] || from.trim()

      const { data: existing } = await supabase
        .from('email_tracking')
        .select('id')
        .eq('message_id', msg.id)
        .maybeSingle()

      if (existing) continue

      const { data: existingLead } = await supabase
        .from('leads')
        .select('id')
        .eq('email', fromEmail)
        .maybeSingle()

      let leadId = existingLead?.id

      if (!leadId) {
        const nameMatch = from.match(/^"?([^"<]+)"?\s*</)
        const name = nameMatch ? nameMatch[1].trim() : fromEmail
        const [firstName, ...lastParts] = name.split(' ')
        const lastName = lastParts.join(' ')

        const { data: newLead, error: createError } = await supabase
          .from('leads')
          .insert({
            first_name: firstName || fromEmail,
            last_name: lastName || '',
            email: fromEmail,
            source: 'Email',
            stage: 'nowy'
          })
          .select()
          .single()

        if (createError) {
          console.error('Failed to create lead:', createError)
          continue
        }

        leadId = newLead.id

        await supabase.from('activities').insert({
          lead_id: leadId,
          type: 'created',
          description: `Lead utworzony automatycznie z maila: "${subject}"`
        })
      }

      await supabase.from('email_tracking').insert({
        message_id: msg.id,
        from_email: fromEmail,
        subject,
        lead_id: leadId
      })

      await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}/modify`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ removeLabelIds: ['UNREAD'] })
        }
      )
    }

    return res.status(200).json({ processed: messages.length })
  } catch (error) {
    console.error('Email check failed:', error)
    return res.status(500).json({ error: error.message })
  }
}
