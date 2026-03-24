import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  console.warn(
    'Brak VITE_SUPABASE_URL lub VITE_SUPABASE_ANON_KEY — skopiuj .env.example do .env i uzupełnij.',
  )
}

export const supabase = createClient(url ?? '', anonKey ?? '')
