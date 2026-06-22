import React, { useState, useEffect, useRef } from 'react'
import { aptitudeApi } from '../services/api'
import toast from 'react-hot-toast'
import { Brain, ChevronRight, ChevronLeft, Send, RotateCcw, CheckCircle, XCircle, TrendingUp, Clock, Timer } from 'lucide-react'

const DIFF_CLASS = { EASY: 'tag-easy', MEDIUM: 'tag-medium', HARD: 'tag-hard' }

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

export default function AptitudePage() {
  const [state, setState] = useState('idle')
  const [sessionId, setSessionId] = useState(null)
  const [questions, setQuestions] = useState([])
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)

  // Time tracking
  const [totalSeconds, setTotalSeconds] = useState(0)
  const [questionTimes, setQuestionTimes] = useState({}) // qId -> seconds
  const [questionStart, setQuestionStart] = useState(null)
  const totalTimerRef = useRef(null)

  useEffect(() => {
    if (state === 'quiz') {
      totalTimerRef.current = setInterval(() => setTotalSeconds(s => s + 1), 1000)
      setQuestionStart(Date.now())
    } else {
      clearInterval(totalTimerRef.current)
    }
    return () => clearInterval(totalTimerRef.current)
  }, [state])

  // Track time per question when navigating
  const recordQuestionTime = (fromIndex) => {
    if (questionStart && questions[fromIndex]) {
      const elapsed = Math.round((Date.now() - questionStart) / 1000)
      const qId = questions[fromIndex].id
      setQuestionTimes(prev => ({ ...prev, [qId]: (prev[qId] || 0) + elapsed }))
      setQuestionStart(Date.now())
    }
  }

  const navigateTo = (newIndex) => {
    recordQuestionTime(current)
    setCurrent(newIndex)
  }

  const start = async () => {
    setState('loading')
    setTotalSeconds(0)
    setQuestionTimes({})
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
    const letter = opt.charAt(0)
    setAnswers(prev => ({ ...prev, [qId]: letter }))
  }

  const submit = async () => {
    const unanswered = questions.filter(q => !answers[q.id])
    if (unanswered.length > 0) {
      toast.error(`Please answer all questions (${unanswered.length} remaining)`)
      return
    }
    recordQuestionTime(current)
    clearInterval(totalTimerRef.current)
    setState('evaluating')

    try {
      const simplifiedQuestions = questions.map(q => ({
        id: q.id, question: q.question, options: q.options,
        correctAnswer: q.correctAnswer, explanation: q.explanation,
        topic: q.topic, type: q.type, difficulty: q.difficulty,
      }))

      const { data } = await aptitudeApi.evaluate({
        sessionId,
        questions: simplifiedQuestions,
        answers,
        timeTakenSeconds: totalSeconds,
        questionTimes,
      })

      // Recalculate score and isCorrect on frontend
      if (data.questionFeedback?.length > 0) {
        let correctCount = 0
        data.questionFeedback.forEach(qf => {
          const q = simplifiedQuestions.find(x => String(x.id) === String(qf.questionId))
          const userAns = (answers[qf.questionId] || qf.userAnswer || '').trim().toUpperCase().charAt(0)
          const correctAns = (q?.correctAnswer || qf.correctAnswer || '').trim().toUpperCase().charAt(0)
          qf.isCorrect = userAns === correctAns
          qf.userAnswer = userAns
          qf.correctAnswer = correctAns
          qf.timeSpent = questionTimes[qf.questionId] || 0
          if (qf.isCorrect) correctCount++
        })
        const score = Math.round((correctCount / data.questionFeedback.length) * 100)
        data.totalScore = score
        data.grade = score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B+' : score >= 60 ? 'B' : score >= 50 ? 'C' : score >= 40 ? 'D' : 'F'
        // Recalculate topicWiseAnalysis based on corrected isCorrect values
const topicMap = {}
data.questionFeedback.forEach(qf => {
  const q = simplifiedQuestions.find(x => String(x.id) === String(qf.questionId))
  const topic = q?.topic || 'General'
  if (!topicMap[topic]) topicMap[topic] = { topic, correct: 0, total: 0, advice: '' }
  topicMap[topic].total++
  if (qf.isCorrect) topicMap[topic].correct++
})

// Merge advice from AI's topicWiseAnalysis
data.topicWiseAnalysis?.forEach(t => {
  if (topicMap[t.topic]) topicMap[t.topic].advice = t.advice
})

data.topicWiseAnalysis = Object.values(topicMap)
      }

      data.timeTakenSeconds = totalSeconds
      data.timeTakenFormatted = formatTime(totalSeconds)
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
    setTotalSeconds(0)
    setQuestionTimes({})
  }

  // ── IDLE ──────────────────────────────────────────────────────────────────
  if (state === 'idle') return (
    <div className="fade-in" style={{ maxWidth: 700, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ width: 80, height: 80, borderRadius: 20, margin: '0 auto 24px', background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Brain size={40} color="#00d4ff" />
        </div>
        <h1 style={{ fontFamily: 'var(--display)', fontSize: 36, fontWeight: 800, marginBottom: 12 }}>Aptitude Test</h1>
        <p style={{ color: 'var(--text2)', marginBottom: 12, fontSize: 15 }}>
          10 dynamically generated questions. Timer starts when you begin — track your speed!
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 32, flexWrap: 'wrap' }}>
          {['10 Questions', 'AI Generated', 'Time Tracked', 'Detailed Feedback'].map(t => (
            <span key={t} className="tag tag-blue">{t}</span>
          ))}
        </div>
        <button className="btn btn-primary" onClick={start} style={{ fontSize: 16, padding: '14px 36px' }}>
          Start Test <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )

  if (state === 'loading' || state === 'evaluating') return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 20 }}>
      <div className="spinner" style={{ width: 56, height: 56 }} />
      <p style={{ color: 'var(--text2)', fontSize: 15 }}>
        {state === 'loading' ? '🧠 Generating personalized questions...' : '🤖 AI is evaluating your answers...'}
      </p>
    </div>
  )

  // ── QUIZ ──────────────────────────────────────────────────────────────────
  if (state === 'quiz') {
    const q = questions[current]
    const answered = Object.keys(answers).length
    const progress = (answered / questions.length) * 100
    const hasVisual = /graph|chart|figure|table below|diagram|image|refer to|following (graph|chart|table|figure)/i.test(q.question)
    const timeColor = totalSeconds > 600 ? 'var(--red)' : totalSeconds > 360 ? 'var(--yellow)' : 'var(--green)'

    return (
      <div className="fade-in" style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 700 }}>Aptitude Test</h2>
            <p style={{ color: 'var(--text3)', fontSize: 13 }}>{answered}/{questions.length} answered</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Live Timer */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, background: `${timeColor}18`, border: `1px solid ${timeColor}30` }}>
              <Timer size={14} color={timeColor} />
              <span style={{ fontSize: 14, fontWeight: 700, color: timeColor, fontFamily: 'var(--display)' }}>{formatTime(totalSeconds)}</span>
            </div>
            <span className="tag tag-blue">Q {current + 1} / {questions.length}</span>
            <span className={`tag ${DIFF_CLASS[q.difficulty] || 'tag-blue'}`}>{q.difficulty}</span>
          </div>
        </div>

        <div style={{ height: 4, background: 'var(--border2)', borderRadius: 4, marginBottom: 28, overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--accent2))', transition: 'width 0.3s', borderRadius: 4 }} />
        </div>

        {hasVisual && (
          <div style={{ padding: '10px 14px', borderRadius: 10, marginBottom: 16, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', fontSize: 13, color: 'var(--yellow)', display: 'flex', gap: 8, alignItems: 'center' }}>
            ⚠️ This question references a visual that cannot be displayed. The data is embedded in the question text.
          </div>
        )}

        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <span className="tag tag-blue" style={{ flexShrink: 0 }}>{q.type}</span>
            <span style={{ fontSize: 12, color: 'var(--text3)', paddingTop: 4 }}>{q.topic}</span>
          </div>
          <p style={{ fontSize: 16, lineHeight: 1.7, fontWeight: 500, whiteSpace: 'pre-wrap' }}>{q.question}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
          {q.options.map((opt) => {
            const letter = opt.charAt(0)
            const selected = answers[q.id] === letter
            return (
              <button key={opt} onClick={() => selectAnswer(q.id, opt)}
                style={{ padding: '14px 18px', borderRadius: 12, textAlign: 'left', cursor: 'pointer', border: `1px solid ${selected ? 'var(--accent)' : 'var(--border2)'}`, background: selected ? 'rgba(0,212,255,0.08)' : 'var(--card)', color: selected ? 'var(--accent)' : 'var(--text)', fontFamily: 'var(--font)', fontSize: 14, transition: 'all 0.15s', fontWeight: selected ? 600 : 400 }}>
                {opt}
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button className="btn btn-ghost" onClick={() => navigateTo(Math.max(0, current - 1))} disabled={current === 0}>
            <ChevronLeft size={16} /> Previous
          </button>
          <div style={{ display: 'flex', gap: 6 }}>
            {questions.map((_, i) => (
              <button key={i} onClick={() => navigateTo(i)}
                style={{ width: 28, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: i === current ? 'var(--accent)' : answers[questions[i]?.id] ? 'rgba(0,255,136,0.2)' : 'var(--bg2)', color: i === current ? '#000' : answers[questions[i]?.id] ? 'var(--green)' : 'var(--text3)' }}>
                {i + 1}
              </button>
            ))}
          </div>
          {current < questions.length - 1 ? (
            <button className="btn btn-primary" onClick={() => navigateTo(current + 1)}>Next <ChevronRight size={16} /></button>
          ) : (
            <button className="btn btn-primary" onClick={submit}>Submit <Send size={16} /></button>
          )}
        </div>
      </div>
    )
  }

  // ── RESULT ────────────────────────────────────────────────────────────────
  if (state === 'result' && result) {
    const scoreColor = result.totalScore >= 70 ? 'var(--green)' : result.totalScore >= 40 ? 'var(--yellow)' : 'var(--red)'
    const totalQ = result.questionFeedback?.length || 10
    const correctCount = result.questionFeedback?.filter(q => q.isCorrect).length || 0
    const avgTimePerQ = result.timeTakenSeconds ? Math.round(result.timeTakenSeconds / totalQ) : 0

    // Speed assessment
    const speedLabel = avgTimePerQ <= 30 ? { text: 'Lightning Fast ⚡', color: 'var(--green)' }
      : avgTimePerQ <= 60 ? { text: 'Good Speed 👍', color: 'var(--green)' }
      : avgTimePerQ <= 90 ? { text: 'Average Speed', color: 'var(--yellow)' }
      : { text: 'Too Slow — Needs Improvement 🐢', color: 'var(--red)' }

    const targetTime = 45 * totalQ // 45s per question target
    const timeDiff = result.timeTakenSeconds - targetTime
    const timeAdvice = timeDiff > 0
      ? `You were ${formatTime(timeDiff)} slower than the target. Aim for under 45s per question.`
      : `You were ${formatTime(Math.abs(timeDiff))} faster than the target. Great pace!`

    return (
      <div className="fade-in" style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Score card */}
        <div className="card card-glow" style={{ textAlign: 'center', marginBottom: 24, padding: 40 }}>
          <div style={{ width: 120, height: 120, borderRadius: '50%', margin: '0 auto 20px', background: `conic-gradient(${scoreColor} ${result.totalScore * 3.6}deg, var(--bg2) 0deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 30px ${scoreColor}40` }}>
            <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'var(--card)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 30, fontFamily: 'var(--display)', fontWeight: 800, color: scoreColor }}>{result.totalScore}</span>
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>/ 100</span>
            </div>
          </div>
          <div style={{ fontSize: 28, fontFamily: 'var(--display)', fontWeight: 800, marginBottom: 8 }}>Grade: {result.grade}</div>
          <p style={{ color: 'var(--text2)', maxWidth: 600, margin: '0 auto 20px' }}>{result.overallRemarks}</p>

          {/* Time stats row */}
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', marginTop: 16 }}>
            {[
              { label: 'Total Time', value: result.timeTakenFormatted || formatTime(result.timeTakenSeconds || 0), icon: '⏱️' },
              { label: 'Avg per Question', value: formatTime(avgTimePerQ), icon: '📊' },
              { label: 'Correct Answers', value: `${correctCount}/${totalQ}`, icon: '✅' },
              { label: 'Speed Rating', value: speedLabel.text, icon: '🚀', color: speedLabel.color },
            ].map(({ label, value, icon, color }) => (
              <div key={label} style={{ textAlign: 'center', padding: '12px 20px', background: 'var(--bg)', borderRadius: 12, border: '1px solid var(--border2)', minWidth: 120 }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: color || 'var(--text)', fontFamily: 'var(--display)' }}>{value}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Time advice */}
          <div style={{ marginTop: 16, padding: '10px 16px', background: timeDiff > 0 ? 'rgba(255,68,102,0.08)' : 'rgba(0,255,136,0.08)', borderRadius: 10, fontSize: 13, color: timeDiff > 0 ? 'var(--red)' : 'var(--green)' }}>
            {timeAdvice}
          </div>
        </div>

        {/* Per-question time breakdown */}
        {result.questionFeedback?.some(qf => qf.timeSpent > 0) && (
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>⏱️ Time per Question</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {result.questionFeedback.map((qf, i) => {
                const t = qf.timeSpent || 0
                const maxT = Math.max(...result.questionFeedback.map(x => x.timeSpent || 0), 1)
                const pct = (t / maxT) * 100
                const tColor = t <= 30 ? 'var(--green)' : t <= 60 ? 'var(--yellow)' : 'var(--red)'
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, background: qf.isCorrect ? 'rgba(0,255,136,0.15)' : 'rgba(255,68,102,0.15)', color: qf.isCorrect ? 'var(--green)' : 'var(--red)', flexShrink: 0 }}>
                      Q{i + 1}
                    </div>
                    <div style={{ flex: 1, height: 6, background: 'var(--bg2)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: tColor, borderRadius: 3, transition: 'width 0.6s' }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: tColor, minWidth: 40, textAlign: 'right' }}>{formatTime(t)}</span>
                  </div>
                )
              })}
            </div>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 12 }}>
              🎯 Target: under 45s per question. Red = too slow, spend more time practicing that topic.
            </p>
          </div>
        )}

        <div className="grid-2" style={{ marginBottom: 24 }}>
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 14, color: 'var(--green)' }}>✅ Strong Areas</h3>
            {result.strongAreas?.map(a => <div key={a} style={{ fontSize: 13, color: 'var(--text2)', padding: '4px 0', borderBottom: '1px solid var(--border2)' }}>{a}</div>)}
          </div>
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 14, color: 'var(--red)' }}>⚠️ Needs Improvement</h3>
            {result.weakAreas?.map(a => <div key={a} style={{ fontSize: 13, color: 'var(--text2)', padding: '4px 0', borderBottom: '1px solid var(--border2)' }}>{a}</div>)}
          </div>
        </div>

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
                  <div style={{ height: '100%', borderRadius: 3, transition: 'width 0.6s', width: `${(t.correct / Math.max(t.total, 1)) * 100}%`, background: t.correct / Math.max(t.total, 1) >= 0.7 ? 'var(--green)' : 'var(--yellow)' }} />
                </div>
                <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>{t.advice}</p>
              </div>
            ))}
          </div>
        )}

        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>📝 Question Review</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {result.questionFeedback?.map((qf, i) => {
              const q = questions.find(x => String(x.id) === String(qf.questionId))
              const isCorrect = qf.isCorrect
              return (
                <div key={i} style={{ padding: 14, borderRadius: 10, border: `1px solid ${isCorrect ? 'rgba(0,255,136,0.2)' : 'rgba(255,68,102,0.2)'}`, background: isCorrect ? 'rgba(0,255,136,0.04)' : 'rgba(255,68,102,0.04)' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    {isCorrect ? <CheckCircle size={16} color="var(--green)" style={{ flexShrink: 0, marginTop: 2 }} /> : <XCircle size={16} color="var(--red)" style={{ flexShrink: 0, marginTop: 2 }} />}
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <p style={{ fontSize: 13, fontWeight: 600 }}>Q{i + 1}. {q?.question}</p>
                        {qf.timeSpent > 0 && <span style={{ fontSize: 11, color: 'var(--text3)', flexShrink: 0, marginLeft: 8 }}><Clock size={10} style={{ display: 'inline' }} /> {formatTime(qf.timeSpent)}</span>}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>
                        Your answer: <span style={{ color: isCorrect ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>{qf.userAnswer}</span>
                        {!isCorrect && <> · Correct: <span style={{ color: 'var(--green)', fontWeight: 700 }}>{qf.correctAnswer}</span></>}
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text3)' }}>{qf.explanation}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {result.improvements?.length > 0 && (
          <div className="card" style={{ marginBottom: 28 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={18} color="var(--accent)" /> Improvement Plan
            </h3>
            {result.improvements.map((imp, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border2)', fontSize: 14, color: 'var(--text2)' }}>
                <span style={{ color: 'var(--accent)', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>{imp}
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