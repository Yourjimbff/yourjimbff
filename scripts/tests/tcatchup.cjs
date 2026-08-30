// THE CATCH UP (Yusuf, order, 30 Aug) — his bank, run against the shipped code.
//
//   "Bank: multi-day assembly across week boundaries; notes quoted verbatim;
//    nothing-logged days shown. First real case: Chris McCarthy, unanswered
//    since Friday."
//
// The clock is FROZEN at Sunday 30 August 2026, 9:15am, which is the morning he
// wrote the order. Everything below is arithmetic against that instant: the
// span comes off a real contact row through the real _ccDaysSince, and the day
// frame comes off the real calendar. Nothing here stubs the thing under test.
//
// THE SECOND FIXTURE CROSSES A MONTH AS WELL AS A WEEK. Aug 24-30 is one
// Monday-to-Sunday block and would have proved nothing about a boundary; a span
// ending Tuesday 1 September starts on Friday 28 August and crosses both.
const fs=require('fs');
const guard=require('./_guard.cjs');
const {closure}=require('./_lift.cjs');

let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };

// ===== THE FROZEN CLOCK ================================================
// new Date() and Date.now() answer the fixed instant; every other form passes
// straight through, so _dbDay('Aug 28, 2026') still parses the way it ships.
const RealDate=Date;
let NOW=new RealDate(2026,7,30,9,15,0);          // Sunday 30 Aug 2026, 9:15am
class FrozenDate extends RealDate{
  constructor(...a){ if(a.length===0) super(NOW.getTime()); else super(...a); }
  static now(){ return NOW.getTime(); }
}
global.Date=FrozenDate;
const at=(y,m,d,h,mi)=>new RealDate(y,m,d,h||0,mi||0,0).getTime();

// ===== THE HARNESS THE PAGE GIVES THIS CODE ============================
const STORE={};
global.localStorage={ getItem:k=>(k in STORE?STORE[k]:null), setItem:(k,v)=>{STORE[k]=String(v);}, removeItem:k=>{delete STORE[k];} };
global.window={ _vipRowsCache:[], _bookCacheAll:[], _sbFailN:0 };
global.document={ getElementById:()=>null };
global.navigator={ language:'en-US' };

// LIFTED PRECISELY, NOT CHASED FROM THE TOP — tdebrief's lesson, and the same
// cause. jvCatchUp references textClient and showToast, and chasing those pulls
// jvPaneRender, renderMobFrontDesk, doLogin and a hundred more, including
// top-level statements that run on load and throw. So this button's own
// functions are taken by name with no chasing, its three doors are stubbed
// below anyway, and only the small shared helpers are closed over.
const {defOf}=require('./_lift.cjs');
const MINE=['_CU_DUE_DAYS','_CU_MAX_DAYS','_CU_WO_LIMIT','_CU_FOOD_LIMIT','_CU_LINE_MAX',
  '_CU_NAME_MAX','_CU_FEEDBACK_LABEL','_cuSpan','_cuDue','_cuDayLabel','_cuWoNote',
  '_jvCatchUpData','_cuCut','_cuClip','_cuQuote','_cuDayLines','_cuFeedback','_cuBody','jvCatchUp'];
// The real contact clock, the real day-namer, the real date parser. Every one of
// these is the shipped answer and not a fixture: the span is computed by the
// same _ccDaysSince the chip on the card reads.
const SHARED=['_ccDaysSince','_jvSpokenDay','_dbDay','_dbDs','_JV_DB_SAYS_RE','_jvNum',
  '_sbFailMark','_sbFailedSince','_sbAtCap'];
eval(closure(SHARED).code);
eval(MINE.map(defOf).join('\n'));
guard(MINE.concat(SHARED), n=>eval(n));

// ===== THE DOORS THIS DRIVES, REPLACED AFTER THE LIFT ==================
// sbSelect and textClient are real functions in index.html, so the static chase
// lifts them; they are reassigned here rather than stubbed before, because the
// eval would otherwise overwrite the stub and this suite would try to reach the
// live project. Reassigning after means _jvCatchUpData closes over THESE.
let ROWS={workout_logs:[], food_logs:[]}, ASKED=[];
let SENT=null, TOASTS=[];
global.sbSelect=async function(table, filter){ ASKED.push(table+'?'+filter); return (ROWS[table]||[]).slice(); };
global.textClient=function(code, body){ SENT={code:code, body:body}; };
global.showToast=function(m){ TOASTS.push(String(m)); };
global._jvShareName=function(code, fallback){ return fallback||code; };
global.CLIENTS={chrism1:{name:'Chris McCarthy', phone:'+15555550101'}};

