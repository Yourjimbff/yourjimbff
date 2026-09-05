// YESTERDAY IS A TAB (Yusuf, 5 Sep).
//
//   "Q yesterday should not be like a read button. It should be a tab. It
//    doesnt make sense that Q yesterday would queue a bunch of people in an
//    entire bulk send who might not have logged yesterday. Yesterday should be
//    yesterdays replies. Thats an obligation."
//
// And, above the box:
//
//   "I would rather have more the formula of the response up there than
//    anything. Like, needs encouragement, worth encouragement, a perfect,
//    encouraging, spotty log."
//
// So this tests two things: that the tab is a VIEW over rows already loaded -
// no read, no write - and that the label above the box says what KIND of reply
// it is, decided off the record and nothing else.
const fs=require('fs');
const guard=require('./_guard.cjs');
const {closure, defOf}=require('./_lift.cjs');

let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };

global.window={}; global.document={getElementById:()=>null};
global.localStorage={ getItem:()=>null, setItem:()=>{}, removeItem:()=>{} };
global._escHtml=x=>String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

const MINE=['_crmYdayKey','_crmYday','_crmYdayAny','_CRM_VERDICTS','_crmVerdict','_crmYdayHtml','_CRM_FILTERS'];
const SHARED=['_jvNum','_dfDayKey','_dfToday','_TAP_MS','_tapKey','_dedupeTaps','_crmLogDayKey'];
eval(closure(SHARED).code);
eval(MINE.map(defOf).join('\n'));
guard(MINE.concat(SHARED), n=>eval(n));

// The two doors: the loaded logs, and the sweep.
let OWED={};
global._crmWaiting=function(code){ return OWED[code] ? {days:OWED[code], waiting:true, text:'x'} : {days:0, waiting:false, text:''}; };
global._crm={logs:{}, logsErr:false, filter:'yday'};

// Yesterday, in the key shape the loader files rows under.
const Y=_crmYdayKey();
const day=(food, work)=>({byDay:{[Y]:{food:food||[], work:work||[], weight:null, steps:null}}, days:{[Y]:1}, ever:true});
const meal=(n,c,p)=>({client_code:'x', name:n, calories:c, protein:p, carbs:0, fat:0, meal:'Meal', date_str:null, logged_at:Y+'T12:00:00Z'});

// ===== NO READ, NO WRITE ===============================================
console.log('\n  IT IS A VIEW, NOT A BUTTON:');
const src=fs.readFileSync('index.html','utf8');
const fn=src.slice(src.indexOf('function _crmYday(code){'), src.indexOf('function _crmYdayAny('));
t(!/sbSelect|await |dfWrite|trainerOp/.test(fn),
  'reading yesterday makes no request and writes no row — it is the rows already in hand');
