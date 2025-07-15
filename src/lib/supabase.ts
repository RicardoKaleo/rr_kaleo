import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types (we'll generate these later)
export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          role: 'manager' | 'final_user'
          full_name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role?: 'manager' | 'final_user'
          full_name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: 'manager' | 'final_user'
          full_name?: string
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          name: string
          email: string
          company: string | null
          phone: string | null
          linkedin_url: string | null
          notes: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          company?: string | null
          phone?: string | null
          linkedin_url?: string | null
          notes?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          company?: string | null
          phone?: string | null
          linkedin_url?: string | null
          notes?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
} 