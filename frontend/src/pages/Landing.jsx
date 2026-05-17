import React from 'react'
import { Link } from 'react-router-dom'
import { Brain, Code2, Mic, Zap, ArrowRight, Star, Users, Trophy } from 'lucide-react'

const FEATURES = [
  {
    icon: Brain, color: '#00d4ff',
    title: 'Aptitude Tests',
    desc: '10 dynamic questions covering quantitative, logical, verbal & data interpretation. Scores, remarks & topic-wise analysis.',
  },
  {
    icon: Code2, color: '#7c3aed',
    title: 'DSA Coding',
    desc: '5 real FAANG interview problems. AI reviews your code, gives hints, best approach, complexity analysis & improvements.',
  },
  {
    icon: Mic, color: '#f97316',
    title: 'HR Interview',
    desc: 'Voice-based Q&A with TTS. AI analyzes tone, grammar, pitch, filler words, STAR structure & word mistakes.',
  },
]



export default function Landing() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', overflow: 'hidden' }}>
      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 60px', borderBottom: '1px solid var(--border2)',
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(7,11,20,0.8)', backdropFilter: 'blur(20px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #00d4ff, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Zap size={20} color="#fff" />
          </div>
          <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 20 }}>InterviewAI</span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link to="/login" className="btn btn-ghost">Login</Link>
          <Link to="/register" className="btn btn-primary">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '100px 20px 60px', position: 'relative' }}>
        {/* Glow bg */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          width: 600, height: 400,
          background: 'radial-gradient(ellipse, rgba(0,212,255,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div className="tag tag-blue" style={{ marginBottom: 20, display: 'inline-flex' }}>
          <Zap size={12} /> Powered by Groq LLaMA 3.3 70B
        </div>

        <h1 style={{
          fontFamily: 'var(--display)', fontSize: 'clamp(40px, 7vw, 80px)',
          fontWeight: 800, lineHeight: 1.1, marginBottom: 24,
          background: 'linear-gradient(135deg, #fff 0%, #00d4ff 50%, #7c3aed 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          Ace Every Interview<br />With AI Coaching
        </h1>
        <p style={{ fontSize: 18, color: 'var(--text2)', maxWidth: 560, margin: '0 auto 40px' }}>
          Practice aptitude tests, DSA coding challenges, and HR interviews with real-time AI feedback. Get hired at your dream company.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/register" className="btn btn-primary" style={{ fontSize: 16, padding: '14px 32px' }}>
            Start Free <ArrowRight size={18} />
          </Link>
          <Link to="/login" className="btn btn-outline" style={{ fontSize: 16, padding: '14px 32px' }}>
            I have an account
          </Link>
        </div>
      </section>



      {/* Features */}
      <section style={{ padding: '60px 60px 100px', maxWidth: 1100, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontFamily: 'var(--display)', fontSize: 36, fontWeight: 800, marginBottom: 48 }}>
          Everything You Need to Prepare
        </h2>
        <div className="grid-3">
          {FEATURES.map(({ icon: Icon, color, title, desc }) => (
            <div key={title} className="card card-glow fade-in"
              style={{ position: 'relative', overflow: 'hidden', transition: 'transform 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: `${color}18`,
                border: `1px solid ${color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 20,
              }}>
                <Icon size={26} color={color} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>{title}</h3>
              <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.7 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{
        textAlign: 'center', padding: '60px 20px 100px',
        background: 'linear-gradient(180deg, var(--bg) 0%, var(--bg2) 100%)',
        borderTop: '1px solid var(--border2)',
      }}>
        <h2 style={{ fontFamily: 'var(--display)', fontSize: 40, fontWeight: 800, marginBottom: 16 }}>
          Ready to Land Your Dream Job?
        </h2>
        <p style={{ color: 'var(--text2)', marginBottom: 32, fontSize: 16 }}>
          Join thousands of candidates who cracked their interviews with InterviewAI.
        </p>
        <Link to="/register" className="btn btn-primary" style={{ fontSize: 16, padding: '14px 36px' }}>
          Start Practicing Now <ArrowRight size={18} />
        </Link>
      </section>
    </div>
  )
}
