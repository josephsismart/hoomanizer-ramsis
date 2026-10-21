import { useEffect, useState } from 'react'
import { watchEvents, watchUsers } from './firebase.js'

const fmt = ts => ts?.toDate ? ts.toDate().toLocaleString() : '…'

export default function Admin({ user, onBack }) {
  const [events, setEvents] = useState([])
  const [users, setUsers] = useState([])
  useEffect(() => { const a = watchEvents(setEvents); const b = watchUsers(setUsers); return () => { a(); b() } }, [])

  const today = new Date().toDateString()
  const todayEv = events.filter(e => e.ts?.toDate && e.ts.toDate().toDateString() === today)
  const uniq = new Set(events.map(e => e.who)).size

  return (
    <main className="admin">
      <div className="controls">
        <h2 style={{ margin: 0 }}>Admin — {user.email}</h2>
        <button className="btn ghost" onClick={onBack}>← Back to app</button>
      </div>
      <div className="stats">
        <div className="card stat"><b>{todayEv.length}</b><span>runs today</span></div>
        <div className="card stat"><b>{events.length}</b><span>recent runs</span></div>
        <div className="card stat"><b>{uniq}</b><span>distinct visitors</span></div>
        <div className="card stat"><b>{users.length}</b><span>signed-in users</span></div>
      </div>

      <section className="card tbl">
        <h2>Signed-in users</h2>
        <table>
          <thead><tr><th>Email</th><th>Name</th><th>Logins</th><th>Last seen</th></tr></thead>
          <tbody>{users.map(u => <tr key={u.id}><td>{u.email}</td><td>{u.name}</td><td>{u.logins}</td><td>{fmt(u.lastSeen)}</td></tr>)}</tbody>
        </table>
      </section>

      <section className="card tbl">
        <h2>Activity (latest 200)</h2>
        <table>
          <thead><tr><th>Time</th><th>Who</th><th>Mode</th><th>Words</th><th>Preview</th></tr></thead>
          <tbody>{events.map(e => (
            <tr key={e.id}><td>{fmt(e.ts)}</td><td>{e.who}</td><td>{e.mode}</td><td>{e.words}{e.outWords != null ? ` → ${e.outWords}` : ''}</td><td className="prev">{e.preview}</td></tr>
          ))}</tbody>
        </table>
      </section>
    </main>
  )
}
