// SIX POUNDS OF FAT (George LaPierre, 14 Sep, his first log in 193 days).
//
// He typed "2 eggs season skinned and boned sardines". It landed at 25,657
// calories: 12g protein, 1g carb, and 2,845g of FAT. His day read 26,042.
//
// MEASURED, NOT GUESSED: _nlEcho returns unpriced on that sentence, because
// "season skinned and boned sardines" matches nothing in the macro table. So
// it went to the model, the model answered with a fat figure three orders of
// magnitude out, and between that answer and the database there was no ceiling
// anywhere.
//
// The app already refuses a read that comes back ALL ZEROS - "a read that
// FAILED, not a zero-calorie meal". This is the same sentence from the other
// end, and the worse half of it: a zero LOOKS wrong on a screen, and 25,657
// looks like a number.
//
// The exemption matters as much as the rule. When somebody writes their macros
// out themselves their figure stands even when it does not add up - "arguing
// with him is the regression this exists to end" - so this guards what the
// MACHINE produced and never what a person typed.
const fs=require('fs');
const guard=require('./_guard.cjs');
const src=fs.readFileSync('index.html','utf8');
const L=src.split('\n');
function fnAt(n){
  const a=L.findIndex(l=>l.indexOf('function '+n+'(')===0 || l.indexOf('async function '+n+'(')===0);
  if(a<0) return '';
  let b=a,d=0,seen=false;
  for(; b<L.length; b++){
    for(const ch of L[b]){ if(ch==='{'){ d++; seen=true; } else if(ch==='}'){ d--; } }
    if(seen && d===0) break;
  }
  return L.slice(a,b+1).join('\n');
}
function varLine(n){ const l=L.find(x=>x.indexOf('var '+n+'=')===0); return l||''; }
let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra!==undefined?('  '+extra):'')); };

eval(varLine('FOOD_MAX_CAL'));
eval(fnAt('_foodOutOfRange'));
guard(['FOOD_MAX_CAL','FOOD_MAX_PROT','FOOD_MAX_CARB','FOOD_MAX_FAT','_foodOutOfRange'], n=>eval(n));

console.log('\n  GEORGE’S PLATE');
const GEORGE={name:'Eggs and Sardines', calories:25657, protein:12, carbs:1, fat:2845};
t(_foodOutOfRange(GEORGE)==='calories' || _foodOutOfRange(GEORGE)==='fat',
  'the row that shipped is caught', _foodOutOfRange(GEORGE));
// and the one he meant, which must sail through untouched
t(_foodOutOfRange({calories:385, protein:42, carbs:1, fat:23})==='',
  'the same meal read correctly is not touched', '385 cal');
t(_foodOutOfRange({calories:350, protein:37, carbs:1, fat:22})==='',
  'and neither is the row he ended up with', '350 cal');

console.log('\n  NOTHING REAL IS EVER NEAR IT');
[[3200,180,320,140,'a genuine cheat day'],
 [1400,90,120,60,'a big dinner'],
 [90,1,22,0,'an apple'],
 [0,0,0,0,'black coffee'],
 [1200,200,10,20,'a competitor’s whole-day protein in one sitting'],
 [5900,300,700,260,'an eating-contest day, still under']
].forEach(function(x){
  t(_foodOutOfRange({calories:x[0],protein:x[1],carbs:x[2],fat:x[3]})==='', '  '+x[4]+' passes', x[0]+' cal');
});

console.log('\n  AND EACH MACRO HAS ITS OWN LINE');
t(_foodOutOfRange({calories:100, protein:12, carbs:1, fat:2845})==='fat',
  'fat alone is enough, even with sane calories');
t(_foodOutOfRange({calories:100, protein:900, carbs:1, fat:2})==='protein', 'so is protein');
t(_foodOutOfRange({calories:100, protein:2, carbs:5000, fat:2})==='carbs', 'so are carbs');
t(_foodOutOfRange(null)==='' && _foodOutOfRange(undefined)==='', 'nothing in, nothing refused');

console.log('\n  WHERE IT RUNS');
const door=fnAt('logFoodFromChat');
t(/_foodOutOfRange\(offer\)/.test(door), 'the one door every food log goes through checks it');
t(door.indexOf('_foodOutOfRange') < door.indexOf('if(dry) return {'),
  'ABOVE the dry exit, so the screen and the write can never disagree');
t(/if\(!_stated\)/.test(door.slice(door.indexOf('_foodOutOfRange')-80, door.indexOf('_foodOutOfRange'))),
  'and never over numbers a person wrote out themselves');
const sub=(function(){ const i=src.indexOf('async function nlSubmit(){'); const m=/\n(?:async )?function /.exec(src.slice(i+26)); return m?src.slice(i,i+26+m.index):src.slice(i); })();
t(/_foodOutOfRange\(est\)/.test(sub), 'the meal sheet says so to the client instead of logging it');
t(/Couldn’t make out the numbers/.test(sub), 'in the same words the all-zeros read already uses');

console.log(bad? ('\n  '+bad+' FAILED') : '\n  all passed');
process.exit(bad?1:0);
