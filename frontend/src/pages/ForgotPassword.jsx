import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../services/api'
import toast from 'react-hot-toast'
import { KeyRound, Mail, RefreshCw, ArrowLeft, Eye, EyeOff, CheckCircle } from 'lucide-react'

export default function ForgotPassword() {
  const [step, setStep] = useState('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [passwords, setPasswords] = useState({ newPassword: '', confirm: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const otpRefs = useRef([])

  useEffect(() => {
    if (resendTimer > 0) { const t = setTimeout(() => setResendTimer(r => r - 1), 1000); return () => clearTimeout(t) }
  }, [resendTimer])

  const handleSendOtp = async (e) => {
    e.preventDefault(); setLoading(true)
    try { await authApi.forgotPassword({ email }); setStep('otp'); setResendTimer(60); toast.success('OTP sent to ' + email) }
    catch (err) { toast.error(err.response?.data?.message || 'Email not found') }
    finally { setLoading(false) }
  }

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]; newOtp[index] = value.slice(-1); setOtp(newOtp)
    if (value && index < 5) otpRefs.current[index + 1]?.focus()
  }
  const handleOtpKeyDown = (index, e) => { if (e.key === 'Backspace' && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus() }

  const handleVerifyOtp = async () => {
    const otpCode = otp.join('')
    if (otpCode.length !== 6) return toast.error('Enter the 6-digit OTP')
    setLoading(true)
    try { await authApi.verifyResetOtp({ email, otp: otpCode }); setStep('newpass') }
    catch (err) { toast.error(err.response?.data?.message || 'Invalid OTP'); setOtp(['','','','','','']); otpRefs.current[0]?.focus() }
    finally { setLoading(false) }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (passwords.newPassword.length < 8) return toast.error('Password must be at least 8 characters')
    if (passwords.newPassword !== passwords.confirm) return toast.error('Passwords do not match')
    setLoading(true)
    try { await authApi.resetPassword({ email, otp: otp.join(''), newPassword: passwords.newPassword }); setStep('done') }
    catch (err) { toast.error(err.response?.data?.message || 'Reset failed') }
    finally { setLoading(false) }
  }

  const handleResend = async () => {
    if (resendTimer > 0) return
    try { await authApi.resendOtp({ email, type: 'RESET_PASSWORD' }); setResendTimer(60); setOtp(['','','','','','']); toast.success('New OTP sent!') }
    catch { toast.error('Failed to resend') }
  }

  const cs = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 20 }
  const steps = ['Email', 'OTP', 'New Password']
  const stepIndex = step === 'email' ? 0 : step === 'otp' ? 1 : 2
  const StepBar = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, background: i <= stepIndex ? 'var(--accent)' : 'var(--bg2)', color: i <= stepIndex ? '#000' : 'var(--text3)', border: `2px solid ${i <= stepIndex ? 'var(--accent)' : 'var(--border2)'}` }}>
              {i < stepIndex ? '✓' : i + 1}
            </div>
            <span style={{ fontSize: 10, color: i <= stepIndex ? 'var(--accent)' : 'var(--text3)', fontWeight: 600 }}>{s}</span>
          </div>
          {i < steps.length - 1 && <div style={{ width: 60, height: 2, background: i < stepIndex ? 'var(--accent)' : 'var(--border2)', margin: '0 4px', marginBottom: 20 }} />}
        </React.Fragment>
      ))}
    </div>
  )

  if (step === 'email') return (
    <div style={cs}><div style={{ width: '100%', maxWidth: 420 }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, margin: '0 auto 16px', background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><KeyRound size={26} color="#00d4ff" /></div>
        <h1 style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Forgot Password</h1>
        <p style={{ color: 'var(--text2)', fontSize: 14 }}>Enter your email to receive a reset OTP</p>
      </div>
      <StepBar />
      <form onSubmit={handleSendOtp} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div><label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 8 }}>Email Address</label>
          <input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required /></div>
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ justifyContent: 'center', padding: '13px' }}>{loading ? 'Sending OTP...' : 'Send OTP'}</button>
      </form>
      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <Link to="/login" style={{ fontSize: 13, color: 'var(--text3)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}><ArrowLeft size={13} /> Back to login</Link>
      </div>
    </div></div>
  )

  if (step === 'otp') return (
    <div style={cs}><div style={{ width: '100%', maxWidth: 420 }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, margin: '0 auto 16px', background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Mail size={26} color="#00d4ff" /></div>
        <h1 style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Enter OTP</h1>
        <p style={{ color: 'var(--text2)', fontSize: 14 }}>Sent to <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{email}</span></p>
      </div>
      <StepBar />
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
        <button className="btn btn-primary" onClick={handleVerifyOtp} disabled={loading || otp.join('').length !== 6} style={{ justifyContent: 'center', padding: '13px' }}>{loading ? 'Verifying...' : 'Verify OTP'}</button>
        <div style={{ textAlign: 'center' }}>
          <button onClick={handleResend} disabled={resendTimer > 0} style={{ background: 'none', border: 'none', cursor: resendTimer > 0 ? 'default' : 'pointer', color: resendTimer > 0 ? 'var(--text3)' : 'var(--accent)', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={13} />{resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
          </button>
        </div>
        <button onClick={() => setStep('email')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}><ArrowLeft size={13} /> Change email</button>
      </div>
    </div></div>
  )

  if (step === 'newpass') return (
    <div style={cs}><div style={{ width: '100%', maxWidth: 420 }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, margin: '0 auto 16px', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><KeyRound size={26} color="#7c3aed" /></div>
        <h1 style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 800, marginBottom: 8 }}>New Password</h1>
        <p style={{ color: 'var(--text2)', fontSize: 14 }}>Choose a strong password</p>
      </div>
      <StepBar />
      <form onSubmit={handleResetPassword} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {['newPassword', 'confirm'].map(key => (
          <div key={key}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 8 }}>{key === 'newPassword' ? 'New Password' : 'Confirm Password'}</label>
            <div style={{ position: 'relative' }}>
              <input type={showPass ? 'text' : 'password'} placeholder="Min 8 characters" value={passwords[key]} onChange={e => setPasswords({ ...passwords, [key]: e.target.value })} required style={{ paddingRight: 44 }} />
              {key === 'newPassword' && <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer' }}>{showPass ? <EyeOff size={16} /> : <Eye size={16} />}</button>}
            </div>
            {key === 'confirm' && passwords.confirm && passwords.newPassword !== passwords.confirm && <p style={{ fontSize: 12, color: 'var(--red)', marginTop: 4 }}>Passwords do not match</p>}
          </div>
        ))}
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ justifyContent: 'center', padding: '13px', marginTop: 8 }}>{loading ? 'Resetting...' : 'Reset Password'}</button>
      </form>
    </div></div>
  )

  return (
    <div style={cs}><div style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
      <div style={{ width: 80, height: 80, borderRadius: '50%', margin: '0 auto 24px', background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle size={40} color="var(--green)" /></div>
      <h1 style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Password Reset!</h1>
      <p style={{ color: 'var(--text2)', marginBottom: 32 }}>Your password has been updated. You can now log in with your new password.</p>
      <Link to="/login"><button className="btn btn-primary" style={{ justifyContent: 'center', padding: '13px 32px' }}>Go to Login</button></Link>
    </div></div>
  )
}