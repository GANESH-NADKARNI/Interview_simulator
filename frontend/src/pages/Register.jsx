import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../services/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { Zap } from 'lucide-react'

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()

  const handle = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters')
    setLoading(true)
    try {
      const { data } = await authApi.register(form)
      setAuth({ username: data.username, email: data.email, userId: data.userId }, data.token)
      toast.success(`Account created! Welcome, ${data.username}!`)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #00d4ff, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Zap size={26} color="#fff" />
          </div>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
            Create Account
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: 14 }}>Start your interview prep journey today</p>
        </div>

        <form onSubmit={handle} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { key: 'username', label: 'Username', type: 'text', ph: 'Choose a username' },
            { key: 'email', label: 'Email', type: 'email', ph: 'your@email.com' },
            { key: 'password', label: 'Password', type: 'password', ph: 'Min 6 characters' },
          ].map(({ key, label, type, ph }) => (
            <div key={key}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 8 }}>
                {label}
              </label>
              <input
                type={type} placeholder={ph}
                value={form[key]}
                onChange={e => setForm({ ...form, [key]: e.target.value })}
                required
              />
            </div>
          ))}
          <button type="submit" className="btn btn-primary" disabled={loading}
            style={{ justifyContent: 'center', marginTop: 8, padding: '13px' }}>
            {loading ? 'Creating account...' : 'Create Free Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text2)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