// ===== HIS SPAN, OFF A REAL CONTACT ROW ================================
// He texted Chris on Friday. Two calendar days back from Sunday, through the
// same _ccDaysSince the chip and the heat board read.
console.log('\n  THE SPAN, FROM THE CONTACT CLOCK:');
STORE['yjb_client_contacts']=JSON.stringify({chrism1:[{t:at(2026,7,28,16,20), k:'text'}]});
t(_ccDaysSince('chrism1')===2, 'Friday to Sunday is two days', 'got '+_ccDaysSince('chrism1'));
t(_cuDue('chrism1')===true, 'two days is due');
t(_cuSpan('chrism1')===2, 'and the message covers those two days', 'got '+_cuSpan('chrism1'));

STORE['yjb_client_contacts']=JSON.stringify({chrism1:[{t:at(2026,7,29,16,20), k:'text'}]});
t(_cuDue('chrism1')===false, 'one day is NOT due — he spoke to them yesterday');
STORE['yjb_client_contacts']=JSON.stringify({chrism1:[{t:at(2026,7,30,7,0), k:'text'}]});
t(_cuDue('chrism1')===false, 'today is not due either');
STORE['yjb_client_contacts']=JSON.stringify({chrism1:[{t:at(2026,6,1,9,0), k:'text'}]});
t(_cuDue('chrism1')===true && _cuSpan('chrism1')===7, 'sixty days quiet is capped at a week', 'span '+_cuSpan('chrism1'));
STORE['yjb_client_contacts']=JSON.stringify({});
t(_cuDaysNever(), 'never contacted at all is due, and gets the full week');
function _cuDaysNever(){ return _ccDaysSince('chrism1')===null && _cuDue('chrism1')===true && _cuSpan('chrism1')===7; }

// ===== HIS LABEL, BYTE FOR BYTE =======================================
// Copied out of the order itself. A lookalike bold face is not his bold face.
t(_CU_FEEDBACK_LABEL==='\u{1D5D9}\u{1D5F2}\u{1D5F2}\u{1D5F1}\u{1D5EF}\u{1D5EE}\u{1D5F0}\u{1D5F8}',
  'the Feedback label is the unicode bold he wrote', JSON.stringify(_CU_FEEDBACK_LABEL));

