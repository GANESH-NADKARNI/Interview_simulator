import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authApi } from '../services/api'
import { Zap, Lock, User, Mail } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SignupPage() {
  const [form, setForm]       = useState({ username: '', email: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate  = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return }
    if (form.password.length < 8)      { toast.error('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      const { data } = await authApi.register({
        username: form.username, email: form.email, password: form.password
      })
      login(data.token, { username: data.username, role: data.role })
      toast.success('Account created! Welcome 🎉')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const upd = (field) => (e) => setForm(p => ({...p, [field]: e.target.value}))

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-500/15 rounded-2xl mb-4">
            <Zap className="w-7 h-7 text-brand-400" />
          </div>
          <h1 className="font-display text-3xl font-bold text-white mb-2">Create account</h1>
          <p className="text-slate-400">Start your interview preparation today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Username" icon={User} placeholder="cool_coder">
            <input className="input-field pl-10" value={form.username} onChange={upd('username')} required minLength={3} />
          </Field>
          <Field label="Email" icon={Mail} placeholder="you@example.com">
            <input className="input-field pl-10" type="email" value={form.email} onChange={upd('email')} required />
          </Field>
          <Field label="Password" icon={Lock} placeholder="Min. 8 characters">
            <input className="input-field pl-10" type="password" value={form.password} onChange={upd('password')} required minLength={8} />
          </Field>
          <Field label="Confirm Password" icon={Lock} placeholder="Repeat password">
            <input className="input-field pl-10" type="password" value={form.confirm} onChange={upd('confirm')} required />
          </Field>

          <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-slate-400 mt-6 text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  )
}

function Field({ label, icon: Icon, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500 pointer-events-none" />
        {children}
      </div>
    </div>
  )
}
