// Scores the hold-outs. Deliberately a SEPARATE entry point from report.cjs so
// that reading a failure here is a conscious act, not something that happens
// while diagnosing the visible bank.
const fs=require('fs');
const {HOLDOUT}=require('./holdout.cjs');
const ROSTER=require('./roster.cjs');
const run=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const by={}; run.forEach(r=>by[r.id]=r);
let pass=0; const lines=[];
HOLDOUT.forEach(h=>{
  const r=by[h.id]; if(!r||!r.ok){ lines.push('  '+h.id+'  NOT RUN'); return; }
  const f=[];
  const t=Array.isArray(h.expect.tool)?h.expect.tool:[h.expect.tool];
  if(h.expect.tool!=='ANY' && t.indexOf(r.tool)<0) f.push('tool expected '+JSON.stringify(h.expect.tool)+', got '+r.tool);
  if(h.expect.client!=='ANY' && String(r.client||'')!==h.expect.client) f.push('client expected "'+h.expect.client+'", got "'+(r.client||'')+'"');
  if(h.expect.confirm!==undefined && !!h.expect.confirm!==!!r.confirm) f.push('confirm expected '+h.expect.confirm+', got '+!!r.confirm);
  if(Array.isArray(h.expect.askWhich)){
    const got=r.ask_which||[];
    if(!h.expect.askWhich.every(c=>got.indexOf(c)>=0)) f.push('ask_which expected '+JSON.stringify(h.expect.askWhich)+', got '+JSON.stringify(got));
  }
  if(!f.length){ pass++; lines.push('  '+h.id+'  pass'); }
  else lines.push('  '+h.id+'  FAIL  "'+h.q+'"\n        '+f.join('\n        '));
});
console.log('HOLD-OUT SCORE  '+pass+'/'+HOLDOUT.length);
console.log(lines.join('\n'));
process.exit(0);
