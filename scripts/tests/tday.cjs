// The day resolver, pinned to a known date so the numbers are stable.
// Today = Monday 24 Aug 2026.
const fs=require('fs');
const L=fs.readFileSync('index.html','utf8').split('\n');
function grab(p){ const a=L.findIndex(p); let b=a; while(L[b]!=='}') b++; return L.slice(a,b+1).join('\n'); }
function one(sw){ return L[L.findIndex(l=>l.startsWith(sw))]; }
const REAL=Date;
class FakeDate extends REAL {
  constructor(...a){ if(!a.length) super(2026,7,24,9,0,0); else super(...a); }
  static now(){ return new REAL(2026,7,24,9,0,0).getTime(); }
}
global.Date=FakeDate;
eval([ one('var _JIM_DAY_BACK_RE='), one('var _JIM_DAY_NAGO_RE='), one('var _JIM_DOW='),
       one('var _JIM_WORDNUM='), one('var _JIM_DAY_MAX='), one('var _JIM_WEEKS_AGO_RE='),
       one('var _JIM_MONTHS='), grab(l=>l.startsWith('function _jimDateSaid(')),
       one('var _JIM_FOOD_CMP_RE='), grab(l=>l.startsWith('function _jimStripFoodCompare(')), 
       grab(l=>l.startsWith('function _jimAnchorDay(')) ].join('\n'));
require('./_guard.cjs')(['_JIM_DAY_BACK_RE','_JIM_DAY_MAX','_JIM_DAY_NAGO_RE','_JIM_DOW','_JIM_MONTHS','_JIM_WEEKS_AGO_RE','_JIM_WORDNUM','_jimAnchorDay','_jimDateSaid','_jimStripFoodCompare','_JIM_FOOD_CMP_RE'], function(n){ return eval(n); });
const fmt=(n)=>{ if(n==null) return 'null'; const d=new REAL(2026,7,24); d.setDate(d.getDate()-n); return d.toDateString().slice(0,10); };
const C=[
  ['I had two buffet muffins yesterday', 1],
  ['last night I had a bowl of granola', 1],
  ['the day before yesterday', 2],
  ['three days ago I had pizza', 3],
  ['on Friday I had eggs', 3],                 // Mon 24 -> Fri 21
  ['last Friday I had eggs', 3],
  ['Tuesday I had eggs', 6],                   // most recent Tuesday = Aug 18
  ['two weeks ago I had pizza', 14],
  ['one week ago', 7],
  ['last week I did legs', 7],
  ["last week's leg day", 7],
  ['last week on Tuesday I did legs', 13],     // Tue of the week before = Aug 11
  ['August 12th I had a burger', 12],          // Aug 12 -> 12 days back
  ['aug 12 I had a burger', 12],
  ['8/12 I had a burger', 12],
  ['on August 24th', 0],                       // today
  ['December 25th', 242],                      // last year's, already happened
  ['I had a blueberry scone', null],           // no day named
  ['what should I eat tomorrow', null],
  ['I ate 8 12 eggs', null]                    // not a date without a separator
];
let bad=0;
C.forEach(function(c){
  const g=_jimAnchorDay(c[0]);
  const ok=(g===c[1]); if(!ok) bad++;
  console.log((ok?'  ok    ':'  FAIL  ')+String(g).padStart(5)+'  '+fmt(g).padEnd(11)+JSON.stringify(c[0])+(ok?'':'   (wanted '+c[1]+')'));
});
console.log(bad? '\n'+bad+' FAILED' : '\nall '+C.length+' pass');
process.exit(bad?1:0);
