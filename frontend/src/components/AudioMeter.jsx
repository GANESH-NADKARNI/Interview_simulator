import React, { useEffect, useRef, useState } from 'react'

const PAUSE_THRESHOLD = 22 // must match useAudioRecorder.js

const PACE_INFO = (wpm) => {
  if (wpm === 0) return null
  if (wpm < 80)   return { label: 'Too Slow',   color: 'var(--red)',    tip: 'Speed up a little' }
  if (wpm < 100)  return { label: 'Slow',        color: 'var(--yellow)', tip: 'Try to speak a bit faster' }
  if (wpm <= 160) return { label: 'Good Pace',   color: 'var(--green)',  tip: 'Perfect speed!' }
  if (wpm <= 200) return { label: 'Fast',        color: 'var(--yellow)', tip: 'Slow down slightly' }
  return               { label: 'Too Fast',   color: 'var(--red)',    tip: 'Slow down — clarity matters' }
}

const VOL_INFO = (vol) => {
  if (vol === 0)  return null
  if (vol < 18)   return { label: 'Too Quiet',  color: 'var(--red)',    tip: 'Speak louder' }
  if (vol < 45)   return { label: 'Good',       color: 'var(--green)',  tip: null }
  return               { label: 'Very Loud',  color: 'var(--yellow)', tip: 'Lower your voice slightly' }
}

// One live coaching tip at a time, shown as relevant events happen
function useLiveTip({ isRecording, volume, pauseCount, wpm, duration }) {
  const [tip, setTip] = useState(null)
  const lastPauseCount = useRef(0)
  const tipTimeout = useRef(null)
  const lastWpmNudge = useRef(0)

  const showTip = (msg, icon, color, ms = 2500) => {
    if (tipTimeout.current) clearTimeout(tipTimeout.current)
    setTip({ msg, icon, color })
    tipTimeout.current = setTimeout(() => setTip(null), ms)
  }

  // Pause detected — positive reinforcement
  useEffect(() => {
    if (!isRecording) return
    if (pauseCount > lastPauseCount.current) {
      lastPauseCount.current = pauseCount
      showTip('Natural pause — good!', '⏸️', 'var(--accent)', 1800)
    }
  }, [pauseCount, isRecording])

  // Too quiet nudge (after 4s)
  useEffect(() => {
    if (!isRecording || duration < 4) return
    if (volume > 0 && volume < 18) {
      showTip("Speak up — you're too quiet", '🔉', 'var(--red)', 2000)
    }
  }, [volume, isRecording, duration])

  // Pace nudge (after 12s, max once per 15s)
  useEffect(() => {
    if (!isRecording || duration < 12 || wpm === 0) return
    if (duration - lastWpmNudge.current < 15) return
    if (wpm < 90) {
      lastWpmNudge.current = duration
      showTip('Try to speak a bit faster', '🐢', 'var(--yellow)', 2500)
    } else if (wpm > 190) {
      lastWpmNudge.current = duration
      showTip('Slow down — clarity over speed', '⚡', 'var(--yellow)', 2500)
    }
  }, [wpm, isRecording, duration])

  // Reset on stop
  useEffect(() => {
    if (!isRecording) {
      setTip(null)
      lastPauseCount.current = 0
      lastWpmNudge.current = 0
    }
  }, [isRecording])

  return tip
}

function Metric({ value, label, color, badge, tip }) {
  return (
    <div style={{ textAlign: 'center', minWidth: 58 }}>
      <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--display)', color, lineHeight: 1.1 }}>
        {value}
      </div>
      <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>{label}</div>
      {badge && <div style={{ fontSize: 10, fontWeight: 700, color, marginTop: 1 }}>{badge}</div>}
      {tip   && <div style={{ fontSize: 9,  color: 'var(--text3)', marginTop: 1, maxWidth: 72 }}>{tip}</div>}
    </div>
  )
}

