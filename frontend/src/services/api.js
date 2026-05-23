import axios from 'axios'
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const api = axios.create({ baseURL: BASE_URL, headers: { 'Content-Type': 'application/json' } })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || ''
    // ✅ Don't redirect on auth endpoints — firebase-login and other auth routes
    // legitimately return 401 and the calling hook handles it via toast
    const isAuthEndpoint = url.includes('/auth/')
    if (err.response?.status === 401 && !isAuthEndpoint) {
      localStorage.clear()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)
export default api

// ── Auth ──────────────────────────────────────────────────────────────────
export const authApi = {
  register:        (data) => api.post('/auth/register', data),
  verifyEmail:     (data) => api.post('/auth/verify-email', data),
  login:           (data) => api.post('/auth/login', data),
  forgotPassword:  (data) => api.post('/auth/forgot-password', data),
  verifyResetOtp:  (data) => api.post('/auth/verify-reset-otp', data),
  resetPassword:   (data) => api.post('/auth/reset-password', data),
  forgotUsername:  (data) => api.post('/auth/forgot-username', data),
  resendOtp:       (data) => api.post('/auth/resend-otp', data),
  changeUsername:  (data) => api.put('/auth/change-username', data),
  getMe:           ()     => api.get('/auth/me'),

  // ✅ Firebase OAuth login (Google / GitHub)
  firebaseLogin:   (data) => api.post('/auth/firebase-login', data),
}

// ── Aptitude ──────────────────────────────────────────────────────────────
export const aptitudeApi = {
  start:    ()     => api.post('/aptitude/start'),
  evaluate: (data) => api.post('/aptitude/evaluate', data),
}

// ── Coding ────────────────────────────────────────────────────────────────
export const codingApi = {
  start:    ()     => api.post('/coding/start'),
  evaluate: (data) => api.post('/coding/evaluate', data),
  hint:     (data) => api.post('/coding/hint', data),
  complete: (data) => api.post('/coding/complete', data),
}

// ── HR ────────────────────────────────────────────────────────────────────
export const hrApi = {
  start:    ()     => api.post('/hr/start'),
  analyze:  (data) => api.post('/hr/analyze', data),
  complete: (data) => api.post('/hr/complete', data),
}

// ── Sessions ──────────────────────────────────────────────────────────────
export const sessionApi = {
  getAll:     ()   => api.get('/sessions'),
  getStats:   ()   => api.get('/sessions/me/stats'),
  getProfile: ()   => api.get('/sessions/me/profile'),
  getById:    (id) => api.get(`/sessions/${id}`),
}

// ── Resume ────────────────────────────────────────────────────────────────
export const resumeApi = {
  analyze: (file) => {
    const form = new FormData(); form.append('file', file)
    return api.post('/resume/analyze', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  improve: (file, targetRole, targetLevel) => {
    const form = new FormData(); form.append('file', file)
    return api.post(`/resume/improve?targetRole=${encodeURIComponent(targetRole)}&targetLevel=${encodeURIComponent(targetLevel)}`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  analyzeText: (text) => api.post('/resume/analyze-text', { text }),
}

// ── Profile ───────────────────────────────────────────────────────────────
export const profileApi = {
  get:  ()     => api.get('/profile'),
  save: (data) => api.post('/profile', data),
}