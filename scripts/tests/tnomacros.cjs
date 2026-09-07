// A ROW REFUSED FOR HAVING NO NUMBERS IS NOT A ROW THAT FAILED TO SAVE.
//
// LeAndra M, found in her Jim chat on 6 Sep. Twice in four days - 3 Sep and
// again on 6 Sep, minutes after her check-in call - she logged an iced vanilla
// latte with almond milk, the 2 Sep zero-macro gate refused it (no numbers
// could be put on it), and Jim said "One of those didn't actually save - can
// you tell me again?" Saying it again hits the same gate. Her own words to
// Yusuf on 3 Sep: "quit using it when it wasn't saving anything I put in."
//
// The gate's own note promised "Jim asks." This file holds it to that.
const fs=require('fs');
let bad=0;
const t=(pass,label)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label); };
const src=fs.readFileSync('index.html','utf8');

const writer=src.slice(src.indexOf('async function logFoodFromChat('), src.indexOf('async function logFoodFromChat(')+16000);
t(/if\(_ins && _ins\.zeroMacros\)\{\s*window\.__jimFoodUnsure = window\.__jimFoodUnsure \|\| \[\];\s*window\.__jimFoodUnsure\.push\(\{name:r\.name, why:'nomacros'\}\);/.test(writer),
  'the zero-macro refusal rides out of logFoodFromChat with its reason, like unconfirmed and duplicate already did');

const a=src.indexOf("var _noMac=_unsure.filter(function(u){ return u.why==='nomacros'; });");
t(a>0, 'the reply splits the no-numbers refusals off first');
const block=src.slice(a, a+2200);
t(/I could not put numbers on ' \+ _nmName \+ ' just now, so it is not on your day yet\. Tell me about how many calories it was/.test(block),
  'and ASKS for the numbers - now only when said, history and estimate all failed (7 Sep, see testimate.cjs)');
t(!/_noMac[\s\S]{0,400}didn't actually save/.test(block.slice(0, block.indexOf('var _allUnsure'))),
  'never says "didn\'t actually save" about a refusal - nothing failed, the app stopped on purpose');
t(/if\(_noMac\.length && _noMac\.length>=_short\)\{[\s\S]{0,120}\} else if\(_allUnsure\)\{/.test(block),
  'when every shortfall was the gate asking, the landed-but-unsure line does not fire - it would claim a row that was never written');
t(/var _allUnsure = _unsure\.length>0 && \(_unsure\.length \+ _noMac\.length\) >= _short;/.test(block),
  'and a turn with one refusal and one unconfirmed row speaks both true sentences, not the failure line');
const elseBranch=block.slice(block.indexOf('} else {'), block.indexOf('} else {')+200);
t(/One of those didn't actually save/.test(elseBranch),
  'a genuinely lost row - not refused, not unconfirmed, not duplicate - still gets the honest failure line, unchanged');

// the gate itself is untouched: Yusuf's 2 Sep ruling stands
t(/if\(_foodMacrosAllZero\(row\) && !_foodZeroIsPlausible\(row\)\)\{/.test(src), 'the 2 Sep gate is untouched - a zero-macro row is still refused');
t(/return \{ok:false, id:null, zeroMacros:true,/.test(src), 'and still answers zeroMacros:true, which is what the reply now reads');

console.log();
if(bad){ console.log('  '+bad+' FAILED'); process.exit(1); }
console.log('  all no-macros assertions pass');
process.exit(0);
