import React, { useState, useRef } from 'react'
import { resumeApi } from '../services/api'
import toast from 'react-hot-toast'
import {
  FileText, Upload, AlertTriangle, CheckCircle, XCircle,
  TrendingUp, Target, Zap, RotateCcw, ChevronDown, ChevronUp, Star
} from 'lucide-react'

const SEV_COLOR = { HIGH: 'var(--red)', MEDIUM: 'var(--yellow)', LOW: 'var(--accent)' }
const SEV_BG = { HIGH: 'rgba(255,68,102,0.08)', MEDIUM: 'rgba(251,191,36,0.08)', LOW: 'rgba(0,212,255,0.08)' }
const SEV_BORDER = { HIGH: 'rgba(255,68,102,0.2)', MEDIUM: 'rgba(251,191,36,0.2)', LOW: 'rgba(0,212,255,0.2)' }

function ScoreRing({ score, size = 110, color }) {
  const r = (size / 2) - 10
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  const c = color || (score >= 75 ? 'var(--green)' : score >= 50 ? 'var(--yellow)' : 'var(--red)')
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg2)" strokeWidth={8} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={c} strokeWidth={8}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }} />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center'
      }}>
        <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: size * 0.22, color: c }}>{score}</span>
        <span style={{ fontSize: size * 0.1, color: 'var(--text3)' }}>/ 100</span>
      </div>
    </div>
  )
}

