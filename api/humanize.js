// Vercel serverless function: POST /api/humanize  { text, mode }
// Uses any OpenAI-compatible chat API. Set env vars in Vercel:
//   LLM_API_KEY   (required)  e.g. Groq key from console.groq.com (free tier)
//   LLM_BASE_URL  (optional)  default https://api.groq.com/openai/v1
//   LLM_MODEL     (optional)  default llama-3.3-70b-versatile

const EDITOR = `You are a line editor doing a final human pass on a rewrite. Keep meaning, facts, names and numbers exactly.
Do these edits and nothing else:
- Make sentence lengths uneven. Where two medium sentences sit together, make one short (3-8 words) and one long (25+).
- Allow one sentence fragment per paragraph if natural. One rhetorical question is allowed in the whole text.
- Never invent facts, examples or actions. Only details already in the source may appear.
- Vary paragraph length: at least one paragraph should be a single sentence if there are 3+ paragraphs.
- Remove every em dash (—), semicolon, and "not only... but also". Remove lists of three used for rhythm.
- No sentence may start with However, Furthermore, Moreover, Additionally, Overall, Ultimately, In conclusion.
- Keep contractions. Plain words. Sound like one person talking, not a brochure.
Output ONLY the edited text.`;

const SYSTEM = `You are a human editor rewriting a draft so it reads like a real person wrote it AND so the wording is original (not matching the source).
HARD RULE: keep exactly the same facts, claims, names, numbers and examples. Do NOT add any new example, detail, action, opinion or claim that is not in the source. If the source is general, stay general. Same paragraph order, roughly the same length (±15%).
Originality: change the structure of every sentence and replace the wording. No run of 4+ consecutive words may be copied from the source except names, titles, numbers and technical terms.

Rewrite rules (these are the exact signals AI detectors measure):
1. BURSTINESS: mix sentence lengths hard. Include at least one sentence of 3-7 words and at least one of 25+ words in every paragraph. Never three sentences of similar length in a row.
2. PERPLEXITY: prefer slightly unexpected but natural word choices over the most obvious word. Use concrete, specific wording. Avoid stock phrasing.
3. Kill AI vocabulary: delve, leverage, utilize, robust, seamless, comprehensive, crucial, pivotal, vital, foster, enhance, facilitate, landscape, realm, tapestry, testament, underscore, navigate, embark, journey, game-changer, cutting-edge, in today's world, it is important to note, in conclusion, furthermore, moreover, additionally, ultimately, overall.
4. No em dashes (—). No semicolons. No colons introducing lists. No bullet points. No "Not only X but also Y". No tricolons (lists of three for rhythm).
5. Use contractions naturally. Occasionally start a sentence with And, But, or So. Allow one short fragment per paragraph if it fits.
6. Vary paragraph openings; never start consecutive sentences with the same word.
7. Sound like one specific person with a point of view, not a style guide. Plain words over fancy ones.
8. Do not add new claims, opinions or examples that were not in the source. Do not address the reader. Do not add a title or commentary.

Example of the target style (notice the short sentences, the contractions, the uneven rhythm):
SOURCE: "Effective time management is essential for students. It allows them to balance academic responsibilities with personal activities, reducing stress and improving overall performance. Furthermore, developing these skills early prepares them for future professional environments."
REWRITE: "Students need to manage their time. When they do, schoolwork and the rest of life stop fighting each other, stress drops, and performance tends to go up with it. And the habit pays off later, because it's what professional environments expect."
(Every sentence in the rewrite maps to a sentence in the source. Nothing was added. Do the same: no extra sentences, no "it works", no "experts say", no new examples.)

Output ONLY the rewritten text.`;

import admin from "firebase-admin";
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "josephsismart@gmail.com").toLowerCase();
const GUEST_LIMIT = 500;
function fb() {
  if (!process.env.FIREBASE_PROJECT_ID) return null;
  if (!admin.apps.length) admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID });
  return admin;
}
async function emailFromReq(req) {
  const h = req.headers.authorization || "";
  const t = h.startsWith("Bearer ") ? h.slice(7) : null;
  const a = fb(); if (!t || !a) return null;
  try { const d = await a.auth().verifyIdToken(t); return (d.email || "").toLowerCase(); } catch { return null; }
}

