// ONE DOOR — permanent, by his ruling (24 Aug, the strip, ship 4).
//
// Every client screen reaches the engine the same way and carries the same
// information. Two things are proved here, because both were silently wrong:
//
//   THE DAY. A screen that passed no day fell through to a global that is not
//   today — it is whatever day the Day page was last looking at, and it stays
//   pointed there. Browsing back to Friday and then logging from the Jim tab
//   wrote the meal onto Friday, days later, with nothing on screen saying so.
//
//   THE SCHEDULING CHECK. Only one of the three screens ever asked whether a
//   sentence was a scheduling request, so identical words behaved differently
//   depending on which screen he happened to be on.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const L=src.split('\n');
function grab(p){ const a=L.findIndex(p); let b=a; while(L[b]!=='}') b++; return L.slice(a,b+1).join('\n'); }
function multi(sw){ const a=L.findIndex(l=>l.trim().startsWith(sw)); let b=a; while(!/;\s*$/.test(L[b])) b++; return L.slice(a,b+1).join('\n'); }
let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };

// ---- the real gate and the real door, lifted out of the file -------------
global.window={};
eval([
  multi('var _JT_SCHED_INTENT_RE=new RegExp('),
  multi('var _JT_PAST_MEAL_RE=new RegExp('),
  multi('var _JIM_CAL_PUT_RE=new RegExp('),
  grab(l=>l.startsWith('function _jimHarvestSteps(')),
  grab(l=>l.startsWith('function _jimHarvestWeight(')),
  grab(l=>l.startsWith('function _jimCalendarAsked(')),
  grab(l=>l.startsWith('function _tlDateStr(')),
  grab(l=>l.startsWith('async function jimDoor(')),
].join('\n'));

// Stubs standing in for the engine and the calendar, recording what they got.
let seen=null, calendarRan=0;
global.jimTurn=async function(text, photos, opts){ seen={text:text, opts:opts}; return 'engine'; };
global._jtCalendarTurnClient=async function(){ calendarRan++; return {line:'Pilates set for 6:00 AM every Tuesday.'}; };
global.cl={code:'yourjimbff1'};
global.isTrainer=function(c){ return c==='thegoat'; };
const run=async(text, opts)=>{ seen=null; calendarRan=0; const r=await jimDoor(text, [], opts); return r; };

(async function(){
  const today=_tlDateStr(new Date());

  console.log('  the day is decided at the door, never left to a global:');
  await run('I had eggs');
  t(!!seen && seen.opts && seen.opts.dateStr===today, 'a screen that passes no day gets real today', seen&&seen.opts&&seen.opts.dateStr);
  await run('I had eggs', {dateStr:'Aug 17, 2026'});
  t(!!seen && seen.opts.dateStr==='Aug 17, 2026', 'a screen that knows its day keeps it', seen&&seen.opts&&seen.opts.dateStr);
  await run('I had eggs', {dateStr:'Aug 17, 2026', timeLocal:'8:00 AM'});
  t(!!seen && seen.opts.timeLocal==='8:00 AM', 'a hand-corrected clock is carried through');

  console.log('\n  every screen asks the same question of the same sentence:');
  await run('did my workout at 6 this morning');
  t(calendarRan===0 && !!seen, 'an ordinary log reaches the engine');
  await run('8000 steps yesterday');
  t(calendarRan===0 && !!seen, 'a step count reaches the engine');
  const sched=await run('put Pilates at 6am on Tuesdays');
  t(calendarRan===1 && seen===null, 'a plain scheduling request reaches the calendar');
  t(/Pilates set for/.test(sched), 'and its answer is what comes back');

  console.log('\n  a scheduling answer is never mistaken for a log:');
  t(!!(window._jimLastTurn && window._jimLastTurn.calendar===true), 'the turn is marked as calendar');
  t(!!(window._jimLastTurn && window._jimLastTurn.wrote===0), 'and honest that nothing was written');
  // The Day bar offers to keep an unloggable sentence as a journal note. It must
  // not offer that for something it just put on the calendar.
  t(/!_jimLastTurn\.wrote && !_jimLastTurn\.calendar/.test(src), 'the journal offer stands down for it');

  console.log('\n  every conversational client screen uses the one door:');
  ['slogSend','jimChoose','jimSend'].forEach(fn=>{
    const at=src.search(new RegExp('(async )?function '+fn+'\\('));
    const body=src.slice(at, at+ (fn==='jimSend'?12000:3000));
    t(body.includes('jimDoor('), fn+' calls the door');
  });
  t(!/_jimTurnClientAware/.test(src), 'the old client-only entry is gone entirely');

  console.log(bad? '\n'+bad+' FAILED' : '\nall pass');
  process.exit(bad?1:0);
})();
