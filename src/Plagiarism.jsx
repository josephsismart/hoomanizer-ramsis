import { useState } from 'react'

export default function Plagiarism({ text }) {
  const [res, setRes] = useState(null)
  const [busy, setBusy] = useState(false)

  async function check() {
    setBusy(true); setRes(null)
    try {
      const r = await fetch('/api/plagiarism', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) })
      const j = await r.json(); if (!r.ok) throw new Error(j.error || 'error')
      setRes(j)
    } catch (e) { setRes({ error: e.message }) }
    setBusy(false)
  }
  const p = res?.percent
  const color = p == null ? 'var(--muted)' : p >= 40 ? 'var(--bad)' : p >= 15 ? 'var(--warn)' : 'var(--ok)'

  return (
    <section className="card det">
      <h2>Plagiarism (web) <span style={{ color }}>{res && !res.error ? `${p}% matched · ${res.matched}/${res.checked} sentences found online` : ''}</span></h2>
      <div className="bar">
        <span className="meta">Searches the web for exact phrases from the longest sentences. Quotes and common phrases can match legitimately.</span>
        <button className="btn" onClick={check} disabled={busy || !text || text.split(/\s+/).length < 8}>{busy ? 'Searching…' : 'Check plagiarism'}</button>
      </div>
      {res?.error && <p className="meta">Unavailable: {res.error}</p>}
      {res && !res.error && res.results.length === 0 && <p className="meta">No matches found for the {res.checked} sentences checked.</p>}
      {res?.results?.length > 0 && (
        <ul className="matches">
          {res.results.map((m, i) => (
            <li key={i}>
              <div className="q">“{m.sentence}”</div>
              <a href={m.url} target="_blank" rel="noreferrer">{m.title || m.url}</a>
              <div className="meta">{m.snippet}</div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
