// ONE TAP, ONE MEAL (Yusuf, 4 Sep) — both real cases, off the real rows.
//
// He pasted his own Share day message to Chris McCarthy: "Breakfast: Eggs,
// sourdough & yogurt bowl · Eggs, sourdough & yogurt bowl (808 cal, 61g
// protein)". One breakfast, named twice, calories added. The two rows below
// are the actual food_logs rows read off the live table today, ids and all.
//
// The second fixture is Ben Plimpton's, from this morning: the identical-value
// double tap the catch up already caught. Both now go through ONE function,
// which is the point of the change — the old catch-up copy tested calories too
// and so caught Ben and missed Chris.
const guard=require('./_guard.cjs');
const {closure}=require('./_lift.cjs');

let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };

global.window={}; global.document={getElementById:()=>null};
const MINE=['_TAP_MS','_tapKey','_dedupeTaps'];
eval(closure(MINE).code);
guard(MINE, n=>eval(n));

// ===== CHRIS McCARTHY, 4 SEPTEMBER, FIFTY ONE SECONDS ==================
console.log('\n  THE CORRECTED RE-LOG:');
const CHRIS=[
  {id:'6aed86e3', name:'Eggs, sourdough & yogurt bowl', meal:'Breakfast', calories:380, protein:22,
   date_str:'Sep 4, 2026', logged_at:'2026-09-04T14:31:40.153+00:00'},
  {id:'0e92ff1c', name:'Eggs, sourdough & yogurt bowl', meal:'Breakfast', calories:428, protein:39,
   date_str:'Sep 4, 2026', logged_at:'2026-09-04T14:32:31.313+00:00'}
];
const c=_dedupeTaps(CHRIS);
t(c.length===1, 'one breakfast, not two', 'got '+c.length);
t(c[0].id==='0e92ff1c', 'and the LATER row wins, because it is the correction', c[0].id);
t(c[0].calories===428, 'so the message says 428, never 808', String(c[0].calories));
t(c.reduce((a,r)=>a+r.calories,0)===428, 'and the total cannot come to 808 again');

// ===== BEN PLIMPTON, 4 SEPTEMBER, SEVENTEEN SECONDS ====================
// The identical-value case. Same answer, one rule.
console.log('\n  THE IDENTICAL DOUBLE TAP:');
const BEN=[
  {id:'b1', name:'Eggs, Sausage & Blueberries', meal:'Breakfast', calories:497, protein:47,
   date_str:'Sep 4, 2026', logged_at:'2026-09-04T12:00:00.000+00:00'},
  {id:'b2', name:'Eggs, Sausage & Blueberries', meal:'Breakfast', calories:497, protein:47,
   date_str:'Sep 4, 2026', logged_at:'2026-09-04T12:00:17.000+00:00'},
  {id:'b3', name:'Yogurt, Blueberries & Strawberries', meal:'Snack', calories:220, protein:18,
   date_str:'Sep 4, 2026', logged_at:'2026-09-04T15:00:00.000+00:00'},
  {id:'b4', name:'Yogurt, Blueberries & Strawberries', meal:'Snack', calories:220, protein:18,
   date_str:'Sep 4, 2026', logged_at:'2026-09-04T15:00:17.000+00:00'}
];
const b=_dedupeTaps(BEN);
t(b.length===2, 'four rows, two meals', 'got '+b.length);
t(b.reduce((a,r)=>a+r.calories,0)===717, 'and 717 cal, not 1,434',
  String(b.reduce((a,r)=>a+r.calories,0)));

// ===== WHAT MUST NEVER BE COLLAPSED ====================================
// The other half of the rule, and the half that would quietly delete a client's
// real food if it were wrong.
console.log('\n  AND WHAT STAYS:');
const SAME_LATER=[
  {id:'s1', name:'Chicken and rice', meal:'Lunch', calories:600, protein:50, date_str:'Sep 4, 2026',
   logged_at:'2026-09-04T12:00:00.000+00:00'},
  {id:'s2', name:'Chicken and rice', meal:'Lunch', calories:600, protein:50, date_str:'Sep 4, 2026',
   logged_at:'2026-09-04T18:00:00.000+00:00'}
];
t(_dedupeTaps(SAME_LATER).length===2, 'the same meal SIX HOURS later is a second plate, and counts');
const THREE_MIN=[
  {id:'m1', name:'Banana', meal:'Snack', calories:100, protein:1, date_str:'Sep 4, 2026',
   logged_at:'2026-09-04T12:00:00.000+00:00'},
  {id:'m2', name:'Banana', meal:'Snack', calories:100, protein:1, date_str:'Sep 4, 2026',
   logged_at:'2026-09-04T12:03:00.000+00:00'}
];
t(_dedupeTaps(THREE_MIN).length===2, 'three minutes is outside the window and both stand');
const DIFF=[
  {id:'d1', name:'Eggs', meal:'Breakfast', calories:200, protein:18, date_str:'Sep 4, 2026',
   logged_at:'2026-09-04T12:00:00.000+00:00'},
  {id:'d2', name:'Toast', meal:'Breakfast', calories:150, protein:5, date_str:'Sep 4, 2026',
   logged_at:'2026-09-04T12:00:10.000+00:00'}
];
t(_dedupeTaps(DIFF).length===2, 'two DIFFERENT foods ten seconds apart are a plate, not a double tap');
const DAYS=[
  {id:'y1', name:'Oats', meal:'Breakfast', calories:400, protein:30, date_str:'Sep 3, 2026',
   logged_at:'2026-09-04T12:00:00.000+00:00'},
  {id:'y2', name:'Oats', meal:'Breakfast', calories:400, protein:30, date_str:'Sep 4, 2026',
   logged_at:'2026-09-04T12:00:05.000+00:00'}
];
t(_dedupeTaps(DAYS).length===2, 'two days caught up in one sitting are two days');
const MEALS=[
  {id:'x1', name:'Rice', meal:'Lunch', calories:200, protein:4, date_str:'Sep 4, 2026',
   logged_at:'2026-09-04T12:00:00.000+00:00'},
  {id:'x2', name:'Rice', meal:'Dinner', calories:200, protein:4, date_str:'Sep 4, 2026',
   logged_at:'2026-09-04T12:00:05.000+00:00'}
];
t(_dedupeTaps(MEALS).length===2, 'the same food under two different meals is two entries');
// NO NAME, NO KEY. Without this guard every unnamed row in a meal collapses
// into one and a client silently loses food.
const NONAME=[
  {id:'n1', name:'', meal:'Snack', calories:100, protein:1, date_str:'Sep 4, 2026',
   logged_at:'2026-09-04T12:00:00.000+00:00'},
  {id:'n2', name:'', meal:'Snack', calories:250, protein:9, date_str:'Sep 4, 2026',
   logged_at:'2026-09-04T12:00:05.000+00:00'}
];
t(_dedupeTaps(NONAME).length===2, 'unnamed rows are never collapsed into each other');
// A row with no clock cannot be proved to be a double tap.
const NOTIME=[
  {id:'t1', name:'Soup', meal:'Lunch', calories:300, protein:12, date_str:'Sep 4, 2026', logged_at:null},
  {id:'t2', name:'Soup', meal:'Lunch', calories:300, protein:12, date_str:'Sep 4, 2026', logged_at:null}
];
t(_dedupeTaps(NOTIME).length===2, 'and a row with no timestamp is never assumed to be one');

// ===== ORDER IS NOT DISTURBED ==========================================
console.log('\n  THE DAY STILL READS IN ORDER:');
const ORDER=[
  {id:'o1', name:'Oats', meal:'Breakfast', calories:400, protein:30, date_str:'Sep 4, 2026',
   logged_at:'2026-09-04T12:00:00.000+00:00'},
  {id:'o2', name:'Salad', meal:'Lunch', calories:350, protein:20, date_str:'Sep 4, 2026',
   logged_at:'2026-09-04T16:00:00.000+00:00'},
  {id:'o3', name:'Oats', meal:'Breakfast', calories:410, protein:31, date_str:'Sep 4, 2026',
   logged_at:'2026-09-04T12:00:30.000+00:00'},
  {id:'o4', name:'Steak', meal:'Dinner', calories:700, protein:60, date_str:'Sep 4, 2026',
   logged_at:'2026-09-04T23:00:00.000+00:00'}
];
const o=_dedupeTaps(ORDER);
t(o.length===3, 'the corrected breakfast collapses and the rest stand', 'got '+o.length);
t(o.map(r=>r.name).join('|')==='Oats|Salad|Steak',
  'and the correction takes the ORIGINAL row’s place, so the day keeps its order',
  o.map(r=>r.name).join('|'));
t(o[0].calories===410, 'holding the later numbers', String(o[0].calories));

// ===== BOTH SURFACES OR IT IS HALF SHIPPED =============================
// The whole reason this function exists is that there were two copies of the
// rule and they disagreed. Asserted on the shipped file, not on a promise.
console.log('\n  ONE RULE, BOTH MESSAGE BUILDERS:');
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
t((src.match(/_dedupeTaps\(/g)||[]).length>=3,
  'the helper is called, not merely defined', String((src.match(/_dedupeTaps\(/g)||[]).length));
t(/var g=_dedupeTaps\(groups\[k\]\.sort\(_mealDayOrder\)\);/.test(src),
  'the feed groups a plate from deduped rows — Share day and its summary');
t(/_dedupeTaps\(F\)\.forEach\(function\(f\)\{/.test(src),
  'and the catch up reads through the same door');
// The old private copy must be GONE, not merely unused beside the new one.
t(!/Math\.abs\(_t-_seen\[_k\]\)/.test(src),
  'the catch up no longer carries its own narrower copy of the rule');

console.log();
if(bad){ console.log('  '+bad+' FAILED'); process.exit(1); }
console.log('  all dedupe assertions pass');
process.exit(0);
