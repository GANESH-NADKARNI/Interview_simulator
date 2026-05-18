import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || '/api'

// Poll config: 30 attempts × 10s = 5 minutes
const MAX_ATTEMPTS = 30
const POLL_INTERVAL = 10000

// Particles floating in background
function Particles() {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 8 + 6,
    delay: Math.random() * 5,
    opacity: Math.random() * 0.4 + 0.1,
  }))

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position: 'absolute',
          left: `${p.x}%`,
          top: `${p.y}%`,
          width: p.size,
          height: p.size,
          borderRadius: '50%',
          background: `rgba(0, 212, 255, ${p.opacity})`,
          animation: `float ${p.duration}s ${p.delay}s ease-in-out infinite alternate`,
          boxShadow: `0 0 ${p.size * 3}px rgba(0,212,255,0.5)`,
        }} />
      ))}
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px) translateX(0px); opacity: 0.1; }
          100% { transform: translateY(-30px) translateX(15px); opacity: 0.6; }
        }
      `}</style>
    </div>
  )
}

// Animated ring loader
function RingLoader({ progress }) {
  const size = 120
  const stroke = 4
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dash = (progress / 100) * circ

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r}
        fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r}
        fill="none" stroke="url(#ringGrad)" strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.4s ease' }}
      />
      <defs>
        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00d4ff" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
    </svg>
  )
}

const STAGES = [
  { label: 'Waking up server...', pct: 10 },
  { label: 'Connecting to database...', pct: 30 },
  { label: 'Loading AI models...', pct: 55 },
  { label: 'Almost ready...', pct: 80 },
  { label: 'All systems go!', pct: 100 },
]

export default function WakeUp() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState('idle') // idle | waking | ready | error
  const [stageIdx, setStageIdx] = useState(0)
  const [progress, setProgress] = useState(0)
  const [dots, setDots] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef(null)
  const startTimeRef = useRef(null)
  const elapsedRef = useRef(null)

  // Skip wake-up if already done this session
  useEffect(() => {
    if (sessionStorage.getItem('backend_ready')) {
      const token = localStorage.getItem('token')
      navigate(token ? '/dashboard' : '/home', { replace: true })
    }
  }, [])

  // Animate dots
  useEffect(() => {
    if (phase !== 'waking') return
    const t = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500)
    return () => clearInterval(t)
  }, [phase])

  // Elapsed timer
  useEffect(() => {
    if (phase !== 'waking') {
      clearInterval(elapsedRef.current)
      return
    }
    elapsedRef.current = setInterval(() => {
      setElapsed(Math.round((Date.now() - startTimeRef.current) / 1000))
    }, 1000)
    return () => clearInterval(elapsedRef.current)
  }, [phase])

  // Advance stages spread across 5 minutes
  useEffect(() => {
    if (phase !== 'waking') return
    let i = 0
    const stageInterval = (MAX_ATTEMPTS * POLL_INTERVAL) / STAGES.length
    const advance = () => {
      if (i < STAGES.length - 1) {
        i++
        setStageIdx(i)
        setProgress(STAGES[i].pct)
        timerRef.current = setTimeout(advance, stageInterval)
      }
    }
    setProgress(STAGES[0].pct)
    timerRef.current = setTimeout(advance, stageInterval)
    return () => clearTimeout(timerRef.current)
  }, [phase])

  const handleStart = async () => {
    setPhase('waking')
    setStageIdx(0)
    setProgress(STAGES[0].pct)
    setElapsed(0)
    startTimeRef.current = Date.now()

    const poll = async (attempts = 0) => {
      try {
        const res = await fetch(`${BACKEND_URL}/actuator/health`, {
          signal: AbortSignal.timeout(8000)
        })
        // ✅ 200 OK = server up and healthy
        // ✅ 403 Forbidden = Spring Security running = server fully started
        if (res.ok || res.status === 403) {
          clearTimeout(timerRef.current)
          setStageIdx(STAGES.length - 1)
          setProgress(100)
          setTimeout(() => setPhase('ready'), 800)
          return
        }
      } catch {
        // Network error / timeout = server still sleeping, keep polling
      }

      if (attempts < MAX_ATTEMPTS - 1) {
        setTimeout(() => poll(attempts + 1), POLL_INTERVAL)
      } else {
        setPhase('error')
      }
    }
    poll()
  }

  const handleContinue = () => {
    sessionStorage.setItem('backend_ready', '1')
    const token = localStorage.getItem('token')
    navigate(token ? '/dashboard' : '/home')
  }

  const formatTime = (s) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'var(--font, system-ui)',
    }}>
      <Particles />

      {/* Grid background */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
        pointerEvents: 'none',
      }} />

      {/* Glow blobs */}
      <div style={{ position: 'absolute', top: '20%', left: '15%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '20%', right: '15%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Card */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: 420,
        padding: 40,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 24,
        backdropFilter: 'blur(20px)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
        textAlign: 'center',
        animation: 'fadeUp 0.6s ease both',
      }}>

        {/* Logo */}
        <div style={{
          width: 64, height: 64, borderRadius: 18, margin: '0 auto 20px',
          background: 'linear-gradient(135deg, #00d4ff, #7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 30px rgba(0,212,255,0.3)',
          animation: phase === 'waking' ? 'pulse 2s ease infinite' : 'none',
          fontSize: 28,
        }}>
          ⚡
        </div>

        <h1 style={{
          fontSize: 26, fontWeight: 800, marginBottom: 8,
          fontFamily: 'var(--display, system-ui)',
          background: 'linear-gradient(135deg, #fff 40%, rgba(255,255,255,0.5))',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          InterviewAI
        </h1>

        {/* IDLE state */}
        {phase === 'idle' && (
          <>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 32, lineHeight: 1.6 }}>
              Running on free hosting — the server needs a moment to wake up.
              Click below to start it before loading the app.
            </p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 10, padding: '10px 16px', marginBottom: 28, fontSize: 12, color: '#fbbf24' }}>
              <span>⏱</span>
              <span>First load may take up to <strong>5 minutes</strong></span>
            </div>
            <button
              onClick={handleStart}
              style={{
                width: '100%', padding: '14px 24px',
                background: 'linear-gradient(135deg, #00d4ff, #7c3aed)',
                border: 'none', borderRadius: 14,
                color: '#fff', fontSize: 15, fontWeight: 700,
                cursor: 'pointer', letterSpacing: 0.5,
                boxShadow: '0 8px 24px rgba(0,212,255,0.25)',
                transition: 'transform 0.15s, box-shadow 0.15s',
                animation: 'glow 3s ease infinite',
              }}
              onMouseEnter={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 12px 32px rgba(0,212,255,0.4)' }}
              onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 8px 24px rgba(0,212,255,0.25)' }}
            >
              🚀 Wake Up Server
            </button>
          </>
        )}

        {/* WAKING state */}
        {phase === 'waking' && (
          <>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginBottom: 28 }}>
              Hang tight — this can take up to 2 minutes on free tier
            </p>
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
              <RingLoader progress={progress} />
              <div style={{ position: 'absolute', textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#00d4ff' }}>{progress}%</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{formatTime(elapsed)}</div>
              </div>
            </div>
            <div style={{
              fontSize: 13, color: 'rgba(255,255,255,0.6)',
              minHeight: 20, marginBottom: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00d4ff', animation: 'blink 1s ease infinite' }} />
              {STAGES[stageIdx]?.label}{dots}
            </div>

            {/* Stage indicators */}
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 20 }}>
              {STAGES.map((s, i) => (
                <div key={i} style={{
                  width: i <= stageIdx ? 20 : 6,
                  height: 6, borderRadius: 3,
                  background: i <= stageIdx
                    ? 'linear-gradient(90deg, #00d4ff, #7c3aed)'
                    : 'rgba(255,255,255,0.1)',
                  transition: 'all 0.4s ease',
                }} />
              ))}
            </div>

            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
              Please don't close this tab
            </p>
          </>
        )}

        {/* READY state */}
        {phase === 'ready' && (
          <>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', margin: '0 auto 20px',
              background: 'rgba(0,255,136,0.1)', border: '2px solid rgba(0,255,136,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, animation: 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
            }}>
              ✅
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#00ff88', marginBottom: 8 }}>Server is ready!</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 6 }}>
              Everything is up and running. Let's go!
            </p>
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, marginBottom: 28 }}>
              Started in {formatTime(elapsed)}
            </p>
            <button
              onClick={handleContinue}
              style={{
                width: '100%', padding: '14px 24px',
                background: 'linear-gradient(135deg, #00ff88, #00d4ff)',
                border: 'none', borderRadius: 14,
                color: '#000', fontSize: 15, fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(0,255,136,0.3)',
                animation: 'fadeUp 0.4s ease both',
              }}
            >
              Enter InterviewAI →
            </button>
          </>
        )}

        {/* ERROR state */}
        {phase === 'error' && (
          <>
            <div style={{ fontSize: 40, marginBottom: 12 }}>😕</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f87171', marginBottom: 8 }}>Server didn't respond in 5 minutes</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 24 }}>
              The server may still be starting. You can try again or proceed anyway.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setPhase('idle'); setProgress(0); setStageIdx(0); setElapsed(0) }}
                style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                Try Again
              </button>
              <button onClick={handleContinue}
                style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: 'rgba(248,113,113,0.15)', color: '#f87171', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                Proceed Anyway
              </button>
            </div>
          </>
        )}
      </div>

      {/* Powered by */}
      <p style={{ position: 'relative', zIndex: 1, marginTop: 24, fontSize: 11, color: 'rgba(255,255,255,0.15)' }}>
        Powered by Groq · Spring Boot · MongoDB
      </p>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(0,212,255,0.3); }
          50%       { box-shadow: 0 0 40px rgba(0,212,255,0.6), 0 0 60px rgba(124,58,237,0.3); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.2; }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 8px 24px rgba(0,212,255,0.25); }
          50%       { box-shadow: 0 8px 32px rgba(0,212,255,0.5), 0 0 60px rgba(124,58,237,0.2); }
        }
        @keyframes popIn {
          from { transform: scale(0.5); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}