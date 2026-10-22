import { useEffect, useMemo, useState } from 'react'
import { humanize, words } from './humanizer.js'
import { enabled as authEnabled, watchAuth, login, logout, isAdmin, idToken, logEvent } from './firebase.js'
import Admin from './Admin.jsx'
import Detector from './Detector.jsx'
import Plagiarism from './Plagiarism.jsx'
import { detect } from './detector.js'

const MODES = [
  { id: 'light', label: 'Light' },
  { id: 'medium', label: 'Medium' },
  { id: 'strong', label: 'Strong' },
  { id: 'deep', label: 'Deep ✦', title: 'Server LLM rewrite (needs LLM_API_KEY on Vercel)' },
]
const GUEST_LIMIT = 500

export default function App() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState('light')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [user, setUser] = useState(null)
  const [view, setView] = useState(() => (location.pathname === '/admin' ? 'admin' : 'app'))
  useEffect(() => watchAuth(setUser), [])
  const admin = isAdmin(user)
  const LIMIT = admin ? Infinity : GUEST_LIMIT

  const nIn = useMemo(() => words(input), [input])
  const over = nIn > LIMIT

  async function run() {
    if (!input.trim() || over) return
    const ev = { mode, words: nIn, preview: input }
    if (mode === 'deep') {
      setBusy(true); setOutput(''); setNote('Rewriting with the model…')
      let text
      try {
        const token = await idToken()
        let best = null
        for (let attempt = 1; attempt <= 3; attempt++) {
          setNote(`Rewriting with the model… (pass ${attempt})`)
          const r = await fetch('/api/humanize', {
            method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify({ text: input, mode: 'strong' }),
          })
          const d = await r.json()
          if (!r.ok) throw new Error(d.error || 'API error')
          const cand = humanize(d.text, 'light').text
          const sc = detect(cand).score ?? 100
          if (!best || sc < best.sc) best = { text: cand, sc, model: d.model }
          setOutput(best.text)
          if (sc <= 20) break
        }
        text = best.text
        setOutput(text); setNote(`Deep rewrite (${best.model}) — ${best.sc}% AI`)
      } catch (e) {
        const r = humanize(input, 'strong'); text = r.text
        setOutput(text); setNote(`Deep mode unavailable (${e.message}). Used Strong rules — ${r.changes} edits.`)
      }
      setBusy(false); logEvent(user, { ...ev, outWords: words(text) }); return
    }
    const { text, changes } = humanize(input, mode)
    setOutput(text); setNote(`${changes} edits made`)
    logEvent(user, { ...ev, outWords: words(text) })
  }

  function clear() { setInput(''); setOutput(''); setNote('') }
  async function copy() {
    if (!output) return
    await navigator.clipboard.writeText(output)
    setCopied(true); setTimeout(() => setCopied(false), 1200)
  }

  if (view === 'admin') {
    if (!admin) return <main><p style={{ textAlign: 'center', marginTop: 60 }}>Admin only. {authEnabled && <button className="btn" onClick={login}>Sign in with Google</button>}</p></main>
    return <Admin user={user} onBack={() => { history.pushState({}, '', '/'); setView('app') }} />
  }

  return (
    <>
      <header>
        <h1>Hoomanizer</h1>
        <p>Paste AI-generated text, get a more natural rewrite.</p>
        {authEnabled && (
          <div className="auth">
            {user ? (
              <>
                {user.photoURL && <img src={user.photoURL} alt="" referrerPolicy="no-referrer" />}
                <span>{user.email}</span>
                {admin && <span className="badge">ADMIN · unlimited</span>}
                {admin && <button className="btn ghost" onClick={() => { history.pushState({}, '', '/admin'); setView('admin') }}>Admin panel</button>}
                <button className="btn ghost" onClick={logout}>Sign out</button>
              </>
            ) : (
              <>
                <span>Guests: {GUEST_LIMIT} words per run.</span>
                <button className="btn ghost" onClick={login}>Sign in with Google</button>
              </>
            )}
          </div>
        )}
      </header>
      <main>
        <div className="controls">
          <div className="seg">
            {MODES.map(m => (
              <button key={m.id} title={m.title} className={mode === m.id ? 'on' : ''} onClick={() => setMode(m.id)}>{m.label}</button>
            ))}
          </div>
          <div className="score">Target: output under 20% AI. Deep ✦ auto re-rolls until it gets there.</div>
        </div>

        <div className="grid">
          <section className="card">
            <h2>AI text <span style={{ color: over ? 'var(--bad)' : undefined }}>{nIn}{admin ? ' words' : ` / ${GUEST_LIMIT} words`}</span></h2>
            <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Paste your text here…" />
            <div className="bar">
              <span className="meta">{admin ? 'Unlimited words.' : `Limit ${GUEST_LIMIT} words per run.`}</span>
              <div>
                <button className="btn ghost" onClick={clear}>Clear</button>
                <button className="btn" onClick={run} disabled={busy || over || nIn === 0}>{busy ? 'Working…' : 'Humanize'}</button>
              </div>
            </div>
          </section>
          <section className="card">
            <h2>Humanized <span>{words(output)} words</span></h2>
            <div className="out" contentEditable suppressContentEditableWarning spellCheck onInput={e => setOutput(e.currentTarget.textContent)}>{output}</div>
            <div className="bar">
              <span className="meta">{note}</span>
              <div>
                <button className="btn ghost" onClick={run} disabled={busy || nIn === 0}>Re-roll</button>
                <button className="btn" onClick={copy}>{copied ? 'Copied!' : 'Copy'}</button>
              </div>
            </div>
          </section>
        </div>

        <div className="tools">
          <Detector text={input} label="Input" />
          <Detector text={output} label="Output" />
        </div>
        <Plagiarism text={output || input} />

        <div className="how">
          <div><b>1. Paste</b>Drop in text from ChatGPT, Claude, Gemini or any AI tool.</div>
          <div><b>2. Humanize</b>Stiff phrases get simplified, sentence lengths get varied, contractions added, filler transitions cut. Deep ✦ uses a language model for a full rewrite.</div>
          <div><b>3. Review</b>Edit the output directly in the right panel, then copy it.</div>
        </div>
      </main>
      <footer>It improves readability; it does not guarantee any detector result. Follow your school's or employer's AI-use rules.</footer>
    </>
  )
}
