// ONE PERSON, ASKED FOR BY NAME — permanent (Yusuf, ruling, 25 Aug).
//
// Three live failures on his own account came out of ONE shape: the trainer
// read path handed the model eighty-two clients flattened to 48 hours, and
// appended Yusuf's own food and training to the same prompt. Out of that came a
// refusal to see a fortnight back, an answer about a client built from his own
// numbers, and a name that resolved to the wrong person without a word said.
//
// The rules that replace it:
//   1. A question naming a person is answered from THAT person's rows or from
//      nothing. Never another client's, never his.
//   2. No capability refusal. If it is in the app it is reachable.
//   3. An ambiguous name ASKS which. It never picks.
//
// Behavioural where it can be — the resolver, the range parser and the record
// builder are lifted and RUN — and structural only for the withholding, which
// is a shape of the prompt and has no return value to assert.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const L=src.split('\n');
function grab(p){ const a=L.findIndex(p); if(a<0) return ''; let b=a; while(L[b]!=='}') b++; return L.slice(a,b+1).join('\n'); }
function line(sw){ const a=L.findIndex(l=>l.trim().startsWith(sw)); return a<0?'':L[a]; }
function multi(sw){ const a=L.findIndex(l=>l.trim().startsWith(sw)); if(a<0) return ''; let b=a; while(!/;\s*$/.test(L[b])) b++; return L.slice(a,b+1).join('\n'); }
// The stop list is an IIFE, and its FIRST line ending in a semicolon is the
// .forEach inside it — multi() would cut the function in half and eval would
// die on the truncation rather than on anything real.
function iife(sw){ const a=L.findIndex(l=>l.trim().startsWith(sw)); if(a<0) return ''; let b=a; while(L[b]!=='})();') b++; return L.slice(a,b+1).join('\n'); }
let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };

// A roster with the collisions his real one has: two Chrises where one name is
// a PREFIX of the other, three Anthonys, and a client sharing his own name.
global.window={};
global.CLIENTS={
  thegoat:{name:'Yusuf', isTrainer:true},
  chrism1:{name:'Chris McCarthy'},  christiana1:{name:'Christian A'},
  anthonyd1:{name:'Anthony Delgado'}, anthonyp1:{name:'Anthony P'}, anthonyc1:{name:'Anthony C'},
  tonia1:{name:'Toni A'}, kellyg1:{name:'Kelly G'}, billm1:{name:'Bill Murray'}
};
global.cl={code:'thegoat'};
global.getHiddenClientSet=()=>({});
eval([
  line('var _JV_FIRST_PERSON_RE='),
  grab(l=>l.startsWith('function _jvDepossess(')),
  grab(l=>l.startsWith('function _jvSelfCode(')),
  grab(l=>l.startsWith('function _jvSelfNames(')),
  grab(l=>l.startsWith('function _jvNamesSelf(')),
  grab(l=>l.startsWith('function _jvResolveOne(')),
  grab(l=>l.startsWith('function _jvResolveClient(')),
  iife('var _JV_NAME_STOP='),
  grab(l=>l.startsWith('function _jvWhoAsked(')),
  grab(l=>l.startsWith('function _jvNameOf(')),
  multi('var _JV_NAME_FRAME=new RegExp('),
  grab(l=>l.startsWith('function _jvUnknownName(')),
  grab(l=>l.startsWith('function _jvAskWhich(')),
  grab(l=>l.startsWith('function _jvIsoDay(')),
  grab(l=>l.startsWith('function _jvDayOf(')),
  grab(l=>l.startsWith('function _jvShiftDays(')),
  line('var _JV_MONTHS='),
  line('var _JV_ORD='),
  grab(l=>l.startsWith('function _jvAskedRange(')),
  grab(l=>l.startsWith('function _jvRowDay(')),
  grab(l=>l.startsWith('function _jvRound(')),
  grab(l=>l.startsWith('function _jvOneLine(')),
  grab(l=>l.startsWith('function _jvDowShort(')),
  grab(l=>l.startsWith('function _jvDaysBetween(')),
  grab(l=>l.startsWith('function _jvBuildRecord(')),
].join('\n'));
require('./_guard.cjs')(['_JV_NAME_STOP','_JV_NAME_FRAME','_jvWhoAsked','_jvUnknownName','_jvAskWhich',
  '_jvAskedRange','_jvBuildRecord','_jvDaysBetween','_jvDowShort','_jvRowDay','_jvOneLine'],
  function(n){ return eval(n); });

