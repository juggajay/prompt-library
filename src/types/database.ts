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
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      prompts: {
        Row: {
          id: string
          user_id: string
          title: string
          prompt_text: string
          description: string | null
          category: string
          tags: string[]
          metadata: Json
          version: number
          parent_prompt_id: string | null
          is_favorite: boolean
          is_public: boolean
          use_count: number
          last_used_at: string | null
          ai_category: string | null
          ai_tags: string[] | null
          quality_score: number | null
          embedding: number[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          prompt_text: string
          description?: string | null
          category: string
          tags?: string[]
          metadata?: Json
          version?: number
          parent_prompt_id?: string | null
          is_favorite?: boolean
          is_public?: boolean
          use_count?: number
          last_used_at?: string | null
          ai_category?: string | null
          ai_tags?: string[] | null
          quality_score?: number | null
          embedding?: number[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          prompt_text?: string
          description?: string | null
          category?: string
          tags?: string[]
          metadata?: Json
          version?: number
          parent_prompt_id?: string | null
          is_favorite?: boolean
          is_public?: boolean
          use_count?: number
          last_used_at?: string | null
          ai_category?: string | null
          ai_tags?: string[] | null
          quality_score?: number | null
          embedding?: number[] | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_usage: {
        Args: {
          prompt_id: string
        }
        Returns: void
      }
      match_prompts: {
        Args: {
          query_embedding: number[]
          match_threshold: number
          match_count: number
        }
        Returns: {
          id: string
          title: string
          prompt_text: string
          similarity: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
