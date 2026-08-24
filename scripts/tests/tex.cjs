const fs=require('fs');
const L=fs.readFileSync('index.html','utf8').split('\n');
function blk(sw){ const a=L.findIndex(l=>l.startsWith(sw)); let b=a; while(!L[b].startsWith('};')) b++; return L.slice(a,b+1).join('\n'); }
function grab(p){ const a=L.findIndex(p); let b=a; while(L[b]!=='}') b++; return L.slice(a,b+1).join('\n'); }
function one(sw){ return L[L.findIndex(l=>l.startsWith(sw))]; }
eval([blk('var EX_MUSCLE'), blk('var EX_ALIAS'), one('var _EX_KNOWN_CACHE=null;'),
  grab(l=>l.startsWith('function _exKnownNames(')), grab(l=>l.startsWith('function _exFlat(')),
  grab(l=>l.startsWith('function _exLev(')), one('var _EX_NEAR_MIN='),
  grab(l=>l.startsWith('function _exCanonical(')), grab(l=>l.startsWith('function _exNearest('))].join('\n'));
require('./_guard.cjs')(['_EX_KNOWN_CACHE','_EX_NEAR_MIN','_exCanonical','_exFlat','_exKnownNames','_exLev','_exNearest'], function(n){ return eval(n); });
const C=[
 // SNAPS - the class distance can actually settle
 ['dumbell row','Dumbbell Row'],
 ['romanian deadlifts','Romanian Deadlift'],
 ['lateral raise','Lateral Raises'],
 ['chest press','Chest Press'],
 ['CHEST PRESS','Chest Press'],
 ['chest-press','Chest Press'],
 ['lat pulldown','Pull Downs / Pull Ups'],      // a known alias
 ['tricep pushdown','Tricep Extension'],        // a known alias
 // MUST SURVIVE AS SAID - a different exercise must never be invented
 ['sissy squat','sissy squat'],
 ['reverse hyper','reverse hyper'],
 ['jefferson curl','jefferson curl'],
 ['zercher good morning','zercher good morning'],
 ['copenhagen plank','copenhagen plank'],
 ['banded face pull','banded face pull'],
 ['dumbbell trespass','dumbbell trespass'],     // the honest limit, handled by the prompt
 ['',''],
];
let bad=0;
C.forEach(function(c){ const g=_exNearest(c[0]); const ok=(g===c[1]); if(!ok) bad++;
 console.log((ok?'  ok    ':'  FAIL  ')+JSON.stringify(c[0]).padEnd(26)+'-> '+JSON.stringify(g)+(ok?'':'  (wanted '+JSON.stringify(c[1])+')')); });
console.log(bad? '\n'+bad+' FAILED' : '\nall '+C.length+' pass');
process.exit(bad?1:0);
