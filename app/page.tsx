"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { mockAuth, type MockUser } from "@/lib/mock-auth"
import { mockDb } from "@/lib/mock-database"
import { Button } from "@/components/ui/button"
import { Settings, Calendar, Target, Award, Menu, X, LogOut } from "lucide-react"

interface MeditationPreset {
  id: string
  name: string
  description: string
  duration: number // in minutes
  type: "breathing" | "mindfulness" | "body-scan"
  breathing_pattern?: {
    inhale: number
    hold1: number
    exhale: number
    hold2: number
  }
}

interface VoiceGuidance {
  time: number // seconds from start
  text: string
  pause?: number // pause after speaking in seconds
}

interface GuidedScript {
  introduction: string
  guidance: VoiceGuidance[]
  conclusion: string
}

interface SessionData {
  id: string
  session_date: string
  preset: MeditationPreset
  duration: number // actual duration completed in seconds
  completed: boolean
  voice_settings: {
    enabled: boolean
    rate: number
  }
  sound_enabled: boolean
  notes?: string
}

interface ProgressStats {
  total_sessions: number
  completed_sessions: number
  total_minutes: number
  sessions_this_week: number
  sessions_this_month: number
}

interface MeditationGoal {
  id: string
  type: "daily" | "weekly" | "monthly"
  target: number // minutes or sessions
  metric: "minutes" | "sessions"
  start_date: string
  end_date: string
  active: boolean
}

interface Badge {
  id: string
  name: string
  description: string
  icon: string
  requirement_type: "streak" | "total_sessions" | "total_minutes" | "completion_rate"
  requirement_value: number
}

interface UserBadge {
  id: string
  badge: Badge
  earned_date: string
}

