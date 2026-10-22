// Statistical AI-text detector (runs in browser). Returns 0-100 = probability-ish that text is AI.
// Signals mirror what GPTZero/Pangram-style detectors measure: low burstiness, AI lexicon,
// uniform sentence/paragraph shape, few contractions, stock transitions, tricolons.

export const AI_LEXICON = {
  // weight = how strongly the term is over-represented in LLM output
  delve: 3, delves: 3, delving: 3, tapestry: 3, testament: 2.5, underscore: 2, underscores: 2, pivotal: 2,
  realm: 2, foster: 1.5, fosters: 1.5, fostering: 1.5, intricate: 2, intricacies: 2, showcase: 1.5, showcases: 1.5,
  meticulous: 2, meticulously: 2, comprehensive: 1.5, vibrant: 1.5, navigate: 1.5, navigating: 1.5, embark: 2,
  leverage: 2, leveraging: 2, robust: 1.5, seamless: 2, seamlessly: 2, ensure: 1, ensures: 1, ensuring: 1,
  enhance: 1.5, enhances: 1.5, enhancing: 1.5, facilitate: 1.5, facilitates: 1.5, furthermore: 2, moreover: 2,
  additionally: 2, notably: 1.5, ultimately: 1.5, overall: 1, crucial: 1.5, essential: 1, vital: 1, paramount: 2,
  landscape: 1.5, multifaceted: 2.5, holistic: 2, synergy: 2.5, paradigm: 2, "game-changer": 2.5, unlock: 1.5,
  elevate: 1.5, captivating: 2, compelling: 1.5, nuanced: 1.5, transformative: 2, groundbreaking: 2,
  "cutting-edge": 2, innovative: 1.5, streamline: 1.5, empower: 1.5, empowers: 1.5, harness: 1.5,
  utilize: 1.5, utilizing: 1.5, utilization: 2, implement: 1, implementing: 1, significant: 0.8, significantly: 1,
  various: 0.8, numerous: 1, individuals: 1, demonstrate: 1, demonstrates: 1, optimal: 1.5, dynamic: 1,
  journey: 1, resonate: 1.5, resonates: 1.5, bustling: 2, indelible: 2.5, beacon: 2, "ever-evolving": 2.5,
  "fast-paced": 2, "in conclusion": 2.5, "in summary": 2, "it is important to note": 3, "it's important to note": 3,
  "it is worth noting": 3, "it's worth noting": 3, "in today's": 2, "plays a crucial role": 3, "plays a vital role": 3,
  "a wide range of": 2, "in the realm of": 3, "the world of": 1.5, "serves as a": 1.5, "not only": 1, "but also": 1,
  "look no further": 3, "whether you're": 2, "dive into": 2, "at the end of the day": 1.5, "in order to": 1,
  "due to the fact that": 2, "a myriad of": 2.5, "a plethora of": 2.5, "the importance of": 1, "when it comes to": 1,
};