t(/\{k:'yday',\s+label:'Yesterday'/.test(src), 'and it is the FIRST tab on the board');
const filts=src.slice(src.indexOf('var _CRM_FILTERS=['), src.indexOf('];', src.indexOf('var _CRM_FILTERS=[')));
t(filts.indexOf("k:'yday'") < filts.indexOf("k:'waiting'"), 'first, ahead of Waiting on me');
t(_CRM_FILTERS[0].k==='yday', 'and first at runtime too', _CRM_FILTERS[0].k);

// ===== A FAILED READ IS NOT AN EMPTY DAY ===============================
console.log('\n  A READ THAT FAILED IS NOT A QUIET DAY:');
_crm.logsErr=true;
t(_crmYday('a')===null,     'a failed log read answers null, never an empty day');
t(_crmYdayAny('a')===false, 'so nobody is put in the tab off a read that did not happen');
t(_crmYdayHtml('a')==='',   'and nothing is drawn');
_crm.logsErr=false; _crm.logs=null;
t(_crmYday('a')===null, 'logs not loaded yet is also null, not empty');
_crm.logs={};

// ===== WHO IS IN THE TAB ===============================================
console.log('\n  WHO IS IN IT:');
_crm.logs={
  ate:    day([meal('Eggs',500,40), meal('Steak',700,60)]),
  trained:day([], [{client_code:'trained', title:'Push'}]),
  both:   day([meal('Oats',600,40), meal('Chicken',700,55)], [{client_code:'both', title:'Pull'}]),
  thin:   day([meal('Coffee and an apple',149,0)]),
  nothing:{byDay:{}, days:{}, ever:true}
};
t(_crmYdayAny('both')===true,    'somebody who ate and trained is in it');
t(_crmYdayAny('ate')===true,     'so is somebody who only ate');
t(_crmYdayAny('trained')===true, 'and somebody who only trained');
t(_crmYdayAny('thin')===true,    'and a thin day is still a day they logged');
t(_crmYdayAny('nothing')===false,'somebody who logged nothing is NOT in it — that is the whole point');
t(_crmYdayAny('never')===false,  'and neither is somebody with no record at all');

// ===== THE FORMULA, NOT THE DATA =======================================
console.log('\n  THE LABEL SAYS WHAT KIND OF REPLY IT IS:');
t(_crmVerdict('both').label==='Perfect day',       'ate properly and trained', _crmVerdict('both').label);
t(_crmVerdict('ate').label==='Worth encouraging',  'ate properly, no training', _crmVerdict('ate').label);
t(_crmVerdict('trained').label==='Trained, no food','trained and nothing eaten went in', _crmVerdict('trained').label);
t(_crmVerdict('thin').label==='Spotty log',        'one item and 149 cal is not a logged day', _crmVerdict('thin').label);
t(_crmVerdict('nothing')===null,                   'and no day means no label at all');

// THE SWEEP OUTRANKS THE DAY. He does not need a macro grade for somebody he
// owes an answer to.
console.log('\n  AND AN UNANSWERED MESSAGE OUTRANKS ALL OF IT:');
OWED={both:2};
t(_crmVerdict('both').label==='Answer them first', 'a perfect day still says answer them first', _crmVerdict('both').label);
t(_crmVerdict('both').tone==='hot', 'and it is marked hot, not gold');
OWED={};
t(_crmVerdict('both').label==='Perfect day', 'with nothing owed, the day speaks again');

// ===== WHAT IT DRAWS ===================================================
console.log('\n  ABOVE THE BOX:');
const h=_crmYdayHtml('both');
console.log('    | '+h.replace(/<[^>]+>/g,' | ').replace(/\s+\|\s+/g,' | ').trim());
t(/class="dqCtx v-good"/.test(h), 'the block carries the verdict tone');
t(/<div class="dqCtxH">Perfect day<\/div>/.test(h), 'the LABEL leads it, not the numbers');
t(/Oats · Chicken/.test(h), 'the meals are named underneath');
t(/1,300 cal · 95g protein/.test(h), 'the totals are the arithmetic of the rows', h);
t(/Trained: Pull/.test(h), 'and the session');
t(!/“|”/.test(h), 'NOTHING here is a quote of them');
OWED={both:2};
t(/class="dqCtx v-hot"/.test(_crmYdayHtml('both')) && /Answer them first/.test(_crmYdayHtml('both')),
  'and the owed card is red with the label to match');
OWED={};

// A double tap on the same meal is one meal here too.
console.log('\n  ONE TAP, ONE MEAL, HERE AS WELL:');
_crm.logs.twice=day([
  {client_code:'twice', name:'Eggs and toast', meal:'Breakfast', calories:380, protein:22, carbs:0, fat:0,
   date_str:null, logged_at:'2026-09-04T14:31:40Z'},
  {client_code:'twice', name:'Eggs and toast', meal:'Breakfast', calories:428, protein:39, carbs:0, fat:0,
   date_str:null, logged_at:'2026-09-04T14:32:31Z'}
]);
const yy=_crmYday('twice');
t(yy.meals.length===1, 'the same breakfast logged twice is one breakfast', String(yy.meals.length));
t(yy.cal===428, 'and the total is 428, never 808', String(yy.cal));

// ===== NOBODY IS QUOTED, ANYWHERE IT MATTERS ===========================
// Yusuf, 5 Sep: "stop quoting them. Its like a dead AI giveaway... its the
// EFFORT of trying to make the human feel heard thats the dead giveaway."
console.log('\n  THE QUOTE BAN:');
const dayLines=src.slice(src.indexOf('function _cuDayLines(day){'), src.indexOf('function _cuDayLines(day){')+2600);
t(!/_cuQuote\(day\.notes\[0\]\)/.test(dayLines), 'a meal note is no longer quoted into the message');
t(!/_cuQuote\(said\[0\]\)/.test(dayLines),       'nor a training note');
t(/out\.push\('Trained: '\+titles\);/.test(dayLines), 'the session is named and stops there');
t(/function _cuWoNote\(/.test(src), 'the note is still MINED — he reads it, they just do not hear it back');

console.log();
if(bad){ console.log('  '+bad+' FAILED'); process.exit(1); }
console.log('  all yesterday-tab assertions pass');
process.exit(0);
