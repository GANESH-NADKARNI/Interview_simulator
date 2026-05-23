// src/hooks/useOAuthLogin.js
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { signInWithGoogle, signInWithGithub } from '../config/firebase'
import { authApi } from '../services/api'
import toast from 'react-hot-toast'

export function useOAuthLogin() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [oauthLoading, setOauthLoading] = useState(null) // 'google' | 'github' | null

  const handleOAuth = async (provider) => {
    setOauthLoading(provider)
    try {
      const signIn = provider === 'google' ? signInWithGoogle : signInWithGithub
      const result = await signIn()

      const idToken = await result.user.getIdToken()

      // ✅ Uses authApi.firebaseLogin — NOT authApi.post (which doesn't exist)
      const { data } = await authApi.firebaseLogin({ idToken })

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify({
        username: data.username,
        email: data.email,
        role: data.role,
      }))
      setAuth({ username: data.username, email: data.email, role: data.role }, data.token)

      toast.success(`Welcome, ${data.username}! 🎉`)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      // User closed the popup — silent, no toast
      if (
        err.code === 'auth/popup-closed-by-user' ||
        err.code === 'auth/cancelled-popup-request'
      ) return

      // ✅ Better error messages for common Firebase errors
      if (err.code === 'auth/popup-blocked') {
        toast.error('Popup was blocked by your browser. Please allow popups for this site.')
        return
      }
      if (err.code === 'auth/account-exists-with-different-credential') {
        toast.error('An account already exists with this email using a different sign-in method.')
        return
      }

      // Backend error message, or fallback
      toast.error(err.response?.data?.message || `${provider} login failed. Please try again.`)
    } finally {
      setOauthLoading(null)
    }
  }

  return { oauthLoading, handleOAuth }
}