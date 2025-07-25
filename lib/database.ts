import { createClient } from "./supabase"
import type { Database } from "./supabase"

type MeditationPreset = Database["public"]["Tables"]["meditation_presets"]["Row"]
type MeditationSession = Database["public"]["Tables"]["meditation_sessions"]["Row"]
type MeditationGoal = Database["public"]["Tables"]["meditation_goals"]["Row"]
type Badge = Database["public"]["Tables"]["badges"]["Row"]
type UserBadge = Database["public"]["Tables"]["user_badges"]["Row"]
type UserSettings = Database["public"]["Tables"]["user_settings"]["Row"]

export class DatabaseService {
  private supabase = createClient()

  // Meditation Presets
  async getMeditationPresets(): Promise<MeditationPreset[]> {
    const { data, error } = await this.supabase.from("meditation_presets").select("*").order("duration")

    if (error) throw error
    return data || []
  }

  // Sessions
  async getUserSessions(userId: string): Promise<MeditationSession[]> {
    const { data, error } = await this.supabase
      .from("meditation_sessions")
      .select(`
        *,
        meditation_presets (*)
      `)
      .eq("user_id", userId)
      .order("session_date", { ascending: false })

    if (error) throw error
    return data || []
  }

  async createSession(session: {
    user_id: string
    preset_id: string
    duration: number
    completed: boolean
    voice_settings: any
    sound_enabled: boolean
    notes?: string
  }): Promise<MeditationSession> {
    const { data, error } = await this.supabase.from("meditation_sessions").insert(session).select().single()

    if (error) throw error
    return data
  }

  async updateSession(sessionId: string, updates: Partial<MeditationSession>): Promise<MeditationSession> {
    const { data, error } = await this.supabase
      .from("meditation_sessions")
      .update(updates)
      .eq("id", sessionId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Goals
  async getUserGoals(userId: string): Promise<MeditationGoal[]> {
    const { data, error } = await this.supabase
      .from("meditation_goals")
      .select("*")
      .eq("user_id", userId)
      .eq("active", true)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  }

  async createGoal(goal: {
    user_id: string
    type: "daily" | "weekly" | "monthly"
    target: number
    metric: "minutes" | "sessions"
    start_date: string
    end_date: string
  }): Promise<MeditationGoal> {
    const { data, error } = await this.supabase.from("meditation_goals").insert(goal).select().single()

    if (error) throw error
    return data
  }

  async updateGoal(goalId: string, updates: Partial<MeditationGoal>): Promise<MeditationGoal> {
    const { data, error } = await this.supabase
      .from("meditation_goals")
      .update(updates)
      .eq("id", goalId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Badges
  async getAllBadges(): Promise<Badge[]> {
    const { data, error } = await this.supabase.from("badges").select("*").order("requirement_value")

    if (error) throw error
    return data || []
  }

  async getUserBadges(userId: string): Promise<(UserBadge & { badge: Badge })[]> {
    const { data, error } = await this.supabase
      .from("user_badges")
      .select(`
        *,
        badge:badges (*)
      `)
      .eq("user_id", userId)

    if (error) throw error
    return data || []
  }

  async awardBadge(userId: string, badgeId: string): Promise<UserBadge> {
    const { data, error } = await this.supabase
      .from("user_badges")
      .insert({ user_id: userId, badge_id: badgeId })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // User Settings
  async getUserSettings(userId: string): Promise<UserSettings | null> {
    const { data, error } = await this.supabase.from("user_settings").select("*").eq("user_id", userId).single()

    if (error && error.code !== "PGRST116") throw error
    return data
  }

  async updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<UserSettings> {
    const { data, error } = await this.supabase
      .from("user_settings")
      .upsert({
        user_id: userId,
        ...settings,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Progress Stats
  async getUserProgressStats(userId: string) {
    const { data, error } = await this.supabase.rpc("get_user_progress", { user_uuid: userId })

    if (error) throw error
    return data
  }

  // Export user data
  async exportUserData(userId: string) {
    const [sessions, goals, userBadges, settings] = await Promise.all([
      this.getUserSessions(userId),
      this.getUserGoals(userId),
      this.getUserBadges(userId),
      this.getUserSettings(userId),
    ])

    return {
      sessions,
      goals,
      badges: userBadges,
      settings,
      exportDate: new Date().toISOString(),
    }
  }

  // Delete all user data
  async deleteAllUserData(userId: string) {
    const { error } = await this.supabase.rpc("delete_all_user_data", { user_uuid: userId })
    if (error) throw error
  }
}

export const db = new DatabaseService()
