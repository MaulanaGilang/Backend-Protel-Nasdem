import type { NextApiRequest, NextApiResponse } from "next";
import supabase from "../../app/supabaseClient";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    
    // Fetch data from Supabase excluding places with "turn" in their name
    const { data, error } = await supabase
      .from("distance")
      .select("*")

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: "No locations found" });
    }

    return res.status(200).json(data);

  } else {
    return res.status(405).json({ message: "Method Not Allowed" });
  }
}
