import { useState, useEffect } from 'react'
import { problemApi, leaderboardApi } from '../services/api'
import { Trophy, Medal, Clock, Code2, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LeaderboardPage() {
  const [problems, setProblems]     = useState([])
  const [selected, setSelected]     = useState(null)
  const [entries, setEntries]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [loadingLB, setLoadingLB]   = useState(false)

  useEffect(() => {
    problemApi.getAll({ size: 50 }).then(({ data }) => {
      setProblems(data.content)
      if (data.content.length > 0) handleSelectProblem(data.content[0])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const handleSelectProblem = async (problem) => {
    setSelected(problem)
    setLoadingLB(true)
    try {
      const { data } = await leaderboardApi.forProblem(problem.id)
      setEntries(data)
    } catch {
      setEntries([])
    } finally {
      setLoadingLB(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8 flex items-center gap-3">
        <Trophy className="w-7 h-7 text-amber-400" />
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Leaderboard</h1>
          <p className="text-slate-400">Top solutions ranked by AI score and runtime</p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Problem selector */}
        <div className="w-56 flex-shrink-0 space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Problems</div>
          {problems.map(p => (
            <button key={p.id} onClick={() => handleSelectProblem(p)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all ${
                selected?.id === p.id
                  ? 'bg-brand-500/15 text-brand-300 border border-brand-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}>
              {p.title}
            </button>
          ))}
        </div>

        {/* Leaderboard table */}
        <div className="flex-1">
          {loading || loadingLB ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-20 text-slate-500">No accepted submissions yet. Be the first!</div>
          ) : (
            <div className="space-y-2">
              {entries.map((entry) => (
                <div key={entry.rank}
                  className="flex items-center gap-4 p-4 bg-surface-900 border border-white/10 rounded-2xl">
                  <RankBadge rank={entry.rank} />
                  <div className="flex-1">
                    <div className="font-semibold text-white">{entry.username}</div>
                    <div className="text-xs text-slate-500">{entry.submittedAt?.split('T')[0]}</div>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-slate-400">
                    <Clock className="w-4 h-4" />
                    {entry.runtimeMs}ms
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-slate-400">
                    <Code2 className="w-4 h-4" />
                    {entry.language}
                  </div>
                  <div className={`text-lg font-bold ${
                    entry.aiScore >= 80 ? 'text-emerald-400' :
                    entry.aiScore >= 60 ? 'text-amber-400' : 'text-red-400'
                  }`}>{entry.aiScore}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function RankBadge({ rank }) {
  if (rank === 1) return <Medal className="w-8 h-8 text-amber-400" />
  if (rank === 2) return <Medal className="w-8 h-8 text-slate-300" />
  if (rank === 3) return <Medal className="w-8 h-8 text-amber-700" />
  return <span className="w-8 h-8 flex items-center justify-center text-slate-500 font-semibold">{rank}</span>
}
