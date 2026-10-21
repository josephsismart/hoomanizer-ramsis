// Vercel serverless function: POST /api/humanize  { text, mode }
// Uses any OpenAI-compatible chat API. Set env vars in Vercel:
//   LLM_API_KEY   (required)  e.g. Groq key from console.groq.com (free tier)
//   LLM_BASE_URL  (optional)  default https://api.groq.com/openai/v1
//   LLM_MODEL     (optional)  default llama-3.3-70b-versatile

const SYSTEM = `You are a human editor rewriting a draft so it reads like a real person wrote it.
Your output must keep the same meaning, facts, names, numbers and roughly the same length (±15%).

Rewrite rules (these are the exact signals AI detectors measure):
1. BURSTINESS: mix sentence lengths hard. Some 4-7 word sentences. Some 25+ word sentences. Never three sentences of similar length in a row.
2. PERPLEXITY: prefer slightly unexpected but natural word choices over the most obvious word. Use concrete, specific wording. Avoid stock phrasing.
3. Kill AI vocabulary: delve, leverage, utilize, robust, seamless, comprehensive, crucial, pivotal, vital, foster, enhance, facilitate, landscape, realm, tapestry, testament, underscore, navigate, embark, journey, game-changer, cutting-edge, in today's world, it is important to note, in conclusion, furthermore, moreover, additionally, ultimately, overall.
4. No em dashes (—). No semicolons. No colons introducing lists. No bullet points. No "Not only X but also Y". No tricolons (lists of three for rhythm).
5. Use contractions naturally. Occasionally start a sentence with And, But, or So. Allow one short fragment per paragraph if it fits.
6. Vary paragraph openings; never start consecutive sentences with the same word.
7. Sound like one specific person with a point of view, not a style guide. Plain words over fancy ones.
8. Do not add new claims, opinions or examples that were not in the source. Do not address the reader. Do not add a title or commentary.

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

  const key = process.env.LLM_API_KEY;
  if (!key) return res.status(503).json({ error: "LLM_API_KEY not configured" });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  const text = (body && body.text || "").toString().trim();
  const mode = INTENSITY[body && body.mode] ? body.mode : "medium";
  if (!text) return res.status(400).json({ error: "text required" });
  if (text.split(/\s+/).length > 1200) return res.status(413).json({ error: "max 1200 words" });

  const base = (process.env.LLM_BASE_URL || "https://api.groq.com/openai/v1").replace(/\/$/, "");
  const model = process.env.LLM_MODEL || "llama-3.3-70b-versatile";

  try {
    const r = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        temperature: 1.0,
        top_p: 0.95,
        frequency_penalty: 0.4,
        presence_penalty: 0.3,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: `${INTENSITY[mode]}\n\nDraft:\n"""\n${text}\n"""` },
        ],
      }),
    });
    const data = await r.json();
    if (!r.ok) return res.status(502).json({ error: data.error?.message || "upstream error" });
    let out = (data.choices?.[0]?.message?.content || "").trim();
    out = out.replace(/^"""|"""$/g, "").replace(/\s*—\s*/g, ", ").trim();
    return res.status(200).json({ text: out, model });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
