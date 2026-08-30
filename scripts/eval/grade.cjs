// PHASE 3 — SCORE. Deterministic, so a re-run in Phase 4 is comparable to this
// one line for line. Nothing here looks at the answer and decides it feels right.
//
// STRICT ON CLIENT. Only an exact client_code passes. A bare name is recorded
// separately as `named` because that one distinction is the whole diagnosis —
// but it does not earn a point. The tools take a code; a name is not a code.
const {BANK} = require('./bank.cjs');
const ROSTER = require('./roster.cjs');

function firstName(s){ return String(s||'').trim().split(/\s+/)[0].toLowerCase(); }
// Does this answer at least MEAN the right person, without being a code?
function namesPerson(ans, code){
  if(!ans || !code) return false;
  const a=String(ans).toLowerCase().replace(/[_\s]+/g,' ').trim();
  const full=String(ROSTER[code]||'').toLowerCase();
  if(!full) return false;
  return a===full || a===firstName(full) || full.indexOf(a)===0 || a.replace(/ /g,'')===full.replace(/ /g,'');
}
function toolOk(exp, got){
  if(exp==='ANY') return true;
  return (Array.isArray(exp)?exp:[exp]).indexOf(got)>=0;
}
function askOk(exp, got){
  got = got||[];
  if(exp==='none') return got.length===0;
  if(!got.length) return false;
  // Every expected person must be offered, by code or by name.
  return exp.every(code => got.some(g => String(g).toLowerCase()===String(code).toLowerCase() || namesPerson(g, code)));
}

function grade(results){
  const byId={}; results.forEach(r=>byId[r.id]=r);
  const rows=[];
  BANK.filter(b=>b.layer!=='answer').forEach(b=>{
    const r=byId[b.id];
    if(!r){ rows.push({b, r:null, pass:false, fails:['not run']}); return; }
    if(!r.ok){ rows.push({b, r, pass:false, fails:['brain errored: '+r.err]}); return; }
    const fails=[], notes=[];
    if(!toolOk(b.expect.tool, r.tool))
      fails.push('tool: expected '+JSON.stringify(b.expect.tool)+', got '+r.tool);
    const ec=b.expect.client;
    if(ec!=='ANY'){
      const wanted = Array.isArray(ec)?ec:[ec];
      const got=String(r.client||'');
      const exact = wanted.some(c=>c===got) || (wanted[0]==='' && got==='');
      if(!exact){
        const near = wanted.some(c=>namesPerson(got,c));
        fails.push('client: expected '+JSON.stringify(ec)+', got '+JSON.stringify(got)+(near?' (right person, NOT a code)':''));
        if(near) notes.push('named');
      }
    }
    if(b.expect.confirm!==undefined && !!b.expect.confirm !== !!r.confirm)
      fails.push('confirm: expected '+b.expect.confirm+', got '+!!r.confirm);
    if(b.expect.askWhich!==undefined && !askOk(b.expect.askWhich, r.ask_which))
      fails.push('ask_which: expected '+JSON.stringify(b.expect.askWhich)+', got '+JSON.stringify(r.ask_which||[]));
    // MULTI-INTENT, graded against the CONTRACT now, not against prose. Until
    // 30 Aug the router had one tool field, so the only evidence a second intent
    // had survived was whether the `why` line mentioned it — a weak proxy that
    // scored 1 of 5. The contract carries an ordered chain now, so the honest
    // test is whether the chain actually contains both intents. The prose
    // fallback stays for a run recorded before the chain existed, so old runs
    // still grade and the trend line remains comparable.
    if(b.bothIntents){
      const chain=Array.isArray(r.chain)?r.chain.map(x=>x.tool)
                 :[r.tool].concat((r.then||[]).map(x=>x&&x.tool).filter(Boolean));
      const missing=b.bothIntents.filter(t=>chain.indexOf(t)<0);
      if(!missing.length){ /* both intents are in the chain, in order */ }
      else if(r.chain || (r.then&&r.then.length)){
        fails.push('multi-intent: the chain is ['+chain.join(' -> ')+'] and never reaches '+missing.join('/'));
      } else {
        const why=String(r.why||'').toLowerCase();
        const spoken = missing.some(t=>why.indexOf(t.replace('_',' '))>=0 || why.indexOf(t)>=0)
          || /\bthen\b|\bafter\b|\balso\b|\bsecond\b|\bseparate\b|\btwo things\b|\bbut\b/.test(why);
        if(!spoken) fails.push('multi-intent: the other half ('+missing.join('/')+') is not mentioned in why — silently dropped');
        else notes.push('pre-chain run: credited off the why line');
      }
    }
    rows.push({b, r, pass:fails.length===0, fails, notes});
  });
  return rows;
}
module.exports={grade, namesPerson};
