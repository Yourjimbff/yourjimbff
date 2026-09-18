/* THE NUMBERS HAVE TO AGREE WITH THEMSELVES (Yusuf, 17 Sep, 9:21pm).

   He photographed a Nutrition Solutions BEAST sleeve. Printed on it, in five
   yellow circles: 765 CALORIES, 52 PROTEIN, 33 CARBS, 45 FAT, 7 FIBER. The
   card showed 78 cal, 25 protein, 3 carbs, 4 fat. "I just logged my dinner,
   and it is very off. Very, very, very off."

   Two faults. v530 cut the fast read to 1100px to save him a second, and three
   digits in a sleeve circle do not survive that. And nothing in the app ever
   checked: 25 protein, 3 carbs and 4 fat is 148 calories by 4/4/9, so the card
   was showing a calorie figure that disagreed with the macros printed beside
   it, and no code noticed.

   This suite RUNS the gates on his actual numbers. A gate that reads correctly
   and passes 78 calories is the same family of failure as no gate at all. */
const fs=require('fs'), path=require('path');
const root=path.join(__dirname,'..','..');
process.chdir(root);
const {closure}=require('./_lift.cjs');
const src=fs.readFileSync(path.join(root,'index.html'),'utf8');
let fails=0;
const ok=(c,m,x)=>{ console.log((c?'  ok   ':'  FAIL ')+m+(x!==undefined?('  '+JSON.stringify(x)):'')); if(!c) fails++; };

console.log('\ntlabelsane - a read has to agree with itself before anybody sees it');

const lifted=closure(['_mbLabelSane','_mbLabelRepair','_mbFromSeen','_mbSeenPairs','_mbCalcCal','_mbSeenField']);
ok(lifted.unresolved.length===0, 'the gates lift with nothing missing', lifted.unresolved);
const F=new Function(lifted.code+'\nreturn {_mbLabelSane,_mbLabelRepair,_mbFromSeen,_mbSeenPairs,_mbCalcCal,_mbSeenField};')();

// ---------------------------------------------------------------- HIS MEAL
const SEEN='765 CALORIES  52 PROTEIN  33 CARBS  45 FAT  7 FIBER';
const WRONG={seen:SEEN, name:'Cilantro Lime Filet Mignon', brand:'Nutrition Solutions',
             calories:78, protein:25, carbs:3, fat:4, fibre:null};
const RIGHT={seen:SEEN, name:'Cilantro Lime Filet Mignon', brand:'Nutrition Solutions',
             calories:765, protein:52, carbs:33, fat:45, fibre:7};

ok(F._mbLabelSane(WRONG).ok===false, 'the read he actually got is REFUSED');
ok(/78/.test(F._mbLabelSane(WRONG).why), 'and it says which figure was wrong', F._mbLabelSane(WRONG).why);
ok(F._mbLabelSane(RIGHT).ok===true, 'what the sleeve really says passes');

// the repair recovers his dinner from the transcription, with no second round trip
const fixed=F._mbLabelRepair(WRONG);
ok(fixed.calories===765, 'the repair reads 765 calories back off the transcription', fixed.calories);
ok(fixed.protein===52 && fixed.carbs===33 && fixed.fat===45,
   'and the three macros with it', [fixed.protein,fixed.carbs,fixed.fat]);
ok(fixed.name==='Cilantro Lime Filet Mignon' && fixed.brand==='Nutrition Solutions',
   'without touching the name or the brand');
ok(F._mbLabelSane(fixed).ok===true, 'and the repaired read passes the gates');

// ------------------------------------------------- THE ARITHMETIC ON ITS OWN
ok(F._mbCalcCal(25,3,4)===148, '25p 3c 4f is 148 calories', F._mbCalcCal(25,3,4));
ok(F._mbCalcCal(52,33,45)===745, '52p 33c 45f is 745, which is what 765 should look like');
ok(F._mbCalcCal(null,null,10)===null, 'one macro alone is not enough to judge');
ok(F._mbCalcCal(10,null,5)!==null, 'two is');

// a calorie figure that cannot be reconciled is refused even with no transcription
ok(F._mbLabelSane({calories:78, protein:25, carbs:3, fat:4}).ok===false,
   'the arithmetic gate alone catches it, with nothing transcribed');
