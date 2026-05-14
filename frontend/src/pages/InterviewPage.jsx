import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { problemApi, submissionApi } from '../services/api'
import { useTimer } from '../hooks/useTimer'
import Editor from '@monaco-editor/react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import toast from 'react-hot-toast'
import {
  Play, Send, Timer, ChevronLeft, Clock, MemoryStick,
  CheckCircle2, XCircle, AlertTriangle, Loader2, Bot,
  TrendingUp, Star, Zap, RotateCcw
} from 'lucide-react'

const LANGUAGES = [
  { value: 'python',     label: 'Python 3.11' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'java',       label: 'Java 21' },
  { value: 'cpp',        label: 'C++' },
]

const STARTER = {
  python:     '# Write your solution here\n\n',
  javascript: '// Write your solution here\n\n',
  java:       'public class Solution {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}\n',
  cpp:        '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n',
}

export default function InterviewPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [problem, setProblem]     = useState(null)
  const [language, setLanguage]   = useState('python')
  const [code, setCode]           = useState(STARTER.python)
  const [loading, setLoading]     = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult]       = useState(null)
  const [activeTab, setActiveTab] = useState('problem') // problem | result
  const [panelSize, setPanelSize] = useState(40) // % for problem panel
  const timer = useTimer(60)

  useEffect(() => {
    problemApi.getById(id).then(({ data }) => {
      setProblem(data)
      // Try to load language-specific starter
      if (data.starterCode) {
        try {
          const sc = JSON.parse(data.starterCode)
          if (sc[language]) setCode(sc[language])
        } catch {}
      }
      setLoading(false)
    }).catch(() => { toast.error('Problem not found'); navigate('/') })
  }, [id])

  const handleLangChange = (lang) => {
    setLanguage(lang)
    if (problem?.starterCode) {
      try {
        const sc = JSON.parse(problem.starterCode)
        if (sc[lang]) { setCode(sc[lang]); return }
      } catch {}
    }
    setCode(STARTER[lang] || '')
  }

  const handleSubmit = async () => {
    if (!code.trim()) { toast.error('Write some code first!'); return }
    timer.pause()
    setSubmitting(true)
    setResult(null)
    try {
      const { data } = await submissionApi.submit({ problemId: Number(id), language, code })
      setResult(data)
      setActiveTab('result')
      if (data.status === 'ACCEPTED') toast.success('All tests passed! 🎉')
      else toast.error(`${data.testsPassed}/${data.testsTotal} tests passed`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
    </div>
  )

  return (
    <div className="h-screen flex flex-col bg-surface-950">
      {/* Top bar */}
      <div className="h-14 border-b border-white/10 flex items-center justify-between px-4 bg-surface-900/50">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-all">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-semibold text-white text-sm">{problem.title}</h1>
            <span className={`text-xs ${{EASY:'text-emerald-400',MEDIUM:'text-amber-400',HARD:'text-red-400'}[problem.difficulty]}`}>
              {problem.difficulty}
            </span>
          </div>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-lg font-bold border transition-colors ${
            timer.isCritical ? 'bg-red-500/15 text-red-400 border-red-500/30 animate-pulse' :
            timer.isWarning  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
                               'bg-white/5 text-white border-white/10'
          }`}>
            <Timer className="w-4 h-4" />
            {timer.display}
          </div>
          {!timer.isRunning ? (
            <button onClick={timer.start} className="btn-ghost py-2 text-sm">Start</button>
          ) : (
            <button onClick={timer.pause} className="btn-ghost py-2 text-sm">Pause</button>
          )}
          <button onClick={timer.reset} className="p-2 text-slate-500 hover:text-slate-300 hover:bg-white/5 rounded-xl transition-all">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-2">
          <select value={language} onChange={e => handleLangChange(e.target.value)}
            className="bg-surface-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500">
            {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
          <button onClick={handleSubmit} disabled={submitting}
            className="btn-primary flex items-center gap-2 py-2">
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Running...</> : <><Send className="w-4 h-4" /> Submit</>}
          </button>
        </div>
      </div>

      {/* Main split layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel */}
        <div className="w-[42%] flex flex-col border-r border-white/10 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-white/10 bg-surface-900/30">
            {['problem', 'result'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 text-sm font-medium capitalize transition-all border-b-2 ${
                  activeTab === tab ? 'border-brand-500 text-brand-400' : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}>
                {tab === 'result' && result && (
                  <span className={`mr-1.5 inline-block w-2 h-2 rounded-full ${
                    result.status === 'ACCEPTED' ? 'bg-emerald-400' : 'bg-red-400'
                  }`} />
                )}
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'problem' ? (
              <ProblemPanel problem={problem} />
            ) : (
              result && <ResultPanel result={result} />
            )}
          </div>
        </div>

        {/* Right panel: Editor */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1">
            <Editor
              height="100%"
              language={language === 'cpp' ? 'cpp' : language}
              value={code}
              onChange={v => setCode(v || '')}
              theme="vs-dark"
              options={{
                fontSize: 14,
                fontFamily: '"JetBrains Mono", Consolas, monospace',
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                lineNumbers: 'on',
                renderLineHighlight: 'gutter',
                bracketPairColorization: { enabled: true },
                padding: { top: 16 },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function ProblemPanel({ problem }) {
  const examples = (() => { try { return JSON.parse(problem.examples) } catch { return [] } })()

  return (
    <div className="prose-dark space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold text-white">{problem.title}</h2>
        <span className={`${{EASY:'badge-easy',MEDIUM:'badge-medium',HARD:'badge-hard'}[problem.difficulty]}`}>
          {problem.difficulty}
        </span>
      </div>

      {problem.category && (
        <span className="inline-block px-3 py-1 bg-white/5 rounded-lg text-xs text-slate-400 border border-white/10">
          {problem.category}
        </span>
      )}

      <div className="text-slate-300 leading-relaxed">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{problem.description}</ReactMarkdown>
      </div>

      {examples.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-white text-sm">Examples</h3>
          {examples.map((ex, i) => (
            <div key={i} className="bg-surface-800 rounded-xl p-4 border border-white/10 space-y-2 text-sm font-mono">
              <div><span className="text-slate-500">Input:</span>  <span className="text-emerald-300">{ex.input}</span></div>
              <div><span className="text-slate-500">Output:</span> <span className="text-brand-300">{ex.output}</span></div>
              {ex.explanation && <div className="text-slate-400 font-sans text-xs">{ex.explanation}</div>}
            </div>
          ))}
        </div>
      )}

      {problem.constraints && (
        <div>
          <h3 className="font-semibold text-white text-sm mb-2">Constraints</h3>
          <div className="text-slate-400 text-sm leading-relaxed whitespace-pre-line bg-surface-800 rounded-xl p-4 border border-white/10 font-mono">
            {problem.constraints}
          </div>
        </div>
      )}

      <div className="flex gap-4 text-xs text-slate-500 pt-2">
        <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {problem.timeLimit}ms limit</div>
        <div className="flex items-center gap-1.5"><MemoryStick className="w-3.5 h-3.5" /> {problem.memoryLimit}MB memory</div>
      </div>
    </div>
  )
}

function ResultPanel({ result }) {
  const statusMeta = {
    ACCEPTED:            { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', Icon: CheckCircle2 },
    WRONG_ANSWER:        { color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20',     Icon: XCircle },
    TIME_LIMIT_EXCEEDED: { color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   Icon: AlertTriangle },
    RUNTIME_ERROR:       { color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20',     Icon: XCircle },
    COMPILE_ERROR:       { color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20',     Icon: XCircle },
  }
  const meta = statusMeta[result.status] || statusMeta.WRONG_ANSWER
  const { Icon } = meta

  return (
    <div className="space-y-5">
      {/* Status banner */}
      <div className={`flex items-center gap-3 p-4 rounded-2xl border ${meta.bg} ${meta.border}`}>
        <Icon className={`w-6 h-6 ${meta.color}`} />
        <div>
          <div className={`font-bold text-lg ${meta.color}`}>{result.status.replace(/_/g, ' ')}</div>
          <div className="text-slate-400 text-sm">
            {result.testsPassed}/{result.testsTotal} test cases passed
            {result.runtimeMs && ` · ${result.runtimeMs}ms`}
          </div>
        </div>
      </div>

      {/* Error message */}
      {result.errorMessage && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <pre className="text-red-400 text-xs font-mono whitespace-pre-wrap">{result.errorMessage}</pre>
        </div>
      )}

      {/* Test results */}
      {result.testResults?.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-white text-sm">Test Cases</h3>
          {result.testResults.map((tc, i) => (
            <div key={i} className={`p-3 rounded-xl border text-sm ${
              tc.passed ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-slate-300">Test {i + 1}</span>
                <div className="flex items-center gap-2">
                  {tc.runtimeMs && <span className="text-xs text-slate-500">{tc.runtimeMs}ms</span>}
                  {tc.passed ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
                </div>
              </div>
              {!tc.hidden && (
                <div className="space-y-1 font-mono text-xs">
                  <div><span className="text-slate-500">Input:    </span><span className="text-slate-300">{tc.input}</span></div>
                  <div><span className="text-slate-500">Expected: </span><span className="text-emerald-300">{tc.expected}</span></div>
                  {!tc.passed && <div><span className="text-slate-500">Got:      </span><span className="text-red-300">{tc.actual}</span></div>}
                </div>
              )}
              {tc.hidden && <div className="text-xs text-slate-500 italic">Hidden test case</div>}
            </div>
          ))}
        </div>
      )}

      {/* AI Feedback */}
      {result.aiFeedback && <AIFeedbackPanel feedback={result.aiFeedback} />}
    </div>
  )
}

