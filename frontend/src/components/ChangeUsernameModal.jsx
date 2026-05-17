import React, { useState, useEffect, useRef } from 'react'
import { authApi } from '../services/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { X, User, Check } from 'lucide-react'

export default function ChangeUsernameModal({ onClose }) {
  const { user, setUser } = useAuthStore()
  const [newUsername, setNewUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
    // Close on Escape
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const isSame = newUsername.trim().toLowerCase() === user?.username?.toLowerCase()
  const isValid = newUsername.trim().length >= 3

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isValid) return toast.error('Username must be at least 3 characters')
    if (isSame)  return toast.error('That is already your username')
    setLoading(true)
    try {
      const { data } = await authApi.changeUsername({ username: newUsername.trim() })
      // Update store + localStorage
      const updated = { ...user, username: data.username || newUsername.trim() }
      setUser(updated)
      localStorage.setItem('user', JSON.stringify(updated))
      toast.success('Username updated!')
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update username')
    } finally {
      setLoading(false)
    }
  }

  return (
    // Backdrop
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      {/* Modal */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 400,
          background: 'var(--card)', border: '1px solid var(--border2)',
          borderRadius: 16, padding: 28,
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={18} color="var(--accent)" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Change Username</div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>Current: <strong style={{ color: 'var(--text2)' }}>{user?.username}</strong></div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4, borderRadius: 6 }}>
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 8 }}>
              New Username
            </label>
            <input
              ref={inputRef}
              type="text"
              placeholder="Enter new username"
              value={newUsername}
              onChange={e => setNewUsername(e.target.value)}
              minLength={3}
              maxLength={30}
              required
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10,
                border: `1px solid ${isSame ? 'var(--yellow)' : isValid && newUsername ? 'var(--accent)' : 'var(--border2)'}`,
                background: 'var(--bg)', color: 'var(--text)', fontSize: 14,
                outline: 'none', boxSizing: 'border-box',
              }}
            />
            {isSame && newUsername && (
              <p style={{ fontSize: 12, color: 'var(--yellow)', marginTop: 6 }}>⚠️ That's already your current username</p>
            )}
            {!isSame && isValid && newUsername && (
              <p style={{ fontSize: 12, color: 'var(--green)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Check size={12} /> Looks good
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1px solid var(--border2)', background: 'none', color: 'var(--text2)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !isValid || isSame}
              className="btn btn-primary"
              style={{ flex: 1, justifyContent: 'center', padding: '11px', opacity: (!isValid || isSame) ? 0.5 : 1 }}
            >
              {loading ? 'Saving...' : 'Save Username'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}