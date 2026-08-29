// SHADOW MODE — the brain routes beside the gates and changes nothing.
//
// THE BREAKING CASE, in his words: he asked about Chris McCarthy, got "Ready.
// What do you need?", said "full debrief", and got his own day board.
//
// Every gate behaved exactly as written. _jvDebriefTurn returns null when no
// name resolves — which is correct and deliberate, it is what stops the debrief
// stealing his morning board — so "full debrief" fell past it to _jvDayReadout,
// which claims the bare word "debrief" and means HIS day. Nothing was broken.
// A phrase-matcher simply cannot know that "full debrief" three seconds after
// "how's Chris McCarthy" is still about Chris.
//
// WHAT THIS SUITE CAN AND CANNOT PROVE. It cannot run the model, so it does not
// claim the brain routes correctly — that is what shadow mode on his phone is
// for, and the report is the evidence. What it proves is everything around the
// model: that the miss is real and reproducible, that the seam cannot touch the
// live path, that the prompt carries all five parts he ordered, and that the
// memory of the moment actually contains the subject the gates could not see.
const fs=require('fs');
const guard=require('./_guard.cjs');
const {closure,defOf}=require('./_lift.cjs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra!==undefined&&extra!==''?('  '+extra):'')); };

const store={};
global.localStorage={getItem:k=>(k in store?store[k]:null),setItem:(k,v)=>{store[k]=String(v);},removeItem:k=>{delete store[k];}};
global.window={addEventListener:()=>{},matchMedia:()=>({matches:false})};
global.document={addEventListener:()=>{},getElementById:()=>null,querySelectorAll:()=>[],
  querySelector:()=>null,body:{classList:{contains:()=>false}}};
global.APP_VERSION='v-test';

const MINE=['JV_TOOLS','_jvBrainMemory','_jvBrainPrompt','_jvGateWouldClaim',
  '_JV_SHADOW_CAP','_jvShadowCount',
  '_JV_SHADOW','_JV_SHADOW_MAX','_JV_SHADOW_KEY','_jvShadowOn','_jvShadowRecord',
  '_jvShadowLoad','_jvShadowClear','_jvShadowReport',
  '_JV_SHADOW_RE','_JV_SHADOW_OFF_RE','_JV_SHADOW_ONN_RE',
  '_JV_HELP_RE','_JV_DEBRIEF_RE','_JV_DEBRIEF_SOFT_RE','_JV_DEBRIEF_PAST_RE','_JV_RQ_DAY',
  '_JT_NEWCLIENT_RE','_JT_PHONE_RE','_JV_TAPE_RE','_JV_TAPE_CLEAR_RE',
  '_JT_MEAL_NOUN_RE','_JT_DAY_TARGET_RE','_JT_SLOT_TARGET_RE','_JT_CAL_ONLY_RE','_JT_CAL_RE',
  '_JV_MMV_NOTFOOD_RE','_jvMealMoveAsked','_jtMealMove','_jtCalendarClaims',
  '_JT_PAST_MEAL_RE','_JT_SCHED_INTENT_RE','_JT_ONE_BRAIN_HOLD'];
const SHARED=['_jvFindClientIn'];
eval(closure(SHARED).code);
eval(MINE.map(defOf).join('\n'));
guard(MINE.concat(SHARED), n=>eval(n));

CLIENTS={ chrism1:{name:'Chris McCarthy'}, christiana1:{name:'Christiana Ruiz'},
          kellyg1:{name:'Kelly G'}, spencerr1:{name:'Spencer R'}, thegoat:{name:'Yusuf', isTrainer:true} };
cl={code:'thegoat', name:'Yusuf'};
isTrainer=c=>c==='thegoat';
global.window.cl=cl;
_jtLoad=()=>global.window._jtThread||[];

console.log('  HIS MISS IS REAL, AND REPRODUCIBLE:');
// The exact exchange, run through the real gates in the real order.
t(_jvGateWouldClaim("how's Chris McCarthy")==='answer',
  '"how\'s Chris McCarthy" reaches no tool at all — it falls to the model', _jvGateWouldClaim("how's Chris McCarthy"));
t(_jvGateWouldClaim('full debrief')==='day_board',
  'and "full debrief" lands on HIS DAY BOARD, which is the miss he hit', _jvGateWouldClaim('full debrief'));
t(_jvGateWouldClaim('debrief for Chris McCarthy')==='debrief',
  'while the SAME request with the name spelled out works perfectly');
// Which is the whole point: the capability was never missing, only unreachable.
t(/\\bdebrief\\b/.test(defOf('_JV_RQ_DAY')) || /debrief/.test(defOf('_JV_RQ_DAY')),
  'because the day board claims the bare word "debrief"');

console.log('\n  HIS REAL MISSES THIS MONTH — the first test set:');
// Every one of these actually happened to him and is recorded in this repo's
// own comments. Several have since been fixed ONE AT A TIME, by hand, by adding
// a gate or widening a regex - which is exactly the treadmill the rethink ends.
// The column on the right is what the gates do with each one TODAY, so the
// shadow report has a baseline to be compared against.
//
// This asserts the CURRENT behaviour, not the desired one. Where it says a
// sentence still lands wrong, that is the honest state of the ladder.
const MISSES=[
  ["how's Chris McCarthy",                       'answer',    'STILL WRONG: no tool, falls to the model'],
  ['full debrief',                               'day_board', 'STILL WRONG: his day board, not Chris'],
  ['run it back on Chris McCarthy',              'answer',    'STILL WRONG: a phrasing no gate knows'],
  ['gimme the breakdown on Chris McCarthy',      'answer',    'STILL WRONG: same, different words'],
  ['debrief for Chris McCarthy',                 'debrief',   'fixed 29 Aug, and still right'],
  ['move my breakfast to yesterday',             'answer',    'fixed 26 Aug: no longer stolen by the calendar'],
  ['move my lunch to dinner',                    'answer',    'fixed 29 Aug: the slot-target hole'],
  ["move Chris McCarthy's breakfast to Sunday",  'meal_move', 'shipped 29 Aug'],
  ['what can you do',                            'help',      'deterministic, never a model']
];
MISSES.forEach(function(row){
  const got=_jvGateWouldClaim(row[0]);
  t(got===row[1], JSON.stringify(row[0].slice(0,42))+' -> '+row[1], row[2]+(got===row[1]?'':('  GOT '+got)));
});
// THE SHAPE OF THE PROBLEM, stated as a number rather than an opinion: four of
// his own sentences about ONE client still reach no tool at all.
const stillLost=MISSES.filter(function(r){ return r[2].indexOf('STILL WRONG')===0; }).length;
t(stillLost===4, 'four of these still miss today, which is what the brain is for', String(stillLost));

console.log('\n  THE MEMORY OF THE MOMENT holds what the gates could not see:');
global.window._jtThread=[
  {r:'me', h:"how's Chris McCarthy", t:Date.now()-9000},
  {r:'jarvis', h:'Ready. What do you need?', t:Date.now()-6000}
];
const mem=_jvBrainMemory();
t(mem.subject==='chrism1', 'the subject on the table is Chris, from the turn before', mem.subject);
t(mem.subjectName==='Chris McCarthy', 'by name, so the prompt can say it', mem.subjectName);
t(mem.turns.length===2, 'and the recent turns ride along', String(mem.turns.length));
// AN OPEN CARD IS ALSO A SUBJECT.
global.window._jtThread=[];
global.window._jvDeepCode='kellyg1';
t(_jvBrainMemory().subject==='kellyg1', 'an open client card is a subject too');
global.window._jvDeepCode=null;
// AND NOTHING INVENTS ONE.
global.window._jtThread=[{r:'me', h:'what time is it', t:Date.now()}];
t(_jvBrainMemory().subject==='', 'with nobody on the table it stays empty, never a guess',
  JSON.stringify(_jvBrainMemory().subject));

console.log('\n  THE MASTER PROMPT CARRIES ALL FIVE PARTS HE ORDERED:');
global.window._jtThread=[{r:'me', h:"how's Chris McCarthy", t:Date.now()}];
const P=_jvBrainPrompt(_jvBrainMemory());
t(/chief of staff to Yusuf/.test(P), '1. identity — his chief of staff, keyed to him');
t(/The person typing IS Yusuf/.test(P) && /not a client/.test(P), '   and never mistakes him for a client');
t(/THE TOOLS, by what they are FOR/.test(P), '2. the toolbox');
t(/Choose by meaning, never by matching words/.test(P), '   described by purpose, not trigger words');
t(/THE MOMENT:/.test(P) && /subject on the table right now is Chris McCarthy/.test(P), '3. the memory of the moment');
t(/never produce a number/.test(P) && /never claim anything happened/.test(P), '4. the laws, as ethics');
t(/matches more than one person is asked about, never guessed/.test(P), '   including exact-name discipline');
t(/TONE/.test(P), '5. his tone rules');
t(/Return ONLY JSON/.test(P) && /"tool"/.test(P), 'and a contract the app can dispatch on');

console.log('\n  THE TOOLBOX IS PURPOSE, NOT PHRASES:');
t(JV_TOOLS.length>=15, 'every proven tool is described', JV_TOOLS.length+' tools');
const ids=JV_TOOLS.map(x=>x.id);
['debrief','day_board','meal_move','phone_save','new_client','roster_answer','client_day','stop','answer']
  .forEach(id=>t(ids.indexOf(id)>=0, 'the '+id+' tool is in the list'));
// THE TEST THAT MATTERS: no tool is described by the words that trigger it.
const leaks=JV_TOOLS.filter(x=>/"|say |type |the word|phrase/i.test(x.p));
t(leaks.length===0, 'and not one of them is described by a trigger word', leaks.map(x=>x.id).join(','));
t(/full debrief/.test(P)===false, 'the prompt never lists his phrasings, so new ones resolve too');

console.log('\n  THE SEAM CANNOT TOUCH THE LIVE PATH:');
const wrap=src.slice(src.indexOf('async function _jtRunItem(t, capture, ctx){'),
                     src.indexOf('async function _jtRunItemGates(t, capture, ctx){'));
t(wrap.length>200, 'the wrapper is findable', String(wrap.length));
t(/var out=await _jtRunItemGates\(t, capture, ctx\);/.test(wrap), 'it calls the untouched ladder');
t(/return out;/.test(wrap), 'and returns exactly what the ladder returned');
// THE ONE THING THAT WOULD MAKE THIS DANGEROUS: awaiting the brain.
t(!/await _jvBrainRoute/.test(wrap), 'the brain is NEVER awaited on the way to an answer');
t(/_sh=_jvBrainRoute\(t\);/.test(wrap), 'it is started and left to land on its own');
t(/\.catch\(function\(e\)\{ _jvShadowRecord/.test(wrap), 'and a brain that fails is recorded, not thrown');
t((wrap.match(/try\{/g)||[]).length>=2, 'every part of the seam sits in a try', String((wrap.match(/try\{/g)||[]).length));
// AND IT NEVER DISPATCHES. Shadow means shadow.
t(!/_jvBrainDispatch|out=b\.|out\.tool=/.test(wrap), 'nothing the brain says is ever acted on');

console.log('\n  IT IS OFF FOR EVERYONE BUT HIM:');
const onFn=(src.match(/function _jvShadowOn\(\)\{[\s\S]*?\n\}/)||[''])[0];
t(/isTrainer\(cl\.code\)/.test(onFn), 'a client never runs the brain, so it costs them nothing');
t(/yjb_shadow_on/.test(onFn), 'and it has a switch');
store['yjb_shadow_on']='0';
t(_jvShadowOn()===false, 'which really turns it off', String(_jvShadowOn()));
store['yjb_shadow_on']='1';
t(_jvShadowOn()===true, 'and on again');

console.log('\n  THE REPORT QUOTES DISAGREEMENTS AND COUNTS AGREEMENTS:');
_jvShadowClear();
_jvShadowRecord("how's Chris McCarthy", 'answer', {tool:'debrief', client:'chrism1', why:'he wants a read on Chris before a call', ms:410});
_jvShadowRecord('full debrief', 'day_board', {tool:'debrief', client:'chrism1', why:'follow-up, still about Chris', ms:380});
_jvShadowRecord('book Kelly Tuesday at 9', 'book', {tool:'book', client:'kellyg1', why:'a booking', ms:300});
_jvShadowRecord('gibberish', 'answer', null, 'brain gave no tool');
const R=_jvShadowReport();
t(/4 messages watched/.test(R), 'it counts what it watched', R.split('\n')[3]);
t(/1 agreed/.test(R), 'and how often they agreed');
t(/2 differed/.test(R), 'and how often they did not');
t(/1 the brain could not answer/.test(R), 'and where the brain failed outright');
t(/full debrief/.test(R) && /gate  -> day_board/.test(R) && /brain -> debrief \(chrism1\)/.test(R),
  'his exact miss is quoted with both answers side by side');
t(/follow-up, still about Chris/.test(R), 'with the brain saying why');
t(!/book Kelly Tuesday/.test(R), 'and an agreement is counted, not quoted — he reads the differences');
t(R.indexOf('<')<0, 'plain text, so it survives a paste');
t(/nothing below actually happened/.test(R), 'and it says plainly that none of it was live');

console.log('\n  HE CAN REACH IT, and it steals nothing:');
// DELEGATES rather than re-deriving. My first version of this re-implemented
// the debrief gate WITHOUT its name check, so it called "full debrief" a
// debrief - the opposite of the very miss this suite exists to document. Same
// mistake I made once already in tmealmove. _jvGateWouldClaim is the one model
// of the ladder and everything defers to it.
function land(s){
  if(_JV_HELP_RE.test(s)) return 'help';
  if(_JV_TAPE_CLEAR_RE.test(s) || _JV_TAPE_RE.test(s)) return 'audio';
  if(_JV_SHADOW_OFF_RE.test(s)) return 'shadow:off';
  if(_JV_SHADOW_ONN_RE.test(s)) return 'shadow:on';
  if(_JV_SHADOW_RE.test(s)) return 'shadow:report';
  const g=_jvGateWouldClaim(s);
  return g==='answer' ? 'falls through' : (g==='day_board' ? 'day board' : g);
}
[['shadow report','shadow:report'],['brain report','shadow:report'],
 ['turn off shadow','shadow:off'],['stop shadow mode','shadow:off'],
 ['turn on shadow','shadow:on'],
 ['audio report','audio'],
 ['full debrief','day board'],
 ["how's Chris McCarthy",'falls through'],
 ['what can you do','help']
].forEach(([s,want])=>t(land(s)===want, JSON.stringify(s)+' -> '+want, land(s)));
t(src.indexOf('_JV_SHADOW_OFF_RE.test(t)') < src.indexOf('if(_JV_SHADOW_RE.test(t)){'),
  'and OFF is tested before REPORT, or "stop shadow mode" would only print it');

console.log('\n  THE ROUTER IS THE SMALL MODEL, because he watches spend:');
const route=(src.match(/async function _jvBrainRoute\(text\)\{[\s\S]*?\n\}/)||[''])[0];
t(/_JV_BRAIN_MODEL='claude-haiku-4-5-20251001'/.test(src), 'haiku, not the expensive one');
t(/max_tokens:220/.test(route), 'and a tight ceiling — this returns one small object', String(/max_tokens:220/.test(route)));
t(!/sbSelect|trainerWrite|trainerOp/.test(route), 'the router never reads a row and never writes one');

console.log('');
if(bad){ console.log('  '+bad+' FAILED'); process.exit(1); }
console.log('  all pass');
// EXIT EXPLICITLY, like every other suite here. Falling off the end leaves node
// alive whenever the lift has pulled in anything that holds a handle, so the
// suite PASSES and then hangs forever — and run.sh waits with it.
process.exit(0);
