import React, { useState } from 'react'
import { codingApi } from '../services/api'
import toast from 'react-hot-toast'
import { Code2, ChevronRight, ChevronLeft, Send, Lightbulb, RotateCcw, CheckCircle, Clock, Database } from 'lucide-react'

const LANGS = ['python', 'javascript', 'java', 'cpp', 'c']
const DIFF_COLORS = { EASY: 'var(--green)', MEDIUM: 'var(--yellow)', HARD: 'var(--red)' }

export default function CodingPage() {
  const [state, setState] = useState('idle') // idle|loading|quiz|submitting|result
  const [sessionId, setSessionId] = useState(null)
  const [problems, setProblems] = useState([])
  const [current, setCurrent] = useState(0)
  const [lang, setLang] = useState('python')
  const [code, setCode] = useState('')
  const [results, setResults] = useState({}) // { problemId: result }
  const [hintData, setHintData] = useState(null)
  const [hintLevel, setHintLevel] = useState(1)
  const [hintLoading, setHintLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('description') // description|hints|result

  const start = async () => {
    setState('loading')
    try {
      const { data } = await codingApi.start()
      setSessionId(data.sessionId)
      setProblems(data.problems.problems)
      setCurrent(0)
      setCode('')
      setResults({})
      setHintData(null)
      setState('quiz')
    } catch {
      toast.error('Failed to generate problems')
      setState('idle')
    }
  }

  const submitCode = async () => {
    if (!code.trim()) return toast.error('Write your solution first!')
    setSubmitting(true)
    try {
      const { data } = await codingApi.evaluate({
        problem: problems[current],
        code,
        language: lang,
      })
      setResults(prev => ({ ...prev, [problems[current].id]: data }))
      setActiveTab('result')
      toast.success(data.isCorrect ? '✅ Accepted!' : '❌ Check the feedback')
    } catch {
      toast.error('Evaluation failed')
    } finally {
      setSubmitting(false)
    }
  }

  const getHint = async () => {
    setHintLoading(true)
    try {
      const { data } = await codingApi.hint({
        problem: problems[current],
        code,
        language: lang,
        hintLevel,
      })
      setHintData(data)
      setHintLevel(l => Math.min(l + 1, 3))
      setActiveTab('hints')
    } catch {
      toast.error('Failed to get hint')
    } finally {
      setHintLoading(false)
    }
  }

  const finishSession = async () => {
    const scores = Object.values(results)
    const avg = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + (b.score || 0), 0) / scores.length * 10)
      : 0
    await codingApi.complete({ sessionId, score: avg, feedback: 'Coding session' }).catch(() => {})
    setState('idle')
    toast.success('Session saved!')
  }

  const changeProblem = (idx) => {
    setCurrent(idx)
    setCode('')
    setHintData(null)
    setHintLevel(1)
    setActiveTab('description')
  }

  // ─── IDLE ────────────────────────────────────────────────
  if (state === 'idle') return (
    <div className="fade-in" style={{ maxWidth: 700, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{
          width: 80, height: 80, borderRadius: 20, margin: '0 auto 24px',
          background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Code2 size={40} color="#7c3aed" />
        </div>
        <h1 style={{ fontFamily: 'var(--display)', fontSize: 36, fontWeight: 800, marginBottom: 12 }}>
          DSA Coding Round
        </h1>
        <p style={{ color: 'var(--text2)', marginBottom: 12, fontSize: 15 }}>
          5 FAANG-style DSA problems. AI reviews your code, gives hints, best approach & complexity analysis.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 32, flexWrap: 'wrap' }}>
          {['5 Problems', 'AI Code Review', 'Hints on Demand', 'Multi-Language'].map(t => (
            <span key={t} className="tag tag-purple">{t}</span>
          ))}
        </div>
        <button className="btn btn-primary" onClick={start} style={{ fontSize: 16, padding: '14px 36px' }}>
          Start Coding <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )

  if (state === 'loading') return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 20 }}>
      <div className="spinner" style={{ width: 56, height: 56 }} />
      <p style={{ color: 'var(--text2)' }}>🧑‍💻 Generating FAANG-level problems...</p>
    </div>
  )

  if (state === 'quiz' && problems.length > 0) {
    const p = problems[current]
    const r = results[p.id]

    return (
      <div className="fade-in" style={{ display: 'flex', gap: 20, height: 'calc(100vh - 100px)' }}>
        {/* Left panel */}
        <div style={{ width: 420, display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0 }}>
          {/* Problem selector */}
          <div style={{ display: 'flex', gap: 6 }}>
            {problems.map((pb, i) => {
              const solved = results[pb.id]
              return (
                <button key={i} onClick={() => changeProblem(i)}
                  style={{
                    flex: 1, padding: '8px 4px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: i === current ? 'var(--accent)' : solved ? 'rgba(0,255,136,0.15)' : 'var(--bg2)',
                    color: i === current ? '#000' : solved ? 'var(--green)' : 'var(--text2)',
                    fontSize: 13, fontWeight: 600, fontFamily: 'var(--font)',
                  }}>
                  {i + 1}{solved ? ' ✓' : ''}
                </button>
              )
            })}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, background: 'var(--bg2)', borderRadius: 10, padding: 4 }}>
            {['description', 'hints', 'result'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1, padding: '7px', borderRadius: 7, border: 'none', cursor: 'pointer',
                  background: activeTab === tab ? 'var(--card)' : 'transparent',
                  color: activeTab === tab ? 'var(--text)' : 'var(--text3)',
                  fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600, textTransform: 'capitalize',
                }}>
                {tab}{tab === 'result' && r ? (r.isCorrect ? ' ✅' : ' ❌') : ''}
              </button>
            ))}
          </div>

          {/* Content panel */}
          <div className="card" style={{ flex: 1, overflow: 'auto' }}>
            {activeTab === 'description' && (
              <div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: DIFF_COLORS[p.difficulty] || 'var(--text2)', background: `${DIFF_COLORS[p.difficulty]}18`, padding: '3px 10px', borderRadius: 20 }}>
                    {p.difficulty}
                  </span>
                  <span className="tag tag-purple" style={{ fontSize: 11 }}>{p.topic}</span>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>{p.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 16 }}>{p.description}</p>

                {p.examples?.map((ex, i) => (
                  <div key={i} style={{ background: 'var(--bg2)', borderRadius: 8, padding: 12, marginBottom: 10, fontSize: 12 }}>
                    <div style={{ color: 'var(--text3)', marginBottom: 4 }}>Example {i + 1}:</div>
                    <div style={{ fontFamily: 'var(--mono)', color: 'var(--green)' }}>Input: {ex.input}</div>
                    <div style={{ fontFamily: 'var(--mono)', color: 'var(--accent)' }}>Output: {ex.output}</div>
                    {ex.explanation && <div style={{ color: 'var(--text3)', marginTop: 4 }}>{ex.explanation}</div>}
                  </div>
                ))}

                {p.constraints?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', marginBottom: 6 }}>Constraints:</div>
                    {p.constraints.map((c, i) => (
                      <div key={i} style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--text2)', padding: '2px 0' }}>{c}</div>
                    ))}
                  </div>
                )}

                {p.companiesAsked?.length > 0 && (
                  <div style={{ marginTop: 14, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {p.companiesAsked.map(c => <span key={c} className="tag tag-blue" style={{ fontSize: 10 }}>{c}</span>)}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'hints' && (
              <div>
                {hintData ? (
                  <>
                    <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 10, padding: 14, marginBottom: 14 }}>
                      <div style={{ color: 'var(--yellow)', fontWeight: 700, marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                        <Lightbulb size={15} /> Hint (Level {hintLevel - 1})
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 }}>{hintData.hint}</p>
                      <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 8, fontStyle: 'italic' }}>{hintData.encouragement}</p>
                    </div>
                  </>
                ) : (
                  <p style={{ color: 'var(--text3)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Click "Get Hint" to get a hint without spoiling the solution</p>
                )}
                {hintLevel <= 3 && (
                  <button className="btn btn-outline" onClick={getHint} disabled={hintLoading} style={{ width: '100%', justifyContent: 'center' }}>
                    <Lightbulb size={15} /> {hintLoading ? 'Getting hint...' : `Get Level ${hintLevel} Hint`}
                  </button>
                )}
              </div>
            )}

            {activeTab === 'result' && r && (
              <div>
                <div style={{
                  padding: 14, borderRadius: 10, marginBottom: 16,
                  background: r.isCorrect ? 'rgba(0,255,136,0.08)' : 'rgba(255,68,102,0.08)',
                  border: `1px solid ${r.isCorrect ? 'rgba(0,255,136,0.2)' : 'rgba(255,68,102,0.2)'}`,
                }}>
                  <div style={{ fontWeight: 700, marginBottom: 6, color: r.isCorrect ? 'var(--green)' : 'var(--red)' }}>
                    {r.isCorrect ? '✅ Accepted' : `❌ ${r.verdict}`} — Score: {r.score}/10
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text2)' }}>{r.remarks}</p>
                </div>

                {r.errors?.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--red)', marginBottom: 6 }}>Errors:</div>
                    {r.errors.map((e, i) => <div key={i} style={{ fontSize: 12, color: 'var(--text2)', padding: '3px 0' }}>• {e}</div>)}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <div style={{ flex: 1, background: 'var(--bg2)', borderRadius: 8, padding: 10 }}>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4, display: 'flex', gap: 6, alignItems: 'center' }}><Clock size={11} /> Time</div>
                    <div style={{ fontSize: 12 }}>
                      <span style={{ color: 'var(--text3)' }}>Yours: </span><span style={{ fontFamily: 'var(--mono)', color: 'var(--yellow)' }}>{r.timeComplexity?.user}</span>
                      <span style={{ color: 'var(--text3)', marginLeft: 8 }}>Optimal: </span><span style={{ fontFamily: 'var(--mono)', color: 'var(--green)' }}>{r.timeComplexity?.optimal}</span>
                    </div>
                  </div>
                  <div style={{ flex: 1, background: 'var(--bg2)', borderRadius: 8, padding: 10 }}>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4, display: 'flex', gap: 6, alignItems: 'center' }}><Database size={11} /> Space</div>
                    <div style={{ fontSize: 12 }}>
                      <span style={{ color: 'var(--text3)' }}>Yours: </span><span style={{ fontFamily: 'var(--mono)', color: 'var(--yellow)' }}>{r.spaceComplexity?.user}</span>
                    </div>
                  </div>
                </div>

                {r.improvements?.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Improvements:</div>
                    {r.improvements.map((imp, i) => <div key={i} style={{ fontSize: 12, color: 'var(--text2)', padding: '3px 0' }}>• {imp}</div>)}
                  </div>
                )}

                {r.bestSolution && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--green)' }}>Optimal Solution:</div>
                    <pre style={{
                      background: 'var(--bg)', padding: 12, borderRadius: 8, fontSize: 11,
                      fontFamily: 'var(--mono)', color: 'var(--text2)', overflow: 'auto', maxHeight: 200,
                      border: '1px solid var(--border2)',
                    }}>{r.bestSolution}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Code editor */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Editor toolbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <select value={lang} onChange={e => setLang(e.target.value)}
              style={{ width: 'auto', padding: '8px 12px', fontFamily: 'var(--mono)', fontSize: 13 }}>
              {LANGS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost" onClick={getHint} disabled={hintLoading || hintLevel > 3} style={{ fontSize: 13 }}>
                <Lightbulb size={14} /> Hint
              </button>
              <button className="btn btn-primary" onClick={submitCode} disabled={submitting} style={{ fontSize: 13 }}>
                {submitting ? 'Submitting...' : <><Send size={14} /> Submit</>}
              </button>
            </div>
          </div>

          {/* Editor */}
          <textarea
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder={`Write your ${lang} solution here...\n\n# Example:\ndef solution(nums):\n    # your code\n    pass`}
            style={{
              flex: 1, fontFamily: 'var(--mono)', fontSize: 13, lineHeight: 1.7,
              resize: 'none', background: '#0a0f1a', border: '1px solid var(--border)',
              borderRadius: 12, padding: 16, color: '#e2e8f0', minHeight: 400,
            }}
            spellCheck={false}
            onKeyDown={(e) => {
              if (e.key === 'Tab') {
                e.preventDefault()
                const start = e.target.selectionStart
                const end = e.target.selectionEnd
                const newCode = code.substring(0, start) + '    ' + code.substring(end)
                setCode(newCode)
                setTimeout(() => e.target.setSelectionRange(start + 4, start + 4), 0)
              }
            }}
          />

          {/* Bottom bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost" onClick={() => changeProblem(Math.max(0, current - 1))} disabled={current === 0}>
                <ChevronLeft size={15} /> Prev
              </button>
              <button className="btn btn-ghost" onClick={() => changeProblem(Math.min(problems.length - 1, current + 1))} disabled={current === problems.length - 1}>
                Next <ChevronRight size={15} />
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost" onClick={() => setCode('')} style={{ fontSize: 13 }}>
                <RotateCcw size={13} /> Clear
              </button>
              <button className="btn btn-outline" onClick={finishSession} style={{ fontSize: 13 }}>
                <CheckCircle size={13} /> Finish Session
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
