// Mock authentication system for preview environment
export interface MockUser {
  id: string
  email: string
  user_metadata?: {
    full_name?: string
  }
}

export interface MockSession {
  user: MockUser
}

class MockAuthClient {
  private currentUser: MockUser | null = null
  private listeners: Array<(event: string, session: MockSession | null) => void> = []

  async getSession() {
    // Check localStorage for existing session
    const savedUser = localStorage.getItem("mock_user")
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser)
      return { data: { session: { user: this.currentUser } } }
    }
    return { data: { session: null } }
  }

  async signUp({
    email,
    password,
    options,
  }: {
    email: string
    password: string
    options?: { data?: { full_name?: string } }
  }) {
    // Simulate signup
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const user: MockUser = {
      id: `user_${Date.now()}`,
      email,
      user_metadata: {
        full_name: options?.data?.full_name,
      },
    }

    this.currentUser = user
    localStorage.setItem("mock_user", JSON.stringify(user))

    // Notify listeners
    this.listeners.forEach((listener) => {
      listener("SIGNED_IN", { user })
    })

    return { error: null }
  }

  async signInWithPassword({ email, password }: { email: string; password: string }) {
    // Simulate signin
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const user: MockUser = {
      id: `user_${Date.now()}`,
      email,
      user_metadata: {
        full_name: email.split("@")[0],
      },
    }

    this.currentUser = user
    localStorage.setItem("mock_user", JSON.stringify(user))

    // Notify listeners
    this.listeners.forEach((listener) => {
      listener("SIGNED_IN", { user })
    })

    return { error: null }
  }

  async signOut() {
    this.currentUser = null
    localStorage.removeItem("mock_user")
    localStorage.removeItem("mock_meditation_data")

    // Notify listeners
    this.listeners.forEach((listener) => {
      listener("SIGNED_OUT", null)
    })

    return { error: null }
  }

  onAuthStateChange(callback: (event: string, session: MockSession | null) => void) {
    this.listeners.push(callback)

    return {
      data: {
        subscription: {
          unsubscribe: () => {
            const index = this.listeners.indexOf(callback)
            if (index > -1) {
              this.listeners.splice(index, 1)
            }
          },
        },
      },
    }
  }
}

export const mockAuth = new MockAuthClient()
