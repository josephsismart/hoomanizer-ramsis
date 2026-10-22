// POST /api/plagiarism { text }  → { checked, matched, percent, results:[{sentence, url, title, snippet}] }
// Uses Google Programmable Search JSON API (free: 100 queries/day).
// Env: GOOGLE_CSE_KEY (API key), GOOGLE_CSE_ID (search engine id, set to "search the entire web")
const MAX_QUERIES = 8;

const sentences = t => (t.match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g) || []).map(s => s.trim()).filter(s => s.split(/\s+/).length >= 8);

function phraseOf(s) {
  // 10-14 consecutive words from the middle of the sentence, no quotes/odd chars
  const w = s.replace(/["“”(){}\[\]]/g, '').split(/\s+/);
  const n = Math.min(12, w.length);
  const start = Math.max(0, Math.floor((w.length - n) / 2));
  return w.slice(start, start + n).join(' ');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const key = process.env.GOOGLE_CSE_KEY, cx = process.env.GOOGLE_CSE_ID;
  if (!key || !cx) return res.status(503).json({ error: 'Plagiarism check not configured (GOOGLE_CSE_KEY / GOOGLE_CSE_ID)' });

  let body = req.body; if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const text = (body?.text || '').toString().trim();
  if (!text) return res.status(400).json({ error: 'text required' });

  const ss = sentences(text);
  // pick the longest sentences spread across the text
  const picked = ss.map((s, i) => ({ s, i, n: s.split(/\s+/).length }))
    .sort((a, b) => b.n - a.n).slice(0, MAX_QUERIES).sort((a, b) => a.i - b.i);

  const results = [];
  await Promise.all(picked.map(async ({ s }) => {
    const q = `"${phraseOf(s)}"`;
    const url = `https://www.googleapis.com/customsearch/v1?key=${key}&cx=${cx}&num=3&q=${encodeURIComponent(q)}`;
    try {
      const r = await fetch(url); const d = await r.json();
      const item = d.items?.[0];
      if (item) results.push({ sentence: s, url: item.link, title: item.title, snippet: item.snippet, total: Number(d.searchInformation?.totalResults || 0) });
    } catch { /* skip */ }
  }));

  const checked = picked.length;
  const matched = results.length;
  const percent = checked ? Math.round(matched / checked * 100) : 0;
  res.status(200).json({ checked, matched, percent, totalSentences: ss.length, results: results.sort((a, b) => text.indexOf(a.sentence) - text.indexOf(b.sentence)) });
}
