// QUEUE YESTERDAY FOR EVERYONE (Yusuf, 5 Sep: "why isnt the bulk send for
// yesterdays logs built out?").
//
// It had been built as a 5:30am task that runs in the cloud, and the cloud
// cannot reach the database, so it had never run once. This is the button that
// does it from the app instead. What this suite holds down is the part that
// could hurt somebody: a false "you logged nothing" going to the whole roster
// off a read that never happened, and a hand written draft being overwritten.
const fs=require('fs');
const guard=require('./_guard.cjs');
const {closure, defOf}=require('./_lift.cjs');

let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };

// ===== THE CLOCK, FROZEN ===============================================
const RealDate=Date;
const NOW=new RealDate(2026,8,5,7,30,0);          // Sat 5 Sep 2026, 7:30am
class FrozenDate extends RealDate{
  constructor(...a){ if(a.length===0) super(NOW.getTime()); else super(...a); }
  static now(){ return NOW.getTime(); }
}
global.Date=FrozenDate;

const STORE={};
global.localStorage={ getItem:k=>(k in STORE?STORE[k]:null), setItem:(k,v)=>{STORE[k]=String(v);}, removeItem:k=>{delete STORE[k];} };
global.window={ _sbFailN:0 };
global.document={ getElementById:()=>null };
global.navigator={ language:'en-US' };

const MINE=['_DQ_SRC','_DQ_LIMIT','_dqCloser','_dqBody','dqQueueYesterday'];
const SHARED=['_cuDayLines','_cuCut','_cuClip','_cuQuote','_cuWoNote','_cuDayLabel','_CU_NAME_MAX',
  '_CU_LINE_MAX','_jvNum','_dbDay','_dbDs','_jvSpokenDay','_JV_DB_SAYS_RE',
  '_sbFailMark','_sbFailedSince','_sbAtCap','_TAP_MS','_tapKey','_dedupeTaps'];
eval(closure(SHARED).code);
eval(MINE.map(defOf).join('\n'));
guard(MINE.concat(SHARED), n=>eval(n));

// ===== THE DOORS, REPLACED AFTER THE LIFT ==============================
let ROWS={food_logs:[], workout_logs:[]}, ASKED=[], WROTE=[], TOASTS=[];
let FAILTABLE=null, CAPTABLE=null;
global.sbSelect=async function(table, filter){
  ASKED.push(table+'?'+filter);
  if(FAILTABLE===table){ window._sbFailN=(window._sbFailN||0)+1; return []; }
  if(CAPTABLE===table) return Array.from({length:4000},(_,i)=>({client_code:'x', logged_at:'2026-09-04T12:00:00Z'}));
  return (ROWS[table]||[]).slice();
};
global.dfWrite=async function(code,d){ WROTE.push({code:code, id:d.id, text:d.text, re:d.re, src:d.src, day:d.day}); return {ok:true, id:d.id||('n'+WROTE.length)}; };
global.dfLoadAll=async function(){};
global.crmPaint=function(){};
global.showToast=function(m){ TOASTS.push(String(m)); };
global.rosterRefresh=async function(){};
global._jvHydratePhones=function(){};
global.isTrainer=function(c){ return c==='thegoat'; };
global.scratchHidden=function(){ return false; };
global._dfToday=function(){ return '2026-09-05'; };
global._dfDayKey=function(iso){ try{ const d=new RealDate(iso); return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2); }catch(e){ return ''; } };
global.CLIENTS={
  kellyg1:{name:'Kelly G', phone:'+19034450693', active:true},
  omar1:{name:'Omar',      phone:'+15107171903', active:true},
  quiet1:{name:'Quiet Q',  phone:'+15550001111', active:true},
  nonum1:{name:'No Number',phone:'',             active:true},
  gone1:{name:'Dropped',   phone:'+15550002222', active:false},
  thegoat:{name:'Yusuf',   phone:'+15550003333', active:true},
  zzscratchnotaclient:{name:'Scratch', phone:'+15550004444', active:true}
};
global._crm={rows:[]};
const reset=()=>{ ASKED=[]; WROTE=[]; TOASTS=[]; window._sbFailN=0; window._dqBusy=0; FAILTABLE=null; CAPTABLE=null; _crm.rows=[]; };

// Yesterday is Friday 4 September 2026.
const YDS='Sep 4, 2026';
const FOOD_KELLY=[
  {client_code:'kellyg1', name:'Eggs and toast', meal:'Breakfast', calories:480, protein:34, carbs:40, fat:18,
   felt:null, date_str:YDS, logged_at:'2026-09-04T13:00:00+00:00'},
  {client_code:'kellyg1', name:'Sirloin and salad', meal:'Dinner', calories:700, protein:58, carbs:22, fat:34,
   felt:'Felt full for once', date_str:YDS, logged_at:'2026-09-04T23:00:00+00:00'}
];
const WO_KELLY=[{client_code:'kellyg1', title:'Push', description:'Bench, incline, dips', exercises:null,
  notes:'Shoulder held up fine', date_str:YDS, logged_at:'2026-09-04T15:00:00+00:00'}];