const sentencesOf = t => (t.match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g) || []).map(s => s.trim()).filter(s => s.split(/\s+/).length >= 2);
const wordsOf = t => t.toLowerCase().match(/[a-z][a-z'-]*/g) || [];
const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
const sd = a => { const m = mean(a); return Math.sqrt(mean(a.map(x => (x - m) ** 2))); };
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

export function detect(text) {
  const t = (text || '').trim();
  const w = wordsOf(t);
  if (w.length < 25) return { score: null, signals: [], note: 'Need at least 25 words.' };

  const ss = sentencesOf(t);
  const lens = ss.map(s => s.split(/\s+/).length);
  const paras = t.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  const plens = paras.map(p => wordsOf(p).length);
  const lower = t.toLowerCase();
  const signals = [];

  // 1. Burstiness: coefficient of variation of sentence length. Human ~0.55+, AI ~0.3
  const cv = lens.length > 2 ? sd(lens) / (mean(lens) || 1) : 0.45;
  const burst = clamp((0.55 - cv) / 0.35, 0, 1); // 1 = very uniform
  signals.push({ name: 'Sentence rhythm', value: burst, detail: `length variation ${cv.toFixed(2)} (human writing is usually above 0.5)` });

  // 2. Mid-length clustering: share of sentences in the 15-28 word "LLM comfort zone"
  const midShare = lens.length ? lens.filter(n => n >= 15 && n <= 28).length / lens.length : 0;
  const shortShare = lens.length ? lens.filter(n => n <= 8).length / lens.length : 0;
  const cluster = clamp((midShare - 0.45) / 0.45, 0, 1) * (shortShare < 0.1 ? 1 : 0.5);
  signals.push({ name: 'Sentence length clustering', value: cluster, detail: `${Math.round(midShare * 100)}% of sentences are 15–28 words, ${Math.round(shortShare * 100)}% are short` });

  // 3. AI lexicon density (weighted hits per 100 words)
  let hits = 0; const found = [];
  for (const [term, wt] of Object.entries(AI_LEXICON)) {
    const re = new RegExp(`\\b${term.replace(/[-]/g, '\\-')}\\b`, 'g');
    const m = lower.match(re); if (m) { hits += m.length * wt; found.push(term); }
  }
  const lexDensity = hits / w.length * 100;
  const lex = clamp(lexDensity / 6, 0, 1);
  signals.push({ name: 'AI vocabulary', value: lex, detail: found.length ? found.slice(0, 8).join(', ') : 'none found' });

  // 4. Transitions at sentence start
  const transRe = /^(however|furthermore|moreover|additionally|in addition|consequently|therefore|thus|ultimately|overall|in conclusion|in summary|notably|importantly|first(ly)?|second(ly)?|third(ly)?|finally|lastly|as a result|on the other hand|in contrast|similarly|likewise)\b/i;
  const transShare = ss.length ? ss.filter(s => transRe.test(s)).length / ss.length : 0;
  const trans = clamp(transShare / 0.35, 0, 1);
  signals.push({ name: 'Stock transitions', value: trans, detail: `${Math.round(transShare * 100)}% of sentences open with a transition word` });

  // 5. Contractions & informality (humans use more)
  const contr = (lower.match(/\b\w+'(t|s|re|ll|ve|d|m)\b/g) || []).length / w.length * 100;
  const informal = clamp(1 - contr / 1.5, 0, 1);
  signals.push({ name: 'Formality', value: informal, detail: `${contr.toFixed(1)} contractions per 100 words` });

  // 6. Tricolons / list-of-three and "not only…but also"
  const tri = (t.match(/\b\w+, \w+,? and \w+\b/g) || []).length + (lower.match(/not only .{3,60} but also/g) || []).length;
  const triD = clamp(tri / Math.max(1, ss.length) / 0.25, 0, 1);
  signals.push({ name: 'Lists of three', value: triD, detail: `${tri} tricolon patterns` });

  // 7. Paragraph uniformity
  const pcv = plens.length > 2 ? sd(plens) / (mean(plens) || 1) : 0.4;
  const paraU = plens.length > 2 ? clamp((0.45 - pcv) / 0.35, 0, 1) : 0.3;
  signals.push({ name: 'Paragraph shape', value: paraU, detail: plens.length > 2 ? `paragraph length variation ${pcv.toFixed(2)}` : 'too few paragraphs to judge' });

  // 8. Vocabulary richness (type-token ratio, length-normalised). AI is mid-high and smooth; very low TTR is also human (repetition).
  const ttr = new Set(w).size / Math.sqrt(w.length);
  const ttrSig = clamp((ttr - 5.5) / 3, 0, 1) * 0.6;
  signals.push({ name: 'Vocabulary smoothness', value: ttrSig, detail: `normalised type-token ratio ${ttr.toFixed(1)}` });

  // 9. Punctuation personality: questions, exclamations, parentheses, quotes, numerals, first person
  const personality = (t.match(/[?!()"]|\b(i|i'm|i've|my|we|our|you)\b|\d/gi) || []).length / w.length * 100;
  const flat = clamp(1 - personality / 4, 0, 1);
  signals.push({ name: 'Voice', value: flat, detail: `${personality.toFixed(1)} personal/punctuation markers per 100 words` });

  // 10. Em dashes and semicolons (ChatGPT-era tell)
  const dashes = (t.match(/—|;/g) || []).length / ss.length;
  const dashSig = clamp(dashes / 0.4, 0, 1) * 0.7;
  signals.push({ name: 'Em dashes / semicolons', value: dashSig, detail: `${(t.match(/—|;/g) || []).length} found` });

  const weights = [2.2, 1.2, 2.4, 1.4, 1.1, 0.9, 0.7, 0.6, 1.0, 0.8];
  const raw = signals.reduce((a, s, i) => a + s.value * weights[i], 0) / weights.reduce((a, b) => a + b, 0);
  // logistic squash centred so that ~0.42 raw ≈ 50%
  const score = Math.round(100 / (1 + Math.exp(-(raw - 0.42) * 9)));
  return { score, signals, note: null };
}

export const verdict = s => s == null ? '' : s >= 70 ? 'Likely AI' : s >= 40 ? 'Mixed / uncertain' : s >= 20 ? 'Mostly human' : 'Human';
