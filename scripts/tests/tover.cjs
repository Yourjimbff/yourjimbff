// HE ALREADY TEXTED THEM (Yusuf, 5 Sep).
//
//   "I can tell you didnt read the messages because I already sent that
//    message to Hayden. You're missing the sweep. There should be a sweep, you
//    should be able to refresh. Why is it still queued there?"
//
// The real case, off the board at the time: Hayden's draft was written
// 4 Sep 21:49:50Z. He wrote the message himself in Messages and the sweep
// recorded his last outgoing text at 5 Sep 00:26. The draft was still pending
// and still in the queue, because nothing had ever compared those two times.
//
// A draft only ever settled if he pressed SEND in the app. He mostly does not.
const fs=require('fs');
const guard=require('./_guard.cjs');
const {closure, defOf}=require('./_lift.cjs');

let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };

global.window={}; global.document={getElementById:()=>null};
global.localStorage={ getItem:()=>null, setItem:()=>{}, removeItem:()=>{} };

const MINE=['_crmOvertaken','crmRefresh'];
const SHARED=['_crmSweepTime'];
eval(closure(SHARED).code);
eval(MINE.map(defOf).join('\n'));
guard(MINE.concat(SHARED), n=>eval(n));
global._crm={contacts:{}, rows:[], err:null, sweepAt:null};

// ===== HAYDEN, THE REAL ROW ============================================
console.log('\n  THE ROW THAT SHOULD NOT HAVE BEEN QUEUED:');
const HAYDEN={id:'dmtm0gxh9jppbu8', status:'pending', at:'2026-09-04T21:49:50.475Z',
  text:'1 idea, charge your phone in another room'};
_crm.contacts={haydenh1:{him:'2026-09-05T00:26', them:'2026-09-05T00:28', last:'them', text:'Reacted'}};
t(_crmOvertaken('haydenh1', HAYDEN)===true,
  'his own text at 00:26 is newer than the draft at 21:49, so the draft is overtaken');

// The sweep stamps a naive time with no zone. Reading it as local would move it
// by hours and flip this either way, which is how a bug like this hides.
console.log('\n  THE SWEEP’S CLOCK IS UTC:');
t(_crmSweepTime('2026-09-05T00:26').toISOString().slice(0,16)==='2026-09-05T00:26',
  'a naive sweep time is read as UTC, not as local', _crmSweepTime('2026-09-05T00:26').toISOString());

// ===== AND WHAT MUST STILL QUEUE =======================================
console.log('\n  WHAT IS STILL HIS TO SEND:');
_crm.contacts={a:{him:'2026-09-04T20:00', them:null, last:'him', text:''}};
t(_crmOvertaken('a', {id:'x', status:'pending', at:'2026-09-04T21:49:50.475Z', text:'y'})===false,
  'a text he sent BEFORE the draft was written does not overtake it');
_crm.contacts={a:{him:null, them:'2026-09-05T00:00', last:'them', text:''}};
t(_crmOvertaken('a', {id:'x', status:'pending', at:'2026-09-04T21:00:00Z', text:'y'})===false,
  'THEIR message does not count — only his own outgoing text answers a draft');
_crm.contacts={};
t(_crmOvertaken('a', {id:'x', status:'pending', at:'2026-09-04T21:00:00Z', text:'y'})===false,
  'no contact row at all is not an excuse to hide a draft');
_crm.contacts={a:{him:'not a date', them:null, last:'him', text:''}};
t(_crmOvertaken('a', {id:'x', status:'pending', at:'2026-09-04T21:00:00Z', text:'y'})===false,
  'and an unreadable time is never read as "newer"');
_crm.contacts={a:{him:'2026-09-05T00:26', them:null, last:'him', text:''}};
t(_crmOvertaken('a', {id:'x', status:'pending', at:null, text:'y'})===false,
  'a draft with no time of its own cannot be judged, so it stands');
t(_crmOvertaken('a', null)===false, 'and there is no draft to judge at all');

// A row he has already answered is answered whatever the clock says.
console.log('\n  ALREADY SETTLED STAYS SETTLED:');
t(_crmOvertaken('a', {id:'x', status:'sent',    at:'2026-09-04T21:00:00Z', text:'y'})===false, 'sent');
t(_crmOvertaken('a', {id:'x', status:'skipped', at:'2026-09-04T21:00:00Z', text:'y'})===false, 'skipped');
t(_crmOvertaken('a', {id:'x', status:'opened',  at:'2026-09-04T21:00:00Z', text:'y'})===true,
  'but an OPENED draft he then texted them about is overtaken too — that is the same event');

// ===== IT LEAVES THE QUEUE, IT DOES NOT LEAVE THE BOARD ================
console.log('\n  IT HIDES NOTHING:');
const src=fs.readFileSync('index.html','utf8');
const q=src.slice(src.indexOf('function _crmBatchQueue(){'), src.indexOf('function crmBatchOpen('));
t(/if\(_crmOvertaken\(p\.code, p\.draft\)\) return false;/.test(q),
  'the batch queue drops it — he is never handed a message he already sent');
t(/crmOverN/.test(src) && /you texted them '/.test(src),
  'the row SAYS he texted them, with the time');
t(/SEND ANYWAY/.test(src), 'and keeps a Send anyway, because a draft about something else is still real');
t(/_over\?'Clear':'Skip'/.test(src), 'with Clear instead of Skip, which is what it actually is');
t(/\.crmRow\.overtaken\{/.test(src) && !/\+'\.crmRow\.overtaken\{[^']*\n/.test(src),
  'styled, one quoted line per rule');

// ===== THE REFRESH =====================================================
// "There should be a sweep, you should be able to refresh."
console.log('\n  AND HE CAN GO AND LOOK AGAIN:');
t(/onclick="crmRefresh\(\)"/.test(src), 'the board carries a Refresh');
const rf=src.slice(src.indexOf('async function crmRefresh(){'), src.indexOf('function _crmYdayKey(){'));
t(/dfLoadAll\(\)/.test(rf),      'it re-reads the drafts and the contact rows the sweep wrote');
t(/_crmLoadLogs\(\)/.test(rf),   'and the logs');
t(/rosterRefresh\(true\)/.test(rf), 'and the roster');
t(/your texts read/.test(rf),    'and it says WHEN his texts were last read, so "current" means something');
t(/window\._crmRefreshing/.test(rf), 'a second tap cannot start it twice');
t(/_crm\.err \? 'Could not read the board'/.test(rf),
  'and a read that FAILED says so rather than claiming the board is current');

console.log();
if(bad){ console.log('  '+bad+' FAILED'); process.exit(1); }
console.log('  all overtaken assertions pass');
process.exit(0);
