import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { sessionApi } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'
import { Brain, Code2, Mic, ArrowRight, TrendingUp, Clock, Trophy, FileText, Settings, Target, Zap, Calendar, Timer } from 'lucide-react'

const MODULES = [
  { path: '/aptitude', icon: Brain, color: '#00d4ff', title: 'Aptitude Test', sub: '10 Questions', desc: 'Quantitative, Logical, Verbal & Pattern Recognition', grad: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(0,212,255,0.05))', border: 'rgba(0,212,255,0.2)' },
  { path: '/coding',   icon: Code2,  color: '#7c3aed', title: 'DSA Coding',   sub: '5 Problems',  desc: 'Real FAANG interview problems with AI code review',  grad: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(124,58,237,0.05))', border: 'rgba(124,58,237,0.2)' },
  { path: '/hr',       icon: Mic,    color: '#f97316', title: 'HR Interview', sub: '5 Questions', desc: 'Voice-based with tone, grammar & STAR analysis',      grad: 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(249,115,22,0.05))', border: 'rgba(249,115,22,0.2)' },
  { path: '/resume',   icon: FileText,color: '#00ff88',title: 'Resume Scanner',sub: 'ATS Check',  desc: 'Upload resume for ATS score & improvement tips',       grad: 'linear-gradient(135deg, rgba(0,255,136,0.15), rgba(0,255,136,0.05))', border: 'rgba(0,255,136,0.2)' },
  { path: '/expertise',icon: Settings,color: '#a78bfa',title: 'My Expertise', sub: 'Profile',     desc: 'Set domain & level for personalized questions',        grad: 'linear-gradient(135deg, rgba(167,139,250,0.15), rgba(167,139,250,0.05))', border: 'rgba(167,139,250,0.2)' },
]

