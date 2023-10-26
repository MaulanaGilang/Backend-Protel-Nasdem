import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vsjaooaxfprqgizgwgiz.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY

if (!supabaseKey) {
  throw new Error("Missing Supabase key. Ensure you've set the SUPABASE_KEY environment variable.")
}

const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase
