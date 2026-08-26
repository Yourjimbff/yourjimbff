// A LOGGED MEAL CAN BE MOVED, CORRECTED AND DELETED — permanent
// (Yusuf, ruling, 26 Aug, after Spencer R).
//
// He logged a breakfast today, it landed on yesterday, and three plain requests
// to move it were refused. Read out of his real rows afterwards, the failure is
// exact and provable:
//
//   THE ROW: date_str "Aug 26, 2026", logged_at 2026-08-25T15:00:00+00:00.
//   Those two disagree. A whole move sets both. Only a HALF-move makes that.
//   And the timestamp is round to the second where every other row of his
//   carries milliseconds — a constructed value, built from "yesterday" plus the
//   stated 9:00 AM, on a breakfast he ate today.
//
//   THE DUPLICATE: two "Spicy Deluxe Sandwich, Fries & Light Lemonade" rows on
//   Aug 25, 42 seconds apart, identical but for the slot — one Snack, one
//   Dinner. That is a CORRECTION performed as an INSERT.
//
// Three causes, three fixes, held here.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const L=src.split('\n');
function grab(p){ const a=L.findIndex(p); if(a<0) return ''; let b=a; while(L[b]!=='}') b++; return L.slice(a,b+1).join('\n'); }
function one(sw){ const a=L.findIndex(l=>l.startsWith(sw)); return a<0?'':L[a]; }
let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };

global.window={};
eval([one('var _JIM_DAY_BACK_RE='), one('var _JIM_DAY_NAGO_RE='), one('var _JIM_DOW='),
  one('var _JIM_WORDNUM='), one('var _JIM_DAY_MAX='), one('var _JIM_WEEKS_AGO_RE='),
  one('var _JIM_MONTHS='), one('var _JIM_FOOD_CMP_RE='),
  grab(l=>l.startsWith('function _jimStripFoodCompare(')),
  grab(l=>l.startsWith('function _jimDateSaid(')),
  grab(l=>l.startsWith('function _jimAnchorDay('))].join('\n'));
require('./_guard.cjs')(['_JIM_FOOD_CMP_RE','_jimStripFoodCompare','_jimAnchorDay'],
  function(n){ return eval(n); });

// ===== 1. A COMPARISON TO A PAST MEAL IS NOT A DATE =====================
console.log('  "the same as yesterday" is what it WAS, not when he ate it:');
const SPENCER="For breakfast I had the same protein coffee as yesterday along with three Kirkland beef sticks and three baby bell cheese";
t(_jimAnchorDay(SPENCER)===null, 'his exact words land on TODAY', String(_jimAnchorDay(SPENCER)));
[['just like yesterday',        'lunch was just like yesterday'],
 ["yesterday's shake, today",   "I had yesterday's protein shake this morning"],
 ['same as last night',         'dinner was the same as last night'],
 ['my usual',                   'I had my usual for breakfast'],
 ['same thing as before',       'I had the same thing as before']
].forEach(function(c){ t(_jimAnchorDay(c[1])===null, 'not a date: '+c[0], String(_jimAnchorDay(c[1]))); });

console.log('\n  and a day he really states still anchors:');
[['yesterday I ate eggs', 1], ['I had pizza last night', 1], ['I had that 2 days ago', 2],
 // The comparison is stripped, never the whole sentence: a leading anchor survives.
 ['yesterday I had the same as the day before', 1]
].forEach(function(c){ t(_jimAnchorDay(c[0])===c[1], JSON.stringify(c[0]), '-> '+_jimAnchorDay(c[0])); });
t(_jimAnchorDay('I had eggs for breakfast')===null, 'and a plain log is today');