// ===== 3. AN AMBIGUOUS NAME ASKS ========================================
console.log('  an ambiguous first name asks WHICH — it never picks:');
const W=q=>{ const r=_jvWhoAsked(q); return r.kind==='one'?('one:'+r.name)
  :(r.kind==='ambiguous'?('ask:'+r.hits.map(h=>h.name).join('/')):r.kind); };
t(W('what is Chris eating')==='ask:Chris McCarthy/Christian A', 'a bare "Chris" is two people here', W('what is Chris eating'));
t(W('how did Anthony do last week')==='ask:Anthony Delgado/Anthony P/Anthony C', 'and "Anthony" is three');
t(_jvAskWhich(_jvWhoAsked('what is Chris eating').hits)==='Which Chris do you mean — Chris McCarthy, Christian A?',
  'the question names every candidate', _jvAskWhich(_jvWhoAsked('what is Chris eating').hits));
console.log('\n  a full name settles it, and so does a code:');
t(W('how is Chris McCarthy doing')==='one:Chris McCarthy', 'the surname decides');
t(W('give me Christian A totals')==='one:Christian A', 'the other Chris, named in full');
t(W('what did chrism1 log')==='one:Chris McCarthy', 'a code he says out loud');
t(W('Toni A seven day average')==='one:Toni A', 'an unambiguous first name needs no question');

// ===== 1. NEVER HIS OWN DATA, AND NEVER NOBODY'S ========================
console.log('\n  a question naming a client is about THAT client, pronoun or not:');
// "give me X's totals" has a first person in it. Reading that first is what
// answered a question about a client with his own numbers.
t(W('give me Christian A totals')==='one:Christian A', 'a "me" in the sentence does not make it about him');
t(W('what did Kelly G eat for me to see')==='one:Kelly G', 'nor does one further away');
console.log('\n  and a question naming nobody stays exactly as it was:');
['who needs me today','run the board','what did I eat today','my seven day average',
 'how is everyone doing','show me todays numbers','what is the plan','log my breakfast',
 'who has not trained this week','I did legs at 6 this morning'].forEach(function(q){
  const k=_jvWhoAsked(q).kind;
  t(k!=='one' && k!=='ambiguous', 'left alone: '+JSON.stringify(q), '-> '+k);
});

console.log('\n  a name that is NOBODY is said out loud, not swallowed:');
t(_jvUnknownName('how is Roberto doing')==='Roberto', 'an unknown name in a plain frame');
t(_jvUnknownName("what is Roberto's calorie average")==='Roberto', 'and in a possessive one');
t(_jvUnknownName('how is Chris doing')==='', 'a name that IS on the roster is not flagged');
['how is everyone doing','show me todays numbers','how is July looking','what did Monday look like',
 'who needs me today','what is the plan','how is it going'].forEach(function(q){
  t(_jvUnknownName(q)==='', 'not a name: '+JSON.stringify(q), '-> '+JSON.stringify(_jvUnknownName(q)));
});

// ===== 2. NO CAPABILITY REFUSAL — THE RANGE IS REAL =====================
// Every window he named in the ruling, resolved to real dates. Fixed "now" so
// this asserts the arithmetic and not the day it happens to run.
console.log('\n  every range he asks for resolves to real dates (today = Tue 25 Aug 2026):');
const NOW='2026-08-25T12:00:00';
const R=q=>{ const r=_jvAskedRange(q,NOW); return r?(r.from+'..'+r.to):'none'; };
[['a seven-day average',        'his seven day calorie average',            '2026-08-19..2026-08-25'],
 ['a weigh-in a fortnight back','what was her weigh-in two weeks ago',      '2026-08-10..2026-08-16'],
 ['a full month by name',       'give me her totals for July',              '2026-07-01..2026-07-31'],
 ['last month',                 'how did he do last month',                 '2026-07-01..2026-07-31'],
 ['this month so far',          'totals for this month',                    '2026-08-01..2026-08-25'],
 ['one week',                   'last week',                                '2026-08-17..2026-08-23'],
 ['the week before that',       'the week before last',                     '2026-08-10..2026-08-16'],
 ['a 30-day window',            'last 30 days',                             '2026-07-27..2026-08-25'],
 ['a fortnight',                'past two weeks',                           '2026-08-12..2026-08-25'],
 ['one day',                    'what did she eat yesterday',               '2026-08-24..2026-08-24']
].forEach(([label,q,want])=>t(R(q)===want, label.padEnd(28), '-> '+R(q)+(R(q)===want?'':'   (wanted '+want+')')));
t(_jvAskedRange('how is she doing',NOW)===null, 'no window named reads as none — the caller picks the floor');

