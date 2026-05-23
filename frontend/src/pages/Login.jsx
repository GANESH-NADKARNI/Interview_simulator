import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { useOAuthLogin } from '../hooks/useOAuthLogin'  // ✅ shared hook (fixed)
import toast from 'react-hot-toast'
import { Zap, Eye, EyeOff, Mail, RefreshCw, ArrowLeft } from 'lucide-react'

// ─── Google icon SVG ─────────────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615Z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
  </svg>
)

// ─── GitHub icon SVG ──────────────────────────────────────────────────────────
const GithubIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12Z"/>
  </svg>
)

// ─── Divider ──────────────────────────────────────────────────────────────────
const Divider = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
    <div style={{ flex: 1, height: 1, background: 'var(--border2)' }} />
    <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 500 }}>or continue with</span>
    <div style={{ flex: 1, height: 1, background: 'var(--border2)' }} />
  </div>
)

// ─── OAuth buttons ────────────────────────────────────────────────────────────
const OAuthButtons = ({ oauthLoading, handleOAuth }) => (
  <div style={{ display: 'flex', gap: 10 }}>
    <button
      type="button"
      onClick={() => handleOAuth('google')}
      disabled={oauthLoading !== null}
      style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: '11px 16px', borderRadius: 10, border: '1px solid var(--border2)',
        background: 'var(--bg)', color: 'var(--text)', fontSize: 13, fontWeight: 600,
        cursor: oauthLoading !== null ? 'not-allowed' : 'pointer',
        opacity: oauthLoading !== null ? 0.6 : 1,
        transition: 'border-color 0.2s, background 0.2s',
      }}
    >
      <GoogleIcon />
      {oauthLoading === 'google' ? 'Opening...' : 'Google'}
    </button>
    <button
      type="button"
      onClick={() => handleOAuth('github')}
      disabled={oauthLoading !== null}
      style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: '11px 16px', borderRadius: 10, border: '1px solid var(--border2)',
        background: 'var(--bg)', color: 'var(--text)', fontSize: 13, fontWeight: 600,
        cursor: oauthLoading !== null ? 'not-allowed' : 'pointer',
        opacity: oauthLoading !== null ? 0.6 : 1,
        transition: 'border-color 0.2s, background 0.2s',
      }}
    >
      <GithubIcon />
      {oauthLoading === 'github' ? 'Opening...' : 'GitHub'}
    </button>
  </div>
)

// ─── Main Login component ─────────────────────────────────────────────────────
// ⚠️  Everything below this line is IDENTICAL to your original Login.jsx.
//     Only the import at the top changed (useOAuthLogin moved to shared hook).
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
  const { oauthLoading, handleOAuth } = useOAuthLogin()

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(r => r - 1), 1000)
      return () => clearTimeout(t)
    }
  }, [resendTimer])

  // ── Your existing email/password login — UNTOUCHED ────────────────────────
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

  // ── Your existing OTP handlers — UNTOUCHED ────────────────────────────────
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

  // ── OTP verification screen — UNTOUCHED ──────────────────────────────────
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
                style={{ width: 46, height: 54, textAlign: 'center', fontSize: 22, fontWeight: 800, borderRadius: 12, border: `2px solid ${digit ? 'var(--accent)' : 'var(--border2)'}`, background: digit ? 'rgba(0,212,255,0.08)' : 'var(--bg)', color: 'var(--text)', outline: 'none', fontFamily: 'Arial, sans-serif', lineHeight: 1, padding: 0, boxSizing: 'border-box' }} />
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

  // ── Main login screen — UNTOUCHED ─────────────────────────────────────────
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

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <OAuthButtons oauthLoading={oauthLoading} handleOAuth={handleOAuth} />
          <Divider />

          {/* ── Your existing email/password form — UNTOUCHED ── */}
          <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
            <button type="submit" className="btn btn-primary" disabled={loading || oauthLoading !== null} style={{ justifyContent: 'center', padding: '13px' }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

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