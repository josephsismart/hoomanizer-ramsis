import { useMemo, useState } from 'react'
import { detect, verdict } from './detector.js'

export default function Detector({ text, label }) {
  const d = useMemo(() => detect(text), [text])
  const [open, setOpen] = useState(false)
  const [llm, setLlm] = useState(null)
  const [busy, setBusy] = useState(false)
  const s = d.score
  const color = s == null ? 'var(--muted)' : s >= 70 ? 'var(--bad)' : s >= 40 ? 'var(--warn)' : 'var(--ok)'

  async function secondOpinion() {
    setBusy(true); setLlm(null)
    try {
      const r = await fetch('/api/detect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) })
      const j = await r.json(); if (!r.ok) throw new Error(j.error || 'error')
      setLlm(j)
    } catch (e) { setLlm({ error: e.message }) }
    setBusy(false)
  }

  return (
    <section className="card det">
      <h2>{label} — AI detection <span style={{ color }}>{s == null ? d.note : `${s}% AI · ${verdict(s)}`}</span></h2>
      <div className="meter"><div style={{ width: `${s ?? 0}%`, background: color }} /></div>
      <div className="bar">
        <button className="btn ghost" onClick={() => setOpen(o => !o)} disabled={s == null}>{open ? 'Hide signals' : 'Why?'}</button>
        <div>
          {llm && !llm.error && <span className="meta">Model says {llm.score}% AI{llm.reasons?.[0] ? ` — ${llm.reasons[0]}` : ''}</span>}
          {llm?.error && <span className="meta">Second opinion unavailable ({llm.error})</span>}
          {' '}<button className="btn ghost" onClick={secondOpinion} disabled={busy || s == null}>{busy ? 'Checking…' : 'Second opinion ✦'}</button>
        </div>
      </div>
      {open && (
        <ul className="signals">
          {d.signals.map(x => (
            <li key={x.name}><span className="sigbar"><i style={{ width: `${Math.round(x.value * 100)}%` }} /></span><b>{x.name}</b> <span className="meta">{x.detail}</span></li>
          ))}
        </ul>
      )}
    </section>
  )
}
