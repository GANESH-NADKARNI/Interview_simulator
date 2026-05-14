import React, { useState } from 'react'
import { aptitudeApi } from '../services/api'
import toast from 'react-hot-toast'
import { Brain, ChevronRight, ChevronLeft, Send, RotateCcw, CheckCircle, XCircle, TrendingUp } from 'lucide-react'

const DIFF_CLASS = { EASY: 'tag-easy', MEDIUM: 'tag-medium', HARD: 'tag-hard' }

export default function AptitudePage() {
  const [state, setState] = useState('idle') // idle | loading | quiz | evaluating | result
  const [sessionId, setSessionId] = useState(null)
  const [questions, setQuestions] = useState([])
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({}) // { questionId: 'A' }
  const [result, setResult] = useState(null)

  const start = async () => {
    setState('loading')
    try {
      const { data } = await aptitudeApi.start()
      setSessionId(data.sessionId)
      setQuestions(data.questions.questions)
      setAnswers({})
      setCurrent(0)
      setState('quiz')
    } catch (e) {
      toast.error('Failed to generate questions. Check your Groq API key.')
      setState('idle')
    }
  }

  const selectAnswer = (qId, opt) => {
    const letter = opt.charAt(0) // "A" from "A) ..."
    setAnswers(prev => ({ ...prev, [qId]: letter }))
  }

  const submit = async () => {
    const unanswered = questions.filter(q => !answers[q.id])
    if (unanswered.length > 0) {
      toast.error(`Please answer all questions (${unanswered.length} remaining)`)
      return
    }
    setState('evaluating')
    try {
      const { data } = await aptitudeApi.evaluate({
        sessionId,
        questions: questions,
        answers,
      })
      setResult(data)
      setState('result')
    } catch (e) {
      toast.error('Evaluation failed')
      setState('quiz')
    }
  }

  const reset = () => {
    setState('idle')
    setResult(null)
    setQuestions([])
    setAnswers({})
  }

  // ─── IDLE ────────────────────────────────────────────────
  if (state === 'idle') return (
    <div className="fade-in" style={{ maxWidth: 700, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{
          width: 80, height: 80, borderRadius: 20, margin: '0 auto 24px',
          background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Brain size={40} color="#00d4ff" />
        </div>
        <h1 style={{ fontFamily: 'var(--display)', fontSize: 36, fontWeight: 800, marginBottom: 12 }}>
          Aptitude Test
        </h1>
        <p style={{ color: 'var(--text2)', marginBottom: 12, fontSize: 15 }}>
          10 dynamically generated questions covering Quantitative, Logical, Verbal & Data Interpretation.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 32, flexWrap: 'wrap' }}>
          {['10 Questions', 'AI Generated', 'Detailed Feedback', 'Score & Remarks'].map(t => (
            <span key={t} className="tag tag-blue">{t}</span>
          ))}
        </div>
        <button className="btn btn-primary" onClick={start} style={{ fontSize: 16, padding: '14px 36px' }}>
          Start Test <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )

  // ─── LOADING ─────────────────────────────────────────────
  if (state === 'loading' || state === 'evaluating') return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 20 }}>
      <div className="spinner" style={{ width: 56, height: 56 }} />
      <p style={{ color: 'var(--text2)', fontSize: 15 }}>
        {state === 'loading' ? '🧠 Generating personalized questions...' : '🤖 AI is evaluating your answers...'}
      </p>
    </div>
  )

  // ─── QUIZ ────────────────────────────────────────────────
  if (state === 'quiz') {
    const q = questions[current]
    const answered = Object.keys(answers).length
    const progress = (answered / questions.length) * 100

    return (
      <div className="fade-in" style={{ maxWidth: 800, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 700 }}>Aptitude Test</h2>
            <p style={{ color: 'var(--text3)', fontSize: 13 }}>{answered}/{questions.length} answered</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span className="tag tag-blue">Q {current + 1} / {questions.length}</span>
            <span className={`tag ${DIFF_CLASS[q.difficulty] || 'tag-blue'}`}>{q.difficulty}</span>
          </div>
        </div>

        {/* Progress */}
        <div style={{ height: 4, background: 'var(--border2)', borderRadius: 4, marginBottom: 28, overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--accent2))', transition: 'width 0.3s', borderRadius: 4 }} />
        </div>

        {/* Question */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <span className="tag tag-blue" style={{ flexShrink: 0 }}>{q.type}</span>
            <span style={{ fontSize: 12, color: 'var(--text3)', paddingTop: 4 }}>{q.topic}</span>
          </div>
          <p style={{ fontSize: 16, lineHeight: 1.7, fontWeight: 500 }}>{q.question}</p>
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
          {q.options.map((opt) => {
            const letter = opt.charAt(0)
            const selected = answers[q.id] === letter
            return (
              <button key={opt} onClick={() => selectAnswer(q.id, opt)}
                style={{
                  padding: '14px 18px', borderRadius: 12, textAlign: 'left', cursor: 'pointer',
                  border: `1px solid ${selected ? 'var(--accent)' : 'var(--border2)'}`,
                  background: selected ? 'rgba(0,212,255,0.08)' : 'var(--card)',
                  color: selected ? 'var(--accent)' : 'var(--text)',
                  fontFamily: 'var(--font)', fontSize: 14, transition: 'all 0.15s',
                  fontWeight: selected ? 600 : 400,
                }}
                onMouseEnter={e => { if (!selected) e.currentTarget.style.borderColor = 'var(--border)' }}
                onMouseLeave={e => { if (!selected) e.currentTarget.style.borderColor = 'var(--border2)' }}
              >
                {opt}
              </button>
            )
          })}
        </div>

        {/* Nav */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button className="btn btn-ghost" onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}>
            <ChevronLeft size={16} /> Previous
          </button>

          <div style={{ display: 'flex', gap: 6 }}>
            {questions.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                style={{
                  width: 28, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  background: i === current ? 'var(--accent)' : answers[questions[i]?.id] ? 'rgba(0,255,136,0.2)' : 'var(--bg2)',
                  color: i === current ? '#000' : answers[questions[i]?.id] ? 'var(--green)' : 'var(--text3)',
                }}
              >{i + 1}</button>
            ))}
          </div>

          {current < questions.length - 1 ? (
            <button className="btn btn-primary" onClick={() => setCurrent(c => c + 1)}>
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button className="btn btn-primary" onClick={submit}>
              Submit <Send size={16} />
            </button>
          )}
        </div>
      </div>
    )
  }

  // ─── RESULT ──────────────────────────────────────────────
  if (state === 'result' && result) {
    const scoreColor = result.totalScore >= 70 ? 'var(--green)' : result.totalScore >= 40 ? 'var(--yellow)' : 'var(--red)'

    return (
      <div className="fade-in" style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Score card */}
        <div className="card card-glow" style={{ textAlign: 'center', marginBottom: 24, padding: 40 }}>
          <div style={{
            width: 120, height: 120, borderRadius: '50%', margin: '0 auto 20px',
            background: `conic-gradient(${scoreColor} ${result.totalScore * 3.6}deg, var(--bg2) 0deg)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 30px ${scoreColor}40`,
          }}>
            <div style={{
              width: 96, height: 96, borderRadius: '50%', background: 'var(--card)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
            }}>
              <span style={{ fontSize: 30, fontFamily: 'var(--display)', fontWeight: 800, color: scoreColor }}>{result.totalScore}</span>
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>/ 100</span>
            </div>
          </div>
          <div style={{ fontSize: 28, fontFamily: 'var(--display)', fontWeight: 800, marginBottom: 8 }}>
            Grade: {result.grade}
          </div>
          <p style={{ color: 'var(--text2)', maxWidth: 600, margin: '0 auto' }}>{result.overallRemarks}</p>
        </div>

        <div className="grid-2" style={{ marginBottom: 24 }}>
          {/* Strong areas */}
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 14, color: 'var(--green)' }}>✅ Strong Areas</h3>
            {result.strongAreas?.map(a => <div key={a} style={{ fontSize: 13, color: 'var(--text2)', padding: '4px 0', borderBottom: '1px solid var(--border2)' }}>{a}</div>)}
          </div>
          {/* Weak areas */}
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 14, color: 'var(--red)' }}>⚠️ Needs Improvement</h3>
            {result.weakAreas?.map(a => <div key={a} style={{ fontSize: 13, color: 'var(--text2)', padding: '4px 0', borderBottom: '1px solid var(--border2)' }}>{a}</div>)}
          </div>
        </div>

        {/* Topic analysis */}
        {result.topicWiseAnalysis?.length > 0 && (
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>📊 Topic-wise Analysis</h3>
            {result.topicWiseAnalysis.map(t => (
              <div key={t.topic} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                  <span style={{ fontWeight: 600 }}>{t.topic}</span>
                  <span style={{ color: 'var(--text3)' }}>{t.correct}/{t.total}</span>
                </div>
                <div style={{ height: 6, background: 'var(--bg2)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 3, transition: 'width 0.6s',
                    width: `${(t.correct / Math.max(t.total, 1)) * 100}%`,
                    background: t.correct / Math.max(t.total, 1) >= 0.7 ? 'var(--green)' : 'var(--yellow)',
                  }} />
                </div>
                <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>{t.advice}</p>
              </div>
            ))}
          </div>
        )}

        {/* Question feedback */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>📝 Question Review</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {result.questionFeedback?.map((qf, i) => {
              const q = questions.find(x => x.id === qf.questionId)
              return (
                <div key={i} style={{
                  padding: 14, borderRadius: 10, border: `1px solid ${qf.isCorrect ? 'rgba(0,255,136,0.2)' : 'rgba(255,68,102,0.2)'}`,
                  background: qf.isCorrect ? 'rgba(0,255,136,0.04)' : 'rgba(255,68,102,0.04)',
                }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    {qf.isCorrect ? <CheckCircle size={16} color="var(--green)" style={{ flexShrink: 0, marginTop: 2 }} /> : <XCircle size={16} color="var(--red)" style={{ flexShrink: 0, marginTop: 2 }} />}
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Q{i + 1}. {q?.question}</p>
                      {!qf.isCorrect && (
                        <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>
                          Your answer: <span style={{ color: 'var(--red)' }}>{qf.userAnswer}</span> · Correct: <span style={{ color: 'var(--green)' }}>{qf.correctAnswer}</span>
                        </div>
                      )}
                      <p style={{ fontSize: 12, color: 'var(--text3)' }}>{qf.explanation}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Improvements */}
        {result.improvements?.length > 0 && (
          <div className="card" style={{ marginBottom: 28 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={18} color="var(--accent)" /> Improvement Plan
            </h3>
            {result.improvements.map((imp, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border2)', fontSize: 14, color: 'var(--text2)' }}>
                <span style={{ color: 'var(--accent)', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                {imp}
              </div>
            ))}
          </div>
        )}

        <button className="btn btn-primary" onClick={reset} style={{ width: '100%', justifyContent: 'center', padding: 14 }}>
          <RotateCcw size={16} /> Take Another Test
        </button>
      </div>
    )
  }

  return null
}