// ===== CHRIS McCARTHY, UNANSWERED SINCE FRIDAY =========================
// Rows in the shape the two tables actually hand back — a chat-logged workout
// carrying BOTH a one-line description and a notes column, a cardio session
// with no exercises at all, and a day in the middle with nothing on it.
STORE['yjb_client_contacts']=JSON.stringify({chrism1:[{t:at(2026,7,28,16,20), k:'text'}]});
ROWS={
  workout_logs:[
    {id:1, title:'Pull', description:'Lat pulldown 3x10 at 120, seated row 3x10 at 140, face pull 3x15 at 40',
     exercises:null, notes:'Shoulder felt better today, kept the rows light', date_str:'Aug 30, 2026', logged_at:'2026-08-30T14:10:00+00:00'}
  ],
  food_logs:[
    {id:11, name:'Eggs and avocado toast', meal:'Breakfast', calories:520, protein:28, carbs:38, fat:27, felt:null, date_str:'Aug 30, 2026', logged_at:'2026-08-30T13:05:00+00:00'},
    {id:12, name:'Chicken and rice bowl',  meal:'Lunch',     calories:710, protein:52, carbs:78, fat:16, felt:'Was still hungry after this one', date_str:'Aug 30, 2026', logged_at:'2026-08-30T17:40:00+00:00'}
  ]
};
let D=null;
(async()=>{
  D=await _jvCatchUpData('chrism1', _cuSpan('chrism1'));

  console.log('\n  THE READ:');
  t(!!D && D.days.length===2, 'two days in the frame', D?('got '+D.days.length):'no data');
  t(D.days[0].label==='Yesterday' && D.days[1].label==='Today',
    'oldest first, said the way the app says a day', D?(D.days.map(x=>x.label).join(' / ')):'');
  t(D.days[0].any===false, 'Saturday has nothing on it and stays in the frame');
  t(D.days[1].sessions.length===1 && D.days[1].meals.length===2, 'Sunday carries the session and both meals');
  t(/logged_at=gte\./.test(ASKED[0]) && /client_code=eq\.chrism1/.test(ASKED[0]),
    'the read is bounded by date on the server and to one client', ASKED[0]||'');

  console.log('\n  THEIR OWN WORDS, VERBATIM:');
  t(D.days[1].sessions[0].note==='Shoulder felt better today, kept the rows light',
    'the notes column is quoted exactly as written', JSON.stringify(D.days[1].sessions[0].note));
  t(D.days[1].notes[0]==='Was still hungry after this one',
    'and a note written against a meal is not dropped');
  t(!/Lat pulldown/.test(_cuWoNote(ROWS.workout_logs[0])),
    'the exercise list is NOT quoted back to them as something they wrote');

  const body=_cuBody(D);
  console.log('\n  THE DRAFTED MESSAGE:\n');
  body.split('\n').forEach(l=>console.log('    | '+l));
  console.log();

  console.log('  HIS STRUCTURE:');
  t(body.indexOf('On your last 2 days:\n\n')===0, 'it opens with the span and nothing else');
  t(/\nYesterday — nothing logged\n/.test(body), 'the empty day is PRINTED, never skipped');
  t(!/Yesterday — nothing logged yet/.test(body), 'a day that is OVER gets no "yet"');
  t(/\nToday\n/.test(body), 'the day that has something on it is just the day');
  t(/Eggs and avocado toast · Chicken and rice bowl/.test(body), 'meal names, brief, in the order eaten');
  t(/\n1,230 cal · 80g protein \/ 116g carbs \/ 43g fat\n/.test(body),
    'total calories, then protein\/carbs\/fat, on their own line');
  t(/Trained: Pull — “Shoulder felt better today, kept the rows light”/.test(body),
    'training brief, with their note quoted verbatim beside it');
  t(/Chicken and rice bowl — “Was still hungry after this one”/.test(body),
    'the meal note is quoted too — ANY note they wrote');

  console.log('  THE LINE BUDGET (3-4 a day, his rule):');
  const blocks=body.split('\n\n').slice(1).filter(b=>b.indexOf(_CU_FEEDBACK_LABEL)!==0);
  blocks.forEach((b,i)=>{
    const n=b.split('\n').length;
    t(n>=1 && n<=4, 'day block '+(i+1)+' is '+n+' line'+(n===1?'':'s'));
  });

  console.log('  THE FEEDBACK:');
  const fb=body.slice(body.indexOf(_CU_FEEDBACK_LABEL));
  t(fb.indexOf(_CU_FEEDBACK_LABEL+': ')===0, 'the label leads it, bold, with a colon');
  t(/logged food on 1 of the 2 days/.test(fb), 'it counts the days off the same frame');
  t(/averaging 1,230 cal and 80g protein/.test(fb), 'and every figure in it is one this file computed');
  t(/1 session/.test(fb), 'the session count is there');
  t(/The 1 day with nothing on it is what I want to close/.test(fb),
    'and the hole is named, because the hole is the point');
  // NOTHING A MODEL WROTE. Every number in the drafted feedback has to be one
  // the arithmetic above produced — the lane's founding law, asserted rather
  // than promised, the way _jvDebriefVerify asserts it for the debrief.
  const figures=new Set(['1','2','1,230','80']);
  const inFb=(fb.match(/\d[\d,]*/g)||[]);
  t(inFb.every(n=>figures.has(n)), 'no figure in the feedback that the data did not produce', inFb.join(' '));

  // ===== A DAY IN PROGRESS IS NOT A DAY THEY MISSED =====================
  // Found live at 09:05 on a Sunday: a real draft to Chris McCarthy said
  // "Today — nothing logged" about a day nine hours old. The hole is still
  // printed; it just stops reading as an accusation about a morning.
  console.log('\n  THE MORNING CASE:');
  ROWS={workout_logs:[], food_logs:[]};
  const Dm=await _jvCatchUpData('chrism1', 2);
  const bm=_cuBody(Dm);
  t(/Today — nothing logged yet/.test(bm), 'today, still running, says "yet"');
  t(/Yesterday — nothing logged\n/.test(bm) && !/Yesterday — nothing logged yet/.test(bm),
    'and yesterday, which is over, does not');
  t(Dm.days[1].isToday===true && Dm.days[0].isToday===false, 'only the last day in the frame is today');

  // ===== NAME EVERY FOOD (Yusuf, ruling, 10 Aug) ========================
  // The real draft joined seven of Chris's meals and cut the line at 110
  // characters, producing "Sourdough Bre…". Food hidden behind an ellipsis is
  // the exact thing that ruling forbids.
  console.log('\n  EVERY FOOD IS NAMED:');
  const SEVEN=['Greek Yogurt','Catfish, Broccoli & Rice','Ground Beef','3 Eggs',
               'Cottage Cheese 2%','Broccoli','Sourdough Bread and Butter'];
  ROWS={workout_logs:[], food_logs:SEVEN.map((n,i)=>({id:100+i, name:n, meal:'Meal', calories:200,
    protein:20, carbs:10, fat:5, felt:null, date_str:'Aug 30, 2026', logged_at:'2026-08-30T13:0'+i+':00+00:00'}))};
  NOW=new RealDate(2026,7,30,9,5,0);
  const D7=await _jvCatchUpData('chrism1', 2);
  const b7=_cuBody(D7);
  const mealLine=b7.split('\n').find(l=>/Greek Yogurt/.test(l))||'';
  console.log('    | '+mealLine);
  SEVEN.forEach(n=>t(mealLine.indexOf(n)>=0, 'named in full: '+n));
  t(mealLine.length>110, 'the joined line is allowed to run long rather than lose a food',
    String(mealLine.length)+' chars');
  t(!/…/.test(mealLine), 'and nothing on the plate is behind an ellipsis');
  // One runaway NAME is still cut — that is a typo, not a plate.
  ROWS.food_logs=[{id:1, name:'x'.repeat(200), meal:'Meal', calories:10, protein:1, carbs:1, fat:1,
    felt:null, date_str:'Aug 30, 2026', logged_at:'2026-08-30T13:00:00+00:00'}];
  const Dx=await _jvCatchUpData('chrism1', 2);
  t(/x{60,63}…/.test(_cuBody(Dx)), 'a single 200-character name is still bounded');
  NOW=new RealDate(2026,7,30,9,15,0);

  // ===== ACROSS A WEEK AND A MONTH BOUNDARY =============================
  console.log('\n  ACROSS THE BOUNDARIES:');
  NOW=new RealDate(2026,8,1,9,15,0);                 // Tuesday 1 September 2026
  STORE['yjb_client_contacts']=JSON.stringify({chrism1:[{t:at(2026,7,27,16,20), k:'text'}]});   // Thursday 27 Aug
  t(_cuSpan('chrism1')===5, 'Thursday to Tuesday is a five day span', 'got '+_cuSpan('chrism1'));
  ROWS={
    workout_logs:[
      {id:2, title:'Bike', description:'45 minute ride, zone 2', exercises:null, notes:null,
       date_str:'Aug 29, 2026', logged_at:'2026-08-29T15:00:00+00:00'},
      {id:3, title:'Legs', description:'Back squat 4x6 at 225 then 3x8 at 205, paused reps on the last set, belt on from the third set onward\nRomanian deadlift 3x10 at 155\nFelt strong, best squat session in weeks',
       exercises:null, notes:null, date_str:'Sep 1, 2026', logged_at:'2026-09-01T13:30:00+00:00'}
    ],
    food_logs:[
      {id:21, name:'Protein oats', meal:'Breakfast', calories:430, protein:34, carbs:52, fat:9, felt:null,
       date_str:'Aug 28, 2026', logged_at:'2026-08-28T12:20:00+00:00'}
    ]
  };
  const D2=await _jvCatchUpData('chrism1', _cuSpan('chrism1'));
  const b2=_cuBody(D2);
  console.log('\n  THE DRAFTED MESSAGE:\n');
  b2.split('\n').forEach(l=>console.log('    | '+l));
  console.log();
  t(D2.days.length===5, 'five days in the frame');
  // Monday 31 August IS yesterday from Tuesday 1 September — the app's one
  // day-namer says so and this suite was written expecting a weekday there.
  // The code was right; the expectation was not.
  t(D2.days.map(x=>x.label).join('|')==='Friday|Saturday|Sunday|Yesterday|Today',
    'the span runs Aug 28 to Sep 1 — across the week AND the month',
    D2.days.map(x=>x.label).join('|'));
  t(D2.days[0].ds==='Aug 28, 2026' && D2.days[4].ds==='Sep 1, 2026',
    'and the frame really is those five calendar dates',
    D2.days.map(x=>x.ds).join(' / '));
  t(/On your last 5 days:/.test(b2), 'and it says so at the top');
  t(D2.days[0].meals.length===1, 'August the 28th kept its breakfast across the month line');
  t(D2.days[1].sessions.length===1 && D2.days[1].sessions[0].title==='Bike',
    'the bike ride counts as training — cardio is training');
  t(/Trained: Bike/.test(b2), 'and the cardio session is named in the message');
  t(/Trained: Legs — “Felt strong, best squat session in weeks”/.test(b2),
    'a sign-off mined out of a multi-line description is quoted; the lifts are not',
    JSON.stringify(D2.days[4].sessions[0].note));
  t(!/225/.test(b2) && !/Romanian/.test(b2), 'no set, rep or load leaks into the message');
  // THE LINE THAT WOULD HAVE LEAKED. The debrief treats anything over ninety
  // characters as speech; that squat line is 104 and is pure exercise list, so
  // the same rule here would quote a client's own loads back at them as
  // something they "wrote". _cuWoNote asks for the actual signal instead.
  t(!/paused reps/.test(b2), 'and a 104-character exercise line is still not a note');
  t((b2.match(/— nothing logged/g)||[]).length===2, 'both empty days are printed');
  t(/The 2 days with nothing on them are what I want to close/.test(b2),
    'and the feedback says "days ... are", not "days ... is"');

  // ===== A FAILED READ IS NOT AN EMPTY WEEK =============================
  // The worst thing this button could send, and the reason the fail marks are
  // in the read at all. sbSelect answers [] for a refusal.
  console.log('\n  A READ THAT FAILED:');
  ROWS={workout_logs:[], food_logs:[]};
  const bump=global.sbSelect;
  global.sbSelect=async function(table, filter){ window._sbFailN=(window._sbFailN||0)+1; return []; };
  const D3=await _jvCatchUpData('chrism1', 5);
  t(D3.failed.food===true && D3.failed.workouts===true, 'the failure is carried, not swallowed');
  SENT=null; TOASTS=[];
  await jvCatchUp('chrism1');
  t(SENT===null, 'and NOTHING is drafted — no message claiming they logged nothing');
  t(TOASTS.some(m=>/Could not read/.test(m)), 'he is told why', TOASTS.join(' / '));

  // A read that came back at its exact limit is unread, never complete.
  window._sbFailN=0;
  global.sbSelect=async function(table, filter){
    if(table!=='food_logs') return [];
    return Array.from({length:600},(_,i)=>({id:i, name:'x', meal:'Snack', calories:1, protein:0, carbs:0, fat:0,
      date_str:'Sep 1, 2026', logged_at:'2026-09-01T12:00:00+00:00'}));
  };
  const D4=await _jvCatchUpData('chrism1', 5);
  t(D4.failed.food===true, 'a read at its exact limit is unread, not complete');
  global.sbSelect=bump;

  // ===== AND IT REACHES THE CLIENT THROUGH THE ONE DOOR =================
  console.log('\n  THE HANDOFF:');
  window._sbFailN=0; window._cuBusy=0;
  ROWS={workout_logs:[], food_logs:[]};
  SENT=null; TOASTS=[];
  await jvCatchUp('chrism1');
  t(SENT && SENT.code==='chrism1', 'it hands off through textClient — the same door Share day uses');
  t(SENT && /On your last 5 days:/.test(SENT.body), 'carrying the drafted span');
  t(SENT && /Nothing has come through from you in those 5 days/.test(SENT.body),
    'a genuinely empty week says so, and asks');

  // ===== BOTH SURFACES OR IT IS HALF SHIPPED ============================
  // CLAUDE.md names this the single most repeated mistake in this file. The
  // assertion is on the shipped markup, not on a renderer being callable.
  console.log('\n  BOTH SURFACES:');
  const src=fs.readFileSync('index.html','utf8');
  const desk=src.slice(src.indexOf('function _pfCard('), src.indexOf('function feedCloseDetail('));
  t(/_cuDue\(b\.code\)/.test(desk) && /jvCatchUp\(/.test(desk),
    'the desktop cockpit card carries it');
  const mob=src.slice(src.indexOf('SHARE DAY ON THE PHONE'), src.indexOf('SHARE DAY ON THE PHONE')+4000);
  t(/_cuDue\(c\)/.test(mob) && /jvCatchUp\(/.test(mob),
    'and so does the mobile front desk');
  t(/\+_cuBtn\s*\n\s*\+'<\/div>'/.test(mob),
    'and the phone actually PUTS it in the row, not merely builds it');
  t(/\.fdShareRow\{[^}]*gap:8px/.test(src), 'the phone row has room for two buttons');

  console.log();
  if(bad){ console.log('  '+bad+' FAILED'); process.exit(1); }
  console.log('  all '+ 'catch up' +' assertions pass');
  process.exit(0);
})().catch(e=>{ console.log('  FAIL  the suite threw: '+(e&&e.stack||e)); process.exit(1); });
