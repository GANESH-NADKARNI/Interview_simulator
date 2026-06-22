import React, { useState, useRef, useEffect } from 'react'
import { hrApi } from '../services/api'
import toast from 'react-hot-toast'
import { Mic, MicOff, Volume2, ChevronRight, RotateCcw, Send, AlertTriangle, Loader } from 'lucide-react'
import ExpressionTracker from '../components/ExpressionTracker'
import AudioMeter from '../components/AudioMeter'
import { useAudioRecorder } from '../hooks/useAudioRecorder'

const SCORE_COLOR = (s) => s >= 8 ? 'var(--green)' : s >= 5 ? 'var(--yellow)' : 'var(--red)'

const EXPRESSION_EMOJI = {
  happy: '😊', neutral: '😐', surprised: '😮',
  fearful: '😰', disgusted: '😒', angry: '😠', sad: '😔',
}

export default function HRPage() {
  const [state, setState] = useState('idle')
  const [sessionId, setSessionId] = useState(null)
  const [questions, setQuestions] = useState([])
  const [current, setCurrent] = useState(0)
  const [analyses, setAnalyses] = useState([])
  const [finalReport, setFinalReport] = useState(null)
  const [transcript, setTranscript] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [expressionSummary, setExpressionSummary] = useState(null)
  const [voiceMetrics, setVoiceMetrics] = useState([]) // per-question voice metrics

  const synthRef = useRef(window.speechSynthesis)
  const expressionRef = useRef(null)

  const {
    isRecording, isTranscribing,
    duration, volume, avgVolume, peakVolume, pauseCount,
    startRecording, stopRecording, transcribeAudio, getVoiceAnalytics,
  } = useAudioRecorder()

  useEffect(() => {
    return () => { synthRef.current?.cancel() }
  }, [])

  const start = async () => {
    setState('loading')
    try {
      const { data } = await hrApi.start()
      setSessionId(data.sessionId)
      setQuestions(data.questions.questions)
      setCurrent(0)
      setAnalyses([])
      setTranscript('')
      setExpressionSummary(null)
      setVoiceMetrics([])
      expressionRef.current?.reset()
      setState('interview')
      setTimeout(() => speakQuestion(data.questions.questions[0]?.question), 800)
    } catch {
      toast.error('Failed to generate HR questions')
      setState('idle')
    }
  }

  const speakQuestion = (text) => {
    if (!synthRef.current) return
    synthRef.current.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.rate = 0.9; utter.pitch = 1; utter.volume = 1
    const voices = synthRef.current.getVoices()
    const preferred = voices.find(v => v.name.includes('Google') || v.lang === 'en-US')
    if (preferred) utter.voice = preferred
    utter.onstart = () => setIsSpeaking(true)
    utter.onend = () => setIsSpeaking(false)
    synthRef.current.speak(utter)
  }

  const handleStartRecording = async () => {
    synthRef.current?.cancel()
    setIsSpeaking(false)
    setTranscript('')
    try {
      await startRecording()
    } catch {
      toast.error('Could not access microphone. Please allow microphone access.')
    }
  }

  const handleStopAndTranscribe = async () => {
    // Capture voice analytics before stopping
    const analytics = getVoiceAnalytics()

    const audioBlob = await stopRecording()
    if (!audioBlob) {
      toast.error('No audio recorded')
      return
    }

    try {
      const text = await transcribeAudio(audioBlob)
      if (!text) {
        toast.error('Could not transcribe audio. Please try again.')
        return
      }
      setTranscript(text)

      // Store voice metrics for this question
      const words = text.trim().split(/\s+/).filter(Boolean).length
      const wpm = analytics.durationSeconds > 5 ? Math.round((words / analytics.durationSeconds) * 60) : 0
      setVoiceMetrics(prev => [...prev, {
        questionIndex: current,
        durationSeconds: analytics.durationSeconds,
        avgVolume: analytics.avgVolume,
        peakVolume: analytics.peakVolume,
        pauseCount: analytics.pauseCount,
        wordCount: words,
        wpm,
      }])
    } catch {
      toast.error('Transcription failed. Please try again.')
    }
  }

  const submitAnswer = async () => {
    if (!transcript.trim()) return toast.error('Please record your answer first')
    setAnalyzing(true)

    const currentMetrics = voiceMetrics[voiceMetrics.length - 1]

    try {
      const { data } = await hrApi.analyze({
        question: questions[current],
        transcript: transcript.trim(),
        duration: String(currentMetrics?.durationSeconds || 0),
        voiceMetrics: currentMetrics || null,
      })

      const newAnalyses = [...analyses, {
        questionIndex: current,
        question: questions[current],
        analysis: data,
        transcript: transcript.trim(),
        voiceMetrics: currentMetrics,
      }]
      setAnalyses(newAnalyses)

      if (current < questions.length - 1) {
        const next = current + 1
        setCurrent(next)
        setTranscript('')
        setTimeout(() => speakQuestion(questions[next]?.question), 500)
      } else {
        const exprSummary = expressionRef.current?.getSummary() || null
        setExpressionSummary(exprSummary)
        setState('analyzing')
        const { data: report } = await hrApi.complete({
          sessionId,
          analyses: newAnalyses.map(a => a.analysis),
          expressionSummary: exprSummary,
          voiceMetricsSummary: voiceMetrics,
        })
        setFinalReport(report)
        setState('done')
      }
    } catch {
      toast.error('Analysis failed')
    } finally {
      setAnalyzing(false)
    }
  }

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  const reset = () => {
    synthRef.current?.cancel()
    setState('idle')
    setFinalReport(null)
    setAnalyses([])
    setTranscript('')
    setExpressionSummary(null)
    setVoiceMetrics([])
    expressionRef.current?.reset()
  }

  // ─── IDLE ────────────────────────────────────────────────
  if (state === 'idle') return (
    <div className="fade-in" style={{ maxWidth: 700, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ width: 80, height: 80, borderRadius: 20, margin: '0 auto 24px', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Mic size={40} color="#f97316" />
        </div>
        <h1 style={{ fontFamily: 'var(--display)', fontSize: 36, fontWeight: 800, marginBottom: 12 }}>HR Interview</h1>
        <p style={{ color: 'var(--text2)', marginBottom: 12, fontSize: 15 }}>
          5 HR questions with AI-powered voice transcription, real-time audio analytics, and expression analysis.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
          {['🎙️ Groq Whisper', '📊 Voice Analytics', '📷 Expression Cam', '✍️ Tone Analysis', '📝 Grammar Check'].map(t => (
            <span key={t} className="tag tag-medium">{t}</span>
          ))}
        </div>
        <div style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)', borderRadius: 12, padding: '12px 16px', marginBottom: 24, fontSize: 13, color: 'var(--text2)' }}>
          💡 Uses <strong>Groq Whisper</strong> for accurate transcription. Allow microphone access when prompted.
        </div>
        <button className="btn btn-primary" onClick={start} style={{ fontSize: 16, padding: '14px 36px' }}>
          Start Interview <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )

  if (state === 'loading' || state === 'analyzing') return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 20 }}>
      <div className="spinner" style={{ width: 56, height: 56 }} />
      <p style={{ color: 'var(--text2)' }}>
        {state === 'loading' ? '🎤 Preparing your HR interview...' : '📊 Generating final assessment report...'}
      </p>
    </div>
  )

  // ─── INTERVIEW ───────────────────────────────────────────
  if (state === 'interview' && questions.length > 0) {
    const q = questions[current]
    return (
      <>
        <ExpressionTracker ref={expressionRef} isActive={true} />
        <div className="fade-in" style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 700 }}>HR Interview</h2>
            <span className="tag tag-medium">Q {current + 1} / {questions.length}</span>
          </div>
          <div style={{ height: 4, background: 'var(--border2)', borderRadius: 4, marginBottom: 28, overflow: 'hidden' }}>
            <div style={{ width: `${(current / questions.length) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #f97316, #f59e0b)', transition: 'width 0.5s', borderRadius: 4 }} />
          </div>

          {/* Question */}
          <div className="card" style={{ marginBottom: 24, border: '1px solid rgba(249,115,22,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <span className={`tag tag-${q.type === 'BEHAVIORAL' ? 'blue' : q.type === 'SITUATIONAL' ? 'purple' : 'medium'}`} style={{ fontSize: 11 }}>{q.type}</span>
              <button onClick={() => speakQuestion(q.question)} disabled={isSpeaking}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: isSpeaking ? 'var(--accent)' : 'var(--text3)', display: 'flex', gap: 6, alignItems: 'center', fontSize: 12 }}>
                <Volume2 size={15} />{isSpeaking ? 'Speaking...' : 'Read aloud'}
              </button>
            </div>
            <p style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.6, marginBottom: 14 }}>{q.question}</p>
            {q.tips?.length > 0 && (
              <div style={{ background: 'rgba(249,115,22,0.06)', borderRadius: 8, padding: 10 }}>
                <div style={{ fontSize: 11, color: '#f97316', fontWeight: 700, marginBottom: 6 }}>💡 Tips:</div>
                {q.tips.map((t, i) => <div key={i} style={{ fontSize: 12, color: 'var(--text2)', padding: '2px 0' }}>• {t}</div>)}
              </div>
            )}
          </div>

          {/* Recording area */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Your Answer</span>
              {isRecording && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--red)', fontSize: 13, fontWeight: 600 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--red)', animation: 'pulse 1s infinite' }} />
                  {formatTime(duration)}
                </div>
              )}
            </div>

            {/* Real-time audio meter */}
            <AudioMeter
              isRecording={isRecording}
              isTranscribing={isTranscribing}
              volume={volume}
              avgVolume={avgVolume}
              peakVolume={peakVolume}
              pauseCount={pauseCount}
              duration={duration}
              transcript={transcript}
            />

            {/* Transcript */}
            <textarea
              value={transcript}
              onChange={e => setTranscript(e.target.value)}
              readOnly={isRecording || isTranscribing}
              placeholder={
                isRecording ? 'Recording... stop when done to transcribe with Groq Whisper'
                : isTranscribing ? 'Transcribing your audio...'
                : transcript ? 'Transcript ready — edit if needed, then submit'
                : 'Click "Start Recording" then speak your answer clearly...'
              }
              style={{
                width: '100%', minHeight: 130, background: 'var(--bg)', borderRadius: 10,
                padding: 16, marginBottom: 12,
                border: isRecording ? '1px solid rgba(255,68,102,0.4)' : isTranscribing ? '1px solid var(--accent)' : transcript ? '1px solid rgba(0,255,136,0.3)' : '1px solid var(--border2)',
                fontSize: 14, lineHeight: 1.8, color: 'var(--text)',
                fontFamily: 'var(--font)', resize: 'vertical', boxSizing: 'border-box',
                cursor: isRecording || isTranscribing ? 'default' : 'text',
                opacity: isTranscribing ? 0.7 : 1,
              }}
            />

            {transcript && !isRecording && !isTranscribing && (
              <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 10 }}>
                ✏️ Transcript from Groq Whisper — edit any mistakes before submitting.
              </p>
            )}

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              {!isRecording && !isTranscribing ? (
                <button onClick={handleStartRecording} className="btn btn-outline"
                  style={{ flex: 1, justifyContent: 'center' }} disabled={analyzing}>
                  <Mic size={16} /> {transcript ? 'Re-record' : 'Start Recording'}
                </button>
              ) : isRecording ? (
                <button onClick={handleStopAndTranscribe} className="btn btn-danger"
                  style={{ flex: 1, justifyContent: 'center' }}>
                  <MicOff size={16} /> Stop & Transcribe
                </button>
              ) : (
                <button className="btn btn-outline" disabled style={{ flex: 1, justifyContent: 'center' }}>
                  <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Transcribing...
                </button>
              )}

              <button className="btn btn-primary" onClick={submitAnswer}
                disabled={analyzing || !transcript.trim() || isRecording || isTranscribing}
                style={{ flex: 1, justifyContent: 'center' }}>
                {analyzing ? 'Analyzing...' : <><Send size={15} /> Submit Answer</>}
              </button>
            </div>
          </div>

          {/* Previous scores */}
          {analyses.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {analyses.map((a, i) => (
                <div key={i} style={{ padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: `${SCORE_COLOR(a.analysis.score)}18`, color: SCORE_COLOR(a.analysis.score) }}>
                  Q{i + 1}: {a.analysis.score}/10
                </div>
              ))}
            </div>
          )}
        </div>
      </>
    )
  }

  // ─── DONE ────────────────────────────────────────────────
  if (state === 'done' && finalReport) {
    const rec = finalReport.hiringRecommendation
    const recColor = rec === 'STRONG_YES' ? 'var(--green)' : rec === 'YES' ? '#90ee90' : rec === 'MAYBE' ? 'var(--yellow)' : 'var(--red)'

    // Aggregate voice metrics
    const avgWPM = voiceMetrics.length > 0 ? Math.round(voiceMetrics.reduce((a, b) => a + (b.wpm || 0), 0) / voiceMetrics.length) : 0
    const totalPauses = voiceMetrics.reduce((a, b) => a + (b.pauseCount || 0), 0)
    const overallVolume = voiceMetrics.length > 0 ? Math.round(voiceMetrics.reduce((a, b) => a + (b.avgVolume || 0), 0) / voiceMetrics.length) : 0

    return (
      <div className="fade-in" style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Score */}
        <div className="card card-glow" style={{ textAlign: 'center', marginBottom: 24, padding: 40 }}>
          <div style={{ width: 120, height: 120, borderRadius: '50%', margin: '0 auto 20px', background: `conic-gradient(${SCORE_COLOR(finalReport.overallScore / 10)} ${finalReport.overallScore * 3.6}deg, var(--bg2) 0deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 30px ${SCORE_COLOR(finalReport.overallScore / 10)}40` }}>
            <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'var(--card)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 28, fontFamily: 'var(--display)', fontWeight: 800, color: SCORE_COLOR(finalReport.overallScore / 10) }}>{finalReport.overallScore}</span>
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>/ 100</span>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 800 }}>Grade: {finalReport.grade}</span>
            <span style={{ padding: '4px 16px', borderRadius: 20, background: `${recColor}18`, color: recColor, fontWeight: 700, fontSize: 13 }}>{rec?.replace('_', ' ')}</span>
          </div>
          <p style={{ color: 'var(--text2)', maxWidth: 600, margin: '0 auto 20px' }}>{finalReport.executiveSummary}</p>
          {finalReport.averages && (
            <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
              {Object.entries(finalReport.averages).map(([key, val]) => (
                <div key={key} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: SCORE_COLOR(val) }}>{val}/10</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'capitalize' }}>{key}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Voice Analytics Summary */}
        {voiceMetrics.length > 0 && (
          <div className="card" style={{ marginBottom: 24, border: '1px solid rgba(0,212,255,0.2)' }}>
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>🎙️ Voice Analytics</h3>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 16 }}>
              {[
                { label: 'Avg Speaking Pace', value: avgWPM ? `${avgWPM} WPM` : 'N/A', note: avgWPM < 100 ? 'Too slow' : avgWPM > 160 ? 'Too fast' : 'Good pace', color: avgWPM >= 100 && avgWPM <= 160 ? 'var(--green)' : 'var(--yellow)' },
                { label: 'Total Pauses', value: totalPauses, note: totalPauses > 15 ? 'Many hesitations' : 'Acceptable', color: totalPauses > 15 ? 'var(--yellow)' : 'var(--green)' },
                { label: 'Avg Volume', value: `${overallVolume}%`, note: overallVolume < 20 ? 'Speak louder' : 'Good', color: overallVolume < 20 ? 'var(--red)' : 'var(--green)' },
              ].map(({ label, value, note, color }) => (
                <div key={label} style={{ textAlign: 'center', minWidth: 100 }}>
                  <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--display)', color }}>{value}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{label}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color }}>{note}</div>
                </div>
              ))}
            </div>

            {/* Per-question voice breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {voiceMetrics.map((m, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '8px 12px', borderRadius: 8, background: 'var(--bg)' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', minWidth: 24 }}>Q{i + 1}</span>
                  <span style={{ fontSize: 12, color: 'var(--text2)' }}>{formatTime(m.durationSeconds)}</span>
                  <span style={{ fontSize: 12, color: m.wpm >= 100 && m.wpm <= 160 ? 'var(--green)' : 'var(--yellow)' }}>{m.wpm || 0} WPM</span>
                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>{m.pauseCount || 0} pauses</span>
                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>{m.wordCount || 0} words</span>
                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>vol {m.avgVolume || 0}%</span>
                </div>
              ))}
            </div>

            {finalReport.voiceInsight && (
              <div style={{ marginTop: 14, background: 'rgba(0,212,255,0.06)', borderRadius: 8, padding: 12, fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
                💡 {finalReport.voiceInsight}
              </div>
            )}
          </div>
        )}

        {/* Expression Analysis */}
        {expressionSummary && expressionSummary.totalReadings > 0 && (
          <div className="card" style={{ marginBottom: 24, border: '1px solid rgba(249,115,22,0.2)' }}>
            <h3 style={{ fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              📷 Expression Analysis
              <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text3)' }}>({expressionSummary.totalReadings} readings)</span>
            </h3>
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center', minWidth: 80 }}>
                <div style={{ fontSize: 48 }}>{EXPRESSION_EMOJI[expressionSummary.dominant] || '😐'}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 6, fontWeight: 600 }}>
                  {expressionSummary.dominant?.charAt(0).toUpperCase() + expressionSummary.dominant?.slice(1)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>Dominant</div>
                <div style={{ marginTop: 8, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, display: 'inline-block',
                  background: expressionSummary.confidenceLevel === 'HIGH' ? 'rgba(0,255,136,0.1)' : expressionSummary.confidenceLevel === 'MEDIUM' ? 'rgba(251,191,36,0.1)' : 'rgba(255,68,102,0.1)',
                  color: expressionSummary.confidenceLevel === 'HIGH' ? 'var(--green)' : expressionSummary.confidenceLevel === 'MEDIUM' ? 'var(--yellow)' : 'var(--red)',
                }}>
                  {expressionSummary.confidenceLevel} confidence
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                {Object.entries(expressionSummary.percentages)
                  .sort((a, b) => b[1] - a[1])
                  .filter(([, pct]) => pct > 0)
                  .map(([expr, pct]) => (
                    <div key={expr} style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                        <span style={{ color: 'var(--text2)' }}>{EXPRESSION_EMOJI[expr]} {expr.charAt(0).toUpperCase() + expr.slice(1)}</span>
                        <span style={{ color: 'var(--text3)', fontWeight: 600 }}>{pct}%</span>
                      </div>
                      <div style={{ height: 5, background: 'var(--bg2)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 3, width: `${pct}%`, transition: 'width 0.6s',
                          background: ['happy', 'neutral'].includes(expr) ? 'var(--green)' : ['surprised'].includes(expr) ? 'var(--yellow)' : 'var(--red)',
                        }} />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            {finalReport.expressionInsight && (
              <div style={{ marginTop: 14, background: 'rgba(249,115,22,0.06)', borderRadius: 8, padding: 12, fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
                💡 {finalReport.expressionInsight}
              </div>
            )}
          </div>
        )}

        <div className="grid-2" style={{ marginBottom: 20 }}>
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 14, color: 'var(--green)' }}>💪 Top Strengths</h3>
            {finalReport.topStrengths?.map((s, i) => (
              <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--border2)', fontSize: 13, color: 'var(--text2)' }}>✅ {s}</div>
            ))}
          </div>
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 14, color: 'var(--red)' }}>🎯 Critical Improvements</h3>
            {finalReport.criticalImprovements?.map((s, i) => (
              <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--border2)', fontSize: 13, color: 'var(--text2)' }}>⚠️ {s}</div>
            ))}
          </div>
        </div>

        {/* Per-question */}
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>📋 Question-by-Question Breakdown</h3>
          {analyses.map((a, i) => {
            const an = a.analysis
            const vm = a.voiceMetrics
            return (
              <div key={i} style={{ marginBottom: 20, paddingBottom: 20, borderBottom: i < analyses.length - 1 ? '1px solid var(--border2)' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>Q{i + 1}. {a.question?.question?.substring(0, 80)}...</span>
                  <span style={{ fontFamily: 'var(--display)', fontWeight: 800, color: SCORE_COLOR(an.score) }}>{an.score}/10</span>
                </div>

                {/* Voice metrics for this question */}
                {vm && (
                  <div style={{ display: 'flex', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
                    {[
                      { icon: '⏱️', val: formatTime(vm.durationSeconds) },
                      { icon: '💬', val: `${vm.wordCount} words` },
                      { icon: '🏃', val: `${vm.wpm || 0} WPM`, color: vm.wpm >= 100 && vm.wpm <= 160 ? 'var(--green)' : 'var(--yellow)' },
                      { icon: '⏸️', val: `${vm.pauseCount} pauses` },
                      { icon: '🔊', val: `${vm.avgVolume}% vol` },
                    ].map(({ icon, val, color }) => (
                      <span key={val} style={{ fontSize: 11, color: color || 'var(--text3)', background: 'var(--bg)', padding: '2px 8px', borderRadius: 20 }}>
                        {icon} {val}
                      </span>
                    ))}
                  </div>
                )}

                <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '8px 12px', marginBottom: 10, fontSize: 13, color: 'var(--text2)', fontStyle: 'italic' }}>
                  "{a.transcript}"
                </div>

                {an.toneAnalysis && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                    {Object.entries(an.toneAnalysis).filter(([k]) => ['confidence', 'enthusiasm', 'professionalism'].includes(k)).map(([k, v]) => (
                      <span key={k} style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                        background: v === 'HIGH' ? 'rgba(0,255,136,0.1)' : v === 'MEDIUM' ? 'rgba(251,191,36,0.1)' : 'rgba(255,68,102,0.1)',
                        color: v === 'HIGH' ? 'var(--green)' : v === 'MEDIUM' ? 'var(--yellow)' : 'var(--red)' }}>
                        {k}: {v}
                      </span>
                    ))}
                  </div>
                )}

                {an.grammarErrors?.length > 0 && (
                  <div style={{ background: 'rgba(255,68,102,0.06)', borderRadius: 8, padding: 10, marginBottom: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--red)', marginBottom: 6 }}>Grammar Errors:</div>
                    {an.grammarErrors.map((e, j) => (
                      <div key={j} style={{ fontSize: 12, color: 'var(--text2)', padding: '3px 0' }}>
                        ❌ <span style={{ color: 'var(--red)', textDecoration: 'line-through' }}>{e.original}</span>{' → '}
                        <span style={{ color: 'var(--green)' }}>{e.corrected}</span>
                        <span style={{ color: 'var(--text3)', marginLeft: 6 }}>({e.explanation})</span>
                      </div>
                    ))}
                  </div>
                )}

                {an.wordMistakes?.length > 0 && (
                  <div style={{ background: 'rgba(251,191,36,0.06)', borderRadius: 8, padding: 10, marginBottom: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--yellow)', marginBottom: 6 }}>Word Mistakes:</div>
                    {an.wordMistakes.map((w, j) => (
                      <div key={j} style={{ fontSize: 12, color: 'var(--text2)', padding: '2px 0' }}>
                        ❌ <em style={{ color: 'var(--yellow)' }}>"{w.word}"</em> → <span style={{ color: 'var(--green)' }}>"{w.correction}"</span>
                      </div>
                    ))}
                  </div>
                )}

                {an.fillerWords?.count > 0 && (
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>
                    🗣️ Filler words: <span style={{ color: 'var(--yellow)' }}>{an.fillerWords.count}x</span> ({an.fillerWords.examples?.join(', ')}) — {an.fillerWords.advice}
                  </div>
                )}

                {an.improvements?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', marginBottom: 4 }}>Improvements:</div>
                    {an.improvements.map((imp, j) => <div key={j} style={{ fontSize: 12, color: 'var(--text2)' }}>• {imp}</div>)}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {finalReport.developmentPlan?.length > 0 && (
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 14 }}>🗺️ Development Plan</h3>
            {finalReport.developmentPlan.map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border2)' }}>
                <span className="tag tag-blue" style={{ flexShrink: 0, alignSelf: 'flex-start', fontSize: 10 }}>{p.timeline}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{p.area}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)' }}>{p.action}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <p style={{ fontSize: 14, color: 'var(--text2)', fontStyle: 'italic', lineHeight: 1.7 }}>💬 {finalReport.motivationalMessage}</p>
        </div>

        <button className="btn btn-primary" onClick={reset} style={{ width: '100%', justifyContent: 'center', padding: 14 }}>
          <RotateCcw size={16} /> Practice Again
        </button>
      </div>
    )
  }

  return null
}