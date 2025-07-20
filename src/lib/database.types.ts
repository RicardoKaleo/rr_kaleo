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
      clients: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string
          company: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          email: string
          company?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string
          company?: string | null
          status?: string
          created_at?: string
        }
      }
      clients_meta: {
        Row: {
          id: string
          client_id: string
          meta_data: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          meta_data: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          meta_data?: Json
          created_at?: string
          updated_at?: string
        }
      }
      gmail_integrations: {
        Row: {
          id: string
          client_id: string
          email_address: string
          access_token: string
          refresh_token: string
          token_expires_at: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          email_address: string
          access_token: string
          refresh_token: string
          token_expires_at: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          email_address?: string
          access_token?: string
          refresh_token?: string
          token_expires_at?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      google_drive_integrations: {
        Row: {
          id: string
          user_id: string
          email_address: string
          access_token: string
          refresh_token: string
          token_expires_at: string
          folder_id: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email_address: string
          access_token: string
          refresh_token: string
          token_expires_at: string
          folder_id?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email_address?: string
          access_token?: string
          refresh_token?: string
          token_expires_at?: string
          folder_id?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          role: string
          created_at: string
        }
        Insert: {
          id: string
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          role?: string
          created_at?: string
        }
      }
      job_listings: {
        Row: {
          id: string
          client_id: string | null
          title: string
          company: string
          location: string
          job_url: string | null
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id?: string | null
          title: string
          company: string
          location: string
          job_url?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string | null
          title?: string
          company?: string
          location?: string
          job_url?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      job_recruiters: {
        Row: {
          id: string
          job_listing_id: string
          recruiter_id: string
          created_at: string
        }
        Insert: {
          id?: string
          job_listing_id: string
          recruiter_id: string
          created_at?: string
        }
        Update: {
          id?: string
          job_listing_id?: string
          recruiter_id?: string
          created_at?: string
        }
      }
      recruiters: {
        Row: {
          id: string
          name: string
          email: string
          company: string | null
          position: string | null
          linkedin_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          company?: string | null
          position?: string | null
          linkedin_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          company?: string | null
          position?: string | null
          linkedin_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      email_templates: {
        Row: {
          id: string
          user_id: string
          name: string
          subject: string
          body: string
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          subject: string
          body: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          subject?: string
          body?: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      email_campaigns: {
        Row: {
          id: string
          job_listing_id: string
          gmail_integration_id: string
          template_id: string | null
          custom_subject: string | null
          custom_body: string | null
          resume_file_url: string | null
          status: string
          scheduled_at: string | null
          sent_at: string | null
          thread_id: string | null
          replied_at: string | null
          reply_status: string
          created_at: string
        }
        Insert: {
          id?: string
          job_listing_id: string
          gmail_integration_id: string
          template_id?: string | null
          custom_subject?: string | null
          custom_body?: string | null
          resume_file_url?: string | null
          status?: string
          scheduled_at?: string | null
          sent_at?: string | null
          thread_id?: string | null
          replied_at?: string | null
          reply_status?: string
          created_at?: string
        }
        Update: {
          id?: string
          job_listing_id?: string
          gmail_integration_id?: string
          template_id?: string | null
          custom_subject?: string | null
          custom_body?: string | null
          resume_file_url?: string | null
          status?: string
          scheduled_at?: string | null
          sent_at?: string | null
          thread_id?: string | null
          replied_at?: string | null
          reply_status?: string
          created_at?: string
        }
      }
      email_campaign_followups: {
        Row: {
          id: string
          campaign_id: string
          second_followup_enabled: boolean
          second_followup_template_id: string | null
          second_followup_days_after: number
          third_followup_enabled: boolean
          third_followup_template_id: string | null
          third_followup_days_after: number
          second_followup_sent_at: string | null
          third_followup_sent_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          second_followup_enabled?: boolean
          second_followup_template_id?: string | null
          second_followup_days_after?: number
          third_followup_enabled?: boolean
          third_followup_template_id?: string | null
          third_followup_days_after?: number
          second_followup_sent_at?: string | null
          third_followup_sent_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          second_followup_enabled?: boolean
          second_followup_template_id?: string | null
          second_followup_days_after?: number
          third_followup_enabled?: boolean
          third_followup_template_id?: string | null
          third_followup_days_after?: number
          second_followup_sent_at?: string | null
          third_followup_sent_at?: string | null
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
} 