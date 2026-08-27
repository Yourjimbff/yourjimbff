// A MOVED MEAL KEEPS ITS CLOCK TIME (Yusuf, ruling, 26 Aug — Ship 5).
//
// applyFoodEdit moved both date fields correctly and then stamped the new day
// at 12:00 MIDDAY, every single time. The line meant to preserve the hour read
// fields._wasLoggedAt, and that name appeared EXACTLY ONCE in the whole file —
// on the line that read it. Nothing set it. So a 7:30am breakfast moved to
// yesterday became a midday meal, and every surface that sorts or reads by time
// showed it as one. The comment above the line promised the opposite, which is
// how it lived through two ships about moving meals.
//
// The clock is now READ OFF THE ROW: memory first, the database second. And if
// neither answers, the edit FAILS rather than guessing midday or moving date_str
// on its own — a half-move is the Spencer bug this function exists to end.
const fs=require('fs');
const guard=require('./_guard.cjs');
const L=fs.readFileSync('index.html','utf8').split('\n');
function grabFn(name){ const a=L.findIndex(l=>l.indexOf('async function '+name+'(')===0); if(a<0) return '';
  let b=a; while(b<L.length && L[b]!=='}') b++; return L.slice(a,b+1).join('\n'); }
let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };

// ---- the world applyFoodEdit runs in -----------------------------------
let PATCHED=null, GETS=0, ROW=null, GET_OK=true;
global.SB_URL='https://x';
global.sbHeaders=()=>({});
global.todayFood=[]; global.allFood=[];
global.recomputeTodayFoodTotals=()=>{};
global.console.error=()=>{};
global.fetch=async function(url, opts){
  if(!opts || !opts.method){                       // the read of the row
    GETS++;
    return {ok:GET_OK, json:async()=>(ROW?[ROW]:[])};
  }
  PATCHED=JSON.parse(opts.body);                    // the write
  return {ok:true, text:async()=>''};
};
eval(grabFn('applyFoodEdit'));
guard(['applyFoodEdit'], n=>eval(n));

// A real local 7:30am on 25 Aug, expressed the way the database stores it.
const SEVEN_THIRTY=new Date(2026,7,25,7,30,0);
const localHM=iso=>{ const d=new Date(iso); return d.getHours()+':'+String(d.getMinutes()).padStart(2,'0'); };
const localDay=iso=>{ const d=new Date(iso); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };
const reset=()=>{ PATCHED=null; GETS=0; ROW=null; GET_OK=true; global.todayFood=[]; global.allFood=[]; };

(async function(){
  console.log('\n  a 7:30am breakfast moved to another day is still 7:30am:');
  reset();
  global.todayFood=[{id:'r1', logged_at:SEVEN_THIRTY.toISOString()}];
  let ok=await applyFoodEdit('r1', {date_str:'Aug 20, 2026'});
  t(ok===true, 'the edit lands');
  t(!!PATCHED && !!PATCHED.logged_at, 'and it writes a timestamp');
  t(PATCHED && localHM(PATCHED.logged_at)==='7:30', 'the clock time is kept', PATCHED?localHM(PATCHED.logged_at):'(none)');
  t(PATCHED && localHM(PATCHED.logged_at)!=='12:00', 'and it is NOT midday');
  t(PATCHED && localDay(PATCHED.logged_at)==='2026-08-20', 'on the day he asked for', PATCHED?localDay(PATCHED.logged_at):'(none)');
  t(PATCHED && PATCHED.date_str==='Aug 20, 2026', 'and both date fields move together');
  t(GETS===0, 'the row was already on screen, so nothing was fetched');

  console.log('\n  and when the row is not on screen, the time is read off the database:');
  reset();
  ROW={logged_at:SEVEN_THIRTY.toISOString()};
  ok=await applyFoodEdit('r1', {date_str:'Aug 20, 2026'});
  t(ok===true, 'the edit lands');
  t(GETS===1, 'the row was read exactly once', GETS+' reads');
  t(PATCHED && localHM(PATCHED.logged_at)==='7:30', 'and the clock time survives', PATCHED?localHM(PATCHED.logged_at):'(none)');

  console.log('\n  A READ THAT DOES NOT ANSWER WRITES NOTHING AT ALL:');
  reset();
  GET_OK=false;
  ok=await applyFoodEdit('r1', {date_str:'Aug 20, 2026'});
  t(ok===false, 'the edit reports that it did not land');
  t(PATCHED===null, 'and NOTHING was written — not a noon stamp');
  t(PATCHED===null, 'and not a date_str on its own, which is the half-move');

  console.log('\n  the caller can still hand the time in, and it is honoured:');
  reset();
  ok=await applyFoodEdit('r1', {date_str:'Aug 20, 2026', _wasLoggedAt:SEVEN_THIRTY.toISOString()});
  t(ok===true && GETS===0, 'no read is needed when it was passed');
  t(PATCHED && localHM(PATCHED.logged_at)==='7:30', 'and the clock time is kept');

  console.log('\n  an edit that is NOT a move never touches the timestamp:');
  reset();
  global.todayFood=[{id:'r1', logged_at:SEVEN_THIRTY.toISOString()}];
  ok=await applyFoodEdit('r1', {calories:400, protein:30});
  t(ok===true, 'a macro correction still lands');
  t(PATCHED && PATCHED.logged_at===undefined, 'and leaves logged_at alone');
  t(GETS===0, 'and reads nothing');

  console.log('\n  THE DEAD FIELD IS GONE AS THE ONLY SOURCE:');
  const src=fs.readFileSync('index.html','utf8');
  t((src.match(/_wasLoggedAt/g)||[]).length>1, 'it is no longer a name read once and set nowhere',
    (src.match(/_wasLoggedAt/g)||[]).length+' occurrences');
  t(/select=logged_at/.test(src), 'the row itself is asked for the clock');

  console.log('\n'+(bad?(bad+' FAILED'):'all pass'));
  process.exit(bad?1:0);
})();