function SectionCard({ label, data }) {
  const [open, setOpen] = useState(false)
  const color = data.present ? (data.score >= 7 ? 'var(--green)' : 'var(--yellow)') : 'var(--red)'
  return (
    <div style={{ border: '1px solid var(--border2)', borderRadius: 10, overflow: 'hidden', marginBottom: 8 }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px', background: 'var(--card)', border: 'none', cursor: 'pointer',
        color: 'var(--text)', fontFamily: 'var(--font)',
      }}>
        {data.present
          ? <CheckCircle size={15} color={color} />
          : <XCircle size={15} color="var(--red)" />}
        <span style={{ flex: 1, textAlign: 'left', fontWeight: 600, fontSize: 13, textTransform: 'capitalize' }}>{label}</span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color }}>{data.score}/10</span>
          {open ? <ChevronUp size={14} color="var(--text3)" /> : <ChevronDown size={14} color="var(--text3)" />}
        </div>
      </button>
      {open && (
        <div style={{ padding: '12px 16px', background: 'var(--bg2)', borderTop: '1px solid var(--border2)' }}>
          {data.issues?.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--red)', marginBottom: 4 }}>Issues:</div>
              {data.issues.map((i, idx) => <div key={idx} style={{ fontSize: 12, color: 'var(--text2)', padding: '2px 0' }}>• {i}</div>)}
            </div>
          )}
          {data.suggestions?.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', marginBottom: 4 }}>Suggestions:</div>
              {data.suggestions.map((s, idx) => <div key={idx} style={{ fontSize: 12, color: 'var(--text2)', padding: '2px 0' }}>💡 {s}</div>)}
            </div>
          )}
          {!data.issues?.length && !data.suggestions?.length && (
            <div style={{ fontSize: 12, color: 'var(--green)' }}>✅ Looks good!</div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ResumePage() {
  const [state, setState] = useState('idle') // idle | analyzing | result
  const [result, setResult] = useState(null)
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [mode, setMode] = useState('upload') // upload | paste
  const fileRef = useRef()

  const handleFile = (f) => {
    if (!f) return
    const allowed = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowed.includes(f.type) && !f.name.match(/\.(pdf|txt|docx|md)$/i)) {
      toast.error('Please upload PDF, DOCX, or TXT file')
      return
    }
    setFile(f)
  }

  const analyze = async () => {
    if (mode === 'upload' && !file) return toast.error('Please upload your resume first')
    if (mode === 'paste' && pasteText.trim().length < 100) return toast.error('Please paste more resume content')

    setState('analyzing')
    try {
      let data
      if (mode === 'upload') {
        const res = await resumeApi.analyze(file)
        data = res.data
      } else {
        const res = await resumeApi.analyzeText(pasteText)
        data = res.data
      }
      setResult(data)
      setState('result')
    } catch (e) {
      toast.error(e.response?.data?.error || 'Analysis failed. Try pasting your resume text instead.')
      setState('idle')
    }
  }

  const reset = () => {
    setState('idle')
    setResult(null)
    setFile(null)
    setPasteText('')
  }

  // ─── IDLE ──────────────────────────────────────────────
  if (state === 'idle') return (
    <div className="fade-in" style={{ maxWidth: 700, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <FileText size={26} color="var(--green)" />
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 800 }}>Resume Scanner</h1>
            <p style={{ color: 'var(--text2)', fontSize: 14 }}>ATS compatibility check + detailed improvement report</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {['ATS Score', 'Section Analysis', 'Keyword Gap', 'Action Verbs', 'Quantification', 'Job Role Match'].map(t => (
            <span key={t} className="tag tag-easy" style={{ fontSize: 11 }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--bg2)', borderRadius: 10, padding: 4, marginBottom: 20 }}>
        {['upload', 'paste'].map(m => (
          <button key={m} onClick={() => setMode(m)}
            style={{
              flex: 1, padding: '9px', borderRadius: 7, border: 'none', cursor: 'pointer',
              background: mode === m ? 'var(--card)' : 'transparent',
              color: mode === m ? 'var(--text)' : 'var(--text3)',
              fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600,
            }}>
            {m === 'upload' ? '📎 Upload File' : '📝 Paste Text'}
          </button>
        ))}
      </div>

      {mode === 'upload' ? (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? 'var(--green)' : file ? 'var(--green)' : 'var(--border)'}`,
            borderRadius: 16, padding: '48px 24px', textAlign: 'center', cursor: 'pointer',
            background: dragOver ? 'rgba(0,255,136,0.04)' : file ? 'rgba(0,255,136,0.04)' : 'var(--card)',
            transition: 'all 0.2s', marginBottom: 16,
          }}>
          <input ref={fileRef} type="file" accept=".pdf,.txt,.docx,.md" style={{ display: 'none' }}
            onChange={e => handleFile(e.target.files[0])} />
          {file ? (
            <>
              <CheckCircle size={40} color="var(--green)" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--green)', marginBottom: 4 }}>{file.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text3)' }}>{(file.size / 1024).toFixed(1)} KB · Click to change</div>
            </>
          ) : (
            <>
              <Upload size={40} color="var(--text3)" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>Drop your resume here</div>
              <div style={{ fontSize: 13, color: 'var(--text3)' }}>Supports PDF, DOCX, TXT · Max 10MB</div>
            </>
          )}
        </div>
      ) : (
        <div style={{ marginBottom: 16 }}>
          <textarea
            value={pasteText}
            onChange={e => setPasteText(e.target.value)}
            placeholder="Paste your resume text here (copy from your PDF/Word document)..."
            style={{ height: 260, resize: 'vertical', fontFamily: 'var(--font)', fontSize: 13, lineHeight: 1.7 }}
          />
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 6 }}>
            {pasteText.length} characters · Minimum 100 needed
          </div>
        </div>
      )}

      <button className="btn btn-primary" onClick={analyze}
        style={{ width: '100%', justifyContent: 'center', padding: 14, fontSize: 15 }}
        disabled={(mode === 'upload' && !file) || (mode === 'paste' && pasteText.length < 100)}>
        <Zap size={17} /> Analyze Resume
      </button>
    </div>
  )

  // ─── ANALYZING ─────────────────────────────────────────
  if (state === 'analyzing') return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 20 }}>
      <div className="spinner" style={{ width: 56, height: 56 }} />
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Scanning your resume...</p>
        <p style={{ color: 'var(--text2)', fontSize: 13 }}>Running ATS checks, keyword analysis & section scoring</p>
      </div>
    </div>
  )

  // ─── RESULT ────────────────────────────────────────────
  if (state === 'result' && result) {
    const atsScore = result.atsCompatibilityScore || result.overallScore || 0
    const contentScore = result.contentScore || 0
    const formatScore = result.formatScore || 0

    return (
      <div className="fade-in" style={{ maxWidth: 960, margin: '0 auto' }}>
        {/* Hero scores */}
        <div className="card card-glow" style={{ marginBottom: 24, padding: '32px 36px' }}>
          <div style={{ display: 'flex', gap: 40, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <ScoreRing score={result.overallScore || 0} size={120} />
              <div style={{ marginTop: 10, fontSize: 13, color: 'var(--text3)' }}>Overall Score</div>
              <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 20 }}>Grade: {result.grade}</div>
            </div>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center' }}>
                <ScoreRing score={atsScore} size={80} color="#00d4ff" />
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 6 }}>ATS Score</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <ScoreRing score={contentScore} size={80} color="#7c3aed" />
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 6 }}>Content</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <ScoreRing score={formatScore} size={80} color="#f97316" />
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 6 }}>Format</div>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              {result.detectedRole && <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 4 }}>🎯 Detected Role: <strong style={{ color: 'var(--text)' }}>{result.detectedRole}</strong></div>}
              {result.detectedLevel && <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12 }}>📊 Level: <strong style={{ color: 'var(--text)' }}>{result.detectedLevel}</strong></div>}
              <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7 }}>{result.summary}</p>
              {result.industryBenchmark && (
                <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(0,212,255,0.06)', borderRadius: 8, fontSize: 12 }}>
                  <Star size={12} color="var(--accent)" style={{ display: 'inline', marginRight: 6 }} />
                  {result.industryBenchmark.message}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid-2" style={{ marginBottom: 20 }}>
          {/* ATS Issues */}
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={16} color="var(--yellow)" /> ATS Issues
            </h3>
            {result.atsIssues?.length > 0 ? result.atsIssues.map((issue, i) => (
              <div key={i} style={{
                padding: 12, borderRadius: 8, marginBottom: 8,
                background: SEV_BG[issue.severity], border: `1px solid ${SEV_BORDER[issue.severity]}`,
              }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: SEV_COLOR[issue.severity], background: SEV_BG[issue.severity], padding: '2px 8px', borderRadius: 20, border: `1px solid ${SEV_BORDER[issue.severity]}` }}>
                    {issue.severity}
                  </span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{issue.issue}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>💡 {issue.fix}</div>
              </div>
            )) : <div style={{ fontSize: 13, color: 'var(--green)' }}>✅ No major ATS issues found!</div>}
          </div>

          {/* Keywords */}
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Target size={16} color="var(--accent)" /> Keyword Analysis
            </h3>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)', marginBottom: 6 }}>✅ Found ({result.keywordsFound?.length || 0})</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {result.keywordsFound?.map(k => (
                  <span key={k} style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, background: 'rgba(0,255,136,0.1)', color: 'var(--green)', border: '1px solid rgba(0,255,136,0.2)' }}>{k}</span>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--red)', marginBottom: 6 }}>❌ Missing ({result.keywordsMissing?.length || 0})</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {result.keywordsMissing?.map(k => (
                  <span key={k} style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, background: 'rgba(255,68,102,0.1)', color: 'var(--red)', border: '1px solid rgba(255,68,102,0.2)' }}>{k}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 14 }}>📋 Section-by-Section Review</h3>
          {result.sections && Object.entries(result.sections).map(([key, val]) => (
            <SectionCard key={key} label={key} data={val} />
          ))}
        </div>

        <div className="grid-2" style={{ marginBottom: 20 }}>
          {/* Action verbs */}
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 14 }}>⚡ Action Verbs</h3>
            <div style={{ display: 'flex', gap: 20, marginBottom: 12 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 28, color: result.actionVerbs?.score >= 7 ? 'var(--green)' : 'var(--yellow)' }}>
                  {result.actionVerbs?.score || 0}/10
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>Score</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 700, marginBottom: 4 }}>Used:</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>{result.actionVerbs?.used?.join(', ')}</div>
                <div style={{ fontSize: 11, color: 'var(--red)', fontWeight: 700, marginBottom: 4 }}>Add these:</div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>{result.actionVerbs?.missing?.join(', ')}</div>
              </div>
            </div>
          </div>

          {/* Quantification */}
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 14 }}>📊 Quantification</h3>
            <div style={{ display: 'flex', gap: 20, marginBottom: 12 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 28, color: result.quantification?.score >= 7 ? 'var(--green)' : 'var(--yellow)' }}>
                  {result.quantification?.score || 0}/10
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>Score</div>
              </div>
              <div style={{ flex: 1 }}>
                {result.quantification?.found?.length > 0 && (
                  <>
                    <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 700, marginBottom: 4 }}>✅ Found:</div>
                    {result.quantification.found.map((f, i) => <div key={i} style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 2 }}>"{f}"</div>)}
                  </>
                )}
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 6, fontStyle: 'italic' }}>{result.quantification?.advice}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Job role match */}
        {result.jobRoleMatch?.length > 0 && (
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 14 }}>🎯 Job Role Match</h3>
            {result.jobRoleMatch.map((r, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{r.role}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: r.matchScore >= 70 ? 'var(--green)' : 'var(--yellow)' }}>{r.matchScore}%</span>
                </div>
                <div style={{ height: 6, background: 'var(--bg2)', borderRadius: 3, overflow: 'hidden', marginBottom: 4 }}>
                  <div style={{ width: `${r.matchScore}%`, height: '100%', background: r.matchScore >= 70 ? 'var(--green)' : 'var(--yellow)', borderRadius: 3, transition: 'width 0.8s' }} />
                </div>
                {r.missingSkills?.length > 0 && (
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>Missing: {r.missingSkills.join(', ')}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Improvements */}
        {result.improvements?.length > 0 && (
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={16} color="var(--accent)" /> Improvement Recommendations
            </h3>
            {result.improvements.map((imp, i) => (
              <div key={i} style={{
                padding: 14, borderRadius: 10, marginBottom: 10,
                background: SEV_BG[imp.priority], border: `1px solid ${SEV_BORDER[imp.priority]}`,
              }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: SEV_COLOR[imp.priority], background: SEV_BG[imp.priority], padding: '2px 8px', borderRadius: 20, border: `1px solid ${SEV_BORDER[imp.priority]}` }}>
                    {imp.priority}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{imp.area}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>Current: {imp.current}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: imp.example ? 6 : 0 }}>✅ {imp.improved}</div>
                {imp.example && (
                  <div style={{ fontSize: 12, fontStyle: 'italic', color: 'var(--accent)', background: 'rgba(0,212,255,0.04)', padding: '6px 10px', borderRadius: 6 }}>
                    Example: {imp.example}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {result.industryBenchmark?.topRecommendation && (
          <div style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.08), rgba(124,58,237,0.08))', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 14, padding: 20, marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', marginBottom: 6 }}>⭐ Top Recommendation</div>
            <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.7 }}>{result.industryBenchmark.topRecommendation}</p>
          </div>
        )}

        <button className="btn btn-primary" onClick={reset} style={{ width: '100%', justifyContent: 'center', padding: 14 }}>
          <RotateCcw size={16} /> Scan Another Resume
        </button>
      </div>
    )
  }

  return null
}
