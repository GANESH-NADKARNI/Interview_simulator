import React from 'react'

const PACE_LABEL = (wpm) => {
  if (wpm === 0) return null
  if (wpm < 100) return { label: 'Too Slow', color: 'var(--yellow)' }
  if (wpm <= 160) return { label: 'Good Pace', color: 'var(--green)' }
  if (wpm <= 200) return { label: 'Fast', color: 'var(--yellow)' }
  return { label: 'Too Fast', color: 'var(--red)' }
}

const VOL_LABEL = (vol) => {
  if (vol === 0) return null
  if (vol < 20) return { label: 'Too Quiet', color: 'var(--red)' }
  if (vol < 45) return { label: 'Good', color: 'var(--green)' }
  return { label: 'Loud', color: 'var(--yellow)' }
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

  // Calculate WPM from actual transcript
  const words = transcript ? transcript.trim().split(/\s+/).filter(Boolean).length : 0
  const wpm = duration > 10 ? Math.round((words / duration) * 60) : 0
  const paceInfo = PACE_LABEL(wpm)
  const volInfo = VOL_LABEL(avgVolume)

  // Volume bar segments (20 bars)
  const bars = 20
  const activeBars = Math.round((volume / 100) * bars)

  if (!isRecording && !isTranscribing && duration === 0) return null

  return (
    <div style={{
      background: 'var(--bg)', borderRadius: 12, padding: '14px 16px', marginBottom: 12,
      border: isRecording ? '1px solid rgba(255,68,102,0.3)' : '1px solid var(--border2)',
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
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 32, marginBottom: 6 }}>
                {Array.from({ length: bars }).map((_, i) => {
                  const isActive = i < activeBars
                  const heightPct = 30 + ((i / bars) * 70)
                  const color = i < bars * 0.4 ? '#00d4ff' : i < bars * 0.75 ? '#00ff88' : '#ff4466'
                  return (
                    <div key={i} style={{
                      flex: 1, borderRadius: 2,
                      height: `${isActive ? heightPct : 15}%`,
                      background: isActive ? color : 'var(--border2)',
                      transition: 'height 0.08s ease, background 0.1s',
                      minHeight: 4,
                    }} />
                  )
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)' }}>
                <span>Quiet</span>
                <span style={{ color: 'var(--red)', fontWeight: 700 }}>● REC {formatTime(duration)}</span>
                <span>Loud</span>
              </div>
            </div>
          )}

          {/* Metrics row */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {/* Duration */}
            {duration > 0 && (
              <div style={{ textAlign: 'center', minWidth: 60 }}>
                <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--display)', color: 'var(--accent)' }}>
                  {formatTime(duration)}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text3)' }}>Duration</div>
              </div>
            )}

            {/* Speaking pace */}
            {wpm > 0 && paceInfo && (
              <div style={{ textAlign: 'center', minWidth: 60 }}>
                <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--display)', color: paceInfo.color }}>
                  {wpm}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text3)' }}>WPM</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: paceInfo.color }}>{paceInfo.label}</div>
              </div>
            )}

            {/* Avg volume */}
            {avgVolume > 0 && volInfo && (
              <div style={{ textAlign: 'center', minWidth: 60 }}>
                <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--display)', color: volInfo.color }}>
                  {avgVolume}%
                </div>
                <div style={{ fontSize: 10, color: 'var(--text3)' }}>Avg Volume</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: volInfo.color }}>{volInfo.label}</div>
              </div>
            )}

            {/* Pauses */}
            {duration > 5 && (
              <div style={{ textAlign: 'center', minWidth: 60 }}>
                <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--display)', color: pauseCount > 5 ? 'var(--yellow)' : 'var(--green)' }}>
                  {pauseCount}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text3)' }}>Pauses</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: pauseCount > 5 ? 'var(--yellow)' : 'var(--green)' }}>
                  {pauseCount > 5 ? 'Many' : 'Good'}
                </div>
              </div>
            )}

            {/* Words */}
            {words > 0 && (
              <div style={{ textAlign: 'center', minWidth: 60 }}>
                <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--display)', color: 'var(--text)' }}>
                  {words}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text3)' }}>Words</div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}