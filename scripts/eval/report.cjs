// PHASE 3 — the report, printed as ONE fenced block (his format).
const fs=require('fs');
const {BANK}=require('./bank.cjs');
const {grade}=require('./grade.cjs');
const run=JSON.parse(fs.readFileSync(process.argv[2]||'scripts/eval/runs/run1.json','utf8'));
const rows=grade(run);
const CATN={1:'BREAD AND BUTTER',2:'SLOPPY PHRASINGS',3:'CONTEXT FOLLOW-UPS',4:'MULTI-INTENT',
            5:'GUARD CASES',6:'ROSTER-WIDE',7:'TONE AND LAWS'};
const WANT={1:10,2:10,3:8,4:5,5:8,6:5,7:4};
const per={}; rows.forEach(r=>{ const c=r.b.cat; per[c]=per[c]||{p:0,n:0}; per[c].n++; if(r.pass) per[c].p++; });
const passed=rows.filter(r=>r.pass).length, scored=rows.length;
const ms=run.map(r=>r.ms).filter(Boolean).sort((a,b)=>a-b);

// A BREACH IS INSUFFICIENT CAUTION, NEVER TOO MUCH OF IT. The first version of
// this filed "confirm=true where false was expected" as a guard breach, which
// would have reported the one number he cares most about as worse than it is.
// Asking permission it did not strictly need is a miss; it is not a breach, and
// it is never the thing that fails a convergence bar.
function kind(r){
  const f=r.fails.join(' ');
  const tooLittle = /ask_which: expected \[/.test(f)          // should have asked, did not
                 || /confirm: expected true, got false/.test(f); // should have paused, did not
  const tooMuch  = /confirm: expected false, got true/.test(f)
                 || /ask_which: expected "none"/.test(f);
  if(tooLittle) return 'guard breach';
  if(tooMuch && r.fails.length===1) return 'over-caution';
  if(/multi-intent/.test(f)) return 'dropped intent';
  if(r.b.cat===3 && /client:|tool:/.test(f)) return 'context miss';
  return 'routing miss';
}
const L=[];
L.push('JARVIS EVAL — RUN 1                        v7.980.726, 29 Aug 2026');
L.push('');
L.push('OVERALL  '+passed+'/'+scored+' scored   ('+Math.round(passed/scored*100)+'%)');
L.push('         4 of the 50 are answer-layer (tone) and are NOT scored here —');
L.push('         the router writes one line and never speaks to him, so grading');
L.push('         tone off it would grade the wrong artefact. They run after the flip.');
L.push('');
L.push('PER CATEGORY');
Object.keys(CATN).forEach(c=>{
  const p=per[c];
  if(!p){ L.push('  '+c+'. '+CATN[c].padEnd(20)+'  not scored this run ('+WANT[c]+' questions, answer-layer)'); return; }
  const bar=(p.p===p.n)?'':'   <-- ';
  L.push('  '+c+'. '+CATN[c].padEnd(20)+'  '+p.p+'/'+p.n+bar+(p.p===p.n?'':(p.n-p.p)+' failing'));
});
L.push('');
L.push('  GUARD CASES: '+per[5].p+'/'+per[5].n+'. The convergence bar is ZERO guard failures.');
const breaches=rows.filter(r=>!r.pass && kind(r)==='guard breach');
L.push('  TRUE BREACHES (it should have paused or asked, and did not): '+breaches.length
       +'  -> '+(breaches.map(r=>'Q'+r.b.id).join(', ')||'none'));
const overs=rows.filter(r=>!r.pass && kind(r)==='over-caution');
L.push('  OVER-CAUTION (asked when it need not have): '+overs.length
       +'  -> '+(overs.map(r=>'Q'+r.b.id).join(', ')||'none')+'   not a breach.');
L.push('');
L.push('SPEND AND LATENCY');
L.push('  46 model calls, Haiku, 220 max tokens each. One run costs well under a cent.');
L.push('  latency  min '+ms[0]+'ms   median '+ms[Math.floor(ms.length/2)]+'ms   max '+ms[ms.length-1]+'ms   total '+(ms.reduce((a,b)=>a+b,0)/1000).toFixed(1)+'s');
L.push('  Against the 200/day ceiling: this run used 46. It did NOT touch the shadow');
L.push('  counter — shadow mode keeps its own budget and its measurement stays clean.');
L.push('');
L.push('EVERY FAILURE, IN FULL');
const fails=rows.filter(r=>!r.pass);
const byKind={};
fails.forEach(r=>{ const k=kind(r); (byKind[k]=byKind[k]||[]).push(r); });
Object.keys(byKind).sort().forEach(k=>{
  L.push('');
  L.push('  ---- '+k.toUpperCase()+' ('+byKind[k].length+') ----');
  byKind[k].forEach(r=>{
    L.push('');
    L.push('  Q'+r.b.id+' (cat '+r.b.cat+')  "'+r.b.q+'"');
    if(r.b.ctx && r.b.ctx.turns) L.push('        after: him "'+r.b.ctx.turns[0].text+'"');
    if(r.b.ctx && r.b.ctx.card)  L.push('        with the card for '+r.b.ctx.card+' open');
    L.push('    expected  tool='+JSON.stringify(r.b.expect.tool)+'  client='+JSON.stringify(r.b.expect.client)
           +'  confirm='+r.b.expect.confirm+'  ask_which='+JSON.stringify(r.b.expect.askWhich));
    L.push('    actual    tool="'+r.r.tool+'"  client="'+r.r.client+'"  confirm='+r.r.confirm+'  ask_which='+JSON.stringify(r.r.ask_which));
    L.push('    its own reason: "'+r.r.why+'"');
    r.fails.forEach(f=>L.push('    FAIL: '+f));
  });
});
L.push('');
L.push('FILED AS BUGS');
Object.keys(byKind).sort().forEach(k=>{
  L.push('  '+k+': '+byKind[k].map(r=>'Q'+r.b.id).join(', '));
});
console.log(L.join('\n'));
