// The widened weight false-confirmation net, both halves, as it now stands.
//
// HARNESS ADAPTED, NOT LOOSENED (24 Aug). The net now consumes the engine's one
// shared claim vocabulary instead of hard-coding logged/added/saved, and its
// verb-free half reads the CLIENT'S OWN sentence to decide whether a weigh-in
// was even claimed. So the lifted body needs those constants in scope and a
// `text` argument it never had. Every case below still asserts exactly what it
// asserted before — they pass an empty sentence, which keeps the verb-free half
// silent — and new cases are appended for the half that did not exist.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const L=src.split('\n');
function grab(p){ const a=L.findIndex(p); let b=a; while(L[b]!=='}') b++; return L.slice(a,b+1).join('\n'); }
function multi(sw){ const a=L.findIndex(l=>l.trim().startsWith(sw)); let b=a; while(!/;\s*$/.test(L[b])) b++; return L.slice(a,b+1).join('\n'); }
const DEPS=[
  multi('var _JIM_CLAIM_VERB ='),
  multi('var _JIM_CLAIM_EXISTS_RE=new RegExp('),
  multi('var _JIM_CLAIM_WT_RE=new RegExp('),
  grab(l=>l.startsWith('function _jimHarvestWeight(')),
].join('\n')+'\n';
const A=src.indexOf('var _wtConfirmMatch =');
const B=src.indexOf('if(!_wtExpected && !_rawReplyHadWeightTag && _wtConfirmMatch)');
const body=src.slice(A,B);
const f=new Function('reply','text',DEPS+'var _wtConfirmMatch;'+body.replace(/var _wtConfirmMatch =/,'_wtConfirmMatch =')+'return !!_wtConfirmMatch;');
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
// THE VERB-FREE CLAIM, which is new. Third element is the client's own
// sentence: the net only asks this question when they actually stated a weight,
// so the same reply after a workout sentence must stay quiet.
const V=[
 ['It’s on your day.',      true,  'scale said 195 this morning'],
 ["That's in your log.",    true,  'weighed 195'],
 ['It’s on your day.',      false, 'did my workout at 6 this morning'],
 ['Nice work today.',       false, 'scale said 195 this morning']
];
let bad=0;
C.forEach(function(c){ const g=f(c[0],''); const ok=(g===c[1]); if(!ok) bad++;
 console.log((ok?'  ok    ':'  FAIL  ')+(g?'catches ':'passes  ')+JSON.stringify(c[0])); });
console.log('\n  and the verb-free claim, gated on them stating a weight:');
V.forEach(function(c){ const g=f(c[0],c[2]); const ok=(g===c[1]); if(!ok) bad++;
 console.log((ok?'  ok    ':'  FAIL  ')+(g?'catches ':'passes  ')+JSON.stringify(c[0])+'  after '+JSON.stringify(c[2])); });
console.log(bad? '\n'+bad+' FAILED' : '\nall '+(C.length+V.length)+' pass');
process.exit(bad?1:0);