// Provider chain: tried in order, next one on error/rate-limit. All free tiers.
//   GEMINI_API_KEY      aistudio.google.com  (free: ~15 req/min, 1500/day)
//   OPENROUTER_API_KEY  openrouter.ai        (free models, ~50-200 req/day)
//   LLM_API_KEY (+LLM_BASE_URL, LLM_MODEL)   any OpenAI-compatible (Groq, OpenAI, Cerebras...)
//   Pollinations (no key)                    1 request / 30s per IP, always available
function providers() {
  const list = [];
  if (process.env.GEMINI_API_KEY) list.push({ name: "gemini", url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", key: process.env.GEMINI_API_KEY, model: process.env.GEMINI_MODEL || "gemini-2.0-flash" });
  if (process.env.OPENROUTER_API_KEY) list.push({ name: "openrouter", url: "https://openrouter.ai/api/v1/chat/completions", key: process.env.OPENROUTER_API_KEY, model: process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free" });
  if (process.env.LLM_API_KEY) list.push({ name: "custom", url: (process.env.LLM_BASE_URL || "https://api.groq.com/openai/v1").replace(/\/$/, "") + "/chat/completions", key: process.env.LLM_API_KEY, model: process.env.LLM_MODEL || "llama-3.3-70b-versatile" });
  list.push({ name: "pollinations", url: "https://text.pollinations.ai/openai", key: null, model: "openai", free: true });
  return list;
}
export const hasFastProvider = () => providers().some(p => !p.free);

export async function chat(messages, opts = {}) {
  let lastErr;
  for (const p of providers()) {
    try {
      const headers = { "Content-Type": "application/json" };
      if (p.key) headers.Authorization = `Bearer ${p.key}`;
      if (p.name === "openrouter") headers["HTTP-Referer"] = "https://hoomanizer-ramsis.vercel.app";
      const body = { model: p.model, messages, temperature: opts.temperature ?? 1.0, top_p: 0.95 };
      if (p.free) { body.reasoning_effort = process.env.FREE_REASONING || "medium"; body.max_tokens = 4000; body.seed = Math.floor(Math.random() * 1e9); }
      else if (p.name !== "gemini") { body.frequency_penalty = opts.frequency_penalty ?? 0.4; body.presence_penalty = 0.3; }
      if (opts.json) body.response_format = { type: "json_object" };
      const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), opts.timeoutMs ?? 50000);
      const r = await fetch(p.url, { method: "POST", headers, body: JSON.stringify(body), signal: ctl.signal }).finally(() => clearTimeout(t));
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error?.message || d.error || `${p.name} error ${r.status}`);
      const out = (d.choices?.[0]?.message?.content || "").trim().replace(/^"""|"""$/g, "").trim();
      if (!out) throw new Error(`${p.name}: empty response`);
      return { text: out, model: `${p.model} via ${p.name}`, free: !!p.free };
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error("no LLM provider available");
}

const PARAPHRASE = `You are rewriting text so it is original (does not match the source wording) AND reads like a real person wrote it.
HARD RULE: keep exactly the same facts, claims, names and numbers. Do NOT add any example, detail, place, action or opinion that is not in the source. If the source says "infrastructure", do not list roads or rail. Same paragraph order, roughly the same length (±15%).
Originality: restructure EVERY sentence (reorder clauses, split or merge, change the starting point) and replace the wording. No run of 4+ consecutive words may be copied from the source except names, titles, numbers and technical terms.
Human style (detectors measure this):
- Sentence lengths must be uneven: in every paragraph include at least one sentence of 3-7 words and one of 25+ words. Never three similar-length sentences in a row.
- Use contractions (it's, don't, that's). Plain everyday words over formal ones.
- Banned: delve, leverage, utilize, robust, seamless, comprehensive, crucial, pivotal, vital, foster, enhance, facilitate, landscape, realm, tapestry, testament, underscore, navigate, embark, meanwhile, moreover, furthermore, additionally, however, ultimately, overall, in conclusion, remarkable, significant, stubborn, arena, agenda.
- No em dashes, no semicolons, no lists of three for rhythm, no "not only... but also". You may start a sentence with And, But or So.
- Sound like one person explaining it, not a report.

Example of the target style (notice the short sentences, the contractions, the uneven rhythm):
SOURCE: "Effective time management is essential for students. It allows them to balance academic responsibilities with personal activities, reducing stress and improving overall performance. Furthermore, developing these skills early prepares them for future professional environments."
REWRITE: "Students need to manage their time. When they do, schoolwork and the rest of life stop fighting each other, stress drops, and performance tends to go up with it. And the habit pays off later, because it's what professional environments expect."
(Every sentence in the rewrite maps to a sentence in the source. Nothing was added. Do the same: no extra sentences, no "it works", no "experts say", no new examples.)
Output ONLY the rewritten text.`;

const INTENSITY = {
  light:  "Make light edits. Keep most sentences, fix the obvious AI tells.",
  medium: "Rewrite moderately. Restructure about half the sentences.",
  strong: "Rewrite thoroughly. Every sentence should be restructured, while meaning stays identical.",
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  const text = (body && body.text || "").toString().trim();
  const mode = INTENSITY[body && body.mode] ? body.mode : "medium";
  const task = body?.task === "paraphrase" ? "paraphrase" : "humanize";
  if (!text) return res.status(400).json({ error: "text required" });
  const email = await emailFromReq(req);
  const isAdmin = email === ADMIN_EMAIL;
  const n = text.split(/\s+/).length;
  if (!isAdmin && n > GUEST_LIMIT) return res.status(413).json({ error: `max ${GUEST_LIMIT} words for guests` });
  if (n > 5000) return res.status(413).json({ error: "max 5000 words" });

  try {
    const sys = task === "paraphrase" ? PARAPHRASE : SYSTEM;
    const user = task === "paraphrase" ? `Rewrite this so it is original and does not match the source:\n"""\n${text}\n"""` : `${INTENSITY[mode]}\n\nDraft:\n"""\n${text}\n"""`;
    let { text: out, model, free } = await chat([{ role: "system", content: sys }, { role: "user", content: user }], { temperature: 1.1 });
    // pass 2 only on fast paid providers (free model is too slow for two passes inside Vercel's limit)
    if (hasFastProvider()) try {
      const r2 = await chat([{ role: "system", content: EDITOR }, { role: "user", content: `Source (for facts):\n"""\n${text}\n"""\n\nRewrite to edit:\n"""\n${out}\n"""` }], { temperature: 0.9, frequency_penalty: 0.5 });
      if (r2.text.split(/\s+/).length > out.split(/\s+/).length * 0.6) out = r2.text;
    } catch { /* keep pass-1 */ }
    out = out.replace(/\s*—\s*/g, ", ").replace(/;\s*/g, ". ").trim();
    return res.status(200).json({ text: out, model, free, task });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