const guidedScripts: Record<string, GuidedScript> = {
  "mindfulness-5": {
    introduction:
      "Welcome to your 5-minute mindfulness meditation. Find a comfortable position and gently close your eyes.",
    guidance: [
      { time: 30, text: "Begin by taking three deep breaths. Inhale slowly through your nose." },
      { time: 45, text: "And exhale completely through your mouth." },
      { time: 60, text: "Now allow your breathing to return to its natural rhythm." },
      { time: 90, text: "Notice the sensation of your breath as it enters and leaves your body." },
      { time: 120, text: "When your mind wanders, gently bring your attention back to your breath." },
      { time: 180, text: "There's no need to control your breathing. Simply observe." },
      { time: 240, text: "Notice any thoughts or feelings that arise, and let them pass like clouds in the sky." },
      { time: 270, text: "Continue to rest your attention on the breath." },
    ],
    conclusion:
      "Take a moment to appreciate this time you've given yourself. When you're ready, gently open your eyes.",
  },
  "mindfulness-10": {
    introduction:
      "Welcome to your 10-minute mindfulness practice. Settle into a comfortable position and close your eyes softly.",
    guidance: [
      { time: 30, text: "Begin with three conscious breaths. Breathe in deeply." },
      { time: 45, text: "And release completely." },
      { time: 75, text: "Allow your body to relax with each exhale." },
      { time: 120, text: "Bring your attention to your breath. Notice where you feel it most clearly." },
      { time: 180, text: "Perhaps at your nostrils, chest, or belly. Rest your attention there." },
      { time: 240, text: "When thoughts arise, acknowledge them kindly and return to your breath." },
      { time: 300, text: "There's nowhere else you need to be right now. Just here, just breathing." },
      { time: 360, text: "Notice the space between your thoughts. Rest in that spaciousness." },
      { time: 420, text: "If you feel restless, that's perfectly normal. Simply return to your breath." },
      { time: 480, text: "Continue to cultivate this gentle awareness." },
      { time: 540, text: "Notice how your body feels now compared to when you began." },
    ],
    conclusion:
      "You've completed your meditation. Take a moment to set an intention for the rest of your day. Open your eyes when ready.",
  },
  "body-scan": {
    introduction:
      "Welcome to your body scan meditation. Lie down comfortably or sit with your back straight. Close your eyes and take three deep breaths.",
    guidance: [
      { time: 45, text: "Begin by bringing attention to the top of your head. Notice any sensations there." },
      { time: 90, text: "Now move your attention to your forehead. Relax any tension you might find." },
      { time: 120, text: "Notice your eyes, your cheeks, and your jaw. Let them soften." },
      { time: 180, text: "Bring awareness to your neck and shoulders. Allow them to release and drop." },
      { time: 240, text: "Move down to your arms. Notice your upper arms, forearms, and hands." },
      { time: 300, text: "Bring attention to your chest. Feel it rise and fall with each breath." },
      { time: 360, text: "Notice your upper back, middle back, and lower back. Let them relax." },
      { time: 420, text: "Move to your abdomen. Notice any sensations without trying to change them." },
      { time: 480, text: "Bring awareness to your hips and pelvis. Let them settle." },
      { time: 540, text: "Notice your thighs, both front and back. Allow them to be heavy." },
      { time: 600, text: "Move to your knees, then your calves and shins." },
      {
        time: 660,
        text: "Finally, bring attention to your feet. Notice your ankles, the tops and soles of your feet.",
      },
      { time: 720, text: "Now take a moment to feel your whole body as one complete, relaxed whole." },
      { time: 780, text: "Rest in this feeling of complete relaxation." },
    ],
    conclusion:
      "You've completed your body scan. Notice how your body feels now. When you're ready, gently wiggle your fingers and toes, and slowly open your eyes.",
  },
  "box-breathing": {
    introduction:
      "Welcome to box breathing. This practice will help you find balance and calm. Sit comfortably and prepare to breathe in a steady rhythm.",
    guidance: [
      { time: 30, text: "We'll breathe in a pattern of 4 counts in, 4 counts hold, 4 counts out, 4 counts hold." },
      { time: 60, text: "Let's begin. Breathe in for 4... 2... 3... 4." },
      { time: 68, text: "Hold for 4... 2... 3... 4." },
      { time: 76, text: "Breathe out for 4... 2... 3... 4." },
      { time: 84, text: "Hold for 4... 2... 3... 4." },
      { time: 120, text: "Continue this rhythm. I'll guide you occasionally." },
      { time: 180, text: "You're doing well. Keep the steady rhythm." },
      { time: 240, text: "Notice how this balanced breathing affects your mind and body." },
    ],
    conclusion: "Excellent work. Take a few natural breaths and notice the sense of balance you've created.",
  },
  "478-breathing": {
    introduction:
      "Welcome to 4-7-8 breathing, a powerful technique for relaxation. Sit comfortably and prepare for this calming practice.",
    guidance: [
      {
        time: 30,
        text: "We'll breathe in for 4 counts, hold for 7, and exhale for 8. This longer exhale activates your relaxation response.",
      },
      { time: 60, text: "Let's begin. Breathe in for 4... 2... 3... 4." },
      { time: 67, text: "Hold for 7... 2... 3... 4... 5... 6... 7." },
      { time: 82, text: "Exhale slowly for 8... 2... 3... 4... 5... 6... 7... 8." },
      { time: 120, text: "Continue this pattern. The long exhale is key to relaxation." },
      { time: 180, text: "With each exhale, feel tension leaving your body." },
      { time: 240, text: "Notice how your nervous system is beginning to calm." },
    ],
    conclusion:
      "Beautiful work. This breathing pattern has activated your body's natural relaxation response. Take a moment to enjoy this calm state.",
  },
}

