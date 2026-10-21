# Simple AI Humanizer

Static AI-text humanizer with two engines:

- **Light / Medium / Strong** — rule-based, runs 100% in the browser, no backend. Removes AI tells (stock phrases, transition words, uniform sentences). Good for readability; will NOT reliably pass GPTZero/Turnitin on its own.
- **Deep ✦** — calls `/api/humanize`, a Vercel serverless function that rewrites with an LLM using a detector-aware prompt (burstiness, perplexity, banned AI vocabulary). This is the mode that gets you near 0% AI on detectors.

## Deploy to Vercel
1. Push this folder to GitHub, import at vercel.com/new (framework **Other**, no build step), or run `npx vercel --prod` here.
2. For Deep mode, add Environment Variables in the Vercel project:
   - `LLM_API_KEY` — e.g. a free key from https://console.groq.com
   - `LLM_BASE_URL` — optional, default `https://api.groq.com/openai/v1` (any OpenAI-compatible API works: OpenAI, Together, DeepSeek, OpenRouter…)
   - `LLM_MODEL` — optional, default `llama-3.3-70b-versatile`
3. Redeploy. Without the key, Deep mode falls back to Strong rules automatically.

## Verify
Paste output into GPTZero / Pangram / Copyleaks free checkers. If it still scores AI, hit **Re-roll** (output is non-deterministic) or try a bigger model via `LLM_MODEL`.
