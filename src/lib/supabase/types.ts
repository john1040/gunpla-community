export type Database = {
  public: {
    Tables: {
      kits: {
        Row: {
          id: string
          name_en: string
          name_jp: string | null
          grade: string
          scale: string
          release_date: string | null
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name_en: string
          name_jp?: string | null
          grade: string
          scale: string
          release_date?: string | null
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name_en?: string
          name_jp?: string | null
          grade?: string
          scale?: string
          release_date?: string | null
          description?: string | null
          created_at?: string
        }
      }
      kit_images: {
        Row: {
          id: string
          kit_id: string
          image_url: string
          created_at: string
        }
        Insert: {
          id?: string
          kit_id: string
          image_url: string
          created_at?: string
        }
        Update: {
          id?: string
          kit_id?: string
          image_url?: string
          created_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          display_name: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
      }
      ratings: {
        Row: {
          id: string
          user_id: string
          kit_id: string
          rating: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          kit_id: string
          rating: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          kit_id?: string
          rating?: number
          created_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          user_id: string
          kit_id: string
          parent_id: string | null
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          kit_id: string
          parent_id?: string | null
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          kit_id?: string
          parent_id?: string | null
          content?: string
          created_at?: string
        }
      }
      comment_likes: {
        Row: {
          id: string
          user_id: string
          comment_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          comment_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          comment_id?: string
          created_at?: string
        }
      }
      wanted_list: {
        Row: {
          id: string
          user_id: string
          kit_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          kit_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          kit_id?: string
          created_at?: string
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