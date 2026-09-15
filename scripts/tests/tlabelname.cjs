// 480 ON THE LABEL, 590 ON THE CARD (Yusuf, 15 Sep, off Giovanni Mejia's log).
//
//   "This guy logged a meal, and it looks like a nutrition label of a food, and
//    it appears that the food he logged was four hundred and eighty calories.
//    And then it says the meal that we logged for him was five hundred and
//    ninety calories."
//
// WHAT WAS ACTUALLY ON THE TABLE. Two food_logs rows, 42 seconds apart, both
// Lunch, both from the same $11.49 product page:
//   "Meal"           480 cal, 52p 31c 13f
//   "Francese Sauce" 110 cal,  1p  2c  9f
// The feed groups a client's meal-slot rows into one card and sums them, so it
// drew "Meal · Francese Sauce — 590 cal" over a photo of a panel reading 480.
//
// BOTH READS WERE RIGHT. The 480 panel is the meal; the 110 panel is the sauce,
// printed separately further down the same page because it is a separate packet.
// 590 is the honest total of the two.
//
// SO THE BUG IS NOT THE ARITHMETIC, IT IS THAT THE CARD COULD NOT BE READ. One
// of the two rows was called "Meal", which names nothing, so there was no way to
// see that 590 was a meal plus its sauce rather than a 480 label misread. And
// while looking at it: the panel prints "Total Sugars 2g" and the row stored 0,
// because sugar was never on the label reader's shape at all.
const fs=require('fs');
const guard=require('./_guard.cjs');
const {defOf}=require('./_lift.cjs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+JSON.stringify(x)+']'):'')); };

const MINE=['_nlFromLabel','_mbLabelPrompt','mbLabelUsable'];
eval(MINE.map(defOf).join('\n'));
guard(MINE, n=>eval(n));

console.log('\n  HIS PANEL, THROUGH THE READER:');
/* Read off his stored photo: 1 serving per container (369g), Calories 480,
   Total Fat 13g, Total Carbohydrate 31g, Protein 52g, Total Sugars 2g, and no
   product name anywhere in the crop - it sits above what he photographed. */
const HIS={name:'', brand:'', servings_per_container:1,
           calories:480, protein:52, carbs:31, fat:13, sugar:2};
const got=_nlFromLabel(HIS);
t(got.calories===480, 'the printed calories are the calories', got.calories);
t(got.protein===52 && got.carbs===31 && got.fat===13, 'and the printed macros are the macros', got);
t(got.sugar===2, 'the sugar comes off the panel now instead of landing as 0', got.sugar);
t(got._unnamed===true, 'and the row knows it has no name of its own', got._unnamed);
t(got.name==='Meal', '  "Meal" is still there as the last resort, so nothing meets an empty name');

console.log('\n  A LABEL THAT DOES NAME ITSELF IS UNTOUCHED:');
const sauce=_nlFromLabel({name:'Francese Sauce', brand:'', calories:110, protein:1, carbs:2, fat:9, sugar:0});
t(sauce.name==='Francese Sauce', 'his second row keeps its printed name', sauce.name);
t(sauce._unnamed===false, 'and never enters the borrow path at all', sauce._unnamed);
t(sauce.sugar===0, 'a printed zero is a fact and is stored as one', sauce.sugar);
const branded=_nlFromLabel({name:'Honey BBQ Chicken', brand:'Nutrition Solutions', calories:570, protein:66, carbs:50, fat:10});
t(branded.name==='Honey BBQ Chicken · Nutrition Solutions', 'brand credit still reads his way', branded.name);
t(branded._unnamed===false, '  and it is named');
t(branded.sugar===null, 'a panel that does not print sugar sends null, never 0', branded.sugar);

console.log('\n  SUGAR IS ASKED FOR, AND ASKED FOR PROPERLY:');
const prompt=_mbLabelPrompt();
t(/"sugar":null/.test(prompt), 'it is on the shape the reader is handed');
t(/grams of TOTAL SUGARS for one serving/.test(prompt), 'as total sugars, for one serving');
t(/not "Added Sugars"/.test(prompt), 'and not the added-sugars line under it');
t(/null if the panel does not show it/.test(prompt), 'null when the panel is silent, which is the file-wide rule');
t(/NEVER write 0 for a number you could not read/.test(prompt), '  the rule it has to agree with, still there');
/* A container of two servings logs the whole container, so the sugar has to be
   multiplied like everything else on the panel or one number is per-serving
   while the rest are per-pack. */
const pack=_nlFromLabel({name:'Cookies', calories:200, protein:2, carbs:30, fat:8, sugar:12, servings_per_container:2});
t(pack.calories===400 && pack.sugar===24, 'a two-serving pack multiplies the sugar with the rest', pack);

console.log('\n  THE BORROW TAKES A NAME AND NOTHING ELSE:');
const race=src.slice(src.indexOf("_labelWon=true; est.source='label';"), src.indexOf("_et.abort();               // the label answered"));
t(/if\(est\._unnamed\)\{/.test(race), 'it only runs when the label gave no name');
t(/var _lateEst=await _estP;/.test(race), 'and then waits for the estimate that is already in flight');
t(/est\.name=_bn\.slice\(0,80\); est\._namedBy='estimate';/.test(race), 'and takes the name');
t(!/est\.calories=/.test(race) && !/est\.protein=/.test(race) && !/est\.fat=/.test(race)
  && !/est\.carbs=/.test(race),
  'and NEVER a number - the label won, so every figure on the row is printed fact');
t(/_bn\.toLowerCase\(\)!=='meal'/.test(race), 'swapping "Meal" for "Meal" is not an improvement');
/* It must not slow the ordinary case down. A label that printed a name never
   reaches this branch, and a failed estimate leaves the row exactly as it was. */
t(/catch\(e\)\{\}\s*\n\s*\}\s*\n\s*_et\.abort\(\);/.test(race+"_et.abort();"),
  'a failed estimate costs the row nothing');

console.log('\n  AND A LATE LABEL CORRECTS THE SUGAR TOO:');
const late=src.slice(src.indexOf('function _nlLabelLanded('), src.indexOf('/* THE SATISFYING PART'));
t(/if\(lab\.sugar!=null\) _patch\.sugar=Math\.round\(\+lab\.sugar\|\|0\);/.test(late),
  'when a label lands after the row was written, the sugar is corrected with the rest');
t(/lab\.sugar!=null/.test(late),
  '  but only when the panel printed one - writing 0 would store an absence as a fact');
t(/if\(!same\) return;/.test(late),
  'and still never over numbers the client edited themselves');

console.log(bad?('\n  '+bad+' FAILED'):'\n  all good (the label names it, and the sugar comes with it)');
process.exit(bad?1:0);