// ===== THE ARITHMETIC IS DONE IN CODE ===================================
// The failure this guards is a model summing rows and saying a wrong number out
// loud on a call. Run against a fixture whose totals are known by hand.
console.log('\n  the record is handed over ALREADY ADDED UP:');
const WHO={code:'chrism1', name:'Chris McCarthy'};
const RANGE={from:'2026-08-19', to:'2026-08-25', label:'the last 7 days', days:7};
const DATA={
  foods:[
    {name:'Eggs',   calories:400, protein:30, carbs:10, fat:20, date_str:'Aug 24, 2026', logged_at:'2026-08-25T02:00:00Z'},
    {name:'Chicken',calories:600, protein:60, carbs:40, fat:20, date_str:'Aug 24, 2026', logged_at:'2026-08-25T03:00:00Z'},
    {name:'Steak',  calories:1000,protein:80, carbs:50, fat:40, date_str:'Aug 22, 2026', logged_at:'2026-08-22T19:00:00Z'},
    // Outside the range on purpose: it must not reach any total.
    {name:'Toast',  calories:9999,protein:99, carbs:99, fat:99, date_str:'Aug 01, 2026', logged_at:'2026-08-01T12:00:00Z'}
  ],
  workouts:[{title:'Push', intensity:8, description:'Bench\n185 x 8', date_str:'Aug 24, 2026', logged_at:'2026-08-25T02:00:00Z'}],
  steps:[{steps:9000, date_str:'Aug 24, 2026', updated_at:'2026-08-24T23:00:00Z'}],
  weights:[
    {weight:157.6, logged_at:'2026-08-22T15:00:00Z'},
    {weight:157.6, logged_at:'2026-08-22T15:30:00Z'},   // the SAME reading stored twice
    {weight:156.4, logged_at:'2026-08-06T15:00:00Z'}
  ],
  broke:false
};
const B=_jvBuildRecord(WHO, RANGE, DATA);
t(/RANGE TOTAL: 2000 cal, 170g protein/.test(B), 'the range total is summed here, not by the model');
t(!/9999/.test(B), 'a row outside the range reaches no total and no line');
t(/AVERAGE PER LOGGED DAY: 1000 cal/.test(B), 'the per-logged-day average');
t(/AVERAGE PER CALENDAR DAY: 286 cal/.test(B), 'and the per-calendar-day one, which is a different question');
t(/Days with food logged: 2 of 7/.test(B), 'the days that carry food are counted');
t(/Nothing logged on: 2026-08-19, 2026-08-20, 2026-08-21, 2026-08-23, 2026-08-25/.test(B), 'and the empty ones are named');
// date_str is the LOCAL day; logged_at is UTC and drifts a day on an evening
// meal. Bucketing on logged_at put nearly one real row in five on the wrong day.
t(/2026-08-24 \(Mon\)  2 meals  1000 cal/.test(B), 'an evening meal lands on the day he ate it, not the UTC one');
t(/9,000 steps/.test(B), 'steps are read and totalled');
t(/157\.6 lbs/.test(B) && /156\.4 lbs/.test(B), 'the weigh-in history is handed over whole');
t(/1 exact duplicate row/.test(B), 'the same reading stored twice is one reading, and the collapse is stated');
t(/Net across the whole history: up 1\.2 lbs/.test(B), 'and the net move is computed');
t(/Bench 185 x 8/.test(B), 'a multi-line session is flattened to its own row');
t(B.indexOf('Chris McCarthy')===B.lastIndexOf('Chris McCarthy')-B.slice(B.indexOf('Chris McCarthy')+1).indexOf('Chris McCarthy')-1 || /ONE person: Chris McCarthy/.test(B),
  'the block says out loud whose data it is');

