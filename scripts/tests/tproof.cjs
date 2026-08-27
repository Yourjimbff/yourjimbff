// AN EDIT AND A DELETE PROVE THEMSELVES (Yusuf, ruling, 26 Aug — Ship 6).
//
// An insert in this app has always read its row back. An edit and a delete did
// not. They asked the server, the server said fine, and "corrected" or "deleted"
// was said off that. But a PATCH or DELETE matching ZERO rows returns the SAME
// success as one that worked — so changing a meal that was not there, or one
// somebody had already removed, was indistinguishable from a real change.
//
// That is a claimed action with no row, which is the one thing this engine may
// never do. Both paths now ask the database to hand back what it touched, and
// nothing back is a failure.
const fs=require('fs');
const guard=require('./_guard.cjs');
const src=fs.readFileSync('index.html','utf8');
const L=src.split('\n');
function grabFn(n){ const a=L.findIndex(l=>l.indexOf('async function '+n+'(')===0); if(a<0) return '';
  let b=a; while(b<L.length && L[b]!=='}') b++; return L.slice(a,b+1).join('\n'); }
function grabPlain(n){ const a=L.findIndex(l=>l.indexOf('function '+n+'(')===0); if(a<0) return '';
  let b=a; while(b<L.length && L[b]!=='}') b++; return L.slice(a,b+1).join('\n'); }
let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };

let RETURNS=[], SENT=[], HTTP_OK=true;
global.SB_URL='https://x';
global.sbHeaders=()=>({});
global.todayFood=[]; global.allFood=[];
global.recomputeTodayFoodTotals=()=>{};
global._foodDupReset=()=>{};
global.console.error=()=>{};
global.fetch=async function(url, opts){
  if(!opts || !opts.method) return {ok:true, json:async()=>[{logged_at:new Date(2026,7,25,7,30,0).toISOString()}]};
  SENT.push({method:opts.method, prefer:(opts.headers||{})['Prefer'], body:opts.body?JSON.parse(opts.body):null});
  return {ok:HTTP_OK, json:async()=>RETURNS.shift()||[], text:async()=>''};
};
eval([grabPlain('_foodEditLanded'), grabFn('applyFoodEdit'), grabFn('applyFoodDelete')].join('\n'));
guard(['_foodEditLanded','applyFoodEdit','applyFoodDelete'], n=>eval(n));

const reset=()=>{ RETURNS=[]; SENT=[]; HTTP_OK=true; global.todayFood=[]; global.allFood=[]; };

(async function(){
  console.log('\n  BOTH WRITES ASK THE DATABASE WHAT THEY TOUCHED:');
  reset(); RETURNS=[[{id:'r1', calories:400}]];
  await applyFoodEdit('r1',{calories:400});
  t(SENT.length===1 && SENT[0].prefer==='return=representation', 'the edit asks for the row back', SENT[0]?SENT[0].prefer:'(none)');
  reset(); RETURNS=[[{id:'r1'}]];
  await applyFoodDelete('r1');
  t(SENT.length===1 && SENT[0].prefer==='return=representation', 'the delete asks for the row back', SENT[0]?SENT[0].prefer:'(none)');

  console.log('\n  A CHANGE THAT MATCHED NOTHING IS A FAILURE, NOT A SUCCESS:');
  reset(); RETURNS=[[]];
  t(await applyFoodEdit('ghost',{calories:400})===false, 'an edit that matched no row reports failure');
  reset(); RETURNS=[[]];
  t(await applyFoodDelete('ghost')===false, 'a delete that matched no row reports failure');

  console.log('\n  and a real one still succeeds:');
  reset(); RETURNS=[[{id:'r1', calories:400, protein:30}]];
  t(await applyFoodEdit('r1',{calories:400, protein:30})===true, 'an edit that changed a row reports success');
  reset(); RETURNS=[[{id:'r1', name:'Eggs'}]];
  t(await applyFoodDelete('r1')===true, 'a delete that removed a row reports success');

  console.log('\n  A ROW CAME BACK IS NOT THE SAME AS IT HOLDS WHAT WAS SENT:');
  reset(); RETURNS=[[{id:'r1', calories:999}]];
  t(await applyFoodEdit('r1',{calories:400})===false, 'a row that came back with the WRONG value is a failure');
  reset(); RETURNS=[[{id:'r1', date_str:'Aug 19, 2026'}]];
  t(await applyFoodEdit('r1',{date_str:'Aug 20, 2026'})===false, 'a move that landed on the wrong day is a failure');

  console.log('\n  the same instant written two ways is still the same instant:');
  const iso=new Date(2026,7,20,7,30,0).toISOString();
  const pg=iso.replace('Z','+00:00').replace('.000','');
  t(_foodEditLanded({logged_at:iso},{logged_at:pg})===true, 'logged_at is compared as a moment, not as text');
  t(_foodEditLanded({logged_at:iso},{logged_at:new Date(2026,7,20,12,0,0).toISOString()})===false, 'and a different moment is caught');

  console.log('\n  a refused request is still a failure, before any of this:');
  reset(); HTTP_OK=false; RETURNS=[[{id:'r1'}]];
  t(await applyFoodEdit('r1',{calories:400})===false, 'the edit reports the refusal');
  reset(); HTTP_OK=false;
  t(await applyFoodDelete('r1')===false, 'the delete reports the refusal');

  console.log('\n  AND SHIP 5 IS NOT UNDONE — a move still keeps its clock time:');
  reset();
  global.todayFood=[{id:'r1', logged_at:new Date(2026,7,25,7,30,0).toISOString()}];
  RETURNS=[[{id:'r1', date_str:'Aug 20, 2026', logged_at:new Date(2026,7,20,7,30,0).toISOString()}]];
  const ok=await applyFoodEdit('r1',{date_str:'Aug 20, 2026'});
  const sent=SENT[0]&&SENT[0].body;
  const hm=d=>new Date(d).getHours()+':'+String(new Date(d).getMinutes()).padStart(2,'0');
  t(ok===true, 'the move lands');
  t(sent && hm(sent.logged_at)==='7:30', 'and it still writes 7:30, not midday', sent?hm(sent.logged_at):'(none)');

  console.log('\n  THE OLD SILENT SHAPE IS GONE FROM BOTH:');
  const editFn=grabFn('applyFoodEdit'), delFn=grabFn('applyFoodDelete');
  t(editFn.indexOf("'Prefer':'return=minimal'")<0, 'the edit no longer writes blind');
  t(delFn.indexOf("'Prefer':'return=minimal'")<0, 'the delete no longer writes blind');

  console.log('\n'+(bad?(bad+' FAILED'):'all pass'));
  process.exit(bad?1:0);
})();
