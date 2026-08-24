// The voice net, on real reply strings.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const L=src.split('\n');
function grab(p){ const a=L.findIndex(p); let b=a; while(L[b]!=='}') b++; return L.slice(a,b+1).join('\n'); }
function multi(sw){ const a=L.findIndex(l=>l.startsWith(sw)); let b=a; while(!/;\s*$/.test(L[b])) b++; return L.slice(a,b+1).join('\n'); }
// the declaration AND the try block that fills it
const a=L.findIndex(l=>l.startsWith('var _JV_SPEAK_SYMBOLS=null;'));
let b=a; while(!L[b].startsWith('}catch(e){ _JV_SPEAK_SYMBOLS=null; }')) b++;
eval(L.slice(a,b+1).join('\n')+'\n'+grab(l=>l.startsWith('function _jvSpeakDesymbol(')));
const clean=(s)=>_jvSpeakDesymbol(s).replace(/\s+/g,' ').trim();
const C=[
 // THE TWO ADMIN VIEW LINES, verbatim from their source
 ['✓ Nathan is back on the roster.', 'Nathan is back on the roster.'],
 ['✓ Saved Nathan’s number to their phone field — you can text Nathan from their card now.',
  'Saved Nathan’s number to their phone field — you can text Nathan from their card now.'],
 // the shape he actually heard
 ['✓ Morning Walk set for 6am tomorrow.', 'Morning Walk set for 6am tomorrow.'],
 // emoji of every flavour
 ['✅ Logged — chicken and rice.', 'Logged — chicken and rice.'],
 ['🍗 Chicken, rice & broccoli. 1029 cal.', 'Chicken, rice & broccoli. 1029 cal.'],
 ['⚡ 9,000 steps → nice work', '9,000 steps nice work'],
 ['• Bench press — 3 sets @ 185 lbs', 'Bench press — 3 sets @ 185 lbs'],
 ['Booking: call · Friday 2:00pm', 'Booking: call Friday 2:00pm'],
 // MUST SURVIVE - words, money, percents, dashes, apostrophes, accents
 ['Café con leche and a jalápeno omelette', 'Café con leche and a jalápeno omelette'],
 ['That is $51.25 and 20% of your target — solid.', 'That is $51.25 and 20% of your target — solid.'],
 ['Buffin Muffin ×2', 'Buffin Muffin ×2'],
 ['Logged your day — three meals, 1,580 cal.', 'Logged your day — three meals, 1,580 cal.']
];
let bad=0;
C.forEach(function(c){ const g=clean(c[0]); const ok=(g===c[1]); if(!ok) bad++;
  console.log((ok?'  ok    ':'  FAIL  ')+JSON.stringify(g));
  if(!ok) console.log('          wanted: '+JSON.stringify(c[1])); });
// and nothing may be jammed together
const jam=C.some(function(c){ return /[a-z][A-Z]/.test(clean(c[0]).replace(/[A-Z][a-z]/g,'')); });
console.log(bad? '\n'+bad+' FAILED' : '\nall '+C.length+' pass');
process.exit(bad?1:0);
