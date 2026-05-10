import { createSupabaseClient } from '../../_lib/supabase.js'
import { scrapeWebsite, buildBriefMarkdown, ScrapeError } from '../../_lib/scrape.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: `Method ${req.method} not allowed` })
  }

  const { id } = req.query
  const supabase = createSupabaseClient()

  const { data: lead, error: fetchErr } = await supabase
    .from('leads')
    .select('id, website, notes')
    .eq('id', id)
    .single()

  if (fetchErr || !lead) {
    return res.status(404).json({ error: 'Lead nie znaleziony' })
  }
  if (!lead.website) {
    return res.status(400).json({ error: 'Lead nie ma podanej strony www' })
  }

  let scraped
  try {
    scraped = await scrapeWebsite(lead.website)
  } catch (err) {
    if (err instanceof ScrapeError) {
      return res.status(err.status).json({ error: err.message })
    }
    console.error('[brief] scrape failed', err)
    return res.status(500).json({ error: 'Nieoczekiwany błąd scrapera' })
  }

  const briefMd = buildBriefMarkdown(scraped)
  const newNotes = lead.notes
    ? `${lead.notes}\n\n---\n\n${briefMd}`
    : briefMd

  const { data: updated, error: updateErr } = await supabase
    .from('leads')
    .update({ notes: newNotes, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (updateErr) {
    return res.status(500).json({ error: updateErr.message })
  }

  let hostname = ''
  try { hostname = new URL(lead.website).hostname } catch {}

  await supabase.from('activities').insert({
    lead_id: id,
    type: 'brief_generated',
    description: hostname ? `Brief wygenerowany ze strony ${hostname}` : 'Brief wygenerowany'
  })

  return res.status(200).json({ lead: updated, brief: briefMd })
}
