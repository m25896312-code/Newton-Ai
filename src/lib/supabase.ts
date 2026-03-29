import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Profile = {
  id: string
  full_name: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export type Problem = {
  id: string
  user_id: string
  title: string
  description: string
  image_url?: string
  subject: string
  grade_level: string
  status: 'pending' | 'solved'
  created_at: string
  updated_at: string
}

export type Solution = {
  id: string
  problem_id: string
  content: string
  steps: Array<{
    step_number: number
    description: string
    explanation: string
  }>
  created_at: string
}
