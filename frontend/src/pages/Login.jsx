import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../services/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { Zap, Eye, EyeOff, Mail, RefreshCw, ArrowLeft } from 'lucide-react'

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [needsVerify, setNeedsVerify] = useState(false)
  const [verifyEmail, setVerifyEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [resendTimer, setResendTimer] = useState(0)
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const otpRefs = useRef([])

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(r => r - 1), 1000)
      return () => clearTimeout(t)
    }
  }, [resendTimer])

  const handle = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await authApi.login(form)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify({ username: data.username, email: data.email, role: data.role }))
      setAuth({ username: data.username, email: data.email, role: data.role }, data.token)
      toast.success(`Welcome back, ${data.username}!`)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const msg = err.response?.data?.message || ''
      if (msg.startsWith('EMAIL_NOT_VERIFIED:')) {
        const email = msg.split(':')[1]
        setVerifyEmail(email)
        setNeedsVerify(true)
        setResendTimer(60)
        toast('Please verify your email first', { icon: '📧' })
      } else {
        toast.error(msg || 'Login failed')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    if (value && index < 5) otpRefs.current[index + 1]?.focus()
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus()
  }

  const handleVerify = async () => {
    const otpCode = otp.join('')
    if (otpCode.length !== 6) return toast.error('Enter the 6-digit OTP')
    setLoading(true)
    try {
      const { data } = await authApi.verifyEmail({ email: verifyEmail, otp: otpCode })
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify({ username: data.username, email: data.email, role: data.role }))
      setAuth({ username: data.username, email: data.email, role: data.role }, data.token)
      toast.success('Email verified! Welcome!')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP')
      setOtp(['', '', '', '', '', ''])
      otpRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendTimer > 0) return
    try {
      await authApi.resendOtp({ email: verifyEmail, type: 'VERIFY_EMAIL' })
      setResendTimer(60)
      toast.success('New OTP sent!')
    } catch { toast.error('Failed to resend') }
  }

  const cs = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 20 }

  if (needsVerify) return (
    <div style={cs}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, margin: '0 auto 16px', background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Mail size={26} color="#00d4ff" />
          </div>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Verify Email</h1>
          <p style={{ color: 'var(--text2)', fontSize: 14 }}>OTP sent to <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{verifyEmail}</span></p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'var(--yellow)' }}>
          <span style={{ fontSize: 15 }}>📬</span>
          <span>Can&#39;t find it? Check your <strong>spam / junk folder</strong>.</span>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            {otp.map((digit, i) => (
              <input key={i} ref={el => otpRefs.current[i] = el} type="text" inputMode="numeric" maxLength={1} value={digit}
                onChange={e => handleOtpChange(i, e.target.value)} onKeyDown={e => handleOtpKeyDown(i, e)}
                style={{ width: 50, height: 56, textAlign: 'center', fontSize: 24, fontWeight: 800, borderRadius: 12, border: `2px solid ${digit ? 'var(--accent)' : 'var(--border2)'}`, background: digit ? 'rgba(0,212,255,0.08)' : 'var(--bg)', color: 'var(--text)', outline: 'none', fontFamily: 'var(--display)' }} />
            ))}
          </div>
          <button className="btn btn-primary" onClick={handleVerify} disabled={loading || otp.join('').length !== 6} style={{ justifyContent: 'center', padding: '13px' }}>
            {loading ? 'Verifying...' : 'Verify & Login'}
          </button>
          <div style={{ textAlign: 'center' }}>
            <button onClick={handleResend} disabled={resendTimer > 0}
              style={{ background: 'none', border: 'none', cursor: resendTimer > 0 ? 'default' : 'pointer', color: resendTimer > 0 ? 'var(--text3)' : 'var(--accent)', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <RefreshCw size={13} />{resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
            </button>
          </div>
          <button onClick={() => setNeedsVerify(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
            <ArrowLeft size={13} /> Back to login
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div style={cs}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, margin: '0 auto 16px', background: 'linear-gradient(135deg, #00d4ff, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={26} color="#fff" />
          </div>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Welcome Back</h1>
          <p style={{ color: 'var(--text2)', fontSize: 14 }}>Sign in to continue your interview prep</p>
        </div>

        <form onSubmit={handle} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 8 }}>Username</label>
            <input type="text" placeholder="Enter your username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>Password</label>
              <Link to="/forgot-password" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>Forgot password?</Link>
            </div>
            <div style={{ position: 'relative' }}>
              <input type={showPass ? 'text' : 'password'} placeholder="Enter your password" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} required style={{ paddingRight: 44 }} />
              <button type="button" onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer' }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ justifyContent: 'center', marginTop: 8, padding: '13px' }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Link to="/forgot-username" style={{ fontSize: 13, color: 'var(--text3)', textDecoration: 'none' }}>Forgot username?</Link>
        </div>
        <p style={{ textAlign: 'center', marginTop: 12, fontSize: 14, color: 'var(--text2)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Create one free</Link>
        </p>
      </div>
    </div>
  )
}