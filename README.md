# Hoomanizer (React + Vite)

Static AI-text humanizer with two engines:

- **Light / Medium / Strong** — rule-based, runs 100% in the browser, no backend. Removes AI tells (stock phrases, transition words, uniform sentences). Good for readability; will NOT reliably pass GPTZero/Turnitin on its own.
- **Deep ✦** — calls `/api/humanize`, a Vercel serverless function that rewrites with an LLM using a detector-aware prompt (burstiness, perplexity, banned AI vocabulary). This is the mode that gets you near 0% AI on detectors.

## Deploy to Vercel
1. Push this folder to GitHub, import at vercel.com/new (framework **Vite** (auto-detected)), or run `npx vercel --prod` here.
2. For Deep mode, add Environment Variables in the Vercel project:
   - `LLM_API_KEY` — e.g. a free key from https://console.groq.com
   - `LLM_BASE_URL` — optional, default `https://api.groq.com/openai/v1` (any OpenAI-compatible API works: OpenAI, Together, DeepSeek, OpenRouter…)
   - `LLM_MODEL` — optional, default `llama-3.3-70b-versatile`
3. Redeploy. Without the key, Deep mode falls back to Strong rules automatically.

## Verify
Paste output into GPTZero / Pangram / Copyleaks free checkers. If it still scores AI, hit **Re-roll** (output is non-deterministic) or try a bigger model via `LLM_MODEL`.

## Google login, limits and admin panel (Firebase)
- Admin (`josephsismart@gmail.com`): unlimited words + `/admin` panel (users + activity log).
- Everyone else: 500 words per run. Enforced in the UI and in `/api/humanize`.
- Every run is logged to Firestore `events` (who, mode, word count, 120-char preview, time).

### Setup (once)
1. console.firebase.google.com → Add project → name it `hoomanizer`.
2. Build → **Authentication** → Get started → Sign-in method → enable **Google**.
   Then Authentication → Settings → **Authorized domains** → add `hoomanizer-ramsis.vercel.app`.
3. Build → **Firestore Database** → Create (production mode, any region).
   Rules tab → paste the contents of `firestore.rules` → Publish.
4. Project settings (gear) → General → Your apps → **Web app** (</>) → register → copy the config.
5. Vercel → project → Settings → Environment Variables → add (see `.env.example`):
   `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`, `FIREBASE_PROJECT_ID`.
6. Deployments → Redeploy.

Without these variables the app still works, just with no login (everyone gets 500 words) and no logging.

## AI detection + plagiarism
- **AI detection** runs in the browser (`src/detector.js`): 10 statistical signals modelled on what GPTZero/Pangram measure (burstiness, AI lexicon, stock transitions, contractions, tricolons, paragraph shape…). Calibrated: typical ChatGPT paragraphs score 80–96, real human writing 3–10.
- **Second opinion ✦** calls `/api/detect`, which asks the LLM for an independent 0–100 score (needs `LLM_API_KEY`).
- **Deep ✦ mode** now does two passes (rewrite → human line-edit) and auto re-rolls up to 3× until the local detector says ≤ 20% AI.
- **Plagiarism (web)** calls `/api/plagiarism`: searches Google for exact 12-word phrases from the 8 longest sentences and reports matches with links. Needs:
  - `GOOGLE_CSE_KEY` — API key from console.cloud.google.com (enable "Custom Search API"; free 100 queries/day)
  - `GOOGLE_CSE_ID` — from programmablesearchengine.google.com → create engine → turn on "Search the entire web" → copy the engine ID
