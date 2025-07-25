// Mock database service for preview environment
interface MockMeditationPreset {
  id: string
  name: string
  description: string
  duration: number
  type: "breathing" | "mindfulness" | "body-scan"
  breathing_pattern?: {
    inhale: number
    hold1: number
    exhale: number
    hold2: number
  }
}

interface MockMeditationSession {
  id: string
  user_id: string
  preset_id: string
  duration: number
  completed: boolean
  voice_settings: any
  sound_enabled: boolean
  notes?: string
  session_date: string
  created_at: string
  meditation_presets?: MockMeditationPreset
}

interface MockMeditationGoal {
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

interface MockBadge {
  id: string
  name: string
  description: string
  icon: string
  requirement_type: "streak" | "total_sessions" | "total_minutes" | "completion_rate"
  requirement_value: number
}

interface MockUserBadge {
  id: string
  user_id: string
  badge_id: string
  earned_date: string
  badge: MockBadge
}

interface MockUserSettings {
  id: string
  user_id: string
  speech_rate: number
  voice_enabled: boolean
  sound_enabled: boolean
  selected_voice?: string
}

const defaultPresets: MockMeditationPreset[] = [
  {
    id: "box-breathing",
    name: "Box Breathing",
    description: "Equal 4-count breathing for balance",
    duration: 5,
    type: "breathing",
    breathing_pattern: { inhale: 4, hold1: 4, exhale: 4, hold2: 4 },
  },
  {
    id: "478-breathing",
    name: "4-7-8 Breathing",
    description: "Calming breath for relaxation",
    duration: 5,
    type: "breathing",
    breathing_pattern: { inhale: 4, hold1: 7, exhale: 8, hold2: 0 },
  },
  {
    id: "mindfulness-5",
    name: "Mindfulness",
    description: "Present moment awareness",
    duration: 5,
    type: "mindfulness",
  },
  {
    id: "mindfulness-10",
    name: "Extended Mindfulness",
    description: "Deeper awareness practice",
    duration: 10,
    type: "mindfulness",
  },
  {
    id: "body-scan",
    name: "Body Scan",
    description: "Progressive relaxation",
    duration: 15,
    type: "body-scan",
  },
  {
    id: "mindfulness-20",
    name: "Deep Practice",
    description: "Extended meditation session",
    duration: 20,
    type: "mindfulness",
  },
]

const defaultBadges: MockBadge[] = [
  {
    id: "first-session",
    name: "First Steps",
    description: "Complete your first meditation session",
    icon: "🌱",
    requirement_type: "total_sessions",
    requirement_value: 1,
  },
  {
    id: "week-warrior",
    name: "Week Warrior",
    description: "Maintain a 7-day meditation streak",
    icon: "🔥",
    requirement_type: "streak",
    requirement_value: 7,
  },
  {
    id: "mindful-master",
    name: "Mindful Master",
    description: "Complete 50 meditation sessions",
    icon: "🧘",
    requirement_type: "total_sessions",
    requirement_value: 50,
  },
  {
    id: "time-keeper",
    name: "Time Keeper",
    description: "Meditate for 10 hours total",
    icon: "⏰",
    requirement_type: "total_minutes",
    requirement_value: 600,
  },
  {
    id: "consistency-champion",
    name: "Consistency Champion",
    description: "Achieve 95% completion rate with 20+ sessions",
    icon: "🏆",
    requirement_type: "completion_rate",
    requirement_value: 95,
  },
  {
    id: "zen-master",
    name: "Zen Master",
    description: "Maintain a 30-day meditation streak",
    icon: "🌟",
    requirement_type: "streak",
    requirement_value: 30,
  },
]

class MockDatabaseService {
  private getStorageKey(userId: string, type: string) {
    return `mock_${type}_${userId}`
  }

  private getData<T>(userId: string, type: string, defaultValue: T[] = []): T[] {
    const key = this.getStorageKey(userId, type)
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : defaultValue
  }

  private setData<T>(userId: string, type: string, data: T[]) {
    const key = this.getStorageKey(userId, type)
    localStorage.setItem(key, JSON.stringify(data))
  }

  async getMeditationPresets(): Promise<MockMeditationPreset[]> {
    await new Promise((resolve) => setTimeout(resolve, 100))
    return defaultPresets
  }

  async getUserSessions(userId: string): Promise<MockMeditationSession[]> {
    await new Promise((resolve) => setTimeout(resolve, 100))
    const sessions = this.getData<MockMeditationSession>(userId, "sessions")

    // Add preset data to sessions
    return sessions.map((session) => ({
      ...session,
      meditation_presets: defaultPresets.find((p) => p.id === session.preset_id),
    }))
  }

  async createSession(session: {
    user_id: string
    preset_id: string
    duration: number
    completed: boolean
    voice_settings: any
    sound_enabled: boolean
    notes?: string
  }): Promise<MockMeditationSession> {
    await new Promise((resolve) => setTimeout(resolve, 100))

    const newSession: MockMeditationSession = {
      id: `session_${Date.now()}`,
      ...session,
      session_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }

    const sessions = this.getData<MockMeditationSession>(session.user_id, "sessions")
    sessions.push(newSession)
    this.setData(session.user_id, "sessions", sessions)

    return newSession
  }

