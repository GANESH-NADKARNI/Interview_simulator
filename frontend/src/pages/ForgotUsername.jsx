import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '../services/api'
import toast from 'react-hot-toast'
import { User, ArrowLeft, CheckCircle } from 'lucide-react'

export default function ForgotUsername() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handle = async (e) => {
    e.preventDefault(); setLoading(true)
    try { await authApi.forgotUsername({ email }); setSent(true) }
    catch (err) { toast.error(err.response?.data?.message || 'Email not found') }
    finally { setLoading(false) }
  }

  const cs = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 20 }

  if (sent) return (
    <div style={cs}><div style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
      <div style={{ width: 80, height: 80, borderRadius: '50%', margin: '0 auto 24px', background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle size={40} color="var(--green)" /></div>
      <h1 style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Email Sent!</h1>
      <p style={{ color: 'var(--text2)', marginBottom: 32 }}>Your username has been sent to <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{email}</span>. Check your inbox.</p>
      <Link to="/login"><button className="btn btn-primary" style={{ justifyContent: 'center', padding: '13px 32px' }}>Go to Login</button></Link>
    </div></div>
  )

  return (
    <div style={cs}><div style={{ width: '100%', maxWidth: 420 }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, margin: '0 auto 16px', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={26} color="#7c3aed" /></div>
        <h1 style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Forgot Username</h1>
        <p style={{ color: 'var(--text2)', fontSize: 14 }}>Enter your email and we'll send your username</p>
      </div>
      <form onSubmit={handle} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div><label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 8 }}>Email Address</label>
          <input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required /></div>
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ justifyContent: 'center', padding: '13px' }}>{loading ? 'Sending...' : 'Send Username'}</button>
      </form>
      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <Link to="/login" style={{ fontSize: 13, color: 'var(--text3)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}><ArrowLeft size={13} /> Back to login</Link>
      </div>
    </div></div>
  )
}