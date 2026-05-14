import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import {
  LayoutDashboard, Brain, Code2, Mic, History,
  LogOut, Menu, X, Zap, ChevronRight, FileText, Settings
} from 'lucide-react'

const NAV = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/aptitude', icon: Brain, label: 'Aptitude', color: '#00d4ff' },
  { path: '/coding', icon: Code2, label: 'Coding', color: '#7c3aed' },
  { path: '/hr', icon: Mic, label: 'HR Interview', color: '#f97316' },
  { path: '/resume', icon: FileText, label: 'Resume Scanner', color: '#00ff88' },
  { path: '/history', icon: History, label: 'History' },
]

const NAV_BOTTOM = [
  { path: '/expertise', icon: Settings, label: 'My Expertise', color: '#a78bfa' },
]

export default function Layout({ children }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Sidebar */}
      <aside style={{
        width: 240,
        background: 'var(--bg2)',
        borderRight: '1px solid var(--border2)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 0',
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        zIndex: 50,
        transform: mobileOpen ? 'translateX(0)' : undefined,
        transition: 'transform 0.3s ease',
      }}
        className="sidebar"
      >
        {/* Logo */}
        <div style={{ padding: '0 20px 32px', borderBottom: '1px solid var(--border2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Zap size={20} color="#fff" />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 16 }}>InterviewAI</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>Powered by Groq</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV.map(({ path, icon: Icon, label, color }) => {
            const active = pathname === path
            return (
              <Link key={path} to={path}
                onClick={() => setMobileOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', borderRadius: 10,
                  textDecoration: 'none',
                  background: active ? 'rgba(0,212,255,0.08)' : 'transparent',
                  border: active ? '1px solid rgba(0,212,255,0.15)' : '1px solid transparent',
                  color: active ? 'var(--accent)' : 'var(--text2)',
                  fontWeight: active ? 600 : 400,
                  fontSize: 14,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
              >
                <Icon size={18} color={active ? 'var(--accent)' : (color || 'var(--text3)')} />
                {label}
                {active && <ChevronRight size={14} style={{ marginLeft: 'auto' }} />}
              </Link>
            )
          })}

          {/* Separator */}
          <div style={{ height: 1, background: 'var(--border2)', margin: '8px 0' }} />

          {NAV_BOTTOM.map(({ path, icon: Icon, label, color }) => {
            const active = pathname === path
            return (
              <Link key={path} to={path}
                onClick={() => setMobileOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', borderRadius: 10,
                  textDecoration: 'none',
                  background: active ? 'rgba(167,139,250,0.08)' : 'transparent',
                  border: active ? '1px solid rgba(167,139,250,0.15)' : '1px solid transparent',
                  color: active ? color : 'var(--text2)',
                  fontWeight: active ? 600 : 400,
                  fontSize: 14,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
              >
                <Icon size={18} color={active ? color : 'var(--text3)'} />
                {label}
                {active && <ChevronRight size={14} style={{ marginLeft: 'auto' }} />}
              </Link>
            )
          })}
        </nav>

        {/* User */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border2)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px', marginBottom: 8,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent2), var(--accent))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: '#fff',
            }}>
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.username}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>{user?.email}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-ghost"
            style={{ width: '100%', justifyContent: 'center', fontSize: 13 }}>
            <LogOut size={15} /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40 }} />
      )}

      {/* Mobile header */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 56,
        background: 'var(--bg2)', borderBottom: '1px solid var(--border2)',
        display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12,
        zIndex: 30,
      }} className="mobile-header">
        <button onClick={() => setMobileOpen(!mobileOpen)}
          style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer' }}>
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <span style={{ fontFamily: 'var(--display)', fontWeight: 800 }}>InterviewAI</span>
      </div>

      {/* Main content */}
      <main style={{ flex: 1, marginLeft: 240, padding: '32px', minHeight: '100vh' }}
        className="main-content">
        {children}
      </main>

      <style>{`
        @media (max-width: 768px) {
          .sidebar { transform: translateX(-100%); }
          .sidebar.open { transform: translateX(0); }
          .main-content { margin-left: 0 !important; padding-top: 72px !important; padding: 72px 16px 32px; }
          .mobile-header { display: flex !important; }
        }
        @media (min-width: 769px) {
          .mobile-header { display: none !important; }
        }
      `}</style>
    </div>
  )
}
