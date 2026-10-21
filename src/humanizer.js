// ---------- data ----------
export const PHRASES = [
  [/\bit is important to note that\b/gi, ""],
  [/\bit is worth noting that\b/gi, ""],
  [/\bit should be noted that\b/gi, ""],
  [/\bin (?:today's|the modern|this) (?:[\w-]+ ){0,3}(?:world|era|age|landscape|society),?\s*/gi, ""],
  [/\bit is (essential|crucial|vital|imperative|necessary) (to|that)\b/gi, (m,a,b)=> b.toLowerCase()==="to"?"you have to":"make sure"],
  [/\bit is (important|critical) (to|that)\b/gi, (m,a,b)=> b.toLowerCase()==="to"?"you need to":"remember that"],
  [/\bfor achieving\b/gi, "to get"],
  [/\bbecome overly dependent on\b/gi, "lean too hard on"],
  [/\bin the realm of\b/gi, "in"],
  [/\bin order to\b/gi, "to"],
  [/\bdue to the fact that\b/gi, "because"],
  [/\bat this point in time\b/gi, "now"],
  [/\ba wide range of\b/gi, "many"],
  [/\ba plethora of\b/gi, "plenty of"],
  [/\ba myriad of\b/gi, "many"],
  [/\bplays a (crucial|vital|pivotal|key) role in\b/gi, "matters for"],
  [/\bdelve into\b/gi, "look at"],
  [/\bdelves into\b/gi, "looks at"],
  [/\bnavigate the complexities of\b/gi, "deal with"],
  [/\bleverag(e|es|ing)\b/gi, (m,s)=> s==="es"?"uses": s==="ing"?"using":"use"],
  [/\butiliz(e|es|ed|ing)\b/gi, (m,s)=> ({e:"use",es:"uses",ed:"used",ing:"using"})[s]],
  [/\bfacilitat(e|es|ed|ing)\b/gi, (m,s)=> ({e:"help",es:"helps",ed:"helped",ing:"helping"})[s]],
  [/\bcommenc(e|es|ed|ing)\b/gi, (m,s)=> ({e:"start",es:"starts",ed:"started",ing:"starting"})[s]],
  [/\bendeavor(s)?\b/gi, (m,s)=> s?"efforts":"effort"],
  [/\bsubsequently\b/gi, "later"],
  [/\badditionally,?\s*/gi, "Also, "],
  [/\bfurthermore,?\s*/gi, "On top of that, "],
  [/\bmoreover,?\s*/gi, "Plus, "],
  [/\bconsequently,?\s*/gi, "So "],
  [/\btherefore,?\s*/gi, "So "],
  [/\bin conclusion,?\s*/gi, "All in all, "],
  [/\bto summarize,?\s*/gi, "In short, "],
  [/\bultimately,?\s*/gi, "In the end, "],
  [/\boverall,?\s*/gi, "All told, "],
  [/\bnevertheless,?\s*/gi, "Still, "],
  [/\bhowever,?\s*/gi, "But "],
  [/\bcomprehensive\b/gi, "thorough"],
  [/\brobust\b/gi, "solid"],
  [/\bseamless(ly)?\b/gi, (m,s)=> s?"smoothly":"smooth"],
  [/\binnovative\b/gi, "new"],
  [/\bcutting-edge\b/gi, "latest"],
  [/\bgame-changer\b/gi, "big deal"],
  [/\bparamount\b/gi, "key"],
  [/\bessential\b/gi, "needed"],
  [/\bsignificant(ly)?\b/gi, (m,s)=> s?"a lot":"big"],
  [/\bnumerous\b/gi, "many"],
  [/\bindividuals\b/gi, "people"],
  [/\bimplement(ed|ing|s)?\b/gi, (m,s)=> ({ed:"put in place",ing:"putting in place",s:"puts in place"})[s]||"put in place"],
  [/\bdemonstrat(e|es|ed|ing)\b/gi, (m,s)=> ({e:"show",es:"shows",ed:"showed",ing:"showing"})[s]],
  [/\bensur(e|es|ed|ing)\b/gi, (m,s)=> ({e:"make sure",es:"makes sure",ed:"made sure",ing:"making sure"})[s]],
  [/\benhanc(e|es|ed|ing)\b/gi, (m,s)=> ({e:"improve",es:"improves",ed:"improved",ing:"improving"})[s]],
  [/\boptimal\b/gi, "best"],
  [/\bvarious\b/gi, "different"],
  [/\bthe utilization of\b/gi, "using"],
  [/\bprior to\b/gi, "before"],
  [/\bin terms of\b/gi, "for"],
  [/\bwith regard to\b/gi, "about"],
  [/\bas a result,?\s*/gi, "Because of this, "],
  [/\bthis is because\b/gi, "that's because"],
  [/\bit is (clear|evident) that\b/gi, "clearly"],
  [/\bnot only ([^,]+), but also\b/gi, "$1, and also"],
];

export const CONTRACTIONS = [
  [/\b(I) am\b/g,"$1'm"],[/\b(it|that|there|he|she|what|who) is\b/gi,"$1's"],
  [/\b(do|does|did|is|are|was|were|has|have|had|would|could|should|will|can) not\b/gi,(m,v)=>v.toLowerCase()==="can"?"can't":v.toLowerCase()==="will"?"won't":v+"n't"],
  [/\b(you|we|they) are\b/gi,"$1're"],[/\b(I|you|we|they) will\b/g,"$1'll"],
  [/\b(I|you|we|they) have\b(?! (to|got)\b)/g,"$1've"],[/\b(I|you|we|they|he|she|it) would\b/g,"$1'd"],
];

export const SYN = {
  important:["a big deal","worth caring about","what counts","key"],
  crucial:["key","make-or-break","what matters most"],
  additionally:["Also","Plus","On top of that","And"],
  provide:["give","offer","hand over"], provides:["gives","offers"], provided:["gave","offered"],
  achieve:["reach","pull off","get to"], achieved:["reached","pulled off"],
  obtain:["get","pick up"], obtained:["got","picked up"],
  assist:["help"], assistance:["help","a hand"],
  require:["need"], requires:["needs"], required:["needed"],
  approximately:["about","roughly","around"],
  purchase:["buy"], purchased:["bought"],
  commence:["start","kick off"], terminate:["end","stop"],
  sufficient:["enough"], numerous:["many","a lot of","plenty of"],
  regarding:["about","on"], concerning:["about"],
  currently:["right now","now","these days"],
  however:["But","Still","Then again","That said,"],
  therefore:["So","Which means","That's why"],
  thus:["so","which means"],
  landscape:["scene","field","world"], realm:["area","world"],
  tapestry:["mix","blend"], testament:["proof","a sign"],
  foster:["build","grow","encourage"], fosters:["builds","grows"],
  journey:["path","process","road"], embark:["start","set out"],
  underscore:["show","point to"], underscores:["shows","points to"],
  vibrant:["lively","busy"], dynamic:["fast-moving","shifting"],
  streamline:["simplify","tidy up"], streamlined:["simplified"],
  empower:["let","help"], empowers:["lets","helps"],
  harness:["use","tap"], harnessing:["using","tapping"],
  transformative:["big","major"], groundbreaking:["new","major"],
  meticulous:["careful"], meticulously:["carefully"],
  intricate:["complex","tangled","detailed"], intricacies:["details","fine points"],
  pivotal:["key","central"], paramount:["key","top"],
  unleash:["release","set loose"], unlock:["open up","free up"],
  elevate:["lift","raise","improve"], elevates:["lifts","raises"],
  resonate:["land","click","connect"], resonates:["lands","clicks"],
  captivating:["gripping","engaging"], compelling:["strong","convincing"],
  nuanced:["subtle","layered"], multifaceted:["many-sided","complex"],
  holistic:["whole","all-round"], synergy:["teamwork","fit"],
  ecosystem:["network","setup","system"], paradigm:["model","way of thinking"],
};
export const OPENERS = ["Here's the thing: ","Honestly, ","In practice, ","Put simply, ","Think of it this way: ","To be fair, ","The short version: "];

// ---------- helpers ----------
const rnd = () => Math.random();
export const words = t => (t.trim().match(/\S+/g)||[]).length;
const sentences = p => p.match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g) || [p];
const cap = s => s.replace(/^\s*([a-z])/, (m,c)=>m.replace(c,c.toUpperCase()));

function fixCaps(text){
  // capitalise sentence starts, tidy spaces
  return text.replace(/\s{2,}/g," ").replace(/\s+([,.;!?])/g,"$1").replace(/([.!?]\s+)([a-z])/g,(m,a,b)=>a+b.toUpperCase()).replace(/^\s*([a-z])/,(m,c)=>c.toUpperCase());
}

export function aiScore(text){
  if(!text.trim()) return null;
  let hits=0; const w=words(text)||1;
  for(const [re] of PHRASES){ const m=text.match(re); if(m) hits+=m.length; }
  const ss=sentences(text).map(s=>words(s)).filter(n=>n>0);
  const mean=ss.reduce((a,b)=>a+b,0)/(ss.length||1);
  const sd=Math.sqrt(ss.reduce((a,b)=>a+(b-mean)**2,0)/(ss.length||1));
  const burst = mean? sd/mean : 0;               // low variance = AI-ish
  const dashes=(text.match(/—/g)||[]).length;
  const contractions=(text.match(/\w'(t|s|re|ll|ve|d|m)\b/g)||[]).length;
  let score = 30 + hits*100/w*6 + (burst<0.35?25:burst<0.5?12:0) + dashes*100/w*4 - contractions*100/w*5;
  return Math.max(0,Math.min(100,Math.round(score)));
}

// ---------- the humanizer ----------
export function humanize(text, mode){
  const level = {light:1, medium:2, strong:3}[mode];
  let changes=0;
  const paras = text.split(/\n{2,}/);
  const outParas = paras.map(p=>{
    let t=p;
    // 1. kill stiff phrases
    for(const [re,rep] of PHRASES){ t=t.replace(re,(...a)=>{changes++; return typeof rep==="function"?rep(...a):rep;}); }
    // 1b. AI-word synonym pools (random pick), prob scales with level
    const ps=[0.45,0.75,1][level-1];
    t=t.replace(/\b([A-Za-z]+)\b/g,(m)=>{ const k=m.toLowerCase(); const pool=SYN[k]; if(!pool||rnd()>ps) return m; changes++; let r=pool[Math.floor(rnd()*pool.length)]; if(m[0]===m[0].toUpperCase()&&r[0]===r[0].toLowerCase()) r=r[0].toUpperCase()+r.slice(1); return r; });
    // 2. em dashes and semicolons → commas / periods
    t=t.replace(/\s*—\s*/g, ()=>{changes++; return rnd()<0.5?", ":". ";});
    if(level>=2) t=t.replace(/;\s*/g, ()=>{changes++; return ". ";});
    // 3. contractions (prob scales with level)
    const pc=[0.5,0.8,1][level-1];
    for(const [re,rep] of CONTRACTIONS){ t=t.replace(re,(...a)=> rnd()<pc ? (changes++, typeof rep==="function"?rep(...a):a[0].replace(re,rep)) : a[0]); }
    // 4. sentence rhythm
    let ss=sentences(t).map(s=>s.trim()).filter(Boolean);
    const out=[];
    for(let i=0;i<ss.length;i++){
      let s=ss[i];
      const n=words(s);
      // split long sentences at ", and" / ", which" / ", but"
      if(n>24 && level>=2){
        const m=s.match(/^(.{20,}?),\s+(and|which|but|so|because)\s+(.+)$/i);
        if(m){ changes++; const tail=m[2].toLowerCase()==="which"?"That ":m[2].toLowerCase()==="and"?"":cap(m[2])+" "; out.push(m[1]+"."); s=tail+m[3]; s=cap(s); }
      }
      // merge two short sentences
      if(n<7 && i+1<ss.length && words(ss[i+1])<9 && rnd()<0.5 && level>=2){
        changes++; s=s.replace(/[.!?]+$/,"")+", and "+ss[i+1].replace(/^\s*\w/,c=>c.toLowerCase()); i++;
      }
      // occasional casual opener
      if(level>=2 && i>0 && n>10 && rnd()<[0,0.12,0.22][level-1]){
        changes++; s=OPENERS[Math.floor(rnd()*OPENERS.length)]+s.replace(/^\w/,c=>c.toLowerCase());
      }
      // break "same first word" runs (detectors flag repeated openers)
      if(out.length && level>=2){ const prev=out[out.length-1].split(/\s+/)[0].toLowerCase(); const cur=s.split(/\s+/)[0].toLowerCase(); if(prev===cur&&prev!=="i"){ changes++; s=["And ","Then ","Which means "][Math.floor(rnd()*3)]+s.replace(/^\w/,c=>c.toLowerCase()); } }
      // split off a punchy fragment from a long sentence (strong only)
      if(level===3 && n>18 && rnd()<0.25){ const mm=s.match(/^(.+?),\s+(especially|particularly|mostly|mainly|at least|even|not)\s+(.+)$/i); if(mm){ changes++; out.push(mm[1]+"."); s=cap(mm[2]+" "+mm[3]); } }
      // drop a trailing hedge
      if(level===3) s=s.replace(/,?\s*(in various ways|in many ways|in a variety of ways)\.?$/i,(m)=>{changes++;return ".";});
      out.push(s);
    }
    t=out.join(" ");
    // 5. list-y triple adjectives "A, B, and C" → "A and B" (strong only, keeps meaning loosely)
    if(level===3) t=t.replace(/\b(\w+), (\w+), and (\w+)\b/g,(m,a,b,c)=>{ if(rnd()<0.3){changes++; return `${a} and ${c}`;} return m; });
    return fixCaps(t);
  });
  return {text: outParas.join("\n\n"), changes};
}
