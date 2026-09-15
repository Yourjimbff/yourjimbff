// A PHOTO IS EVIDENCE OF WHAT, NEVER OF HOW MUCH (Kristyn Perin, 15 Sep).
//
//   "When I added a photo to my dinner meal it added 500 calories even though
//    the description listed the weighed out portions of each item."
//   Yusuf: "Don't just make a short term fix for her log, make a long-term fix.
//    When someone writes what it is we always factor that in."
//
// HER SENTENCE, off the table: "5.5 oz lean ground beef, 115 g of rice, 1
// zucchini and 1 tbsp bachans japanese bbq sauce". Saved row 539 cal.
//
// TWO THINGS WERE WRONG UNDERNEATH THAT, and only one of them is the one she
// reported.
//
// THE ONE SHE REPORTED: on the reading road the photo and her sentence go up
// together and one answer comes back, one row per food, each carrying the
// MODEL's qty and unit. The table then prices those rows faithfully - from the
// model's numbers. Her "5.5 oz" was never held anywhere as a fact; it was a
// phrase in a prompt, and a model looking at a full plate is free to decide
// the plate is bigger than that.
//
// THE ONE FOUND WHILE LOOKING: _mtParse gated units through a list with ounces
// in it and not one gram spelling, so a typed weight lost its unit before
// _mtQtyToUnits - which has understood grams since Scott's 34,750-calorie
// breakfast on 2 Sep - ever saw it. "115 g of rice" priced as 115 HANDFULS.
const fs=require('fs');
const guard=require('./_guard.cjs');
const {defOf}=require('./_lift.cjs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+JSON.stringify(x)+']'):'')); };

global.window={}; global.document={getElementById:()=>null};
/* ORDER MATTERS HERE and it cost a confusing five minutes: MT_WEIGHT_G reads
   MT_G_PER_OZ at definition time, so lifting it first leaves oz:undefined and
   every ounce in the suite prices as NaN. Constants before the tables that
   read them, tables before the functions. */
const MINE=['MT_G_PER_OZ','MB_PALM_OZ','MT_ROWS','MT_WEIGHT_G','MT_UNIT_ALIAS','_MT_UNIT_RE',
            '_MT_BY','_mtIndex','_mtRow','_mtRound','_mtCal','_mtQty','_mtItem','_mtSum','_mtApplyItems',
            '_mtApplyResult','_mtParse','_mtFromPhrase',
            '_nlHardBreaks','_nlEchoParse','_nlSameFood','_nlStandsAlone','_nlEchoSplit',
            '_nlLocks','_nlApplyLocks','_nlSettle'];
eval(MINE.map(defOf).join('\n'));
guard(MINE, n=>eval(n));

const HERS='5.5 oz lean ground beef, 115 g of rice, 1 zucchini and 1 tbsp bachans japanese bbq sauce';

console.log('\n  GRAMS ARE A WEIGHT ON THIS ROAD TOO:');
/* Measured on the served build before the fix: 18,078 and 24,920 calories. */
const rice=_mtFromPhrase('115 g of rice');
t(rice && rice.calories>90 && rice.calories<200, '115 g of rice is a plate of rice, not 18,078 calories',
  rice && rice.calories);
t(rice && rice.carbs>20 && rice.carbs<45, '  and its carbs are grams of rice, not 4,025', rice && rice.carbs);
const sp=_mtFromPhrase('200 grams of sweet potato');
t(sp && sp.calories>120 && sp.calories<260, '200 grams of sweet potato likewise', sp && sp.calories);
t(_mtFromPhrase('105g blueberries').calories<120, 'and a weight with no space still reads',
  _mtFromPhrase('105g blueberries').calories);
t(_mtFromPhrase('1 lb ground beef').calories>800, 'pounds convert too', _mtFromPhrase('1 lb ground beef').calories);
/* What must NOT have changed: the units that already worked. */
t(_mtFromPhrase('5.5 oz lean ground beef').calories===351, 'ounces are exactly where they were',
  _mtFromPhrase('5.5 oz lean ground beef').calories);
t(_mtFromPhrase('1 zucchini').calories<40, 'and a bare count is still a count', _mtFromPhrase('1 zucchini').calories);
/* THE GATE IS BUILT FROM THE TABLE THAT DOES THE WORK, so it can never drift
   out of step with the converter again - that drift IS the bug. */
t(/Object\.keys\(MT_WEIGHT_G\|\|\{\}\)\.forEach/.test(src),
  'the unit list is generated from MT_WEIGHT_G, not typed out beside it');
Object.keys(MT_WEIGHT_G).forEach(function(u){
  if(!_MT_UNIT_RE.test(u)) { bad++; console.log('  FAIL  '+u+' converts but does not parse'); }
});
t(true, 'every spelling the converter knows, the parser now accepts');

console.log('\n  HER SENTENCE, SPLIT THE WAY THE ECHO BAR SPLITS IT:');
const parts=_nlEchoSplit(HERS);
t(parts.length===4, 'four foods, one per thing she wrote', parts);
t(parts[0]==='5.5 oz lean ground beef' && parts[1]==='115 g of rice', '  and they come out whole', parts);

console.log('\n  WHAT SHE MEASURED IS TAKEN BEFORE THE MODEL IS ASKED:');
const locks=_nlLocks(HERS);
const lockedFoods=locks.map(x=>x.food);
t(locks.length===3, 'three of her four carry a measured amount', lockedFoods);
t(lockedFoods.indexOf('lean ground beef')>-1 && lockedFoods.indexOf('rice')>-1,
  '  the beef and the rice, off her scale', lockedFoods);
