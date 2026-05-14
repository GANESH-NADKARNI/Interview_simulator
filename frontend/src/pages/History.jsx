import React, { useEffect, useState } from 'react'
import { sessionApi } from '../services/api'
import { Brain, Code2, Mic, Trophy, Calendar } from 'lucide-react'

const TYPE_ICON = { APTITUDE: Brain, CODING: Code2, HR: Mic }
const TYPE_COLOR = { APTITUDE: '#00d4ff', CODING: '#7c3aed', HR: '#f97316' }
const SCORE_COLOR = (s) => s >= 70 ? 'var(--green)' : s >= 40 ? 'var(--yellow)' : 'var(--red)'

export default function History() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')

  useEffect(() => {
    sessionApi.getAll()
      .then(r => setSessions(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'ALL' ? sessions : sessions.filter(s => s.type === filter)
  const completed = filtered.filter(s => s.completed)

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 800, marginBottom: 6 }}>Session History</h1>
        <p style={{ color: 'var(--text2)', fontSize: 14 }}>{sessions.filter(s => s.completed).length} completed sessions</p>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {['ALL', 'APTITUDE', 'CODING', 'HR'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={filter === f ? 'btn btn-primary' : 'btn btn-ghost'}
            style={{ fontSize: 13, padding: '8px 16px' }}>
            {f === 'ALL' ? 'All' : f}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div className="spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <Trophy size={40} color="var(--text3)" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text3)', fontSize: 15 }}>No sessions yet. Start practicing!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(s => {
            const Icon = TYPE_ICON[s.type] || Brain
            const color = TYPE_COLOR[s.type] || '#00d4ff'
            return (
              <div key={s.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: `${color}18`, border: `1px solid ${color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Icon size={20} color={color} />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{s.type} Interview</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text3)', fontSize: 12 }}>
                    <Calendar size={12} />
                    {new Date(s.startedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {s.overallRemarks && (
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4, maxWidth: 500 }}>
                      {s.overallRemarks.substring(0, 100)}{s.overallRemarks.length > 100 ? '...' : ''}
                    </div>
                  )}
                </div>

                <div style={{ textAlign: 'right' }}>
                  {s.completed ? (
                    <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 24, color: SCORE_COLOR(s.totalScore) }}>
                      {s.totalScore}%
                    </div>
                  ) : (
                    <span style={{ fontSize: 12, color: 'var(--text3)', background: 'var(--bg2)', padding: '4px 10px', borderRadius: 20 }}>
                      Incomplete
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
