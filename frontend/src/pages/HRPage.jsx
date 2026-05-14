import React, { useState, useRef, useEffect } from 'react'
import { hrApi } from '../services/api'
import toast from 'react-hot-toast'
import { Mic, MicOff, Volume2, ChevronRight, RotateCcw, Send, AlertTriangle } from 'lucide-react'

const SCORE_COLOR = (s) => s >= 8 ? 'var(--green)' : s >= 5 ? 'var(--yellow)' : 'var(--red)'

export default function HRPage() {
  const [state, setState] = useState('idle') // idle|loading|interview|analyzing|done
  const [sessionId, setSessionId] = useState(null)
  const [questions, setQuestions] = useState([])
  const [current, setCurrent] = useState(0)
  const [analyses, setAnalyses] = useState([]) // per-question analysis
  const [finalReport, setFinalReport] = useState(null)
  const [transcript, setTranscript] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [recordSeconds, setRecordSeconds] = useState(0)
  const [analyzing, setAnalyzing] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(true)

  const recognitionRef = useRef(null)
  const synthRef = useRef(window.speechSynthesis)
  const timerRef = useRef(null)
  const startTimeRef = useRef(null)

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) setSpeechSupported(false)
    return () => {
      stopRecording()
      synthRef.current?.cancel()
    }
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
      setState('interview')
      // Auto-read first question after short delay
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
    utter.rate = 0.9
    utter.pitch = 1
    utter.volume = 1
    // Try to use a natural voice
    const voices = synthRef.current.getVoices()
    const preferred = voices.find(v => v.name.includes('Google') || v.name.includes('Natural') || v.lang === 'en-US')
    if (preferred) utter.voice = preferred
    utter.onstart = () => setIsSpeaking(true)
    utter.onend = () => setIsSpeaking(false)
    synthRef.current.speak(utter)
  }

  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return

    synthRef.current?.cancel()
    setIsSpeaking(false)

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    let finalText = ''

    recognition.onresult = (e) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) finalText += t + ' '
        else interim = t
      }
      setTranscript(finalText + interim)
    }

    recognition.onerror = (e) => {
      if (e.error !== 'no-speech') toast.error('Microphone error: ' + e.error)
      stopRecording()
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsRecording(true)
    startTimeRef.current = Date.now()
    timerRef.current = setInterval(() => {
      setRecordSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000))
    }, 1000)
  }

  const stopRecording = () => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setIsRecording(false)
    clearInterval(timerRef.current)
  }

  const submitAnswer = async () => {
    if (!transcript.trim()) return toast.error('Please record your answer first')
    stopRecording()
    setAnalyzing(true)

    const duration = Math.floor((Date.now() - (startTimeRef.current || Date.now())) / 1000).toString()

    try {
      const { data } = await hrApi.analyze({
        question: questions[current],
        transcript: transcript.trim(),
        duration,
      })
      const newAnalyses = [...analyses, { questionIndex: current, question: questions[current], analysis: data, transcript: transcript.trim() }]
      setAnalyses(newAnalyses)

      if (current < questions.length - 1) {
        // Move to next question
        const next = current + 1
        setCurrent(next)
        setTranscript('')
        setRecordSeconds(0)
        setTimeout(() => speakQuestion(questions[next]?.question), 500)
      } else {
        // All done - generate final report
        setState('analyzing')
        const { data: report } = await hrApi.complete({
          sessionId,
          analyses: newAnalyses.map(a => a.analysis),
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
    stopRecording()
    synthRef.current?.cancel()
    setState('idle')
    setFinalReport(null)
    setAnalyses([])
    setTranscript('')
    setRecordSeconds(0)
  }

  // ─── IDLE ────────────────────────────────────────────────
  if (state === 'idle') return (
    <div className="fade-in" style={{ maxWidth: 700, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{
          width: 80, height: 80, borderRadius: 20, margin: '0 auto 24px',
          background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Mic size={40} color="#f97316" />
        </div>
        <h1 style={{ fontFamily: 'var(--display)', fontSize: 36, fontWeight: 800, marginBottom: 12 }}>
          HR Interview
        </h1>
        <p style={{ color: 'var(--text2)', marginBottom: 12, fontSize: 15 }}>
          5 HR questions with Text-to-Speech. Answer via voice. AI analyzes tone, grammar, STAR structure & word mistakes.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
          {['Voice Recording', 'TTS Questions', 'Tone Analysis', 'Grammar Check', 'STAR Analysis'].map(t => (
            <span key={t} className="tag tag-medium">{t}</span>
          ))}
        </div>

        {!speechSupported && (
          <div style={{
            display: 'flex', gap: 10, alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 20,
            background: 'rgba(255,68,102,0.1)', border: '1px solid rgba(255,68,102,0.2)',
            color: 'var(--red)', fontSize: 13,
          }}>
            <AlertTriangle size={16} />
            Speech recognition not supported in this browser. Use Chrome for the full experience. You can still type your answers.
          </div>
        )}

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
    const prevAnalysis = analyses[current]

    return (
      <div className="fade-in" style={{ maxWidth: 800, margin: '0 auto' }}>
        {/* Progress */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 700 }}>HR Interview</h2>
          <span className="tag tag-medium">Q {current + 1} / {questions.length}</span>
        </div>
        <div style={{ height: 4, background: 'var(--border2)', borderRadius: 4, marginBottom: 28, overflow: 'hidden' }}>
          <div style={{ width: `${((current) / questions.length) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #f97316, #f59e0b)', transition: 'width 0.5s', borderRadius: 4 }} />
        </div>

        {/* Question */}
        <div className="card" style={{ marginBottom: 24, border: '1px solid rgba(249,115,22,0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <span className={`tag tag-${q.type === 'BEHAVIORAL' ? 'blue' : q.type === 'SITUATIONAL' ? 'purple' : 'medium'}`} style={{ fontSize: 11 }}>
              {q.type}
            </span>
            <button onClick={() => speakQuestion(q.question)} disabled={isSpeaking}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: isSpeaking ? 'var(--accent)' : 'var(--text3)', display: 'flex', gap: 6, alignItems: 'center', fontSize: 12 }}>
              <Volume2 size={15} className={isSpeaking ? 'pulse' : ''} />
              {isSpeaking ? 'Speaking...' : 'Read aloud'}
            </button>
          </div>
          <p style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.6, marginBottom: 14 }}>{q.question}</p>
          {q.tips?.length > 0 && (
            <div style={{ background: 'rgba(249,115,22,0.06)', borderRadius: 8, padding: 10 }}>
              <div style={{ fontSize: 11, color: 'var(--orange)', fontWeight: 700, marginBottom: 6 }}>💡 Tips:</div>
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
                {formatTime(recordSeconds)}
              </div>
            )}
          </div>

          {/* Transcript display */}
          <div style={{
            minHeight: 120, background: 'var(--bg)', borderRadius: 10, padding: 16, marginBottom: 16,
            border: isRecording ? '1px solid rgba(255,68,102,0.3)' : '1px solid var(--border2)',
            fontSize: 14, lineHeight: 1.8, color: transcript ? 'var(--text)' : 'var(--text3)',
            position: 'relative', transition: 'border-color 0.2s',
          }}>
            {transcript || 'Your spoken answer will appear here...'}
            {isRecording && !transcript && (
              <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{
                    width: 6, height: 6, borderRadius: '50%', background: 'var(--red)',
                    animation: `pulse ${0.5 + i * 0.2}s ease-in-out infinite`,
                  }} />
                ))}
              </div>
            )}
          </div>

          {/* If no speech support, allow typing */}
          {!speechSupported && (
            <textarea
              value={transcript}
              onChange={e => setTranscript(e.target.value)}
              placeholder="Type your answer here..."
              style={{ height: 120, resize: 'vertical', marginBottom: 12 }}
            />
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            {speechSupported && (
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={isRecording ? 'btn btn-danger' : 'btn btn-outline'}
                style={{ flex: 1, justifyContent: 'center', ...(isRecording ? { animation: 'none' } : {}) }}
              >
                {isRecording ? <><MicOff size={16} /> Stop Recording</> : <><Mic size={16} /> Start Recording</>}
              </button>
            )}
            <button className="btn btn-primary" onClick={submitAnswer} disabled={analyzing || !transcript.trim()}
              style={{ flex: 1, justifyContent: 'center' }}>
              {analyzing ? 'Analyzing...' : <><Send size={15} /> Submit Answer</>}
            </button>
          </div>
        </div>

        {/* Previous answer scores */}
        {analyses.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {analyses.map((a, i) => (
              <div key={i} style={{ padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                background: `${SCORE_COLOR(a.analysis.score)}18`, color: SCORE_COLOR(a.analysis.score) }}>
                Q{i + 1}: {a.analysis.score}/10
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ─── DONE ────────────────────────────────────────────────
  if (state === 'done' && finalReport) {
    const rec = finalReport.hiringRecommendation
    const recColor = rec === 'STRONG_YES' ? 'var(--green)' : rec === 'YES' ? '#90ee90' : rec === 'MAYBE' ? 'var(--yellow)' : 'var(--red)'

    return (
      <div className="fade-in" style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Final score */}
        <div className="card card-glow" style={{ textAlign: 'center', marginBottom: 24, padding: 40 }}>
          <div style={{
            width: 120, height: 120, borderRadius: '50%', margin: '0 auto 20px',
            background: `conic-gradient(${SCORE_COLOR(finalReport.overallScore / 10)} ${finalReport.overallScore * 3.6}deg, var(--bg2) 0deg)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 30px ${SCORE_COLOR(finalReport.overallScore / 10)}40`,
          }}>
            <div style={{
              width: 96, height: 96, borderRadius: '50%', background: 'var(--card)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
            }}>
              <span style={{ fontSize: 28, fontFamily: 'var(--display)', fontWeight: 800, color: SCORE_COLOR(finalReport.overallScore / 10) }}>{finalReport.overallScore}</span>
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>/ 100</span>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 800 }}>Grade: {finalReport.grade}</span>
            <span style={{ padding: '4px 16px', borderRadius: 20, background: `${recColor}18`, color: recColor, fontWeight: 700, fontSize: 13 }}>
              {rec?.replace('_', ' ')}
            </span>
          </div>
          <p style={{ color: 'var(--text2)', maxWidth: 600, margin: '0 auto 20px' }}>{finalReport.executiveSummary}</p>

          {/* Averages */}
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

        <div className="grid-2" style={{ marginBottom: 20 }}>
          {/* Strengths */}
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 14, color: 'var(--green)' }}>💪 Top Strengths</h3>
            {finalReport.topStrengths?.map((s, i) => (
              <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--border2)', fontSize: 13, color: 'var(--text2)' }}>
                ✅ {s}
              </div>
            ))}
          </div>
          {/* Improvements */}
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 14, color: 'var(--red)' }}>🎯 Critical Improvements</h3>
            {finalReport.criticalImprovements?.map((s, i) => (
              <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--border2)', fontSize: 13, color: 'var(--text2)' }}>
                ⚠️ {s}
              </div>
            ))}
          </div>
        </div>

        {/* Per-question breakdown */}
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>📋 Question-by-Question Breakdown</h3>
          {analyses.map((a, i) => {
            const an = a.analysis
            return (
              <div key={i} style={{ marginBottom: 20, paddingBottom: 20, borderBottom: i < analyses.length - 1 ? '1px solid var(--border2)' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>Q{i + 1}. {a.question?.question?.substring(0, 80)}...</span>
                  <span style={{ fontFamily: 'var(--display)', fontWeight: 800, color: SCORE_COLOR(an.score) }}>{an.score}/10</span>
                </div>

                {/* Tone */}
                {an.toneAnalysis && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                    {Object.entries(an.toneAnalysis).filter(([k]) => ['confidence', 'enthusiasm', 'professionalism'].includes(k)).map(([k, v]) => (
                      <span key={k} style={{
                        padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                        background: v === 'HIGH' ? 'rgba(0,255,136,0.1)' : v === 'MEDIUM' ? 'rgba(251,191,36,0.1)' : 'rgba(255,68,102,0.1)',
                        color: v === 'HIGH' ? 'var(--green)' : v === 'MEDIUM' ? 'var(--yellow)' : 'var(--red)',
                      }}>
                        {k}: {v}
                      </span>
                    ))}
                  </div>
                )}

                {/* Grammar errors */}
                {an.grammarErrors?.length > 0 && (
                  <div style={{ background: 'rgba(255,68,102,0.06)', borderRadius: 8, padding: 10, marginBottom: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--red)', marginBottom: 6 }}>Grammar Errors:</div>
                    {an.grammarErrors.map((e, j) => (
                      <div key={j} style={{ fontSize: 12, color: 'var(--text2)', padding: '3px 0' }}>
                        ❌ <span style={{ color: 'var(--red)', textDecoration: 'line-through' }}>{e.original}</span>
                        {' → '}
                        <span style={{ color: 'var(--green)' }}>{e.corrected}</span>
                        <span style={{ color: 'var(--text3)', marginLeft: 6 }}>({e.explanation})</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Word mistakes */}
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

                {/* Filler words */}
                {an.fillerWords?.count > 0 && (
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>
                    🗣️ Filler words: <span style={{ color: 'var(--yellow)' }}>{an.fillerWords.count}x</span> ({an.fillerWords.examples?.join(', ')}) — {an.fillerWords.advice}
                  </div>
                )}

                {/* Improvements */}
                {an.improvements?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', marginBottom: 4 }}>Improvements:</div>
                    {an.improvements.map((imp, j) => (
                      <div key={j} style={{ fontSize: 12, color: 'var(--text2)' }}>• {imp}</div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Dev plan */}
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
          <p style={{ fontSize: 14, color: 'var(--text2)', fontStyle: 'italic', lineHeight: 1.7 }}>
            💬 {finalReport.motivationalMessage}
          </p>
        </div>

        <button className="btn btn-primary" onClick={reset} style={{ width: '100%', justifyContent: 'center', padding: 14 }}>
          <RotateCcw size={16} /> Practice Again
        </button>
      </div>
    )
  }

  return null
}