t(lockedFoods.indexOf('zucchini')<0,
  '  and NOT the zucchini - a count of a thing that comes in sizes is what a photo is for',
  lockedFoods);
const beef=locks.filter(x=>x.food==='lean ground beef')[0];
t(beef && beef.qty===5.5 && beef.unit==='oz', '  her figure is kept as her figure', beef&&{q:beef.qty,u:beef.unit});
t(beef && beef.key==='lean beef', '  resolved to a table key, so matching never depends on wording', beef&&beef.key);
/* Her sauce is measured but the table has never heard of it - that is exactly
   the job the model and the photo keep. */
const sauce=locks.filter(x=>x.food.indexOf('bachans')>-1)[0];
t(!!sauce, 'her sauce is seen as measured');
t(sauce && sauce.priced===null, '  but the table cannot price it, so it stays the model’s to price',
  sauce && sauce.priced);

console.log('\n  AND A PHOTO CANNOT ARGUE WITH IT:');
/* The plate the model came back with after looking at her photo: her foods,
   scaled up, plus a side she never mentioned. This is the +500. */
const fromPhoto={name:'Beef, rice and zucchini', items:[
  {name:'Lean ground beef', table_key:'lean beef', qty:9,   unit:'oz'},
  {name:'White rice',       table_key:'white rice', qty:2.5, unit:'handful'},
  {name:'Zucchini',         table_key:'zucchini',  qty:2,   unit:'handful'},
  {name:'Bachans BBQ sauce', qty:1, unit:'tbsp', calories:35, protein:0, carbs:8, fat:0}
]};
const loose=_mtApplyResult(JSON.parse(JSON.stringify(fromPhoto)));
const settled=_nlSettle(JSON.parse(JSON.stringify(fromPhoto)), HERS);
t(loose.calories-settled.calories>200,
  'the photo-scaled plate really was hundreds of calories heavier',
  {photo:loose.calories, hers:settled.calories});
const beefRow=settled.items.filter(i=>i.table_key==='lean beef')[0];
t(beefRow && beefRow.qty===5.5 && beefRow.unit==='oz', 'the beef goes back to the 5.5 oz she weighed',
  beefRow && {q:beefRow.qty, u:beefRow.unit});
const riceRow=settled.items.filter(i=>i.table_key==='white rice')[0];
t(riceRow && riceRow.qty===115 && /^g/.test(riceRow.unit), 'and the rice to her 115 g',
  riceRow && {q:riceRow.qty, u:riceRow.unit});
/* The photo keeps every job it is actually good at. */
const zuc=settled.items.filter(i=>i.table_key==='zucchini')[0];
t(zuc && zuc.qty===2, 'the zucchini keeps what the picture judged - she never weighed it',
  zuc && zuc.qty);
t(settled.items.some(i=>String(i.name||'').toLowerCase().indexOf('bachans')>-1),
  'and her sauce survives, priced by the model because the table cannot');
t(settled._lockedCount===2, 'two rows locked, the rest left alone', settled._lockedCount);
/* The total has to be the sum of the rows it is showing, or the card lies. */
const sum=settled.items.reduce((n,i)=>n+(+i.calories||0),0);
t(Math.abs(sum-settled.calories)<=4, 'and the meal is the sum of its rows',
  {rows:sum, meal:settled.calories});

console.log('\n  NOTHING IS LOCKED THAT SHE DID NOT MEASURE:');
t(_nlLocks('').length===0, 'no words, no locks');
t(_nlLocks('chicken and rice').length===0, 'no amounts, no locks - the picture decides');
t(_nlLocks('2 eggs and toast').length===0, '  a bare count is not a measurement');
const unchanged={name:'x', items:[{name:'Chicken breast', table_key:'chicken breast', qty:8, unit:'oz'}]};
const same=_nlSettle(JSON.parse(JSON.stringify(unchanged)), 'chicken and rice');
t(same.items[0].qty===8, 'a plate with nothing stated comes back exactly as the model priced it', same.items[0]);

console.log('\n  AND THE MODEL IS TOLD, NOT ONLY OVERRULED:');
t(/A QUANTITY THE CLIENT WROTE IS A FACT THEY MEASURED/.test(src), 'the rule is in the prompt');
/* Matched in halves: the prompt is assembled by concatenation, so a sentence
   can straddle a string break. */
t(/A photo /.test(src) && /is evidence of WHAT is on the plate, never of HOW MUCH when they have already said how much/.test(src),
  'said the way it actually works');
t(/Where they named no amount, /.test(src) && /the picture is exactly what you should judge it by/.test(src),
  'and the picture is not told to stop doing its job');
t(/if\(line\)\{ try\{ _nlApplyLocks\(est, _nlLocks\(line\)\); \}catch\(e\)\{\} \}/.test(src),
  'but the braces are the code, applied before the sum');
t((src.match(/_nlSettle\(await _estP, line\)|_nlSettle\(_e0, line\)/g)||[]).length===2,
  'and both roads out of the photo race hand it her line',
  (src.match(/_nlSettle\([^)]*line\)/g)||[]));

console.log(bad?('\n  '+bad+' FAILED'):'\n  all good (she weighed it, so that is what it weighs)');
process.exit(bad?1:0);
