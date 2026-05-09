import { createSupabaseClient } from './_lib/supabase.js'

export default async function handler(req, res) {
  const { id } = req.query
  const supabase = createSupabaseClient()

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: `Method ${req.method} not allowed` })
  }

  const { data, error } = await supabase.from('activities')
    .select('*')
    .eq('lead_id', id)
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })
  return res.status(200).json(data)
}
