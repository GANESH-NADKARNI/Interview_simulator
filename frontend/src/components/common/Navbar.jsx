import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Code2, Trophy, History, LogOut, User, Zap } from 'lucide-react'

const NAV = [
  { to: '/',            label: 'Problems',    icon: Code2    },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy   },
  { to: '/history',     label: 'History',     icon: History  },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <header className="border-b border-white/10 bg-surface-950/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center group-hover:bg-brand-600 transition-colors">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-lg text-white">CodeSim</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                pathname === to
                  ? 'bg-brand-500/15 text-brand-400'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>

        {/* User menu */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10">
            <User className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-300">{user?.username}</span>
          </div>
          <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all" title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
