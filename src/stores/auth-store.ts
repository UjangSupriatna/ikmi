import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface User {
  id: string
  email: string
  name: string
  username: string
  avatar: string | null
  coverPhoto: string | null
  bio: string | null
  phone: string | null
  address: string | null
  website: string | null
  headline: string | null
  skills: string | null
  birthday: string | null
  gender: string | null
  createdAt: string
  updatedAt: string
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  
  // Actions
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
  fetchCurrentUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true,
      isAuthenticated: false,

      setUser: (user) => {
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
        })
      },

      setLoading: (loading) => {
        set({ isLoading: loading })
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        })
      },

      fetchCurrentUser: async () => {
        try {
          set({ isLoading: true })
          
          const response = await fetch('/api/auth/me')
          
          if (response.ok) {
            const data = await response.json()
            set({
              user: data.user,
              isAuthenticated: true,
              isLoading: false,
            })
          } else {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            })
          }
        } catch {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          })
        }
      },
    }),
    {
      name: 'ikmi-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

// Auth API functions
export const authApi = {
  register: async (data: {
    name: string
    username: string
    email: string
    password: string
  }) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return response.json()
  },

  login: async (identifier: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    })
    return response.json()
  },

  logout: async () => {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
    })
    return response.json()
  },

  getCurrentUser: async () => {
    const response = await fetch('/api/auth/me')
    return response.json()
  },
}