  async updateSession(sessionId: string, updates: Partial<MockMeditationSession>): Promise<MockMeditationSession> {
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Find session across all users (simplified for mock)
    const allKeys = Object.keys(localStorage).filter((key) => key.includes("mock_sessions_"))

    for (const key of allKeys) {
      const sessions = JSON.parse(localStorage.getItem(key) || "[]")
      const sessionIndex = sessions.findIndex((s: MockMeditationSession) => s.id === sessionId)

      if (sessionIndex !== -1) {
        sessions[sessionIndex] = { ...sessions[sessionIndex], ...updates }
        localStorage.setItem(key, JSON.stringify(sessions))
        return sessions[sessionIndex]
      }
    }

    throw new Error("Session not found")
  }

  async getUserGoals(userId: string): Promise<MockMeditationGoal[]> {
    await new Promise((resolve) => setTimeout(resolve, 100))
    return this.getData<MockMeditationGoal>(userId, "goals")
  }

  async createGoal(goal: {
    user_id: string
    type: "daily" | "weekly" | "monthly"
    target: number
    metric: "minutes" | "sessions"
    start_date: string
    end_date: string
  }): Promise<MockMeditationGoal> {
    await new Promise((resolve) => setTimeout(resolve, 100))

    const newGoal: MockMeditationGoal = {
      id: `goal_${Date.now()}`,
      ...goal,
      active: true,
      created_at: new Date().toISOString(),
    }

    const goals = this.getData<MockMeditationGoal>(goal.user_id, "goals")
    goals.push(newGoal)
    this.setData(goal.user_id, "goals", goals)

    return newGoal
  }

  async updateGoal(goalId: string, updates: Partial<MockMeditationGoal>): Promise<MockMeditationGoal> {
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Find goal across all users (simplified for mock)
    const allKeys = Object.keys(localStorage).filter((key) => key.includes("mock_goals_"))

    for (const key of allKeys) {
      const goals = JSON.parse(localStorage.getItem(key) || "[]")
      const goalIndex = goals.findIndex((g: MockMeditationGoal) => g.id === goalId)

      if (goalIndex !== -1) {
        goals[goalIndex] = { ...goals[goalIndex], ...updates }
        localStorage.setItem(key, JSON.stringify(goals))
        return goals[goalIndex]
      }
    }

    throw new Error("Goal not found")
  }

  async getAllBadges(): Promise<MockBadge[]> {
    await new Promise((resolve) => setTimeout(resolve, 100))
    return defaultBadges
  }

  async getUserBadges(userId: string): Promise<MockUserBadge[]> {
    await new Promise((resolve) => setTimeout(resolve, 100))
    const userBadges = this.getData<MockUserBadge>(userId, "user_badges")

    // Add badge data
    return userBadges.map((ub) => ({
      ...ub,
      badge: defaultBadges.find((b) => b.id === ub.badge_id)!,
    }))
  }

  async awardBadge(userId: string, badgeId: string): Promise<MockUserBadge> {
    await new Promise((resolve) => setTimeout(resolve, 100))

    const newUserBadge: MockUserBadge = {
      id: `user_badge_${Date.now()}`,
      user_id: userId,
      badge_id: badgeId,
      earned_date: new Date().toISOString(),
      badge: defaultBadges.find((b) => b.id === badgeId)!,
    }

    const userBadges = this.getData<MockUserBadge>(userId, "user_badges")
    userBadges.push(newUserBadge)
    this.setData(userId, "user_badges", userBadges)

    return newUserBadge
  }

  async getUserSettings(userId: string): Promise<MockUserSettings | null> {
    await new Promise((resolve) => setTimeout(resolve, 100))
    const settings = this.getData<MockUserSettings>(userId, "settings")
    return settings[0] || null
  }

  async updateUserSettings(userId: string, settings: Partial<MockUserSettings>): Promise<MockUserSettings> {
    await new Promise((resolve) => setTimeout(resolve, 100))

    const existingSettings = this.getData<MockUserSettings>(userId, "settings")
    const updatedSettings: MockUserSettings = {
      id: `settings_${userId}`,
      user_id: userId,
      speech_rate: 0.8,
      voice_enabled: true,
      sound_enabled: true,
      ...existingSettings[0],
      ...settings,
    }

    this.setData(userId, "settings", [updatedSettings])
    return updatedSettings
  }

  async getUserProgressStats(userId: string) {
    await new Promise((resolve) => setTimeout(resolve, 100))

    const sessions = await this.getUserSessions(userId)
    const completedSessions = sessions.filter((s) => s.completed)

    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    return {
      total_sessions: sessions.length,
      completed_sessions: completedSessions.length,
      total_minutes: Math.round(sessions.reduce((sum, s) => sum + s.duration / 60, 0)),
      sessions_this_week: sessions.filter((s) => new Date(s.session_date) >= weekAgo).length,
      sessions_this_month: sessions.filter((s) => new Date(s.session_date) >= monthAgo).length,
    }
  }

  async exportUserData(userId: string) {
    await new Promise((resolve) => setTimeout(resolve, 100))

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

  async deleteAllUserData(userId: string) {
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Clear all user data
    const types = ["sessions", "goals", "user_badges", "settings"]
    types.forEach((type) => {
      const key = this.getStorageKey(userId, type)
      localStorage.removeItem(key)
    })
  }
}

export const mockDb = new MockDatabaseService()
