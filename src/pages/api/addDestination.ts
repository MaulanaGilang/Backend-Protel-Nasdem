// src/pages/api/addDestination.ts

import type { NextApiRequest, NextApiResponse } from 'next'
import supabase from '../../app/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { placeName, latitude, longitude, totalNodes } = req.body

  const { data, error } = await supabase
    .from('places')
    .insert([{ places_name: placeName, latitude, longitude, total_nodes: totalNodes }])

  if (error) return res.status(500).json({ error: error.message })
  return res.status(200).json(data)
}
