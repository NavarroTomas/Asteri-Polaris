import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl) {
  throw new Error(
    'Falta VITE_SUPABASE_URL en el archivo .env'
  )
}

if (!supabasePublishableKey) {
  throw new Error(
    'Falta VITE_SUPABASE_PUBLISHABLE_KEY en el archivo .env'
  )
}

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
)