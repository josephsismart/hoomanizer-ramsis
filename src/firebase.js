import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import { getFirestore, collection, addDoc, doc, setDoc, serverTimestamp, query, orderBy, limit, onSnapshot, increment } from 'firebase/firestore'

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}
export const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || 'josephsismart@gmail.com').toLowerCase()
export const enabled = Boolean(cfg.apiKey && cfg.projectId)

let auth = null, db = null
if (enabled) {
  const app = initializeApp(cfg)
  auth = getAuth(app)
  db = getFirestore(app)
}

export const isAdmin = (user) => !!user && (user.email || '').toLowerCase() === ADMIN_EMAIL

export function watchAuth(cb) {
  if (!auth) { cb(null); return () => {} }
  return onAuthStateChanged(auth, cb)
}
export async function login() {
  if (!auth) return
  const res = await signInWithPopup(auth, new GoogleAuthProvider())
  const u = res.user
  await setDoc(doc(db, 'users', u.uid), {
    email: u.email, name: u.displayName || '', photo: u.photoURL || '',
    lastSeen: serverTimestamp(), logins: increment(1),
  }, { merge: true })
}
export const logout = () => auth && signOut(auth)
export const idToken = async () => (auth?.currentUser ? auth.currentUser.getIdToken() : null)

// guest id persists per browser so you can see repeat visitors
function guestId() {
  try {
    let g = localStorage.getItem('guestId')
    if (!g) { g = 'guest-' + Math.random().toString(36).slice(2, 10); localStorage.setItem('guestId', g) }
    return g
  } catch { return 'guest' }
}

export async function logEvent(user, { mode, words, preview, outWords }) {
  if (!db) return
  try {
    await addDoc(collection(db, 'events'), {
      uid: user?.uid || null,
      who: user?.email || guestId(),
      mode, words, outWords: outWords ?? null,
      preview: (preview || '').slice(0, 120),
      ua: navigator.userAgent.slice(0, 120),
      ts: serverTimestamp(),
    })
  } catch (e) { console.warn('log failed', e.message) }
}

export function watchEvents(cb, n = 200) {
  if (!db) return () => {}
  return onSnapshot(query(collection(db, 'events'), orderBy('ts', 'desc'), limit(n)), s => cb(s.docs.map(d => ({ id: d.id, ...d.data() }))))
}
export function watchUsers(cb) {
  if (!db) return () => {}
  return onSnapshot(query(collection(db, 'users'), orderBy('lastSeen', 'desc')), s => cb(s.docs.map(d => ({ id: d.id, ...d.data() }))))
}
