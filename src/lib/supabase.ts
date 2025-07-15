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
      clients_meta: {
        Row: {
          id: string
          client_id: string
          gender: 'Female' | 'Male' | 'Non-Binary' | null
          ethnicity: 'Asian' | 'Black or African American' | 'Hispanic or Latino' | 'Native American or Native Alaska' | 'Native Haiwaiian or other Pacific Islander' | 'Two or more races' | null
          veteran_status: 'I am a protected veteran' | 'I am a veteran but not protected' | 'I am not a veteran' | null
          disability: "I don't have a disability" | 'I have a disability' | null
          salary_expectations: string | null
          notice_period: string | null
          title_role: string | null
          travel_percent: number | null
          client_references: string | null
          geographic_preferences: string | null
          work_experience: string | null
          work_preference: 'Full Remote' | 'Hybrid' | 'On-Site' | null
          visa_status: 'I have a work permit' | 'I need to be sponsored for VISA' | "I'm a citizen" | 'Other (Comment to Specify)' | null
          observations: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          gender?: 'Female' | 'Male' | 'Non-Binary' | null
          ethnicity?: 'Asian' | 'Black or African American' | 'Hispanic or Latino' | 'Native American or Native Alaska' | 'Native Haiwaiian or other Pacific Islander' | 'Two or more races' | null
          veteran_status?: 'I am a protected veteran' | 'I am a veteran but not protected' | 'I am not a veteran' | null
          disability?: "I don't have a disability" | 'I have a disability' | null
          salary_expectations?: string | null
          notice_period?: string | null
          title_role?: string | null
          travel_percent?: number | null
          client_references?: string | null
          geographic_preferences?: string | null
          work_experience?: string | null
          work_preference?: 'Full Remote' | 'Hybrid' | 'On-Site' | null
          visa_status?: 'I have a work permit' | 'I need to be sponsored for VISA' | "I'm a citizen" | 'Other (Comment to Specify)' | null
          observations?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          gender?: 'Female' | 'Male' | 'Non-Binary' | null
          ethnicity?: 'Asian' | 'Black or African American' | 'Hispanic or Latino' | 'Native American or Native Alaska' | 'Native Haiwaiian or other Pacific Islander' | 'Two or more races' | null
          veteran_status?: 'I am a protected veteran' | 'I am a veteran but not protected' | 'I am not a veteran' | null
          disability?: "I don't have a disability" | 'I have a disability' | null
          salary_expectations?: string | null
          notice_period?: string | null
          title_role?: string | null
          travel_percent?: number | null
          client_references?: string | null
          geographic_preferences?: string | null
          work_experience?: string | null
          work_preference?: 'Full Remote' | 'Hybrid' | 'On-Site' | null
          visa_status?: 'I have a work permit' | 'I need to be sponsored for VISA' | "I'm a citizen" | 'Other (Comment to Specify)' | null
          observations?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
} 