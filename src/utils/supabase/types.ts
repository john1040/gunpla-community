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
          created_at: string
          display_name: string | null
          avatar_url: string | null
        }
        Insert: {
          id: string
          created_at?: string
          display_name?: string | null
          avatar_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          display_name?: string | null
          avatar_url?: string | null
        }
      }
      wanted_list: {
        Row: {
          id: string
          created_at: string
          user_id: string
          kit_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          kit_id: string
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          kit_id?: string
        }
      }
      kits: {
        Row: {
          id: string
          name_en: string
          grade: string
          created_at: string
        }
        Insert: {
          id?: string
          name_en: string
          grade: string
          created_at?: string
        }
        Update: {
          id?: string
          name_en?: string
          grade?: string
          created_at?: string
        }
      }
      kit_images: {
        Row: {
          id: string
          created_at: string
          kit_id: string
          image_url: string
        }
        Insert: {
          id?: string
          created_at?: string
          kit_id: string
          image_url: string
        }
        Update: {
          id?: string
          created_at?: string
          kit_id?: string
          image_url?: string
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