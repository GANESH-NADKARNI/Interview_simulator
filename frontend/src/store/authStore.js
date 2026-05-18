import { create } from 'zustand'

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token') || null,

  setAuth: (user, token) => {
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('token', token)
    set({ user, token })
  },

  logout: () => {
    // Only remove auth-related keys — don't wipe unrelated app data
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    set({ user: null, token: null })
  },

  // Read from Zustand state, not localStorage directly — stays in sync with setAuth/logout
  isAuthenticated: () => !!get().token,
}))