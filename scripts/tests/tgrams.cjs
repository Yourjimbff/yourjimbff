// THE UNIT IS A WORD AS OFTEN AS IT IS A LETTER (nightly sweep, 16 Sep).
//
// _parseInlineMacros read the unit as a bare `g?`. So "47 g protein" landed and
// "47 grams protein" did not, and the difference was invisible to the person
// typing it: the number was dropped in silence and the unread words stayed in
// `rest`, which is the string that names the meal.
//
// What that cost, on his own feed. Niko H, 16 Sep, said:
//   "Turkey chilli, it had 526 calories, 47 g protein, 22 grams carbs, 5.2 grams fat"
// The row stored 526 cal and 47g protein, lost the 22g carbs and the 5.2g fat,
// so his day total was wrong by both - and the meal was filed as
//   "Turkey Chilli, It Had, , , , 22 Grams Carbs, 5.2 Grams Fat"
// because the two phrases the parser could not read were still sitting in the
// name. One missing word in one unit list, two of his numbers gone, and a name
// with four empty commas in it on every screen that shows his day.
//
// This suite is the permanent test for that miss. Half of it is the sentences
// that MUST now read; the other half is the sentences that MUST STILL FAIL,
// because a unit that got greedier is exactly how "100 grams chicken" turns
// into 100g of carbs.
const fs=require('fs');
const guard=require('./_guard.cjs');
const {defOf}=require('./_lift.cjs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };

const MINE=['_parseInlineMacros'];
eval(MINE.map(defOf).join('\n'));
guard(MINE, n=>eval(n));

const M=s=>_parseInlineMacros(s).macros;

console.log('\n  HIS SENTENCE, WHOLE:');
const niko=_parseInlineMacros("Turkey chilli, it had 526 calories, 47 g protein, 22 grams carbs, 5.2 grams fat");
t(niko.macros.cal===526,    'the calories read', String(niko.macros.cal));
t(niko.macros.protein===47, 'the protein reads', String(niko.macros.protein));
t(niko.macros.carbs===22,   'the carbs read - they did not before', String(niko.macros.carbs));
t(niko.macros.fat===5.2,    'the fat reads, decimal and all', String(niko.macros.fat));
t(niko.rest==="Turkey chilli, it had", 'and the meal is named off what is left, with no empty commas in it', JSON.stringify(niko.rest));

console.log('\n  THE WORD, IN THE SHAPES PEOPLE SAY IT:');
t(M("22 grams carbs").carbs===22,          '"22 grams carbs"');
t(M("47 grams protein").protein===47,      '"47 grams protein"');
t(M("5.2 grams fat").fat===5.2,            '"5.2 grams fat"');
t(M("22 grams of carbs").carbs===22,       '"22 grams of carbs"');
t(M("22 grams carbohydrates").carbs===22,  '"22 grams carbohydrates"');
t(M("30 gram protein").protein===30,       '"30 gram protein", singular');
t(M("30 gms protein").protein===30,        '"30 gms protein"');
t(M("protein 60 grams").protein===60,      '"protein 60 grams", word first');

console.log('\n  AND THE LETTER STILL READS, UNCHANGED:');
t(M("47 g protein").protein===47,          '"47 g protein"');
const trip=M("60g protein 10g carbs 5g fat");
t(trip.protein===60&&trip.carbs===10&&trip.fat===5, '"60g protein 10g carbs 5g fat"');
const wf=M("protein 60 carbs 10 fat 5");
t(wf.protein===60&&wf.carbs===10&&wf.fat===5,       '"protein 60 carbs 10 fat 5"');
t(M("250 cals").cal===250,                 '"250 cals"');
const bare=M("chicken and rice 60/10/30");
t(bare.protein===60&&bare.carbs===10&&bare.fat===30, 'the bare 60/10/30 triple');

console.log('\n  AND THE ONES THAT MUST STILL FIND NOTHING:');
const none=s=>t(!_parseInlineMacros(s).hasMacro, JSON.stringify(s), JSON.stringify(M(s)));
none("100 grams chicken");     /* a weight of food, not a macro */
none("200 grams cod");
none("5 grams ginger");
none("2 grams fat free cheese");  /* the `free` guard - this is a cheese */
none("a handful of blueberries");
none("4 oz wild caught salmon, 4 oz jasmine white rice");

console.log(bad?('\n  '+bad+' FAILED'):'\n  all gram assertions pass');
process.exit(bad?1:0);