function formatTime(s) {
  if (!s) return '—'
  const m = Math.floor(s / 60), sec = s % 60
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`
}

// GitHub-style contribution heatmap - all dates in UTC to match server storage
function ActivityHeatmap({ sessions, createdAt }) {
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  // All date logic in UTC so it matches server-stored timestamps exactly
  const todayKey = new Date().toISOString().split('T')[0] // YYYY-MM-DD UTC
  const currentYear = parseInt(todayKey.slice(0, 4))

  const accountStartKey = useMemo(() => {
    const d = createdAt ? new Date(createdAt) : new Date()
    return d.toISOString().split('T')[0]
  }, [createdAt])
  const startYear = parseInt(accountStartKey.slice(0, 4))

  const availableYears = useMemo(() => {
    const years = []
    for (let y = currentYear; y >= startYear; y--) years.push(y)
    return years
  }, [startYear, currentYear])

  const [selected, setSelected] = useState(currentYear)

  const { weeks, map } = useMemo(() => {
    // Build date→count map using UTC date keys to match server-stored timestamps
    const map = {}
    sessions.forEach(s => {
      const raw = s.startedAt || ''
      const d = new Date(raw.endsWith('Z') ? raw : raw + 'Z')
      const key = d.toISOString().split('T')[0] // UTC YYYY-MM-DD
      if (key >= accountStartKey) {
        map[key] = (map[key] || 0) + 1
      }
    })

    const y = Number(selected)

    // Range as UTC date strings for simple string comparison
    const rangeStartKey = y === startYear ? accountStartKey : `${y}-01-01`
    const rangeEndKey   = y === currentYear ? todayKey : `${y}-12-31`

    // Build grid using UTC date arithmetic
    const rangeStartDate = new Date(rangeStartKey + 'T00:00:00Z')
    const rangeEndDate   = new Date(rangeEndKey   + 'T00:00:00Z')

    // Align to Sunday on or before rangeStart (using UTC day-of-week)
    const gridStart = new Date(rangeStartDate)
    gridStart.setUTCDate(gridStart.getUTCDate() - gridStart.getUTCDay())

    const weeks = []
    let week = []
    const cur = new Date(gridStart)

    while (cur <= rangeEndDate || week.length > 0) {
      if (cur > rangeEndDate) {
        while (week.length < 7) week.push({ date: '', count: -1, month: -1, day: -1 })
        weeks.push(week)
        break
      }
      const key = cur.toISOString().split('T')[0]
      const inRange = key >= rangeStartKey && key <= rangeEndKey
      week.push({ date: key, count: inRange ? (map[key] || 0) : -1, month: cur.getUTCMonth(), day: cur.getUTCDate() })
      cur.setUTCDate(cur.getUTCDate() + 1)
      if (week.length === 7) { weeks.push(week); week = [] }
    }

    return { weeks, map }
  }, [sessions, selected, accountStartKey, todayKey])

  const totalSessions = Object.values(map).reduce((a, b) => a + b, 0)
  const activeDays = Object.keys(map).length

  const bestStreak = useMemo(() => {
    const sorted = Object.keys(map).sort()
    let best = 0, cur = 0, prev = null
    sorted.forEach(d => {
      const dt = new Date(d)
      if (prev) {
        const diff = (dt - prev) / 86400000
        cur = diff === 1 ? cur + 1 : 1
      } else cur = 1
      best = Math.max(best, cur)
      prev = dt
    })
    return best
  }, [map])

  const getColor = (count) => {
    if (count < 0) return 'transparent'
    if (count === 0) return 'rgba(255,255,255,0.06)'
    if (count === 1) return '#9be9a8'
    if (count === 2) return '#40c463'
    if (count === 3) return '#30a14e'
    return '#216e39'
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 16, fontSize: 13, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ color: 'var(--text2)' }}>
            <strong style={{ color: 'var(--text)', fontSize: 15 }}>{totalSessions}</strong> sessions in {selected}
          </span>
          <span style={{ color: 'var(--text3)' }}>Total active days: <strong style={{ color: 'var(--text)' }}>{activeDays}</strong></span>
          <span style={{ color: 'var(--text3)' }}>Max streak: <strong style={{ color: 'var(--text)' }}>{bestStreak}</strong></span>
        </div>

        {availableYears.length > 1 && (
          <select
            value={selected}
            onChange={e => setSelected(Number(e.target.value))}
            style={{ fontSize: 13, padding: '5px 12px', borderRadius: 8, border: '1px solid var(--border2)', background: 'var(--bg2)', color: 'var(--text)', cursor: 'pointer', width: 'auto', minWidth: 100 }}
          >
            {availableYears.map(y => (
              <option key={y} value={y}>{y}{y === currentYear ? ' (current)' : ''}</option>
            ))}
          </select>
        )}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'inline-flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', gap: 0 }}>
            {/* Day labels */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginRight: 6 }}>
              {[null, 'Mon', null, 'Wed', null, 'Fri', null].map((d, i) => (
                <div key={i} style={{ fontSize: 10, color: 'var(--text3)', height: 13, lineHeight: '13px', width: 24, textAlign: 'right', paddingRight: 4 }}>
                  {d || ''}
                </div>
              ))}
            </div>

            {/* Week columns */}
            <div style={{ display: 'flex', gap: 3 }}>
              {weeks.map((wk, wi) => (
                <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {wk.map((cell, di) => (
                    <div
                      key={di}
                      title={cell.count > 0 ? `${cell.date}: ${cell.count} session${cell.count > 1 ? 's' : ''}` : cell.date || ''}
                      style={{
                        width: 13, height: 13, borderRadius: 3,
                        background: cell.count < 0 ? 'transparent' : getColor(cell.count),
                        cursor: cell.count > 0 ? 'pointer' : 'default',
                        flexShrink: 0, transition: 'opacity 0.15s'
                      }}
                      onMouseEnter={e => { if (cell.count > 0) e.target.style.opacity = '0.75' }}
                      onMouseLeave={e => e.target.style.opacity = '1'}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Month labels */}
          <div style={{ display: 'flex', marginLeft: 30, marginTop: 6, gap: 3 }}>
            {weeks.map((wk, wi) => {
              const firstValid = wk.find(cell => cell.count >= 0)
              const showMonth = firstValid && firstValid.day <= 7
              return (
                <div key={wi} style={{ width: 13, fontSize: 11, color: 'var(--text3)', overflow: 'visible', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {showMonth ? MONTHS[firstValid.month] : ''}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 12, justifyContent: 'flex-end' }}>
        <span style={{ fontSize: 11, color: 'var(--text3)' }}>Less</span>
        {[0, 1, 2, 3, 4].map(c => (
          <div key={c} style={{ width: 13, height: 13, borderRadius: 3, background: getColor(c) }} />
        ))}
        <span style={{ fontSize: 11, color: 'var(--text3)' }}>More</span>
      </div>
    </div>
  )
}

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 10, padding: '10px 14px', fontSize: 13 }}>
      <p style={{ color: 'var(--text3)', marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontWeight: 700 }}>{p.name}: {p.value}{p.name === 'Score' ? '%' : ''}</p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState(null)
  const [sessions, setSessions] = useState([])
  const [allSessions, setAllSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      sessionApi.getStats(),
      sessionApi.getAll(),
    ]).then(([statsRes, sessRes]) => {
      setStats(statsRes.data)
      const all = sessRes.data || []
      setAllSessions(all)
      setSessions(all.slice(0, 6))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  // Radar chart data
  const radarData = stats ? [
    { subject: 'Aptitude', A: Math.min(100, (stats.aptitudeCount || 0) * 20), fullMark: 100 },
    { subject: 'Coding',   A: Math.min(100, (stats.codingCount || 0) * 20),   fullMark: 100 },
    { subject: 'HR',       A: Math.min(100, (stats.hrCount || 0) * 20),       fullMark: 100 },
    { subject: 'Avg Score',A: stats.averageScore || 0,                         fullMark: 100 },
    { subject: 'Sessions', A: Math.min(100, (stats.completedSessions || 0) * 10), fullMark: 100 },
  ] : []

  // Score trend from stats
  const trendData = stats?.scoreTrend?.map((t, i) => ({
    name: `#${i + 1}`,
    Score: t.score,
    Type: t.type,
    date: t.date,
  })) || []

  // Bar chart - sessions per type
  const typeData = stats ? [
    { name: 'Aptitude', count: stats.aptitudeCount || 0, color: '#00d4ff' },
    { name: 'Coding',   count: stats.codingCount || 0,   color: '#7c3aed' },
    { name: 'HR',       count: stats.hrCount || 0,       color: '#f97316' },
  ] : []

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="spinner" style={{ width: 48, height: 48 }} />
    </div>
  )

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--display)', fontSize: 32, fontWeight: 800, marginBottom: 6 }}>
          {greeting}, {user?.username} 👋
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: 15 }}>Track your progress and keep leveling up.</p>
      </div>

      {/* Top stats */}
      {stats && (
        <div className="grid-3" style={{ marginBottom: 28 }}>
          {[
            { icon: Trophy,    label: 'Completed',    value: stats.completedSessions, color: '#00d4ff', sub: 'sessions' },
            { icon: TrendingUp,label: 'Avg Score',    value: `${stats.averageScore}%`, color: '#7c3aed', sub: 'overall' },
            { icon: Target,    label: 'Total Attempts',value: stats.totalSessions,     color: '#f97316', sub: 'all time' },
          ].map(({ icon: Icon, label, value, color, sub }) => (
            <div key={label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={24} color={color} />
              </div>
              <div>
                <div style={{ fontSize: 28, fontFamily: 'var(--display)', fontWeight: 800 }}>{value}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>{label} · {sub}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Time stats */}
      {stats && (stats.avgAptitudeTimeSecs > 0 || stats.avgCodingTimeSecs > 0) && (
        <div className="grid-2" style={{ marginBottom: 28 }}>
          {[
            { label: 'Avg Aptitude Time', value: formatTime(stats.avgAptitudeTimeSecs), icon: Timer, color: '#00d4ff', target: '7m 30s', targetSecs: 450 },
            { label: 'Avg Coding Time',   value: formatTime(stats.avgCodingTimeSecs),   icon: Timer, color: '#7c3aed', target: '30m',   targetSecs: 1800 },
          ].map(({ label, value, icon: Icon, color, target, targetSecs }) => {
            const actual = label.includes('Aptitude') ? stats.avgAptitudeTimeSecs : stats.avgCodingTimeSecs
            const pct = Math.min(100, (actual / targetSecs) * 100)
            const isGood = actual <= targetSecs
            return (
              <div key={label} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon size={16} color={color} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>Target: {target}</span>
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--display)', color: isGood ? 'var(--green)' : 'var(--red)', marginBottom: 10 }}>{value}</div>
                <div style={{ height: 6, background: 'var(--bg2)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: isGood ? 'var(--green)' : 'var(--red)', borderRadius: 3 }} />
                </div>
                <p style={{ fontSize: 12, color: isGood ? 'var(--green)' : 'var(--red)', marginTop: 6 }}>
                  {isGood ? `✅ ${formatTime(targetSecs - actual)} faster than target` : `⚠️ ${formatTime(actual - targetSecs)} slower than target — keep practicing!`}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {/* Charts row */}
      {trendData.length > 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
          {/* Score trend */}
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={16} color="var(--accent)" /> Score Trend
            </h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="Score" stroke="#00d4ff" strokeWidth={2.5} dot={{ fill: '#00d4ff', r: 4 }} activeDot={{ r: 6 }} name="Score" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Sessions per type bar */}
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Target size={16} color="var(--accent)" /> Sessions by Type
            </h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={typeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Sessions" radius={[6,6,0,0]}
                  fill="url(#barGrad)"
                  label={{ fill: 'var(--text2)', fontSize: 11, position: 'top' }}
                />
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00d4ff" />
                    <stop offset="100%" stopColor="#7c3aed" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Radar chart + Activity heatmap */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, marginBottom: 28 }}>
        {/* Radar */}
        {radarData.length > 0 && (
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={16} color="var(--accent)" /> Performance Radar
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text3)', fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="You" dataKey="A" stroke="#00d4ff" fill="#00d4ff" fillOpacity={0.15} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Activity heatmap */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={16} color="var(--accent)" /> Practice Activity
            <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text3)' }}>— last 12 months</span>
          </h3>
          <ActivityHeatmap sessions={allSessions} />
          <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 12 }}>
            {allSessions.length} total sessions · Keep your streak going!
          </p>
        </div>
      </div>

      {/* Module cards */}
      <h2 style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Practice Modules</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16, marginBottom: 40 }}>
        {MODULES.map(({ path, icon: Icon, color, title, sub, desc, grad, border }) => (
          <Link key={path} to={path} style={{ textDecoration: 'none' }}>
            <div style={{ background: grad, border: `1px solid ${border}`, borderRadius: 16, padding: 24, cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 8px 30px ${color}20` }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div style={{ width: 50, height: 50, borderRadius: 13, background: `${color}20`, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={24} color={color} />
                </div>
                <span className="tag" style={{ background: `${color}15`, color, borderColor: `${color}30`, fontSize: 11 }}>{sub}</span>
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
            <Link to="/history" style={{ color: 'var(--accent)', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>View all →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 40 }}>
            {sessions.map(s => (
              <div key={s.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 14 }}>
                <div className={`tag tag-${s.type === 'APTITUDE' ? 'blue' : s.type === 'CODING' ? 'purple' : 'medium'}`} style={{ minWidth: 80, textAlign: 'center' }}>
                  {s.type}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {new Date((s.startedAt||'').endsWith('Z') ? s.startedAt : (s.startedAt||'')+'Z').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                  {s.timeTakenSeconds > 0 && (
                    <div style={{ fontSize: 11, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <Clock size={10} /> {formatTime(s.timeTakenSeconds)}
                    </div>
                  )}
                </div>
                {s.completed ? (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 22, fontFamily: 'var(--display)', fontWeight: 800, color: s.totalScore >= 70 ? 'var(--green)' : s.totalScore >= 40 ? 'var(--yellow)' : 'var(--red)' }}>
                      {s.totalScore}%
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text3)' }}>score</div>
                  </div>
                ) : (
                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>Incomplete</span>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Empty state */}
      {!loading && allSessions.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text3)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🚀</div>
          <h3 style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No sessions yet</h3>
          <p style={{ fontSize: 14 }}>Pick a module above and start your first practice session!</p>
        </div>
      )}
    </div>
  )
}