function AIFeedbackPanel({ feedback }) {
  const score = feedback.score ?? 0
  const scoreColor = score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-red-400'
  const scoreBg    = score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500'

  return (
    <div className="bg-surface-800 border border-white/10 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Bot className="w-5 h-5 text-brand-400" />
        <h3 className="font-semibold text-white">AI Code Analysis</h3>
      </div>

      {/* Score */}
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="26" fill="none" stroke="#1e293b" strokeWidth="6" />
            <circle cx="32" cy="32" r="26" fill="none" strokeWidth="6" stroke="currentColor"
              className={scoreColor}
              strokeDasharray={`${(score / 100) * 163.4} 163.4`}
              strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-sm font-bold ${scoreColor}`}>{score}</span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-sm text-slate-300">{feedback.summary}</div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Time',  value: feedback.timeComplexity,  icon: TrendingUp },
          { label: 'Space', value: feedback.spaceComplexity, icon: MemoryStick },
          { label: 'Quality',    value: `${feedback.qualityScore}/10`,     icon: Star },
          { label: 'Readability', value: `${feedback.readabilityScore}/10`, icon: Zap },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-surface-900 rounded-xl p-3 border border-white/10">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Icon className="w-3 h-3" />{label}
            </div>
            <div className="font-semibold text-white text-sm">{value}</div>
          </div>
        ))}
      </div>

      {/* Strengths */}
      {feedback.strengths?.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-emerald-400 mb-2">✓ Strengths</div>
          <ul className="space-y-1">
            {feedback.strengths.map((s, i) => (
              <li key={i} className="text-xs text-slate-300 flex gap-2">
                <span className="text-emerald-500 flex-shrink-0">•</span>{s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Optimizations */}
      {feedback.optimizations?.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-amber-400 mb-2">⚡ Suggestions</div>
          <ul className="space-y-1">
            {feedback.optimizations.map((s, i) => (
              <li key={i} className="text-xs text-slate-300 flex gap-2">
                <span className="text-amber-500 flex-shrink-0">•</span>{s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