// ===== 2. A MOVE MOVES BOTH DATE FIELDS =================================
// A row carries its day twice — date_str, which the Day page filters on, and
// logged_at, which the feed, the trainer record and every ordering read.
console.log('\n  a move sets BOTH day fields, or it is a half-move:');
const FE=grab(l=>l.startsWith('async function applyFoodEdit('));
t(!!FE, 'the edit path is findable');
t(/if\(patch\.date_str\)\{/.test(FE), 'moving a day is noticed');
t(/patch\.logged_at=/.test(FE), 'and logged_at moves with it');
t(/_wasLoggedAt/.test(FE), 'keeping the same clock time on the new day');
// Run it: the same arithmetic the patch does, on Spencer's actual row.
const mk=(dateStr, wasIso)=>{
  const nd=new Date(dateStr); const old=new Date(wasIso);
  return new Date(nd.getFullYear(), nd.getMonth(), nd.getDate(), old.getHours(), old.getMinutes(), 0);
};
const moved=mk('Aug 26, 2026','2026-08-25T15:00:00+00:00');
t(moved.getDate()===26 && moved.getMonth()===7, 'his breakfast lands on the 26th, not the 25th',
  moved.toDateString());
t(moved.getHours()===new Date('2026-08-25T15:00:00+00:00').getHours(), 'at the hour he ate it');

// ===== 3. THE ROW CAN BE FOUND, SO IT IS NEVER "NOTHING MATCHING" =======
console.log('\n  the meals he can be asked to move are legible in the prompt:');
const RF=(src.match(/RECENT FOOD \(last 7 days[\s\S]{0,2200}?rfBits\.join/)||[''])[0];
t(!!RF, 'the recent-food block is findable');
// It printed f.meal and never selected it — so every older row arrived with an
// empty slot, and "move the BREAKFAST from yesterday" matched nothing.
t(/select=id,name,rating,calories,protein,meal,eat_time,date_str,logged_at/.test(src),
  'meal and eat_time are actually SELECTED now');
t(/\(f\.meal\?\(f\.meal\+' '\):''\)/.test(RF), 'and the slot is printed on the line');
// date_str is "Aug 26, 2026". A plain .sort() on that is a text compare, so
// "Aug 5" sorts after "Aug 26" and June sorts after August.
t(/new Date\(a\), db=new Date\(b\)/.test(RF), 'the seven days are the seven most RECENT, by real date');
t(!/Object\.keys\(_byDay\)\.sort\(\)\.reverse\(\)/.test(src), 'never a lexicographic sort of a human date');

console.log('\n  and the instruction that refused him is gone:');
t(!/DO NOT delete meals via chat/.test(src), 'no blanket refusal to delete in chat');
t(!/point them to the ⋯ Delete button instead/.test(src), 'and he is not sent to a button');
t(/MOVING, CORRECTING AND DELETING A LOGGED MEAL IS SOMETHING YOU DO/.test(src), 'it is stated as a capability');
t(/NEVER re-emit \[FOOD_LOG\] to move or fix something already logged/.test(src),
  'and a correction may never be a second row — that is the duplicate');
t(/IF TWO ROWS LOOK ALIKE, ASK WHICH ONE/.test(src), 'two alike rows ask which, never refuse');
t(/NEVER say you cannot see something on their week without having read both lists/.test(src),
  'the exact refusal he got is named and forbidden');
t(/never claim a change you did not make/.test(src), 'and a move is not announced before it is made');

// ===== 4. "SEE EARLIER MESSAGES" WAS A DEAD BUTTON ======================
// Not slow — dead, and only in the one state it exists for. from>=n means the
// current sitting is EMPTY: everything on the thread is older than fifteen
// minutes, which is exactly where he is when he comes back and taps it.
// jtShowEarlier set _jtShown and re-rendered; _jtWindow then wiped _jtShown on
// that same render and the window fell back to the empty sitting.
console.log('\n  "see earlier messages" actually expands:');
global.JT_THREAD_WINDOW=30;
eval(grab(l=>l.startsWith('function _jtWindow(')));
const TH=Array.from({length:50},(_,i)=>({role:i%2?'a':'u'}));
global._jtSittingFrom=()=>50;              // a cold thread: nothing in this sitting
window._jtShown=null;
t(_jtWindow(TH).rows.length===0, 'a cold thread opens on the newest, showing none of it');
window._jtShown=30; window._jtExpanding=true;
t(_jtWindow(TH).rows.length===30, 'ONE tap reveals a windowful', _jtWindow(TH).rows.length+' rows');
window._jtShown=60;
t(_jtWindow(TH).rows.length===50, 'and a second tap reaches the whole thread');
window._jtExpanding=false;
// The reset is still right for a NEW sitting — an expansion he did while
// reading must not follow him into tomorrow.
window._jtShown=30;
_jtWindow(TH);
t(window._jtShown===null, 'but a new sitting still clears the expansion');
t(/!window\._jtExpanding/.test(src), 'the guard is the render being serviced, not a timer');

// HISTORY IS READ FROM THE DEVICE, NOT THE DATABASE — said plainly because it
// is the difference between hidden and lost. _jtLoad reads localStorage only,
// so this thread does not follow him to another phone or survive cleared site
// data. Nothing is DELETED by the button; there is simply nothing stored
// server-side for it to reach. Named here so it is not mistaken for fixed.
const LD=grab(l=>l.startsWith('function _jtLoad('));
t(/localStorage\.getItem\('yjb_jt_thread'\)/.test(LD), 'the thread is device-local (known limit, not a regression)');
t(!/sbSelect/.test(LD), 'and nothing reads it back from the database');

console.log(bad? '\n'+bad+' FAILED' : '\nall pass');
process.exit(bad?1:0);