(async()=>{
  // ===== THE HAPPY PATH ================================================
  console.log('\n  A DAY THAT HAPPENED:');
  reset();
  ROWS={food_logs:FOOD_KELLY, workout_logs:WO_KELLY};
  await dqQueueYesterday();
  t(/logged_at=gte\./.test(ASKED[0]) && /logged_at=lt\./.test(ASKED[0]),
    'the read is bounded to the day on the SERVER, both ends', (ASKED[0]||'').slice(0,60));
  t(/client_code=in\.\(/.test(ASKED[0]), 'and to the roster in one request, not one per client');
  t(ASKED.length===2, 'two reads for the whole roster, not a hundred and fifty', String(ASKED.length));
  const kelly=WROTE.find(w=>w.code==='kellyg1');
  console.log('\n    KELLY:');
  (kelly?kelly.text:'(nothing)').split('\n').forEach(l=>console.log('    | '+l));
  t(!!kelly, 'she gets one');
  t(/^Yesterday\n/.test(kelly.text), 'it opens on the day itself, no announcement');
  t(/Eggs and toast · Sirloin and salad/.test(kelly.text), 'both meals named, in the order eaten');
  t(/1,180 cal · 92g protein/.test(kelly.text), 'the totals are the arithmetic of her rows', kelly.text);
  t(/Trained: Push/.test(kelly.text), 'and the session is named');
  t(/“Felt full for once”/.test(kelly.text), 'a note she wrote is quoted back');
  t(/Same again today\?$/.test(kelly.text), 'and it closes on a push, not a compliment nobody earned');
  t(kelly.src==='day', 'stamped as this button’s work', String(kelly.src));
  t(kelly.day==='Sep 4, 2026', 'and stamped with the day it is about', String(kelly.day));
  t(/read in one pass/.test(kelly.re) && /Sep 4, 2026/.test(kelly.re), 'the evidence rides with it');

  // ===== NOTHING FROM TODAY (his rule) =================================
  console.log('\n  TODAY IS NOT IN IT:');
  reset();
  ROWS={food_logs:FOOD_KELLY.concat([
    {client_code:'kellyg1', name:'Coffee and an apple', meal:'Breakfast', calories:149, protein:0, carbs:34, fat:1,
     felt:null, date_str:'Sep 5, 2026', logged_at:'2026-09-05T12:00:00+00:00'}
  ]), workout_logs:WO_KELLY};
  await dqQueueYesterday();
  const k2=WROTE.find(w=>w.code==='kellyg1');
  t(!/Coffee and an apple/.test(k2.text), 'a meal logged TODAY never reaches yesterday’s message');
  t(/1,180 cal/.test(k2.text), 'and it does not move yesterday’s numbers either', k2.text.split('\n')[2]);

  // ===== A BLANK DAY IS SAID, NEVER RECAPPED ===========================
  console.log('\n  A DAY THAT DID NOT:');
  reset();
  ROWS={food_logs:FOOD_KELLY, workout_logs:WO_KELLY};
  await dqQueueYesterday();
  const q=WROTE.find(w=>w.code==='quiet1');
  console.log('    | '+(q?q.text.replace(/\n/g,' | '):'(nothing)'));
  t(!!q, 'the person with nothing still gets a message');
  t(/nothing logged/.test(q.text), 'and it says so plainly');
  t(!/nothing logged yet/.test(q.text), 'without "yet" — yesterday is over');
  t(/Nothing came through from you yesterday/.test(q.text), 'the close is honest, not a lecture');
  t(!/cal|protein|Trained/.test(q.text), 'AND THERE IS NO RECAP OF A DAY THAT DID NOT HAPPEN');
  t(/NOTHING on the record/.test(q.re) && /read is proved good/.test(q.re),
    'the note says the read was proved before the absence was claimed');

  // ===== WHO IS EVEN IN IT =============================================
  console.log('\n  WHO IT WRITES TO:');
  const codes=WROTE.map(w=>w.code).sort().join(',');
  t(codes==='kellyg1,omar1,quiet1', 'active clients with a number, and nobody else', codes);
  t(!WROTE.some(w=>w.code==='nonum1'), 'no number, no draft — it could never be sent');
  t(!WROTE.some(w=>w.code==='gone1'),  'a dropped client is not messaged');
  t(!WROTE.some(w=>w.code==='thegoat'), 'and it does not text him');
  t(!WROTE.some(w=>w.code==='zzscratchnotaclient'), 'nor the scratch client');

  // ===== THE ABSENCE LAW, WHICH IS THE WHOLE POINT =====================
  // A refused read answers [] exactly as an empty day does. Getting this wrong
  // sends "you logged nothing yesterday" to seventy five people at once.
  console.log('\n  A READ THAT FAILED IS NOT AN EMPTY ROSTER:');
  reset(); ROWS={food_logs:FOOD_KELLY, workout_logs:WO_KELLY}; FAILTABLE='food_logs';
  await dqQueueYesterday();
  t(WROTE.length===0, 'the food read failed, so NOT ONE draft is written', String(WROTE.length));
  t(TOASTS.some(m=>/Could not read/.test(m)), 'and he is told why', TOASTS.join(' / '));
  reset(); ROWS={food_logs:FOOD_KELLY, workout_logs:WO_KELLY}; FAILTABLE='workout_logs';
  await dqQueueYesterday();
  t(WROTE.length===0, 'the training read failing voids the run too');
  reset(); ROWS={food_logs:FOOD_KELLY, workout_logs:WO_KELLY}; CAPTABLE='food_logs';
  await dqQueueYesterday();
  t(WROTE.length===0, 'a read that came back at its exact cap is unread, never complete');

  // ===== IT NEVER WRITES OVER A REAL DRAFT =============================
  console.log('\n  WHAT IT LEAVES ALONE:');
  reset(); ROWS={food_logs:FOOD_KELLY, workout_logs:WO_KELLY};
  _crm.rows=[
    {code:'kellyg1', id:'h1', status:'pending', text:'Something I wrote by hand', src:'', at:'2026-09-05T02:00:00Z'},
    {code:'omar1',   id:'d1', status:'pending', text:'an old auto one', src:'day', at:'2026-09-04T09:00:00Z'}
  ];
  await dqQueueYesterday();
  t(!WROTE.some(w=>w.code==='kellyg1'), 'a hand written draft is untouched — his words are never overwritten');
  const om=WROTE.find(w=>w.code==='omar1');
  t(!!om && om.id==='d1', 'but its OWN draft is refreshed IN PLACE, never stacked as a second row', om?String(om.id):'none');

  console.log('\n  WHAT IT SKIPS:');
  reset(); ROWS={food_logs:FOOD_KELLY, workout_logs:WO_KELLY};
  _crm.rows=[
    {code:'kellyg1', id:'s1', status:'sent',    text:'x', src:'day', at:'2026-09-05T02:00:00Z'},
    {code:'omar1',   id:'k1', status:'skipped', text:'x', src:'day', at:'2026-09-05T02:00:00Z'}
  ];
  await dqQueueYesterday();
  t(!WROTE.some(w=>w.code==='kellyg1'), 'someone he already texted today is not queued again');
  t(!WROTE.some(w=>w.code==='omar1'),   'and someone he deliberately skipped today stays skipped');

  console.log('\n  AND IT DOES NOT CHURN:');
  reset(); ROWS={food_logs:FOOD_KELLY, workout_logs:WO_KELLY};
  await dqQueueYesterday();
  const first=WROTE.find(w=>w.code==='kellyg1');
  reset(); ROWS={food_logs:FOOD_KELLY, workout_logs:WO_KELLY};
  _crm.rows=[{code:'kellyg1', id:'d9', status:'pending', text:first.text, src:'day', at:'2026-09-05T06:00:00Z'}];
  await dqQueueYesterday();
  t(!WROTE.some(w=>w.code==='kellyg1'), 'running it twice writes nothing the second time');

  // ===== THE MARK HAS TO SURVIVE =======================================
  // If src were dropped on a status change, the next morning would read its own
  // draft as hand written and refuse to touch it forever.
  console.log('\n  THE MARK SURVIVES THE ROW:');
  const src=fs.readFileSync('index.html','utf8');
  t(/src:\(d\.src\|\|undefined\), day:\(d\.day\|\|undefined\),/.test(src), 'dfWrite stores it');
  t(/src:\(o\.src\?String\(o\.src\):''\), day:\(o\.day\?String\(o\.day\):''\)/.test(src), 'the reader reads it back');
  t((src.match(/src:\(d\.src\|\|undefined\)/g)||[]).length>=2,
    'and a status change carries it through — otherwise the draft freezes forever',
    String((src.match(/src:\(d\.src\|\|undefined\)/g)||[]).length));

  // ===== THE BUTTON IS ON THE BOARD ====================================
  console.log('\n  IT IS REACHABLE:');
  t(/onclick="dqQueueYesterday\(\)"/.test(src), 'the board carries the button');
  t(/\.crmDayBtn\{/.test(src), 'and it has a style');
  t(!/\+'\.crmDayBtn\{[^']*\n/.test(src), 'written one quoted line per rule, not pasted as a block');
  t(/if\(window\._dqBusy\) return; window\._dqBusy=1;/.test(src), 'and a double tap cannot start it twice');

  console.log();
  if(bad){ console.log('  '+bad+' FAILED'); process.exit(1); }
  console.log('  all queue-yesterday assertions pass');
  process.exit(0);
})().catch(e=>{ console.log('  FAIL  the suite threw: '+(e&&e.stack||e)); process.exit(1); });
