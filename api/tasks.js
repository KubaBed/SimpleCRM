import { createSupabaseClient } from './_lib/supabase.js'

export default async function handler(req, res) {
  const { id } = req.query
  const supabase = createSupabaseClient()

  if (req.method === 'GET') {
    const { data, error } = await supabase.from('tasks')
      .select('*')
      .eq('lead_id', id)
      .order('due_date', { ascending: true, nullsLast: true })

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'POST') {
    const { data, error } = await supabase.from('tasks')
      .insert({ ...req.body, lead_id: id })
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })

    await supabase.from('activities').insert({
      lead_id: id,
      type: 'task_added',
      description: `Zadanie: ${data.title}`
    })

    return res.status(201).json(data)
  }

  res.setHeader('Allow', 'GET, POST')
  res.status(405).json({ error: `Method ${req.method} not allowed` })
}