ok(F._mbLabelSane({calories:765, protein:52, carbs:33, fat:45}).ok===true,
   'and clears the real one');

// ------------------------------------------------------- NO FALSE REFUSALS
// Real labels, each one checked by hand against its packet. None of these may fail.
const REAL=[
  ['Chobani 0% plain, 150g',        {calories:80,  protein:14, carbs:6,  fat:0}],
  ['Quest bar, cookies and cream',  {calories:190, protein:21, carbs:22, fat:8,  fibre:14}],
  ['olive oil, 1 tbsp',             {calories:120, protein:0,  carbs:0,  fat:14}],
  ['white rice, 1 cup cooked',      {calories:205, protein:4,  carbs:45, fat:0}],
  ['almonds, 1oz',                  {calories:164, protein:6,  carbs:6,  fat:14, fibre:3.5}],
  ['NS Caribbean Pineapple',        {calories:527, protein:43, carbs:55, fat:15}],
  ['a Coke, 12oz',                  {calories:140, protein:0,  carbs:39, fat:0}],
  ['grilled chicken breast, 6oz',   {calories:280, protein:53, carbs:0,  fat:6}],
  ['avocado, whole',                {calories:240, protein:3,  carbs:12, fat:22, fibre:10}],
  ['black coffee',                  {calories:2,   protein:0,  carbs:0,  fat:0}]
];
REAL.forEach(([label,raw])=>{
  const r=F._mbLabelSane(raw);
  ok(r.ok===true, 'a real label is not refused: '+label, r.why||'');
});

// a zero-calorie product is a real thing and must not be judged by arithmetic
ok(F._mbLabelSane({calories:0, protein:0, carbs:0, fat:0}).ok===true, 'a zero-calorie product passes');

// ------------------------------------------------------ THE TRANSCRIPTION
ok(F._mbFromSeen('570 CALORIES 66 PROTEIN 50 CARBS 10 FAT 3 FIBER').calories===570,
   'number-before-word transcription parses');
ok(F._mbFromSeen('Calories: 240  Protein: 8g  Total Carbohydrate: 30g  Total Fat: 11g').protein===8,
   'word-before-number transcription parses too');
ok(F._mbFromSeen('Total Carbohydrate 30g Total Sugars 12g').carbs===30,
   'total sugars is not mistaken for total carbohydrate');
ok(F._mbFromSeen('Total Fat 11g Saturated Fat 3g').fat===11,
   'saturated fat is not mistaken for fat');
ok(F._mbSeenField('fiber')==='fibre' && F._mbSeenField('fibre')==='fibre',
   'both spellings of fibre land on the same field');

// nothing transcribed means the first gate simply does not fire
ok(F._mbLabelSane({seen:'', calories:200, protein:20, carbs:10, fat:8}).ok===true,
   'an empty transcription does not refuse a sane read');

// ------------------------------------------------------- THE PIXELS, IN SOURCE
const readBody=(()=>{ const i=src.indexOf('async function mbReadLabel(dataUrl, opts){');
  return src.slice(i, src.indexOf('\n}\n', i)); })();
ok(!/_fast\?1100:/.test(readBody), 'the fast read no longer sends 1100px');
ok(/downscaleImage\(dataUrl, 1600,/.test(readBody), 'both roads send 1600');
ok(/_mbLabelSane\(got\)/.test(readBody), 'and every read goes through the gate');
ok(/_mbLabelRepair\(got\)/.test(readBody), 'with the transcription as its second chance');

// the JSON shape has to ask for the fields the prose describes
const prompt=(()=>{ const i=src.indexOf('function _mbLabelPrompt(){');
  return src.slice(i, src.indexOf('\n}\n', i)); })();
ok(/"seen":""/.test(prompt), 'the shape asks for the transcription');
ok(/"ingredients":""/.test(prompt), 'and for ingredients, which the prose described and the shape had dropped');

console.log(fails? ('\ntlabelsane: '+fails+' FAILED\n') : '\ntlabelsane: all good\n');
process.exit(fails?1:0);
