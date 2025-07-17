export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          full_name: string
          role: 'manager' | 'final_user'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          role?: 'manager' | 'final_user'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          role?: 'manager' | 'final_user'
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
          status: 'active' | 'inactive' | 'prospect'
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
          status?: 'active' | 'inactive' | 'prospect'
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
          status?: 'active' | 'inactive' | 'prospect'
          created_at?: string
          updated_at?: string
        }
      }
      clients_meta: {
        Row: {
          id: string
          client_id: string
          meta_key: string
          meta_value: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          meta_key: string
          meta_value: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          meta_key?: string
          meta_value?: Json
          created_at?: string
          updated_at?: string
        }
      }
      client_managers: {
        Row: {
          id: string
          client_id: string
          manager_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          manager_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          manager_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      client_final_users: {
        Row: {
          id: string
          client_id: string
          final_user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          final_user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          final_user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 