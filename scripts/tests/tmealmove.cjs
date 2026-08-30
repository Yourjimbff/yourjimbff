// MOVING A NAMED CLIENT'S MEAL (ship 8) — the door, and the proof it is reachable.
//
// THE ROUTING-PROOF LAW: no capability ships without its natural phrasings run
// down the REAL gates in the REAL order, arriving at the right door. This door
// sits in dangerous company — _JT_CAL_RE claims the bare phrase "move my/his/her"
// and has stolen meal moves before, and the logging engine below it acts on the
// SIGNED-IN account, so a sentence that slipped past would move Yusuf's own meal
// instead of the client's and say it had done the right thing.
//
// THE FALLTHROUGH IS AS LOAD-BEARING AS THE DOOR. "Move my breakfast to
// yesterday" must NOT be claimed here. Zero name hits returns null so his own
// meal moves keep going where they always have.
const fs=require('fs');
const guard=require('./_guard.cjs');
const {closure,defOf}=require('./_lift.cjs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra!==undefined&&extra!==''?('  '+extra):'')); };

global.window={addEventListener:()=>{},matchMedia:()=>({matches:false}),_sbFailN:0};
global.document={addEventListener:()=>{},getElementById:()=>null,querySelectorAll:()=>[],
  querySelector:()=>null,body:{classList:{contains:()=>false}}};
global.localStorage={getItem:()=>null,setItem:()=>{}};

const MINE=['_JT_MEAL_NOUN_RE','_JT_DAY_TARGET_RE','_JT_SLOT_TARGET_RE','_JT_CAL_ONLY_RE','_JT_CAL_RE',
  '_JV_MMV_NOTFOOD_RE','_jvMealMoveAsked','_MV_MONTHS','_mvDayFrom','_mvSlotFrom','_mvHalves',
  '_jvClientMealMove','_tlDateStr','_jtMealMove','_jtCalendarClaims','_JT_PAST_MEAL_RE','_JT_SCHED_INTENT_RE',
  '_JT_ONE_BRAIN_HOLD'];
const SHARED=['_jvNameMatch','_jvFindClientIn','_jvSafeName','_escHtml','_sbFailMark','_sbFailedSince'];
eval(closure(SHARED).code);
eval(MINE.map(defOf).join('\n'));
guard(MINE.concat(SHARED), n=>eval(n));

CLIENTS={ chrism1:{name:'Chris McCarthy'}, christiana1:{name:'Christiana Ruiz'},
          kellyg1:{name:'Kelly G'}, spencerr1:{name:'Spencer R'}, thegoat:{name:'Yusuf', isTrainer:true} };
// BARE ASSIGNMENTS, ON PURPOSE. index.html declares `var cl` at its top level
// and the lift brings that declaration with it, so `global.cl = ...` sets a
// DIFFERENT binding and the door reads the lifted `cl`, which is still null.
// In the browser those are one and the same; in node they are not.
cl={code:'thegoat', name:'Yusuf'};
isTrainer=c=>c==='thegoat';
global.window.cl=cl;
global.isTrainer=isTrainer;

// ---- a fixed clock, so every date below is derived and never hard-coded ----
// Aug 29 2026 is a Saturday. Asserted, not assumed: a literal date is exactly
// what breaks in another time zone.
const NOW=new Date(2026,7,29,10,0,0);
t(NOW.getDay()===6, 'the fixture clock is a Saturday', String(NOW.getDay()));
const ds=(y,m,d)=>_tlDateStr(new Date(y,m,d));

console.log('\n  THE DAY A SENTENCE NAMES, derived from the clock:');
t(_mvDayFrom('to yesterday',NOW)===ds(2026,7,28), 'yesterday', _mvDayFrom('to yesterday',NOW));
t(_mvDayFrom('to this morning',NOW)===ds(2026,7,29), 'this morning is today', _mvDayFrom('to this morning',NOW));
t(_mvDayFrom('to tomorrow',NOW)===ds(2026,7,30), 'tomorrow');
t(_mvDayFrom('last night',NOW)===ds(2026,7,28), 'last night is yesterday');
t(_mvDayFrom('on Thursday',NOW)===ds(2026,7,27), 'a weekday means the most recent one', _mvDayFrom('on Thursday',NOW));
t(_mvDayFrom('on Sunday',NOW)===ds(2026,7,23), 'and never reaches forward for one', _mvDayFrom('on Sunday',NOW));
t(_mvDayFrom('on Aug 22',NOW)===ds(2026,7,22), 'an explicit month and day');
t(_mvDayFrom('on the 22nd',NOW)===ds(2026,7,22), 'an ordinal in this month');
t(_mvDayFrom('to dinner',NOW)===null, 'a slot alone names no day');
// A DATE AHEAD OF TODAY is last year's, never a meal that has not happened.
t(_mvDayFrom('on Dec 25',NOW)===ds(2025,11,25), 'a date ahead of today is last year', _mvDayFrom('on Dec 25',NOW));

console.log('\n  THE TWO HALVES OF THE SENTENCE:');
const h=_mvHalves('move the blueberry pancakes I had on Saturday to this morning');
t(/Saturday/.test(h.from) && !/Saturday/.test(h.to), 'the source is before the last "to"');
t(/this morning/.test(h.to), 'and the target after it', h.to);
t(_mvSlotFrom('to dinner')==='Dinner' && _mvSlotFrom('his breakfast')==='Breakfast', 'slots read both ways');

console.log('\n  WHAT THE RECOGNISER WILL AND WILL NOT TAKE:');
[['move Chris McCarthy\'s breakfast to Sunday',true],
 ['move Spencer\'s lunch to dinner',true],
 ['shift Kelly G\'s dinner to yesterday',true],
 ['move my breakfast to yesterday',true],
 ['move his session to Tuesday',false],
 ['move Chris\'s workout to Thursday',false],
 ['move his call to Friday',false],
 ['move Kelly\'s pilates class to Tuesday',false],
 ['move my meal prep block to Sunday',false],
 ['what did Chris eat yesterday',false],
].forEach(([s,want])=>t(_jvMealMoveAsked(s)===want, JSON.stringify(s)+' -> '+(want?'a meal move':'not this door')));

// ===== THE ROUTING PROOF ================================================
console.log('\n  THE LADDER, IN THE ORDER _jtRunItem RUNS IT:');
const ORDER=[
  ['book command',   "var bk=await _jvBookCommand(t);"],
  ['contact',        "var cc=await _ccHandleStatement(t);"],
  ['feed command',   "fc=await _jvFeedCommand(t);"],
  ['debrief',        "var _db=await _jvDebriefTurn(t);"],
  ['MEAL MOVE',      "var _mv=await _jvClientMealMove(t);"],
  ['roster answer',  "var _rq=_jvRosterAnswer(t);"],
  ['day board',      "var _rd=await _jvDayReadout(t);"],
  ['calendar',       "if(_jtCalendarClaims(t)){"],
];
let last=-1;
ORDER.forEach(([name,needle])=>{
  const i=src.indexOf(needle);
  t(i>0, name+' is in the ladder');
  t(i>last, '  ...and sits below the one above');
  last=i;
});
t(src.indexOf("var _mv=await _jvClientMealMove(t);") < src.indexOf("if(_jtCalendarClaims(t)){"),
  'THE MEAL MOVE SITS ABOVE THE CALENDAR GATE, which claims "move his"');

console.log('\n  A SLOT IS A TARGET TOO (the bug this proof found):');
// "move my lunch to dinner" named no DAY, so the calendar's meal-move veto did
// not fire and _JT_CAL_RE's "move my" took his own slot move to the appointment
// builder. Found by running the ladder rather than by calling the door.
t(_jtMealMove('move my lunch to dinner')===true, 'a slot target counts as a meal move');
t(_jtMealMove('move my breakfast to yesterday')===true, 'and a day target still does');
t(_jtMealMove('move my meal prep block to Sunday')===false, 'while a block on his week still does not');
t(_jtCalendarClaims('move my lunch to dinner')===false, 'so the calendar no longer claims it');

console.log('\n  THE THIEF IS REAL, and is held above:');
t(/move \(my\|his\|her\)/.test(defOf('_JT_CAL_RE')), 'the calendar gate really does claim "move my/his/her"');
t(_jtCalendarClaims("move Chris's breakfast to Sunday")===false,
  'and its own meal-move veto already lets a meal past it');

console.log('\n  WHERE A SENTENCE ACTUALLY LANDS:');
// The real gates, in the real order, for everything above this door that could
// plausibly claim one of these sentences.
// A NULL KEEPS FALLING. The first version of this returned early when the meal
// door declined, which modelled the door and not the ladder - so deleting the
// calendar's meal-move veto changed nothing here and the mutant lived. In the
// real _jtRunItem a null from this door means the sentence carries on DOWN,
// straight into the gate that used to steal it.
function land(s){
  if(_jvMealMoveAsked(s)){
    let hits=[]; try{ const f=_jvFindClientIn(s); hits=(f&&f.hits)||[]; }catch(e){}
    if(hits.length===1) return 'mealmove:'+hits[0];
    if(hits.length>1) return 'mealmove:ask-which';
    // zero hits: not this door's sentence. It falls past, and what is BELOW
    // now gets its chance - which is the whole point of proving routing.
  }
  if(_jtCalendarClaims(s)) return 'calendar';
  return 'falls through to the engine';
}
[["move Chris McCarthy's breakfast to Sunday",'mealmove:chrism1'],
 ["shift Spencer's dinner to yesterday",'mealmove:spencerr1'],
 ["move Kelly G's lunch to dinner",'mealmove:kellyg1'],
 ["can you move the blueberry pancakes Chris McCarthy had on Saturday to this morning",'mealmove:chrism1'],
 ["move Chris's breakfast to Sunday",'mealmove:ask-which'],
 ["move my breakfast to yesterday",'falls through to the engine'],
 ["move my lunch to dinner",'falls through to the engine'],
 ["move his session to Tuesday",'calendar'],
].forEach(([s,want])=>t(land(s)===want, JSON.stringify(s.slice(0,52))+' -> '+want, land(s)));

// ===== THE DOOR ITSELF, DRIVEN ==========================================
const ROWS=[
  {id:'11111111-1111-1111-1111-111111111111',name:'Blueberry pancakes',meal:'Breakfast',eat_time:'8:00 AM',calories:640,date_str:ds(2026,7,22),logged_at:'2026-08-22T12:00:00Z'},
  {id:'22222222-2222-2222-2222-222222222222',name:'Chicken and rice',meal:'Lunch',eat_time:'1 pm',calories:700,date_str:ds(2026,7,28),logged_at:'2026-08-28T17:00:00Z'},
  {id:'33333333-3333-3333-3333-333333333333',name:'Steak',meal:'Dinner',eat_time:'7 pm',calories:800,date_str:ds(2026,7,28),logged_at:'2026-08-28T23:00:00Z'},
];
let sent=null, failRead=false, doorAnswer=null;
global.sbSelect=async function(tbl,q){
  if(failRead){ window._sbFailN++; return []; }
  return /client_code=eq\.chrism1/.test(q) ? ROWS.map(r=>Object.assign({},r)) : [];
};
global.trainerWrite=async function(op,args){
  sent={op:op,args:args};
  if(doorAnswer) return doorAnswer;
  const row=ROWS.filter(r=>r.id===args.id)[0];
  if(!row) return {ok:false, rows:[], status:404};
  const landed=Object.assign({},row);
  if(args.date_str) landed.date_str=args.date_str;
  if(args.meal) landed.meal=args.meal;
  return {ok:true, rows:[landed], status:200};
};
const run=async(s)=>{ sent=null; return await _jvClientMealMove(s); };

(async function(){
  let r;

  console.log('\n  IT MOVES THE RIGHT MEAL, THROUGH THE DOOR:');
  r=await run("move Chris McCarthy's breakfast to yesterday");
  t(!!r && r.ok, 'it handled the sentence', r&&r.line);
  t(sent && sent.op==='mealEdit', 'through mealEdit, never a raw patch', sent&&sent.op);
  t(sent.args.client_code==='chrism1' && sent.args.id==='11111111-1111-1111-1111-111111111111',
    'carrying the client AND the row id together');
  const YESTERDAY=_mvDayFrom('to yesterday');
  t(sent.args.date_str===YESTERDAY, 'and the day it is going to', sent.args.date_str+' vs '+YESTERDAY);
  t(/Moved Chris McCarthy/.test(r.speak), 'and says whose meal moved', r.speak);
  t(/Read back from the row/.test(r.speak), 'and that it was read back');

  console.log('\n  THE CLOCK RULE — a moved meal keeps its stated eat time:');
  t(sent.args.eat_time===undefined, 'eat_time is never sent, so the row keeps its own');
  t(/kept its stated time of 8:00 AM/.test(r.speak), 'and the confirmation says so', r.speak);

  console.log('\n  A SLOT MOVE:');
  r=await run("move Chris McCarthy's lunch to dinner");
  t(!!r && r.ok, 'handled');
  t(sent.args.meal==='Dinner', 'the target slot is sent', sent.args.meal);
  t(sent.args.date_str===undefined, 'and no day, because he named none');
  t(sent.args.id==='22222222-2222-2222-2222-222222222222', 'and it picked the lunch, not the dinner');

  console.log('\n  IT NAMES THE MEAL WHEN HE DOES:');
  r=await run("move the blueberry pancakes Chris McCarthy had on Aug 22 to this morning");
  t(!!r && r.ok, 'handled', r&&r.line);
  t(sent.args.id==='11111111-1111-1111-1111-111111111111', 'matched on the food\'s own name');

  console.log('\n  IT NEVER GUESSES A PERSON:');
  r=await run("move Chris's breakfast to Sunday");
  t(!!r && r.ok===false && /Which one/.test(r.speak), 'two Chrises asks which', r&&r.speak);
  t(sent===null, 'and writes nothing while it asks');
  r=await run("move my breakfast to yesterday");
  t(r===null, 'his own meal is NOT this door\'s sentence, it falls through');
  t(sent===null, 'and nothing was written');

  console.log('\n  IT NEVER GUESSES A MEAL:');
  r=await run("move Chris McCarthy's snack to Sunday");
  t(!!r && r.ok===false && /cannot see/.test(r.speak), 'a meal that is not there is said plainly', r&&r.speak);
  t(sent===null, 'and nothing is written');
  r=await run("move Chris McCarthy's meal to Sunday");
  t(!!r && r.ok===false && /Which one/.test(r.speak), 'three candidates asks which', r&&r.speak);
  t(sent===null, 'and still writes nothing');

  console.log('\n  A FAILED READ IS NOT AN EMPTY DAY:');
  failRead=true;
  r=await run("move Chris McCarthy's breakfast to yesterday");
  t(!!r && r.ok===false && /could not read/.test(r.speak), 'it says the read failed', r&&r.speak);
  t(!/cannot see/.test(r.speak), 'and does NOT claim the meal is not there');
  t(sent===null, 'and moves nothing');
  failRead=false;

  console.log('\n  A REFUSED WRITE IS NEVER REPORTED AS A MOVE:');
  doorAnswer={ok:false, rows:[], status:404};
  r=await run("move Chris McCarthy's breakfast to yesterday");
  t(!!r && r.ok===false, 'a 404 from the door is a failure');
  t(/could not move/.test(r.speak) && !/Moved/.test(r.speak), 'and says so instead of claiming a move', r.speak);
  doorAnswer={ok:true, rows:[], status:200};
  r=await run("move Chris McCarthy's breakfast to yesterday");
  t(!!r && r.ok===false, 'an empty answer is a failure too, not a success');
  doorAnswer=null;

  console.log('\n  A ROW THAT CAME BACK WRONG IS NOT A MOVE EITHER:');
  doorAnswer={ok:true, status:200, rows:[{id:'11111111-1111-1111-1111-111111111111',name:'Blueberry pancakes',
    meal:'Breakfast',eat_time:'8:00 AM',date_str:'Jan 1, 2020'}]};
  r=await run("move Chris McCarthy's breakfast to yesterday");
  t(!!r && r.ok===false && /did not come back where I sent it/.test(r.speak),
    'a row that landed somewhere else is refused', r&&r.speak);
  doorAnswer=null;

  console.log('\n  A CLIENT SESSION CANNOT REACH IT:');
  isTrainer=c=>false;
  r=await run("move Chris McCarthy's breakfast to yesterday");
  t(r===null, 'not a trainer, not this door');
  isTrainer=c=>c==='thegoat';

  console.log('\n  NOTHING TOUCHES THE PUBLIC KEY:');
  const fn=src.slice(src.indexOf('async function _jvClientMealMove('), src.indexOf('// ===== PER-CLIENT VERBATIM NOTES'));
  t(fn.length>800, 'the door is findable', String(fn.length));
  t(/trainerWrite\('mealEdit'/.test(fn), 'it writes through mealEdit');
  t(!/sbWrite|sbUpsert|sbInsert|SB_URL/.test(fn), 'and never through the public key');
  t(!/eat_time:/.test(fn.slice(fn.indexOf('var patch='), fn.indexOf('trainerWrite'))),
    'and the patch never carries eat_time');

  console.log('');
  if(bad){ console.log('  '+bad+' FAILED'); process.exit(1); }
  console.log('  all pass');
  // EXIT EXPLICITLY, like every other suite here. Falling off the end leaves
  // node alive whenever the lift has pulled in anything that holds a handle,
  // so the suite PASSES and then hangs forever — and run.sh, which waits for
  // each suite in turn, waits with it. Cost me the whole run once.
  process.exit(0);
})();
