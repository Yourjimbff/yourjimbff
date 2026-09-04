// CALLS IN FLIGHT (Yusuf, 4 Sep: "we should triage urgency and response time
// ... im especially talking about time sensitive replies for instance pending /
// scheduled appointments ... the people we're working on adding to the calendar
// right now").
//
// The board could only ever answer "who waited longest". It could not see that
// George had asked a direct question about TOMORROW, or that a slot was being
// held for somebody who never agreed to it. Three people were waiting on a time
// with slots held the next day and nothing on the screen said so.
const fs = require('fs');
const L = fs.readFileSync('index.html', 'utf8').split('\n');
const SRC = L.join('\n');
function lift(name){ const s=L.findIndex(l=>l.startsWith('function '+name+'(')||l.startsWith('async function '+name+'('));
  if(s<0) throw new Error('SEAM MOVED: '+name);
  let d=0,st=false;
  for(let i=s;i<L.length;i++){ for(const c of L[i]){ if(c==='{'){d++;st=true;} else if(c==='}'){d--;} } if(st&&d===0) return L.slice(s,i+1).join('\n'); }
  throw new Error('SEAM MOVED: close of '+name); }
function liftObj(n){ const s=L.findIndex(l=>l.startsWith('var '+n+'='));
  if(s<0) throw new Error('SEAM MOVED: '+n);
  for(let i=s;i<L.length;i++) if(L[i].trimEnd().endsWith('};')) return L.slice(s,i+1).join('\n');
  throw new Error('SEAM MOVED: close of '+n); }

global.window = {};
let ROSTER = [];
global._crmRoster = () => ROSTER;
let _crm = { calls:{} };
const src = liftObj('_CW_STATES') + '\n' + lift('_crmCallPipeline')
  + '\nmodule.exports={_crmCallPipeline,_CW_STATES};';
const m = { exports:{} };
new Function('module','exports','_crm','window','_crmRoster',src)(m,m.exports,_crm,global.window,global._crmRoster);
const pipe = m.exports._crmCallPipeline;

let bad=0,n=0;
const t=(ok,msg,got)=>{n++;if(!ok)bad++;console.log((ok?'  ok    ':'  FAIL  ')+msg+(got!=null?('  '+got):''));};
const H = h => new Date(Date.now()+h*36e5).toISOString();
const set = (calls, roster) => { _crm.calls = calls; ROSTER = roster || Object.keys(calls).map(c=>({code:c,name:c})); };

console.log('\nA HELD SLOT THAT NOBODY CONFIRMED OUTRANKS EVERYTHING:');
// Once tomorrow's hour passes it cannot be recovered. A wait clock can.
set({
  cold:   {state:'yes',     slot:null,     since:H(-200)},   // waiting 8 days
  soon:   {state:'named',   slot:H(14),    since:H(-2)},     // held tomorrow
  sooner: {state:'yes',     slot:H(4),     since:H(-1)}      // held in 4 hours
});
let r = pipe();
t(r[0].code==='sooner', 'the nearest unconfirmed slot is first', r.map(x=>x.code).join(' > '));
t(r[1].code==='soon',   'then the next nearest slot');
t(r[2].code==='cold',   'and an 8 day wait with no slot ranks BELOW both', r[2].code);

console.log('\nWITH NO SLOTS IN PLAY, WHOEVER IS WAITING ON HIM COMES FIRST:');
set({
  theirMove: {state:'offered', slot:null, since:H(-300)},  // 12 days, but THEIR move
  hisMove:   {state:'yes',     slot:null, since:H(-3)}     // 3 hours, HIS move
});
r = pipe();
t(r[0].code==='hisMove', 'his move beats a longer wait that is not his', r.map(x=>x.code).join(' > '));
t(r[0].ball==='you' && r[1].ball==='them', 'and the ball is named on each row');

console.log('\nSETTLED WORK LEAVES THE LIST — it buries the unfinished:');
set({ a:{state:'booked',slot:H(20),since:H(-1)}, b:{state:'done',slot:null,since:H(-1)}, c:{state:'yes',slot:null,since:H(-1)} });
r = pipe();
t(r.length===1 && r[0].code==='c', 'booked and done drop off', r.map(x=>x.code).join(',')||'(empty)');

console.log('\nA REAL BOOKING BEATS A WRITTEN NOTE, always:');
// The bookings table is the app's own record. A [CALL] row is somebody's note
// about a conversation. If the call is genuinely on the books it is settled.
set({ x:{state:'yes', slot:null, since:H(-50)} });
global.window._bookCacheAll = [{client_code:'x', starts_at:H(30)}];
t(pipe().length===0, 'a client with a future booking is off the list even mid-negotiation');
global.window._bookCacheAll = [{client_code:'x', starts_at:H(-30)}];
t(pipe().length===1, '...but a booking in the PAST does not settle anything');
global.window._bookCacheAll = [];

console.log('\nIT NEVER INVENTS A STATE:');
set({ junk:{state:'maybe', slot:null, since:H(-1)}, real:{state:'yes', slot:null, since:H(-1)} });
t(pipe().length===1 && pipe()[0].code==='real', 'an unknown state is dropped, not guessed at');
set({});
t(pipe().length===0, 'and no calls at all is an empty list, not a crash');

console.log('\nTHE STRIP DISAPPEARS WHEN THERE IS NOTHING TO SAY:');
t(/function _crmCallsHtml\(\)\{[\s\S]{0,120}if\(!list\.length\) return '';/.test(SRC),
  'no rows means no card at all');

console.log('\nAND THE WRITE REFUSES WHAT IT CANNOT MEAN:');
t(/if\(!_CW_STATES\[c\.state\]\) return \{ok:false, reason:'unknown state '\+c\.state\};/.test(SRC),
  'cwWrite rejects a state that is not one of the five');
t(/slot:c\.slot\|\|null/.test(SRC), 'and a call with no agreed time stores null rather than a guess');

console.log('\nGOLD IS SPENT ON ONE THING:');
const gold = (SRC.match(/\.cw[A-Za-z]*[^']*var\(--gold\)/g)||[]);
t(gold.length===1, 'exactly one gold rule on this card, the nearly-here row', gold.length+' found');

console.log('\n' + (n-bad) + '/' + n + ' passed');
console.log('tcalls2: ' + (bad?'FAIL':'ok'));
process.exit(bad?1:0);
