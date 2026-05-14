import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { problemApi } from '../services/api'
import { Search, Filter, ChevronRight, Clock, MemoryStick, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

const DIFFICULTIES = ['ALL', 'EASY', 'MEDIUM', 'HARD']

export default function ProblemsPage() {
  const [problems, setProblems]   = useState([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(true)
  const [page, setPage]           = useState(0)
  const [difficulty, setDiff]     = useState('ALL')
  const [search, setSearch]       = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    fetchProblems()
  }, [page, difficulty])

  const fetchProblems = async () => {
    setLoading(true)
    try {
      const params = { page, size: 10 }
      if (difficulty !== 'ALL') params.difficulty = difficulty
      const { data } = await problemApi.getAll(params)
      setProblems(data.content)
      setTotal(data.totalElements)
    } catch {
      toast.error('Failed to load problems')
    } finally {
      setLoading(false)
    }
  }

  const filtered = search
    ? problems.filter(p => p.title.toLowerCase().includes(search.toLowerCase()))
    : problems

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-white mb-2">Problem Set</h1>
        <p className="text-slate-400">Sharpen your skills with curated coding problems</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
          <input className="input-field pl-10" placeholder="Search problems..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {DIFFICULTIES.map(d => (
            <button key={d} onClick={() => { setDiff(d); setPage(0) }}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                difficulty === d
                  ? 'bg-brand-500 text-white'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/10'
              }`}>
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Problem list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p, idx) => (
            <ProblemRow key={p.id} problem={p} index={page * 10 + idx + 1}
              onClick={() => navigate(`/interview/${p.id}`)} />
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-16 text-slate-500">No problems found</div>
          )}
        </div>
      )}

      {/* Pagination */}
      {total > 10 && (
        <div className="flex items-center justify-between mt-6">
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="btn-ghost disabled:opacity-40">
            Previous
          </button>
          <span className="text-slate-400 text-sm">Page {page + 1} of {Math.ceil(total / 10)}</span>
          <button disabled={(page + 1) * 10 >= total} onClick={() => setPage(p => p + 1)} className="btn-ghost disabled:opacity-40">
            Next
          </button>
        </div>
      )}
    </div>
  )
}

function ProblemRow({ problem, index, onClick }) {
  const diffClass = {
    EASY: 'badge-easy', MEDIUM: 'badge-medium', HARD: 'badge-hard'
  }[problem.difficulty] || 'badge-easy'

  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-4 p-4 bg-surface-900 hover:bg-surface-800 border border-white/10 hover:border-white/20 rounded-2xl transition-all group text-left">
      <span className="w-8 text-center text-slate-600 font-mono text-sm font-medium">{index}</span>
      <span className="flex-1 font-medium text-white group-hover:text-brand-300 transition-colors">{problem.title}</span>
      <div className="flex items-center gap-3">
        {problem.category && (
          <span className="hidden sm:block px-2.5 py-1 bg-white/5 rounded-lg text-xs text-slate-400 border border-white/10">
            {problem.category}
          </span>
        )}
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <Clock className="w-3.5 h-3.5" />
          <span>{problem.timeLimit}ms</span>
        </div>
        <span className={diffClass}>{problem.difficulty}</span>
        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all" />
      </div>
    </button>
  )
}
