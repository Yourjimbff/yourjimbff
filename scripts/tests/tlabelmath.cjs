// THE FACTOR BOX IS THE BENCHMARK (Yusuf, 14 Sep, an hour after launch:
// "the calories are wrong ... I believe it's six hundred something calories
// and use that as an improvement benchmark moving forward").
//
// Zadkiel Rios photographed a Factor sleeve. The box says, in three boxed
// figures across the front:
//
//     640 CALORIES   43g PROTEIN   12g TOTAL CARBS
//     SEE NUTRITION INFORMATION FOR TOTAL FAT, SATURATED FAT AND CHOLESTEROL
//
// It logged as 220 calories. 43x4 + 12x4 + 0x9 = 220 exactly, so the printed
// 640 was thrown away and the number was worked out from a plate missing its
// biggest macro - because the fat came back as 0, and 0 fat is not a fact
// about the food, it is the absence of a reading stored as one.
//
// Two faults, in two files-worth of code, and this suite holds both:
//   the READER was told "a nutrient not shown at all is 0", four lines under
//   "NEVER write 0 for a number you could not read"; and
//   the MATH derived calories from macros instead of deriving the missing fat
//   from the calories.
//
// A front-of-box panel that prints calories, protein and carbs and sends you
// to the back for fat is not a Factor quirk - it is the whole meal-delivery
// category. Every one of them undercounted by roughly two thirds.
const fs=require('fs');
const guard=require('./_guard.cjs');
const src=fs.readFileSync('index.html','utf8');
const L=src.split('\n');
function fnAt(n){
  const a=L.findIndex(l=>l.indexOf('function '+n+'(')===0 || l.indexOf('async function '+n+'(')===0);
  if(a<0) return '';
  let b=a, d=0, seen=false;
  for(; b<L.length; b++){
    for(const ch of L[b]){ if(ch==='{'){ d++; seen=true; } else if(ch==='}'){ d--; } }
    if(seen && d===0) break;
  }
  return L.slice(a,b+1).join('\n');
}
let bad=0;
const t=(pass,label,extra)=>{ if(!bad&&!pass){} if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra!==undefined?('  '+extra):'')); };

eval(fnAt('_nlFromLabel'));
guard(['_nlFromLabel'], n=>eval(n));

// The reader's actual output for that photo, copied from a live read of the
// stored image - not a shape invented for the test.
const FACTOR = {seen:"640 CALORIES 43g PROTEIN 12g TOTAL CARBS",
  name:'Jalapeño-Lime Cheddar Chicken with Spicy Cilantro Cauli "Rice"', brand:'Factor',
  serving_text:'1 serving', servings_per_container:null,
  calories:640, protein:43, carbs:12, fibre:null, fat:null, kind:'protein', confidence:'high'};

console.log('\n  THE BENCHMARK: ZADKIEL’S FACTOR BOX');
const r = _nlFromLabel(FACTOR);
t(!!r, 'it reads');
t(r && r.calories===640, 'the printed 640 is what gets logged', r&&r.calories);
t(r && r.calories!==220, 'and never 220 again - the number this shipped as', r&&r.calories);
t(r && r.protein===43, 'protein as printed', r&&r.protein);
t(r && r.carbs===12, 'carbs as printed', r&&r.carbs);
// The fat is not on that box. It is what the calories have left after protein
// and carbs are paid for: (640 - 172 - 48) / 9 = 46.7
t(r && r.fat===47, 'the fat the box does not print is worked out of the calories', r&&r.fat);
t(r && r.fat!==0, 'never stored as a silent zero', r&&r.fat);
const addsUp = r ? (r.protein*4 + r.carbs*4 + r.fat*9) : 0;
t(Math.abs(addsUp-640)<=6, 'and the row adds up to the printed number', addsUp);
t(r && /Factor/.test(r.name), 'the brand is credited', r&&r.name);

console.log('\n  THE WHOLE CATEGORY, NOT ONE BOX');
// Any front panel of the same shape: calories + protein + carbs, no fat.
[[540,38,30],[420,25,45],[710,52,18],[330,30,8]].forEach(function(x){
  const o=_nlFromLabel({calories:x[0], protein:x[1], carbs:x[2], fat:null, name:'Meal', brand:'Any'});
  const back = o.protein*4 + o.carbs*4 + o.fat*9;
  t(o.calories===x[0] && Math.abs(back-x[0])<=6,
    '  '+x[0]+' cal / '+x[1]+'p / '+x[2]+'c lands on '+x[0]+' and balances', o.calories+' cal, '+o.fat+'g fat');
});

console.log('\n  WHAT IT REFUSES TO INVENT');
// Neither figure read. Deriving calories from macros with an unknown fat is not
// wrong by a little - it is wrong by everything the fat was worth. Handing it
// back sends the plate to the estimator, which is a guess that knows it is one.
t(_nlFromLabel({calories:null, protein:43, carbs:12, fat:null, name:'Meal'})===null,
  'no calories AND no fat is handed back, not guessed');
// Fat genuinely printed as 0 is a fact and is kept, and the calories are then
// honestly derivable.
const z=_nlFromLabel({calories:null, protein:25, carbs:5, fat:0, name:'Jerky'});
t(z && z.calories===120 && z.fat===0, 'a fat printed as 0 is a real 0, and calories come off it', z&&z.calories);
// Three numbers that cannot belong together are a misread, not a fat reading.
const badsum=_nlFromLabel({calories:200, protein:43, carbs:12, fat:null, name:'Meal'});
t(badsum && badsum.fat===0 && badsum.calories===200,
  'a negative remainder does not become negative fat', badsum&&badsum.fat);
const huge=_nlFromLabel({calories:9000, protein:10, carbs:10, fat:null, name:'Meal'});
t(huge && huge.fat===0, 'nor does an absurd one become 970g of fat', huge&&huge.fat);

console.log('\n  AND THE READER IS NO LONGER TOLD TO WRITE ZERO');
const prompt=fnAt('_mbLabelPrompt');
t(!/a nutrient not shown at all is 0/.test(prompt),
  'the line that contradicted "NEVER write 0" is gone');
t(/NOT SHOWN AT ALL is null, never 0/.test(prompt), 'and says null instead');
t(/NEVER write 0 for a number you could not read/.test(prompt), 'the rule it used to contradict still stands');
t(/SEE NUTRITION INFORMATION FOR TOTAL FAT/.test(prompt),
  'and the front-of-box panel is named, so it is recognised rather than guessed at');

console.log(bad? ('\n  '+bad+' FAILED') : '\n  all passed');
process.exit(bad?1:0);