console.log('\n  an EMPTY range says so and substitutes nothing:');
const E=_jvBuildRecord(WHO, RANGE, {foods:[],workouts:[],steps:[],weights:[],broke:false});
t(/NOTHING\. Chris McCarthy logged no food at all/.test(E), 'no food is stated plainly');
t(/Do not substitute a different range, a different client, or an older day/.test(E), 'and substituting is forbidden in the same breath');
t(/never logged a weigh-in/.test(E), 'a never-weighed client is a fact, not a gap');

console.log('\n  a BROKEN read is never reported as an empty one:');
const K=_jvBuildRecord(WHO, RANGE, {foods:[],workouts:[],steps:[],weights:[],broke:true});
t(/ONE OR MORE OF THESE READS DID NOT ANSWER/.test(K), 'the failure is declared');
t(/you may NOT say Chris McCarthy logged nothing/.test(K), 'and stating an absence is forbidden while it stands');

// ===== THE WITHHOLDING IS STRUCTURAL ====================================
// This is the rule that could cost him a client on a call, and it is a SHAPE of
// the prompt — there is no return value to assert, so what is held is that his
// own reads cannot run on a question about somebody else.
console.log('\n  his own data is withheld by RETURNING, not by an instruction:');
const BD=(src.match(/A QUESTION NAMING A CLIENT GETS THAT CLIENT AND NOBODY ELSE[\s\S]{0,2200}?\n  \}catch\(e\)\{\}/)||[''])[0];
t(!!BD, 'the gate exists in the day context');
t(/isTrainer\(cl\.code\)/.test(BD), 'trainer accounts only — a client never reaches anyone’s record');
t(/askText &&/.test(BD), 'and only when the caller passed what he asked');
t(/return sections\.join/.test(BD), 'it RETURNS — his own reads below never run');
t(/_jvOnePerson\(askText\)/.test(BD), 'through the one door, not a second copy of the resolver');
// The gate has to sit ABOVE his own sections or it withholds nothing.
const iGate=src.indexOf('A QUESTION NAMING A CLIENT GETS THAT CLIENT AND NOBODY ELSE');
const iMine=src.indexOf('// RECENT WEIGHTS — trend');
t(iGate>0 && iMine>iGate, 'and it sits ABOVE his own profile, food, training and weights');
t(/async function buildDayContext\(askText\)/.test(src), 'the read path finally sees the question');
t(/await buildChatContext\(\(window\.cl && typeof isTrainer==='function' && isTrainer\(cl\.code\)\) \? text : null\)/.test(src),
  'and the chat rail hands it over, trainer-gated');

console.log('\n  every trainer surface consults the one door:');
t(/_jvAssistantContext\(\{ask:msg\}\)/.test(src), 'the cockpit passes the question');
t(/_jvAssistantContext\(\{ask:t\}\)/.test(src), 'the front desk single line passes it too');
t(/var _op=await _jvOnePerson\(t\);/.test(src), 'and a batch item fetches its OWN person');
// ctx is shared across a batch. Appending to it would leave item one's client
// in the prompt while item two asks about somebody else.
t(/var _itemCtx=ctx;/.test(src) && /_jtModel\(t, _itemCtx\)/.test(src), 'onto a copy, so one item cannot leak into the next');

console.log('\n  the hand-rolled name scans are gone:');
// Two blocks each carried their own copy of "who does he mean", and each PICKED
// the longest first name with nothing said about the others.
t(!/if\(!best \|\| first\.length>best\.first\.length\)/.test(src), 'no block picks the longest first name any more');
t((src.match(/var _w=null; try\{ _w=_jvWhoAsked\(msg\); \}catch\(e\)\{\}/g)||[]).length===2,
  'both consult the one resolver instead');

console.log('\n  and the capability refusal is gone:');
t(!/say plainly you only have today in front of you/.test(src), 'it is no longer told to say it cannot see back');
t(/NEVER tell him you cannot see something that exists in this app/.test(src), 'it is told the opposite');

console.log(bad? '\n'+bad+' FAILED' : '\nall pass');
process.exit(bad?1:0);
