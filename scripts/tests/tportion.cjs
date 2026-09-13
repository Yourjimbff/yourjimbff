// A PALM CANNOT MEASURE AN EGG, AND A SIDE IS NOT A COURSE.
//
// Yusuf, 13 Sep, building his own six test meals in the builder: eggs landed
// as "1", turkey bacon as "1", and berries came out at four and a half
// handfuls next to two eggs. Three taps was the standard he set -- "portions
// should be easy and even calculated based on the persons goals" -- and the
// portions were the part that wasn't.
//
// TWO HOLES, BOTH IN THE ARITHMETIC, NEITHER VISIBLE FROM THE SOURCE:
//
// 1. mbDefaultQty knew exactly one protein rule -- palms. Anything measured in
//    eggs, slices, scoops or cups fell past it to `return 1`, "one of whatever
//    it comes in". One egg is 6g of protein. The rule aims at forty-two.
//
// 2. portionFor drove fruit at a whole fruit-course carb target (20-35g) and
//    clamped only at eight. Mixed berries carry 6g a handful, so twenty-eight
//    grams asks for four and a half of them. The clamp was a number, not a
//    ceiling: eight handfuls of blackberries is not a breakfast either.
//
// So this suite RUNS the arithmetic rather than reading it. The component rows
// below are the real ones, read off meal_components on 13 Sep -- if the shelf
// changes under them the numbers here change with it, which is the point.
const {closure}=require('./_lift.cjs');
let bad=0;
const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };

const lift=closure(['mbDefaultQty','mbCountQty','mbFruitCap','portionFor','mbProteinGrams']);
if(lift.unresolved.length){ console.log('  FAIL  the portion chain has holes: '+lift.unresolved.join(', ')); process.exit(1); }
eval(lift.code);

// ---- the shelf, as it really is (meal_components, 13 Sep) ----
const C=(name,kind,unit,cal,p,c,f)=>({name,kind,unit,per_unit:{cal,p,c,f}});
const EGG      = C('Eggs','protein','egg',72,6,0,5);
const BACON    = C('Turkey Bacon','protein','slice',35,3,0,3);
const YOGURT   = C('Greek Yogurt','protein','cup',130,22,8,0);
const POWDER   = C('Protein Powder','protein','scoop',120,25,3,1);
const CHEESE   = C('Cheese','protein','slice',47,5.7,0.2,2.6);
const MILK     = C('Milk','protein','cup',120,8,12,5);
const RIBEYE   = C('Ribeye','protein','palm',290,30,0,19);
const THIGHS   = C('Chicken Thighs','protein','serving',416,55,0,19);
const MIXED    = C('Mixed Berries','fruit','handful',35,1,6,0);
const BLACKB   = C('Blackberries','fruit','handful',31,1,3,0);
const STRAWB   = C('Strawberries','fruit','handful',25,1,4,0);
const BLUEB    = C('Blueberries','fruit','handful',42,1,9,0);
const BANANA   = C('Banana','fruit','banana',105,1,24,0);
const APPLE    = C('Apple','fruit','serving',78,0,24,0);
const PEAR     = C('Pear','fruit','serving',88,0,16,0);
const KIWI     = C('Kiwi','fruit','kiwi',42,1,8,0);
const RICE     = C('Rice','carb','serving',70,1.4,14.3,0.2);
const BROCCOLI = C('Broccoli','veg','handful',31,2.6,6,0.3);

const qty=(c,gender)=>mbDefaultQty(c,'cut',gender||'male');

console.log('\n  ONE PALM IS WORTH A NUMBER, AND IT IS WRITTEN DOWN:');
/* The median protein across every palm-measured food on the shelf. Without it
   the countable rule has nothing to aim at. */
t(MB_PALM_P===28, 'a palm is 28g of protein', MB_PALM_P);
t(mbProteinGrams('male')===42,   'so a man aims at 42g a meal',   mbProteinGrams('male'));
t(mbProteinGrams('female')===28, 'and a woman at 28g',            mbProteinGrams('female'));
t(mbProteinGrams()===28, 'someone we have not met takes the lower one', mbProteinGrams());

console.log('\n  THE FOODS THAT USED TO COME OUT AS "1":');
/* Yusuf's Breakfast 1 is three eggs. Yusuf's Breakfast 2 is two slices of
   turkey bacon. Neither was typed into this file as an answer -- both fall
   out of the protein target meeting the plate. */
