import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export function createBrowserClient() {
  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase credentials not configured in .env.local')
    return createClient('https://placeholder.supabase.co', 'placeholder-key')
  }
  return createClient(supabaseUrl, supabaseKey)
}