export default function AudioMeter({
  isRecording,
  isTranscribing,
  volume,
  avgVolume,
  peakVolume,
  pauseCount,
  duration,
  transcript,
}) {
  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  const words    = transcript ? transcript.trim().split(/\s+/).filter(Boolean).length : 0
  const wpm      = duration > 10 ? Math.round((words / duration) * 60) : 0
  const paceInfo = PACE_INFO(wpm)
  const volInfo  = VOL_INFO(avgVolume)
  const liveTip  = useLiveTip({ isRecording, volume, pauseCount, wpm, duration })

  const bars       = 24
  const activeBars = Math.round((volume / 100) * bars)
  const isSilent   = isRecording && volume < PAUSE_THRESHOLD

  if (!isRecording && !isTranscribing && duration === 0) return null

  return (
    <div style={{
      background: 'var(--bg)', borderRadius: 12, padding: '14px 16px', marginBottom: 12,
      border: isRecording
        ? `1px solid ${isSilent ? 'rgba(251,191,36,0.4)' : 'rgba(255,68,102,0.35)'}`
        : '1px solid var(--border2)',
      transition: 'border-color 0.3s',
    }}>
      {isTranscribing ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--accent)', fontSize: 13 }}>
          <div className="spinner" style={{ width: 16, height: 16 }} />
          Transcribing with Groq Whisper...
        </div>
      ) : (
        <>
          {/* Volume bars */}
          {isRecording && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 36, marginBottom: 6 }}>
                {Array.from({ length: bars }).map((_, i) => {
                  const isActive = i < activeBars
                  const heightPct = 20 + ((i / bars) * 80)
                  const color = i < bars * 0.4 ? '#00d4ff' : i < bars * 0.75 ? '#00ff88' : '#ff4466'
                  return (
                    <div key={i} style={{
                      flex: 1, borderRadius: 2,
                      height: `${isActive ? heightPct : 12}%`,
                      background: isActive ? color : 'rgba(255,255,255,0.07)',
                      transition: 'height 0.07s ease',
                      minHeight: 3,
                    }} />
                  )
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)' }}>
                <span>Quiet</span>
                <span style={{ color: isSilent ? 'var(--yellow)' : 'var(--red)', fontWeight: 700, transition: 'color 0.2s' }}>
                  {isSilent ? '○ SILENT' : '● REC'} {formatTime(duration)}
                </span>
                <span>Loud</span>
              </div>
            </div>
          )}

          {/* Live coaching tip — appears and auto-dismisses */}
          {liveTip && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(0,212,255,0.07)',
              border: '1px solid rgba(0,212,255,0.18)',
              borderRadius: 8, padding: '7px 12px', marginBottom: 10,
              fontSize: 12, color: liveTip.color, fontWeight: 600,
            }}>
              <span style={{ fontSize: 14 }}>{liveTip.icon}</span>
              {liveTip.msg}
            </div>
          )}

          {/* Metrics row */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>

            {duration > 0 && (
              <Metric value={formatTime(duration)} label="Duration" color="var(--accent)" />
            )}

            {avgVolume > 0 && volInfo && (
              <Metric
                value={`${avgVolume}%`} label="Avg Volume"
                color={volInfo.color} badge={volInfo.label} tip={volInfo.tip}
              />
            )}

            {wpm > 0 && paceInfo && (
              <Metric
                value={wpm} label="WPM"
                color={paceInfo.color} badge={paceInfo.label} tip={paceInfo.tip}
              />
            )}

            {duration > 5 && (
              <Metric
                value={pauseCount} label="Pauses"
                color={pauseCount === 0 ? 'var(--text3)' : pauseCount <= 6 ? 'var(--green)' : 'var(--yellow)'}
                badge={pauseCount === 0 ? '—' : pauseCount <= 6 ? 'Natural' : 'Many'}
              />
            )}

            {words > 0 && (
              <Metric
                value={words} label="Words"
                color={words < 30 && duration > 8 ? 'var(--yellow)' : 'var(--text)'}
                badge={words < 30 && duration > 8 ? 'Elaborate more' : null}
              />
            )}
          </div>

          {/* Avg volume progress bar */}
          {isRecording && avgVolume > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ height: 4, background: 'var(--border2)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 2,
                  width: `${Math.min(100, avgVolume * 2)}%`,
                  background: volInfo?.color || 'var(--accent)',
                  transition: 'width 0.3s ease',
                }} />
              </div>
              <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 3 }}>
                Avg volume — ideal range: 20–45%
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}