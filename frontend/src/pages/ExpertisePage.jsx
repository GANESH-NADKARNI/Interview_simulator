import React, { useState, useEffect } from 'react'
import { profileApi } from '../services/api'
import toast from 'react-hot-toast'
import { Settings, Save, CheckCircle, ChevronDown } from 'lucide-react'

const DOMAINS = {
  'Software Engineering': {
    icon: '💻',
    subs: [
      'Backend Development (Java/Spring)',
      'Backend Development (Node.js)',
      'Backend Development (Python/Django)',
      'Frontend Development (React/Vue)',
      'Full Stack Development',
      'Mobile Development (Android)',
      'Mobile Development (iOS/Swift)',
      'Mobile Development (Flutter)',
    ],
  },
  'Data & AI': {
    icon: '🤖',
    subs: [
      'Machine Learning / AI',
      'Data Science & Analytics',
      'Data Engineering (Spark/Kafka)',
      'NLP / LLM Engineering',
      'Computer Vision',
      'MLOps / AI Infrastructure',
    ],
  },
  'Cloud & DevOps': {
    icon: '☁️',
    subs: [
      'Cloud Architecture (AWS)',
      'Cloud Architecture (GCP)',
      'Cloud Architecture (Azure)',
      'DevOps & CI/CD',
      'Site Reliability Engineering (SRE)',
      'Kubernetes & Containers',
    ],
  },
  'Cybersecurity': {
    icon: '🔐',
    subs: [
      'Application Security',
      'Network Security',
      'Penetration Testing',
      'Security Operations (SOC)',
    ],
  },
  'Product & Design': {
    icon: '🎨',
    subs: [
      'Product Management',
      'UX/UI Design',
      'Product Analytics',
    ],
  },
  'Embedded & Systems': {
    icon: '⚙️',
    subs: [
      'Embedded Systems (C/C++)',
      'Systems Programming',
      'Firmware Development',
      'VLSI / Hardware',
    ],
  },
  'Other': {
    icon: '🌐',
    subs: [
      'Game Development',
      'Blockchain / Web3',
      'QA / Test Engineering',
      'Technical Support',
      'General Software Engineer',
    ],
  },
}

const LEVELS = [
  { value: 'FRESHER', label: 'Fresher', desc: '0–1 year / Student', color: '#00d4ff' },
  { value: 'JUNIOR', label: 'Junior', desc: '1–2 years', color: '#00ff88' },
  { value: 'MID', label: 'Mid-Level', desc: '2–5 years', color: '#fbbf24' },
  { value: 'SENIOR', label: 'Senior', desc: '5–8 years', color: '#f97316' },
  { value: 'LEAD', label: 'Lead / Principal', desc: '8+ years', color: '#ff4466' },
]

const LANG_OPTIONS = ['python', 'javascript', 'java', 'cpp', 'c', 'go', 'kotlin', 'swift', 'typescript', 'rust']

