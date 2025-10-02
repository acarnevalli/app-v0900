import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Running in offline mode.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper para verificar se o Supabase está configurado
export const isSupabaseConfigured = () => {
  return !!supabaseUrl && !!supabaseAnonKey
}
