// The widened weight false-confirmation net, both halves, as it now stands.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const A=src.indexOf('var _wtConfirmMatch =');
const B=src.indexOf('if(!_wtExpected && !_rawReplyHadWeightTag && _wtConfirmMatch)');
const body=src.slice(A,B);
const f=new Function('reply','var _wtConfirmMatch;'+body.replace(/^var /,'')+'return !!_wtConfirmMatch;');
const C=[
 // MUST CATCH -- a weigh-in claimed with nothing written
 ['Logged — 195 this morning.', true],
 ['Logged — 198 lbs this morning.', true],
 ['Logged — 197.', true],
 ['Got it, 196 recorded.', true],
 ['Logged your weigh-in — 195.', true],
 ['Saved your weight, 195.', true],
 ['Recorded 197.4 for today.', true],
 // MUST NOT -- these are other logs, or a recap, not a weigh-in claim
 ['Logged — chicken and rice. 620 cal, 48g protein.', false],
 ['Logged — 9,000 steps.', false],
 ['Logged — 20 min walk.', false],
 ['Logged — 3 sets of 10.', false],
 ['Logged your weight training session.', false],
 ['You are at 2040 cal for the day.', false],
 ['Logged — 45g protein.', false]
];
let bad=0;
C.forEach(function(c){ const g=f(c[0]); const ok=(g===c[1]); if(!ok) bad++;
 console.log((ok?'  ok    ':'  FAIL  ')+(g?'catches ':'passes  ')+JSON.stringify(c[0])); });
console.log(bad? '\n'+bad+' FAILED' : '\nall '+C.length+' pass');
process.exit(bad?1:0);