const SKILL_POOL = {
  'Software Engineering': ['Java', 'Spring Boot', 'Python', 'Django', 'Node.js', 'React', 'Vue', 'Angular', 'TypeScript', 'PostgreSQL', 'MongoDB', 'Redis', 'Kafka', 'REST API', 'GraphQL', 'Microservices', 'Docker', 'Kubernetes', 'AWS', 'Git'],
  'Data & AI': ['Python', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas', 'NumPy', 'SQL', 'Spark', 'Kafka', 'Airflow', 'MLflow', 'Hugging Face', 'LangChain', 'OpenCV', 'R', 'Tableau', 'Power BI', 'Databricks'],
  'Cloud & DevOps': ['AWS', 'GCP', 'Azure', 'Terraform', 'Kubernetes', 'Docker', 'Jenkins', 'GitHub Actions', 'Ansible', 'Prometheus', 'Grafana', 'Linux', 'Bash', 'Python', 'Nginx'],
  'Cybersecurity': ['Penetration Testing', 'OWASP', 'Burp Suite', 'Wireshark', 'SIEM', 'Python', 'Linux', 'Network Security', 'Cryptography', 'Kali Linux'],
}

export default function ExpertisePage() {
  const [profile, setProfile] = useState({
    domain: '',
    subDomain: '',
    experienceLevel: '',
    skills: [],
    targetRole: '',
    preferredLanguage: 'python',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [skillInput, setSkillInput] = useState('')
  const [domainOpen, setDomainOpen] = useState(false)

  useEffect(() => {
    profileApi.get()
      .then(r => { if (r.data?.domain) setProfile(r.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const toggleSkill = (skill) => {
    setProfile(p => ({
      ...p,
      skills: p.skills.includes(skill)
        ? p.skills.filter(s => s !== skill)
        : [...p.skills, skill],
    }))
  }

  const addCustomSkill = () => {
    const s = skillInput.trim()
    if (!s || profile.skills.includes(s)) return
    setProfile(p => ({ ...p, skills: [...p.skills, s] }))
    setSkillInput('')
  }

  const save = async () => {
    if (!profile.domain) return toast.error('Please select your domain')
    if (!profile.experienceLevel) return toast.error('Please select your experience level')
    setSaving(true)
    try {
      await profileApi.save(profile)
      setSaved(true)
      toast.success('✅ Profile saved! Questions will now be tailored to you.')
      setTimeout(() => setSaved(false), 3000)
    } catch {
      toast.error('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const suggestedSkills = (() => {
    for (const [key, val] of Object.entries(SKILL_POOL)) {
      if (profile.domain?.includes(key) || (profile.domain === 'Software Engineering' && key === 'Software Engineering')) {
        return val
      }
    }
    // Match by first word
    const domainKey = Object.keys(SKILL_POOL).find(k => profile.domain?.startsWith(k.split(' ')[0]))
    return domainKey ? SKILL_POOL[domainKey] : SKILL_POOL['Software Engineering']
  })()

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div className="spinner" />
    </div>
  )

  return (
    <div className="fade-in" style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Settings size={26} color="#a78bfa" />
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 800 }}>Expertise Profile</h1>
            <p style={{ color: 'var(--text2)', fontSize: 14 }}>Questions across all modules will adapt to your domain & level</p>
          </div>
        </div>
      </div>

      {/* Domain */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 4 }}>🎯 Your Domain</h3>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>Select your primary area of expertise</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
          {Object.entries(DOMAINS).map(([domain, { icon }]) => {
            const selected = profile.domain === domain || profile.domain?.startsWith(domain.split(' ')[0])
            return (
              <button key={domain} onClick={() => setProfile(p => ({ ...p, domain, subDomain: '', skills: [] }))}
                style={{
                  padding: '12px 14px', borderRadius: 10, border: `1px solid ${selected ? 'rgba(124,58,237,0.5)' : 'var(--border2)'}`,
                  background: selected ? 'rgba(124,58,237,0.1)' : 'var(--bg2)',
                  color: selected ? '#a78bfa' : 'var(--text2)',
                  fontFamily: 'var(--font)', fontSize: 13, fontWeight: selected ? 700 : 400,
                  cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8,
                  transition: 'all 0.15s',
                }}>
                <span style={{ fontSize: 18 }}>{icon}</span>
                {domain}
                {selected && <CheckCircle size={14} style={{ marginLeft: 'auto' }} />}
              </button>
            )
          })}
        </div>

        {/* Sub-domain */}
        {profile.domain && DOMAINS[profile.domain]?.subs?.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 8 }}>
              Specialization (optional)
            </label>
            <div style={{ position: 'relative' }}>
              <select value={profile.subDomain}
                onChange={e => setProfile(p => ({ ...p, subDomain: e.target.value }))}
                style={{ appearance: 'none', paddingRight: 36 }}>
                <option value="">-- Select specialization --</option>
                {DOMAINS[profile.domain].subs.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown size={15} color="var(--text3)" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>
          </div>
        )}
      </div>

      {/* Experience Level */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 4 }}>📊 Experience Level</h3>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>This adjusts question difficulty across all modules</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
          {LEVELS.map(({ value, label, desc, color }) => {
            const selected = profile.experienceLevel === value
            return (
              <button key={value} onClick={() => setProfile(p => ({ ...p, experienceLevel: value }))}
                style={{
                  padding: '14px 12px', borderRadius: 10, border: `1px solid ${selected ? color + '60' : 'var(--border2)'}`,
                  background: selected ? color + '12' : 'var(--bg2)',
                  color: selected ? color : 'var(--text2)',
                  fontFamily: 'var(--font)', cursor: 'pointer', textAlign: 'center',
                  transition: 'all 0.15s',
                }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 11, color: selected ? color + 'cc' : 'var(--text3)' }}>{desc}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Skills */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 4 }}>🛠️ Skills & Technologies</h3>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>Select all that apply — questions will reference these technologies</p>

        {/* Suggested */}
        {suggestedSkills.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Suggested for {profile.domain || 'your domain'}
            </div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {suggestedSkills.map(skill => {
                const selected = profile.skills.includes(skill)
                return (
                  <button key={skill} onClick={() => toggleSkill(skill)}
                    style={{
                      padding: '5px 12px', borderRadius: 20, border: `1px solid ${selected ? 'rgba(0,212,255,0.4)' : 'var(--border2)'}`,
                      background: selected ? 'rgba(0,212,255,0.1)' : 'var(--bg2)',
                      color: selected ? 'var(--accent)' : 'var(--text3)',
                      fontFamily: 'var(--font)', fontSize: 12, fontWeight: selected ? 700 : 400, cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}>
                    {selected ? '✓ ' : ''}{skill}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Custom skill input */}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text" placeholder="Add custom skill (e.g., Apache Flink)..."
            value={skillInput}
            onChange={e => setSkillInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCustomSkill()}
            style={{ flex: 1 }}
          />
          <button className="btn btn-outline" onClick={addCustomSkill} style={{ flexShrink: 0 }}>Add</button>
        </div>

        {/* Selected */}
        {profile.skills.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)', marginBottom: 6 }}>
              Selected ({profile.skills.length}):
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {profile.skills.map(s => (
                <span key={s} onClick={() => toggleSkill(s)}
                  style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                    background: 'rgba(0,255,136,0.1)', color: 'var(--green)', border: '1px solid rgba(0,255,136,0.2)' }}>
                  {s} ×
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Preferred coding language */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 4 }}>💬 Preferred Coding Language</h3>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>Used as default in the coding round</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {LANG_OPTIONS.map(lang => {
            const selected = profile.preferredLanguage === lang
            return (
              <button key={lang} onClick={() => setProfile(p => ({ ...p, preferredLanguage: lang }))}
                style={{
                  padding: '7px 16px', borderRadius: 20, border: `1px solid ${selected ? 'rgba(124,58,237,0.4)' : 'var(--border2)'}`,
                  background: selected ? 'rgba(124,58,237,0.1)' : 'var(--bg2)',
                  color: selected ? '#a78bfa' : 'var(--text3)',
                  fontFamily: 'var(--mono)', fontSize: 12, fontWeight: selected ? 700 : 400, cursor: 'pointer',
                  transition: 'all 0.15s',
                }}>
                {lang}
              </button>
            )
          })}
        </div>
      </div>

      {/* Target role */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 4 }}>🎯 Target Role (optional)</h3>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12 }}>e.g., "Backend Engineer at a product-based startup"</p>
        <input
          type="text" placeholder="e.g., Senior Backend Engineer at Google..."
          value={profile.targetRole || ''}
          onChange={e => setProfile(p => ({ ...p, targetRole: e.target.value }))}
        />
      </div>

      {/* Preview */}
      {profile.domain && profile.experienceLevel && (
        <div style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.15)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', marginBottom: 8 }}>🧠 AI Context Preview</div>
          <code style={{ fontSize: 12, color: 'var(--text2)', fontFamily: 'var(--mono)', lineHeight: 1.8 }}>
            Domain: {profile.domain} | Specialization: {profile.subDomain || 'Not set'} | Level: {profile.experienceLevel} | Skills: {profile.skills.join(', ') || 'None'} | Target: {profile.targetRole || 'Not set'}
          </code>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 8 }}>
            ↑ This context will be sent to AI when generating questions in Aptitude, Coding, and HR modules.
          </p>
        </div>
      )}

      <button className="btn btn-primary" onClick={save} disabled={saving || !profile.domain || !profile.experienceLevel}
        style={{ width: '100%', justifyContent: 'center', padding: 14, fontSize: 15 }}>
        {saved ? <><CheckCircle size={17} /> Saved!</> : saving ? 'Saving...' : <><Save size={17} /> Save Profile</>}
      </button>
    </div>
  )
}