t(qty(EGG)===3,   'eggs land on three, not one',            qty(EGG));
t(qty(BACON)===2, 'turkey bacon lands on two, not one',     qty(BACON));
t(qty(CHEESE)===2,'cheese stops at two slices',             qty(CHEESE));
t(qty(YOGURT)===1.5,'greek yogurt lands on a cup and a half', qty(YOGURT));
t(qty(POWDER)===1.5,'a scoop and a half of powder for a man', qty(POWDER));
t(qty(POWDER,'female')===1, 'one scoop for a woman -- the goal still moves it', qty(POWDER,'female'));
t(qty(MILK)===1.5,'milk stops at a cup and a half',         qty(MILK));

console.log('\n  THE CAP IS THE PLATE, NOT THE MATHS:');
/* 42g of protein out of eggs alone is seven of them. The arithmetic is right
   and the answer is absurd, which is what a ceiling is for. */
t(Math.round(42/6)===7, 'the arithmetic really does ask for seven eggs');
t(qty(EGG)===3, 'and the plate says three', qty(EGG));
t(MB_COUNT_CAP.egg===3 && MB_COUNT_CAP.slice===2, 'the ceilings are named, not derived');
t(MB_COUNT_WHOLE.egg===1, 'an egg is a whole thing');
t(qty(EGG)%1===0 && qty(BACON)%1===0, 'so eggs and slices never come out in halves');
t(qty(YOGURT)%0.5===0, 'while a cup can be half a cup');

console.log('\n  AND IT ONLY TOUCHES WHAT IT UNDERSTANDS:');
t(qty(RIBEYE)===1.5, 'a palm food still takes the palm rule', qty(RIBEYE));
t(qty(THIGHS)===1,   'a food that comes by the serving is one serving', qty(THIGHS));
t(mbCountQty(BROCCOLI,'male')===0, 'a vegetable is not a protein and is left alone');
t(mbCountQty(RIBEYE,'male')===0,   'nor is a palm food counted twice');
t(mbCountQty(C('Mystery','protein','jar',10,0,0,0),'male')===0, 'a unit it has never met is left alone');

console.log('\n  A HANDFUL OR TWO:');
/* The bug he saw, exactly: mixed berries beside two eggs. */
t(qty(MIXED)===2,  'mixed berries land on two handfuls, not four and a half', qty(MIXED));
t(qty(BLACKB)===2, 'blackberries too -- they used to run to eight',           qty(BLACKB));
t(qty(STRAWB)===2, 'strawberries as well',                                     qty(STRAWB));
t(qty(BLUEB)===2,  'and blueberries',                                          qty(BLUEB));

console.log('\n  ONE, WHEN ONE IS ALREADY A SERVING:');
t(mbFruitCap(BANANA)===1, 'a banana carries a whole serving of carbs by itself');
t(mbFruitCap(APPLE)===1,  'so does an apple');
t(mbFruitCap(PEAR)===1,   'and a pear');
t(mbFruitCap(MIXED)===2,  'a handful of berries does not');
t(qty(BANANA)===1, 'so it is one banana',  qty(BANANA));
t(qty(APPLE)===1,  'one apple',            qty(APPLE));
t(qty(PEAR)===1,   'one pear',             qty(PEAR));
t(qty(KIWI)===2,   'and two kiwis',        qty(KIWI));

console.log('\n  THE SIDE DOOR IS UNCHANGED -- THE CEILING ONLY CATCHES THE FALL:');
/* The guided build already passes MB_SIDE_CARB for fruit, and those answers
   were right. A ceiling that moved them would be a regression dressed as a fix. */
t(portionFor(MIXED, 10).qty===1.5, 'a berry side is still a handful and a half', portionFor(MIXED,10).qty);
t(portionFor(BANANA,10).qty===0.5, 'and a banana side is still half a banana',   portionFor(BANANA,10).qty);

console.log('\n  A CARB COURSE IS NOT A SIDE:');
/* Only fruit got a ceiling. Rice is the carb of the meal and keeps the old one. */
t(portionFor(RICE,35).qty===2.5, 'rice still portions to the carb target', portionFor(RICE,35).qty);
t(portionFor(C('Thin','carb','serving',10,0,1,0), 400).qty===8, 'and a carb still clamps at eight, as before');

console.log('\n  THE FRUIT CEILING IS A CEILING, NOT A FLOOR:');
t(portionFor(BANANA, 60).qty===1, 'asking for more of a banana than a banana still gives one', portionFor(BANANA,60).qty);
t(portionFor(MIXED, 2).qty===0.5, 'and a tiny target still gives half a handful',              portionFor(MIXED,2).qty);

console.log(bad? ('\n  '+bad+' FAILED\n') : '\n  all good\n');
process.exit(bad?1:0);
