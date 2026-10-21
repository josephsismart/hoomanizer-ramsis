import { useMemo, useState } from 'react'
import { humanize, aiScore, words } from './humanizer.js'

const MODES = [
  { id: 'light', label: 'Light' },
  { id: 'medium', label: 'Medium' },
  { id: 'strong', label: 'Strong' },
  { id: 'deep', label: 'Deep ✦', title: 'Server LLM rewrite (needs LLM_API_KEY on Vercel)' },
]
const LIMIT = 500

function Pill({ value }) {
  const cls = value == null ? '' : value >= 60 ? 'bad' : value >= 35 ? 'warn' : 'ok'
  return <span className={`pill ${cls}`}>{value == null ? '–' : `${value}%`}</span>
}

export default function App() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState('light')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  const nIn = useMemo(() => words(input), [input])
  const scoreIn = useMemo(() => aiScore(input), [input])
  const scoreOut = useMemo(() => aiScore(output), [output])
  const over = nIn > LIMIT

  async function run() {
    if (!input.trim() || over) return
    if (mode === 'deep') {
      setBusy(true); setOutput(''); setNote('Rewriting with the model…')
      try {
        const r = await fetch('/api/humanize', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: input, mode: 'strong' }),
        })
        const d = await r.json()
        if (!r.ok) throw new Error(d.error || 'API error')
        const { text } = humanize(d.text, 'light')
        setOutput(text); setNote(`Deep rewrite (${d.model})`)
      } catch (e) {
        const { text, changes } = humanize(input, 'strong')
        setOutput(text); setNote(`Deep mode unavailable (${e.message}). Used Strong rules — ${changes} edits.`)
      }
      setBusy(false); return
    }
    const { text, changes } = humanize(input, mode)
    setOutput(text); setNote(`${changes} edits made`)
  }

  function clear() { setInput(''); setOutput(''); setNote('') }
  async function copy() {
    if (!output) return
    await navigator.clipboard.writeText(output)
    setCopied(true); setTimeout(() => setCopied(false), 1200)
  }

  return (
    <>
      <header>
        <h1>Hoomanizer</h1>
        <p>Paste AI-generated text, get a more natural rewrite.</p>
      </header>
      <main>
        <div className="controls">
          <div className="seg">
            {MODES.map(m => (
              <button key={m.id} title={m.title} className={mode === m.id ? 'on' : ''} onClick={() => setMode(m.id)}>{m.label}</button>
            ))}
          </div>
          <div className="score">Input AI-pattern score: <Pill value={scoreIn} /> → Output: <Pill value={scoreOut} /></div>
        </div>

        <div className="grid">
          <section className="card">
            <h2>AI text <span style={{ color: over ? 'var(--bad)' : undefined }}>{nIn} / {LIMIT} words</span></h2>
            <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Paste your text here…" />
            <div className="bar">
              <span className="meta">Limit {LIMIT} words per run.</span>
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
