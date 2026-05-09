import { createSupabaseClient } from './_lib/supabase.js'

export default async function handler(req, res) {
  const { id } = req.query
  const supabase = createSupabaseClient()

  if (req.method === 'PATCH') {
    const { data, error } = await supabase.from('tasks')
      .update(req.body)
      .eq('id', id)
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })

    if (req.body.completed) {
      await supabase.from('activities').insert({
        lead_id: data.lead_id,
        type: 'task_completed',
        description: `Zadanie ukończone: ${data.title}`
      })
    }

    return res.status(200).json(data)
  }

  res.setHeader('Allow', 'PATCH')
  res.status(405).json({ error: `Method ${req.method} not allowed` })
}