const Page = () => {
  const [user, setUser] = useState<MockUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPreset, setSelectedPreset] = useState<MeditationPreset | null>(null)
  const [presets, setPresets] = useState<MeditationPreset[]>([])
  const [isActive, setIsActive] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [breathingPhase, setBreathingPhase] = useState<"inhale" | "hold1" | "exhale" | "hold2">("inhale")
  const [breathingCount, setBreathingCount] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [currentVoiceGuidance, setCurrentVoiceGuidance] = useState<VoiceGuidance | null>(null)
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null)
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null)
  const [hasSpokenIntro, setHasSpokenIntro] = useState(false)
  const [speechRate, setSpeechRate] = useState(0.8)
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [currentView, setCurrentView] = useState<"home" | "progress" | "calendar" | "goals" | "badges" | "settings">(
    "home",
  )
  const [progressStats, setProgressStats] = useState<ProgressStats | null>(null)
  const [goals, setGoals] = useState<MeditationGoal[]>([])
  const [badges, setBadges] = useState<Badge[]>([])
  const [userBadges, setUserBadges] = useState<UserBadge[]>([])
  const [showSessionNotes, setShowSessionNotes] = useState(false)
  const [sessionNotes, setSessionNotes] = useState("")
  const [completedSessionId, setCompletedSessionId] = useState<string | null>(null)
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [showCustomGoalForm, setShowCustomGoalForm] = useState(false)
  const [customGoal, setCustomGoal] = useState({
    type: "daily" as "daily" | "weekly" | "monthly",
    target: 10,
    metric: "minutes" as "minutes" | "sessions",
  })
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const startTimeRef = useRef<number>(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const breathingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  // Initialize auth state
  useEffect(() => {
    const getSession = async () => {
      const { data } = await mockAuth.getSession()
      setUser(data.session?.user ?? null)
      setLoading(false)
    }

    getSession()

    const {
      data: { subscription },
    } = mockAuth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        await loadUserData(session.user.id)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Load user data when authenticated
  const loadUserData = useCallback(async (userId: string) => {
    try {
      const [presetsData, sessionsData, goalsData, badgesData, userBadgesData, progressData, settingsData] =
        await Promise.all([
          mockDb.getMeditationPresets(),
          mockDb.getUserSessions(userId),
          mockDb.getUserGoals(userId),
          mockDb.getAllBadges(),
          mockDb.getUserBadges(userId),
          mockDb.getUserProgressStats(userId),
          mockDb.getUserSettings(userId),
        ])

      setPresets(presetsData)
      setSessions(
        sessionsData.map((session) => ({
          ...session,
          preset: session.meditation_presets as any,
        })),
      )
      setGoals(goalsData)
      setBadges(badgesData)
      setUserBadges(userBadgesData)
      setProgressStats(progressData)

      if (settingsData) {
        setSpeechRate(settingsData.speech_rate)
        setVoiceEnabled(settingsData.voice_enabled)
        setSoundEnabled(settingsData.sound_enabled)
      }
    } catch (error) {
      console.error("Error loading user data:", error)
    }
  }, [])

  // Save user settings
  const saveUserSettings = useCallback(async () => {
    if (!user) return

    try {
      await mockDb.updateUserSettings(user.id, {
        speech_rate: speechRate,
        voice_enabled: voiceEnabled,
        sound_enabled: soundEnabled,
        selected_voice: selectedVoice?.name || undefined,
      })
    } catch (error) {
      console.error("Error saving settings:", error)
    }
  }, [user, speechRate, voiceEnabled, soundEnabled, selectedVoice])

  // Save settings when they change
  useEffect(() => {
    if (user) {
      saveUserSettings()
    }
  }, [speechRate, voiceEnabled, soundEnabled, selectedVoice, saveUserSettings])

  // Record a meditation session
  const recordSession = useCallback(
    async (preset: MeditationPreset, actualDuration: number, wasCompleted: boolean) => {
      if (!user) return

      try {
        const session = await mockDb.createSession({
          user_id: user.id,
          preset_id: preset.id,
          duration: actualDuration,
          completed: wasCompleted,
          voice_settings: {
            enabled: voiceEnabled,
            rate: speechRate,
          },
          sound_enabled: soundEnabled,
        })

        // Reload user data to update stats and check for new badges
        await loadUserData(user.id)

        if (wasCompleted) {
          setCompletedSessionId(session.id)
          setShowSessionNotes(true)
        }
      } catch (error) {
        console.error("Error recording session:", error)
      }
    },
    [user, voiceEnabled, speechRate, soundEnabled, loadUserData],
  )

  // Save session notes
  const saveSessionNotes = useCallback(async () => {
    if (!completedSessionId || !user) return

    try {
      await mockDb.updateSession(completedSessionId, { notes: sessionNotes })
      await loadUserData(user.id)
      setShowSessionNotes(false)
      setSessionNotes("")
      setCompletedSessionId(null)
    } catch (error) {
      console.error("Error saving session notes:", error)
    }
  }, [completedSessionId, sessionNotes, user, loadUserData])

  // Export data functionality
  const exportData = useCallback(
    async (format: "csv" | "json") => {
      if (!user) return

      try {
        const data = await mockDb.exportUserData(user.id)

        if (format === "csv") {
          const headers = [
            "Date",
            "Meditation Type",
            "Duration (min)",
            "Completed",
            "Voice Enabled",
            "Voice Rate",
            "Notes",
          ]
          const csvData = data.sessions.map((session) => [
            new Date(session.session_date).toLocaleDateString(),
            session.preset?.name || "Unknown",
            Math.round(session.duration / 60),
            session.completed ? "Yes" : "No",
            session.voice_settings.enabled ? "Yes" : "No",
            session.voice_settings.rate.toFixed(1),
            session.notes || "",
          ])

          const csvContent = [headers, ...csvData].map((row) => row.map((field) => `"${field}"`).join(",")).join("\n")

          const blob = new Blob([csvContent], { type: "text/csv" })
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = `meditation-data-${new Date().toISOString().split("T")[0]}.csv`
          a.click()
          URL.revokeObjectURL(url)
        } else {
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = `meditation-data-${new Date().toISOString().split("T")[0]}.json`
          a.click()
          URL.revokeObjectURL(url)
        }
      } catch (error) {
        console.error("Error exporting data:", error)
      }
    },
    [user],
  )

  // Create new goal
  const createGoal = useCallback(
    async (type: "daily" | "weekly" | "monthly", target: number, metric: "minutes" | "sessions") => {
      if (!user) return

      try {
        const now = new Date()
        const endDate = new Date()

        switch (type) {
          case "daily":
            endDate.setDate(now.getDate() + 1)
            break
          case "weekly":
            endDate.setDate(now.getDate() + 7)
            break
          case "monthly":
            endDate.setMonth(now.getMonth() + 1)
            break
        }

        await mockDb.createGoal({
          user_id: user.id,
          type,
          target,
          metric,
          start_date: now.toISOString(),
          end_date: endDate.toISOString(),
        })

        await loadUserData(user.id)
      } catch (error) {
        console.error("Error creating goal:", error)
      }
    },
    [user, loadUserData],
  )

  // Delete/cancel a goal
  const deleteGoal = useCallback(
    async (goalId: string) => {
      if (!user) return

      try {
        await mockDb.updateGoal(goalId, { active: false })
        await loadUserData(user.id)
      } catch (error) {
        console.error("Error deleting goal:", error)
      }
    },
    [user, loadUserData],
  )

  // Create custom goal
  const createCustomGoal = useCallback(async () => {
    if (!user) return

    try {
      const now = new Date()
      const endDate = new Date()

      switch (customGoal.type) {
        case "daily":
          endDate.setDate(now.getDate() + 1)
          break
        case "weekly":
          endDate.setDate(now.getDate() + 7)
          break
        case "monthly":
          endDate.setMonth(now.getMonth() + 1)
          break
      }

      await mockDb.createGoal({
        user_id: user.id,
        type: customGoal.type,
        target: customGoal.target,
        metric: customGoal.metric,
        start_date: now.toISOString(),
        end_date: endDate.toISOString(),
      })

      await loadUserData(user.id)
      setShowCustomGoalForm(false)
      setCustomGoal({ type: "daily", target: 10, metric: "minutes" })
    } catch (error) {
      console.error("Error creating custom goal:", error)
    }
  }, [customGoal, user, loadUserData])

  // Reset all data
  const resetAllData = useCallback(async () => {
    if (!user) return

    try {
      await mockDb.deleteAllUserData(user.id)
      await loadUserData(user.id)
      setShowResetConfirm(false)
    } catch (error) {
      console.error("Error resetting data:", error)
    }
  }, [user, loadUserData])

  // Sign out
  const handleSignOut = async () => {
    await mockAuth.signOut()
  }

  // Get calendar data
  const getCalendarData = useCallback(() => {
    const year = calendarDate.getFullYear()
    const month = calendarDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const sessionsByDate = new Map<string, SessionData[]>()
    sessions.forEach((session) => {
      const dateKey = new Date(session.session_date).toDateString()
      if (!sessionsByDate.has(dateKey)) {
        sessionsByDate.set(dateKey, [])
      }
      sessionsByDate.get(dateKey)!.push(session)
    })

    const calendarDays = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      calendarDays.push(null)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dateKey = date.toDateString()
      const daySessions = sessionsByDate.get(dateKey) || []
      const hasCompletedSession = daySessions.some((s) => s.completed)

      calendarDays.push({
        day,
        date,
        sessions: daySessions,
        hasSession: daySessions.length > 0,
        hasCompletedSession,
      })
    }

    return calendarDays
  }, [calendarDate, sessions])

  // Initialize audio context
  useEffect(() => {
    if (typeof window !== "undefined") {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
  }, [])

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      setSpeechSynthesis(window.speechSynthesis)

      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices()
        setAvailableVoices(voices)

        // Prefer a calm, natural voice
        const preferredVoice =
          voices.find(
            (voice) =>
              voice.name.toLowerCase().includes("natural") ||
              voice.name.toLowerCase().includes("neural") ||
              voice.name.toLowerCase().includes("enhanced"),
          ) ||
          voices.find((voice) => voice.lang.startsWith("en")) ||
          voices[0]

        setSelectedVoice(preferredVoice)
      }

      loadVoices()
      window.speechSynthesis.onvoiceschanged = loadVoices
    }
  }, [])

  // Play gentle notification sound
  const playNotificationSound = useCallback(
    (frequency = 440, duration = 200) => {
      if (!soundEnabled || !audioContextRef.current) return

      const oscillator = audioContextRef.current.createOscillator()
      const gainNode = audioContextRef.current.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContextRef.current.destination)

      oscillator.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime)
      oscillator.type = "sine"

      gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.1, audioContextRef.current.currentTime + 0.01)
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContextRef.current.currentTime + duration / 1000)

      oscillator.start(audioContextRef.current.currentTime)
      oscillator.stop(audioContextRef.current.currentTime + duration / 1000)
    },
    [soundEnabled],
  )

  const speak = useCallback(
    (text: string, customRate?: number) => {
      if (!voiceEnabled || !speechSynthesis || !selectedVoice) return

      // Cancel any ongoing speech
      speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.voice = selectedVoice
      utterance.rate = customRate || speechRate
      utterance.pitch = 0.9
      utterance.volume = 0.7

      speechSynthesis.speak(utterance)
    },
    [voiceEnabled, speechSynthesis, selectedVoice, speechRate],
  )

  // Handle breathing pattern
  useEffect(() => {
    if (!isActive || !selectedPreset?.breathing_pattern) return

    const pattern = selectedPreset.breathing_pattern
    const phases: Array<{ phase: typeof breathingPhase; duration: number }> = [
      { phase: "inhale", duration: pattern.inhale },
      { phase: "hold1", duration: pattern.hold1 },
      { phase: "exhale", duration: pattern.exhale },
      { phase: "hold2", duration: pattern.hold2 },
    ].filter((p) => p.duration > 0)

    let currentPhaseIndex = 0
    let phaseStartTime = Date.now()

    const updateBreathingPhase = () => {
      const now = Date.now()
      const elapsed = (now - phaseStartTime) / 1000
      const currentPhaseDuration = phases[currentPhaseIndex].duration

      if (elapsed >= currentPhaseDuration) {
        currentPhaseIndex = (currentPhaseIndex + 1) % phases.length
        phaseStartTime = now
        setBreathingPhase(phases[currentPhaseIndex].phase)
        setBreathingCount((prev) => prev + (currentPhaseIndex === 0 ? 1 : 0))

        // Play gentle sound on phase change
        if (phases[currentPhaseIndex].phase === "inhale") {
          playNotificationSound(523.25, 150) // C5
        } else if (phases[currentPhaseIndex].phase === "exhale") {
          playNotificationSound(392, 150) // G4
        }
      }
    }

    breathingIntervalRef.current = setInterval(updateBreathingPhase, 100)

    return () => {
      if (breathingIntervalRef.current) {
        clearInterval(breathingIntervalRef.current)
      }
    }
  }, [isActive, selectedPreset, playNotificationSound])

  // Main timer logic
  useEffect(() => {
    if (!isActive || timeRemaining <= 0) return

    intervalRef.current = setInterval(() => {
      const now = Date.now()
      const elapsed = Math.floor((now - startTimeRef.current) / 1000)
      const remaining = Math.max(0, selectedPreset!.duration * 60 - elapsed)

      setTimeRemaining(remaining)

      if (remaining === 0) {
        setIsActive(false)
        playNotificationSound(659.25, 500) // E5 - completion sound

        // Record completed session
        recordSession(selectedPreset!, selectedPreset!.duration * 60, true)
      }
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isActive, timeRemaining, selectedPreset, playNotificationSound, recordSession])

  // Handle guided meditation
  useEffect(() => {
    if (!isActive || !selectedPreset || !voiceEnabled) return

    const script = guidedScripts[selectedPreset.name.toLowerCase().replace(/\s+/g, "-")]
    if (!script) return

    // Speak introduction
    if (!hasSpokenIntro) {
      setTimeout(() => {
        speak(script.introduction)
        setHasSpokenIntro(true)
      }, 2000)
    }

    // Handle guidance during meditation
    const totalDuration = selectedPreset.duration * 60
    const elapsed = totalDuration - timeRemaining

    const currentGuidance = script.guidance.find(
      (guidance) => Math.abs(guidance.time - elapsed) < 2 && guidance.time <= elapsed,
    )

    if (currentGuidance && currentGuidance !== currentVoiceGuidance) {
      setCurrentVoiceGuidance(currentGuidance)
      speak(currentGuidance.text)
    }

    // Speak conclusion
    if (timeRemaining <= 10 && timeRemaining > 0) {
      speak(script.conclusion)
    }
  }, [isActive, selectedPreset, timeRemaining, voiceEnabled, hasSpokenIntro, currentVoiceGuidance, speak])

  // Handle page visibility changes
  // useEffect(() => {
  //   const handleVisibilityChange = () => {
  //     if (document.hidden && isActive) {
  //       // Store current state when tab becomes hidden
  //       localStorage.setItem(
  //         "meditationState",
  //         JSON.stringify({
  //           startTime: startTimeRef.current,
  //           duration: selectedPreset?.duration,
  //           presetId: selectedPreset?.id,
  //         }),
  //       )
  //     } else if (!document.hidden && isActive) {
  //       // Recalculate time when tab becomes visible
  //       const now = Date.now()
  //       const elapsed = Math.floor((now - startTimeRef.current) / 1000)
  //       const remaining = Math.max(0, selectedPreset!.duration * 60 - elapsed)
  //       setTimeRemaining(remaining)
  //     }
  //   }

  //   document.addEventListener("visibilitychange", handleVisibilityChange)
  //   return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  // }, [isActive, selectedPreset])

  // Close mobile menu when view changes
  useEffect(() => {
    setShowMobileMenu(false)
  }, [currentView])

  const startMeditation = (preset: MeditationPreset) => {
    setSelectedPreset(preset)
    setTimeRemaining(preset.duration * 60)
    setIsActive(true)
    setBreathingPhase("inhale")
    setBreathingCount(0)
    setHasSpokenIntro(false)
    startTimeRef.current = Date.now()
    playNotificationSound(523.25, 300) // Start sound
  }

  const pauseResume = () => {
    if (isActive) {
      setIsActive(false)
    } else {
      startTimeRef.current = Date.now() - (selectedPreset!.duration * 60 - timeRemaining) * 1000
      setIsActive(true)
    }
  }

  const stopMeditation = () => {
    // Record the session before stopping
    if (selectedPreset) {
      const actualDuration = selectedPreset.duration * 60 - timeRemaining
      const wasCompleted = timeRemaining === 0
      recordSession(selectedPreset, actualDuration, wasCompleted)
    }

    setIsActive(false)
    setSelectedPreset(null)
    setTimeRemaining(0)
    setBreathingCount(0)
    setHasSpokenIntro(false)
    setCurrentVoiceGuidance(null)
    if (speechSynthesis) {
      speechSynthesis.cancel()
    }
    // localStorage.removeItem("meditationState")
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getBreathingInstruction = () => {
    switch (breathingPhase) {
      case "inhale":
        return "Breathe In"
      case "hold1":
        return "Hold"
      case "exhale":
        return "Breathe Out"
      case "hold2":
        return "Hold"
    }
  }

  const getBreathingCircleScale = () => {
    switch (breathingPhase) {
      case "inhale":
        return "scale-110"
      case "hold1":
        return "scale-110"
      case "exhale":
        return "scale-90"
      case "hold2":
        return "scale-90"
    }
  }

  const MobileNavigation = () => (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowMobileMenu(!showMobileMenu)}
        className="fixed top-4 right-4 z-50 bg-white/80 backdrop-blur-sm shadow-lg"
      >
        {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {showMobileMenu && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm">
          <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl">
            <div className="p-6 pt-16">
              <div className="space-y-4">
                <Button
                  variant="ghost"
                  onClick={() => setCurrentView("home")}
                  className={`w-full justify-start text-left ${currentView === "home" ? "bg-blue-50 text-blue-700" : ""}`}
                >
                  🏠 Home
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setCurrentView("progress")}
                  className={`w-full justify-start text-left ${currentView === "progress" ? "bg-blue-50 text-blue-700" : ""}`}
                >
                  📊 Progress
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setCurrentView("calendar")}
                  className={`w-full justify-start text-left ${currentView === "calendar" ? "bg-blue-50 text-blue-700" : ""}`}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Calendar
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setCurrentView("goals")}
                  className={`w-full justify-start text-left ${currentView === "goals" ? "bg-blue-50 text-blue-700" : ""}`}
                >
                  <Target className="w-4 h-4 mr-2" />
                  Goals
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setCurrentView("badges")}
                  className={`w-full justify-start text-left ${currentView === "badges" ? "bg-blue-50 text-blue-700" : ""}`}
                >
                  <Award className="w-4 h-4 mr-2" />
                  Badges
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setCurrentView("settings")}
                  className={`w-full justify-start text-left ${currentView === "settings" ? "bg-blue-50 text-blue-700" : ""}`}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
                <div className="border-t pt-4">
                  <Button
                    variant="ghost"
                    onClick={handleSignOut}
                    className="w-full justify-start text-left text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // Show loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-light">Loading...</p>
        </div>
      </div>
    )
  }

  // Main content rendering logic based on currentView
  // ** rest of code here **
}
