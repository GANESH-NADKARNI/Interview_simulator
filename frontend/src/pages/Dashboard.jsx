import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { sessionApi } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { Brain, Code2, Mic, ArrowRight, TrendingUp, Clock, Trophy, FileText, Settings } from 'lucide-react'

const MODULES = [
  {
    path: '/aptitude', icon: Brain, color: '#00d4ff',
    title: 'Aptitude Test', sub: '10 Questions',
    desc: 'Quantitative, Logical, Verbal & Data Interpretation',
    grad: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(0,212,255,0.05))',
    border: 'rgba(0,212,255,0.2)',
  },
  {
    path: '/coding', icon: Code2, color: '#7c3aed',
    title: 'DSA Coding', sub: '5 Problems',
    desc: 'Real FAANG interview problems with AI code review',
    grad: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(124,58,237,0.05))',
    border: 'rgba(124,58,237,0.2)',
  },
  {
    path: '/hr', icon: Mic, color: '#f97316',
    title: 'HR Interview', sub: '5 Questions',
    desc: 'Voice-based with tone, grammar & STAR analysis',
    grad: 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(249,115,22,0.05))',
    border: 'rgba(249,115,22,0.2)',
  },
  {
    path: '/resume', icon: FileText, color: '#00ff88',
    title: 'Resume Scanner', sub: 'ATS Check',
    desc: 'Upload resume for ATS score, keyword gaps & improvements',
    grad: 'linear-gradient(135deg, rgba(0,255,136,0.15), rgba(0,255,136,0.05))',
    border: 'rgba(0,255,136,0.2)',
  },
  {
    path: '/expertise', icon: Settings, color: '#a78bfa',
    title: 'My Expertise', sub: 'Profile',
    desc: 'Set your domain & level to get personalized questions',
    grad: 'linear-gradient(135deg, rgba(167,139,250,0.15), rgba(167,139,250,0.05))',
    border: 'rgba(167,139,250,0.2)',
  },
]

export default function Dashboard() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState(null)
  const [sessions, setSessions] = useState([])

  useEffect(() => {
    sessionApi.getStats().then(r => setStats(r.data)).catch(() => {})
    sessionApi.getAll().then(r => setSessions(r.data?.slice(0, 5) || [])).catch(() => {})
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontFamily: 'var(--display)', fontSize: 32, fontWeight: 800, marginBottom: 6 }}>
          {greeting}, {user?.username} 👋
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: 15 }}>
          Ready to level up your interview skills? Pick a module to practice.
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid-3" style={{ marginBottom: 36 }}>
          {[
            { icon: Trophy, label: 'Sessions Done', value: stats.completedSessions, color: '#00d4ff' },
            { icon: TrendingUp, label: 'Avg Score', value: `${stats.averageScore}%`, color: '#7c3aed' },
            { icon: Clock, label: 'Total Attempts', value: stats.totalSessions, color: '#f97316' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: `${color}18`, border: `1px solid ${color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Icon size={22} color={color} />
              </div>
              <div>
                <div style={{ fontSize: 26, fontFamily: 'var(--display)', fontWeight: 800 }}>{value}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>{label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modules */}
      <h2 style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
        Practice Modules
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 40 }}>
        {MODULES.map(({ path, icon: Icon, color, title, sub, desc, grad, border }) => (
          <Link key={path} to={path} style={{ textDecoration: 'none' }}>
            <div style={{
              background: grad, border: `1px solid ${border}`,
              borderRadius: 16, padding: 24, cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = `0 8px 30px ${color}20`
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div style={{
                  width: 50, height: 50, borderRadius: 13,
                  background: `${color}20`, border: `1px solid ${color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={24} color={color} />
                </div>
                <span className="tag" style={{
                  background: `${color}15`, color, borderColor: `${color}30`,
                  fontSize: 11,
                }}>{sub}</span>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{title}</h3>
              <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 20 }}>{desc}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color, fontSize: 13, fontWeight: 600 }}>
                Start Practice <ArrowRight size={15} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent sessions */}
      {sessions.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 700 }}>Recent Sessions</h2>
            <Link to="/history" style={{ color: 'var(--accent)', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>
              View all →
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sessions.map(s => (
              <div key={s.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16 }}>
                <div className={`tag tag-${s.type === 'APTITUDE' ? 'blue' : s.type === 'CODING' ? 'purple' : 'medium'}`}>
                  {s.type}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: 'var(--text2)' }}>
                    {new Date(s.startedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                {s.completed && (
                  <div style={{ fontSize: 20, fontFamily: 'var(--display)', fontWeight: 800, color: s.totalScore >= 70 ? 'var(--green)' : s.totalScore >= 40 ? 'var(--yellow)' : 'var(--red)' }}>
                    {s.totalScore}%
                  </div>
                )}
                {!s.completed && <span style={{ fontSize: 12, color: 'var(--text3)' }}>Incomplete</span>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
