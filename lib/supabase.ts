import { createClientComponentClient, createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

// Client-side Supabase client
export const createClient = () => createClientComponentClient()

// Server-side Supabase client
export const createServerClient = () => createServerComponentClient({ cookies })

// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
      }
      meditation_presets: {
        Row: {
          id: string
          name: string
          description: string | null
          duration: number
          type: "breathing" | "mindfulness" | "body-scan"
          breathing_pattern: any | null
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          duration: number
          type: "breathing" | "mindfulness" | "body-scan"
          breathing_pattern?: any | null
          is_default?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          duration?: number
          type?: "breathing" | "mindfulness" | "body-scan"
          breathing_pattern?: any | null
          is_default?: boolean
          created_at?: string
        }
      }
      meditation_sessions: {
        Row: {
          id: string
          user_id: string
          preset_id: string
          duration: number
          completed: boolean
          voice_settings: any
          sound_enabled: boolean
          notes: string | null
          session_date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          preset_id: string
          duration: number
          completed?: boolean
          voice_settings: any
          sound_enabled?: boolean
          notes?: string | null
          session_date?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          preset_id?: string
          duration?: number
          completed?: boolean
          voice_settings?: any
          sound_enabled?: boolean
          notes?: string | null
          session_date?: string
          created_at?: string
        }
      }
      meditation_goals: {
        Row: {
          id: string
          user_id: string
          type: "daily" | "weekly" | "monthly"
          target: number
          metric: "minutes" | "sessions"
          start_date: string
          end_date: string
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: "daily" | "weekly" | "monthly"
          target: number
          metric: "minutes" | "sessions"
          start_date: string
          end_date: string
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: "daily" | "weekly" | "monthly"
          target?: number
          metric?: "minutes" | "sessions"
          start_date?: string
          end_date?: string
          active?: boolean
          created_at?: string
        }
      }
      badges: {
        Row: {
          id: string
          name: string
          description: string | null
          icon: string | null
          requirement_type: "streak" | "total_sessions" | "total_minutes" | "completion_rate"
          requirement_value: number
          created_at: string
        }
      }
      user_badges: {
        Row: {
          id: string
          user_id: string
          badge_id: string
          earned_date: string
        }
        Insert: {
          id?: string
          user_id: string
          badge_id: string
          earned_date?: string
        }
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          speech_rate: number
          voice_enabled: boolean
          sound_enabled: boolean
          selected_voice: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          speech_rate?: number
          voice_enabled?: boolean
          sound_enabled?: boolean
          selected_voice?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          speech_rate?: number
          voice_enabled?: boolean
          sound_enabled?: boolean
          selected_voice?: string | null
          updated_at?: string
        }
      }
    }
  }
}
