import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../services/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { Zap, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()

  const handle = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await authApi.login(form)
      // Save to localStorage FIRST before navigating
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify({
        username: data.username,
        email: data.email,
        role: data.role
      }))
      // Then update the store
      setAuth({ username: data.username, email: data.email, role: data.role }, data.token)
      toast.success(`Welcome back, ${data.username}!`)
      // Navigate after everything is saved
      navigate('/dashboard', { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Login failed')
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
            Welcome Back
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: 14 }}>Sign in to continue your interview prep</p>
        </div>

        <form onSubmit={handle} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 8 }}>
              Username
            </label>
            <input
              type="text" placeholder="Enter your username"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 8 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Enter your password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
                style={{ paddingRight: 44 }}
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer'
                }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}
            style={{ justifyContent: 'center', marginTop: 8, padding: '13px' }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text2)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
            Create one free
          </Link>
        </p>
      </div>
    </div>
  )
}