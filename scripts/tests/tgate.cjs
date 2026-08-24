const fs=require('fs');
const L=fs.readFileSync('index.html','utf8').split('\n');
function grab(p){ const a=L.findIndex(p); let b=a; while(L[b]!=='}') b++; return L.slice(a,b+1).join('\n'); }
function multi(startsWith){ const a=L.findIndex(l=>l.startsWith(startsWith)); let b=a; while(!/;\s*$/.test(L[b])) b++; return L.slice(a,b+1).join('\n'); }
eval([
  multi('var _JT_PAST_MEAL_RE=new RegExp('),
  'var _JIM_DAY_BACK_RE='+L[L.findIndex(l=>l.startsWith('var _JIM_DAY_BACK_RE='))].split('=').slice(1).join('='),
  L[L.findIndex(l=>l.startsWith('var _JIM_DAY_NAGO_RE='))],
  L[L.findIndex(l=>l.startsWith('var _JIM_DOW='))],
  L[L.findIndex(l=>l.startsWith('var _JIM_WORDNUM='))],
  L[L.findIndex(l=>l.startsWith('var _JIM_DAY_MAX='))],
  L[L.findIndex(l=>l.startsWith('var _JIM_WEEKS_AGO_RE='))],
  L[L.findIndex(l=>l.startsWith('var _JIM_MONTHS='))],
  grab(l=>l.startsWith('function _jimDateSaid(')),
  grab(l=>l.startsWith('function _jimAnchorDay(')),
].join('\n'));
// The gate, exactly as jimTurn applies it: he reported eating AND named a past day.
const fires=(t)=>{ const d=_jimAnchorDay(t); return (d!=null && d>0 && _JT_PAST_MEAL_RE.test(t)); };
const C=[
  ['I had two buffet muffins yesterday', true],          // HIS MUST-BE-100%
  ['last night I had a bowl of granola', true],
  ['yesterday I ate chicken and rice', true],
  ['I had a bowl of oats the day before yesterday', true],
  ['three days ago I had pizza', true],
  ['I had a blueberry scone', false],                    // today: logs fine already
  ['I had a great workout yesterday', true],             // extractor returns no food -> no write
  ['what should I eat tomorrow', false],
  ['I am thinking of having granola later', false],
  ['schedule a morning walk for me tomorrow at 6am', false],
  ['scale said 198 this morning', false],
  ['did legs yesterday squats 315 for 5', false],        // no eating verb
  ['how many calories in a bowl of granola', false],
  ['remind me to eat more protein yesterday', false]
];
let bad=0;
C.forEach(function(c){ const g=fires(c[0]); const ok=(g===c[1]); if(!ok) bad++;
  console.log((ok?'  ok    ':'  FAIL  ')+(g?'FIRES ':'quiet ')+JSON.stringify(c[0])); });
console.log(bad? '\n'+bad+' FAILED' : '\nall '+C.length+' pass');
process.exit(bad?1:0);
