import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authApi } from '../services/api'
import { Zap, Lock, User, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [form, setForm]         = useState({ username: '', password: '' })
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const { login } = useAuth()
  const navigate  = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await authApi.login(form)
      login(data.token, { username: data.username, role: data.role })
      toast.success(`Welcome back, ${data.username}!`)
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-500/15 rounded-2xl mb-4">
            <Zap className="w-7 h-7 text-brand-400" />
          </div>
          <h1 className="font-display text-3xl font-bold text-white mb-2">Welcome back</h1>
          <p className="text-slate-400">Sign in to continue your practice</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Username</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              <input className="input-field pl-10" placeholder="your_username" value={form.username}
                onChange={e => setForm(p => ({...p, username: e.target.value}))} required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              <input className="input-field pl-10 pr-10" type={showPw ? 'text' : 'password'}
                placeholder="••••••••" value={form.password}
                onChange={e => setForm(p => ({...p, password: e.target.value}))} required />
              <button type="button" onClick={() => setShowPw(p => !p)}
                className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-slate-400 mt-6 text-sm">
          Don't have an account?{' '}
          <Link to="/signup" className="text-brand-400 hover:text-brand-300 font-medium">Sign up</Link>
        </p>
      </div>
    </AuthLayout>
  )
}

function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-surface-950 flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-surface-900 to-surface-950 border-r border-white/5 items-center justify-center p-12">
        <div className="max-w-sm">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-white">CodeSim</span>
          </div>
          <h2 className="font-display text-4xl font-bold text-white mb-4 leading-tight">
            Practice interviews with AI feedback
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed">
            Solve problems, get instant AI analysis on your code quality, complexity, and style.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4">
            {[['7+','Problems'],['AI','Feedback'],['Live','Execution']].map(([n,l]) => (
              <div key={l} className="bg-white/5 rounded-2xl p-4 text-center border border-white/10">
                <div className="font-display font-bold text-2xl text-brand-400">{n}</div>
                <div className="text-xs text-slate-400 mt-1">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8">{children}</div>
    </div>
  )
}
