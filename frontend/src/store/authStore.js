import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

axios.defaults.baseURL = API_URL

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setAuthHeader: (token) => {
        if (token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        } else {
          delete axios.defaults.headers.common['Authorization']
        }
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const response = await axios.post('/auth/login', { email, password })
          const { token, user } = response.data
          
          get().setAuthHeader(token)
          set({ user, token, isAuthenticated: true, isLoading: false })
          return { success: true }
        } catch (error) {
          set({ 
            error: error.response?.data?.error || 'Login failed', 
            isLoading: false 
          })
          return { success: false, error: error.response?.data?.error }
        }
      },

      register: async (name, email, password, role = 'student') => {
        set({ isLoading: true, error: null })
        try {
          const response = await axios.post('/auth/register', { 
            name, 
            email, 
            password, 
            role 
          })
          const { token, user } = response.data
          
          get().setAuthHeader(token)
          set({ user, token, isAuthenticated: true, isLoading: false })
          return { success: true }
        } catch (error) {
          set({ 
            error: error.response?.data?.error || 'Registration failed', 
            isLoading: false 
          })
          return { success: false, error: error.response?.data?.error }
        }
      },

      logout: () => {
        get().setAuthHeader(null)
        set({ user: null, token: null, isAuthenticated: false, error: null })
      },

      updateUser: (updates) => {
        set((state) => ({
          user: { ...state.user, ...updates }
        }))
      },

      refreshUser: async () => {
        try {
          const response = await axios.get('/auth/me')
          set({ user: response.data })
        } catch (error) {
          console.error('Failed to refresh user:', error)
        }
      },

      clearError: () => set({ error: null })
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        token: state.token, 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      })
    }
  )
)

// Initialize auth header on store creation
const token = useAuthStore.getState().token
if (token) {
  useAuthStore.getState().setAuthHeader(token)
}

export default useAuthStore
