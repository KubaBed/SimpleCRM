import { createSupabaseClient } from './_lib/supabase.js'

export default async function handler(req, res) {
  const supabase = createSupabaseClient()

  if (req.method === 'GET') {
    let query = supabase.from('leads').select('*').order('created_at', { ascending: false })

    if (req.query.stage) query = query.eq('stage', req.query.stage)
    if (req.query.search) query = query.or(`first_name.ilike.%${req.query.search}%,last_name.ilike.%${req.query.search}%,email.ilike.%${req.query.search}%,company_name.ilike.%${req.query.search}%`)

    const { data, error } = await query
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'POST') {
    const { data, error } = await supabase.from('leads').insert(req.body).select().single()
    if (error) return res.status(500).json({ error: error.message })

    await supabase.from('activities').insert({
      lead_id: data.id,
      type: 'created',
      description: 'Lead utworzony'
    })

    return res.status(201).json(data)
  }

  res.setHeader('Allow', 'GET, POST')
  res.status(405).json({ error: `Method ${req.method} not allowed` })
}
