import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { submissionApi } from '../services/api'
import { History, CheckCircle2, XCircle, Clock, Code2, Bot, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function HistoryPage() {
  const [submissions, setSubmissions] = useState([])
  const [total, setTotal]             = useState(0)
  const [page, setPage]               = useState(0)
  const [loading, setLoading]         = useState(true)
  const [expanded, setExpanded]       = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    setLoading(true)
    submissionApi.getHistory(page).then(({ data }) => {
      setSubmissions(data.content)
      setTotal(data.totalElements)
      setLoading(false)
    }).catch(() => { toast.error('Failed to load history'); setLoading(false) })
  }, [page])

  const statusMeta = {
    ACCEPTED:            { color: 'text-emerald-400', icon: CheckCircle2 },
    WRONG_ANSWER:        { color: 'text-red-400',     icon: XCircle },
    TIME_LIMIT_EXCEEDED: { color: 'text-amber-400',   icon: Clock },
    RUNTIME_ERROR:       { color: 'text-red-400',     icon: XCircle },
    COMPILE_ERROR:       { color: 'text-red-400',     icon: XCircle },
    PENDING:             { color: 'text-slate-400',   icon: Clock },
    RUNNING:             { color: 'text-brand-400',   icon: Loader2 },
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8 flex items-center gap-3">
        <History className="w-7 h-7 text-brand-400" />
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Submission History</h1>
          <p className="text-slate-400">{total} total submissions</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
        </div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-slate-500 mb-4">No submissions yet</div>
          <button onClick={() => navigate('/')} className="btn-primary">Start Practicing</button>
        </div>
      ) : (
        <div className="space-y-2">
          {submissions.map(sub => {
            const { color, icon: Icon } = statusMeta[sub.status] || statusMeta.WRONG_ANSWER
            const isOpen = expanded === sub.id

            return (
              <div key={sub.id} className="bg-surface-900 border border-white/10 rounded-2xl overflow-hidden">
                <button onClick={() => setExpanded(isOpen ? null : sub.id)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-white/3 transition-all text-left">
                  <Icon className={`w-5 h-5 ${color} flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white truncate">{sub.problemTitle}</div>
                    <div className="text-xs text-slate-500">{sub.submittedAt?.replace('T', ' ').substring(0, 16)}</div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`text-sm font-semibold ${color}`}>{sub.status.replace(/_/g, ' ')}</span>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Code2 className="w-3.5 h-3.5" />{sub.language}
                    </div>
                    {sub.runtimeMs && (
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="w-3.5 h-3.5" />{sub.runtimeMs}ms
                      </div>
                    )}
                    {sub.aiScore != null && (
                      <div className="flex items-center gap-1 text-xs">
                        <Bot className="w-3.5 h-3.5 text-brand-400" />
                        <span className={sub.aiScore >= 80 ? 'text-emerald-400' : sub.aiScore >= 60 ? 'text-amber-400' : 'text-red-400'}>
                          {sub.aiScore}
                        </span>
                      </div>
                    )}
                    {isOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                  </div>
                </button>

                {isOpen && sub.aiFeedback && (
                  <div className="border-t border-white/10 p-4 bg-surface-950/50">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      {[
                        ['Tests',    `${sub.testsPassed}/${sub.testsTotal}`],
                        ['AI Score', sub.aiScore],
                        ['Time',     sub.aiFeedback.timeComplexity],
                        ['Space',    sub.aiFeedback.spaceComplexity],
                      ].map(([k, v]) => (
                        <div key={k} className="bg-surface-800 rounded-xl p-3">
                          <div className="text-xs text-slate-500 mb-1">{k}</div>
                          <div className="font-semibold text-white">{v}</div>
                        </div>
                      ))}
                    </div>
                    {sub.aiFeedback.summary && (
                      <p className="mt-3 text-sm text-slate-400">{sub.aiFeedback.summary}</p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {total > 10 && (
        <div className="flex items-center justify-between mt-6">
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="btn-ghost disabled:opacity-40">Previous</button>
          <span className="text-slate-400 text-sm">Page {page + 1}</span>
          <button disabled={(page + 1) * 10 >= total} onClick={() => setPage(p => p + 1)} className="btn-ghost disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  )
}
