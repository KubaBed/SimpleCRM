import { createSupabaseClient } from './_lib/supabase.js'

export default async function handler(req, res) {
  const { id } = req.query
  const supabase = createSupabaseClient()

  if (req.method === 'PATCH') {
    const old = await supabase.from('leads').select('stage').eq('id', id).single()

    const { data, error } = await supabase.from('leads')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })

    if (req.body.stage && old.data && old.data.stage !== req.body.stage) {
      await supabase.from('activities').insert({
        lead_id: id,
        type: 'stage_change',
        description: `Etap: ${old.data.stage} → ${req.body.stage}`
      })
    }

    if (req.body.notes !== undefined) {
      await supabase.from('activities').insert({
        lead_id: id,
        type: 'note_added',
        description: 'Notatka zaktualizowana'
      })
    }

    return res.status(200).json(data)
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase.from('leads').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  res.setHeader('Allow', 'PATCH, DELETE')
  res.status(405).json({ error: `Method ${req.method} not allowed` })
}
