/* THE BACKFILL THAT ISN'T A BACKFILL (Yusuf, 18 Sep).

   "you should go back and clean up everyone's food logs who've been logging
   food on the free app."

   4,461 food rows exist. 56 carry the app's own separator and already itemise
   (_mealNameSplit). 2,655 carry the client's own sentence on meal_text, and a
   large share of those sentences are already a list of foods - the person who
   ate it typed the itemisation months ago and the app printed a title over it.

   _mealTextSplit reads that list at render time. No row is written, so no
   guess is stored, and every row ever logged is covered rather than the ones a
   60-day window caught.

   Every case below is a REAL string from his food_logs, including the one that
   made the guards necessary. */
const fs=require('fs'), path=require('path');
const root=path.join(__dirname,'..','..');
process.chdir(root);
const {closure}=require('./_lift.cjs');
const src=fs.readFileSync(path.join(root,'index.html'),'utf8');
let fails=0;
const ok=(c,m,x)=>{ console.log((c?'  ok   ':'  FAIL ')+m+(x!==undefined?('  '+JSON.stringify(x)):'')); if(!c) fails++; };

console.log('\ntmealtext - the client already itemised it; read that, do not invent one');

const lifted=closure(['_mealTextSplit','_mealBulletsHtml','_mealNameSplit','_mealItemRows']);
/* _mealItemRows calls JSON.parse on a string items column; JSON is a runtime
   global, not a file-level declaration, so the lifter reports it. */
const holes=lifted.unresolved.filter(n=>n!=='JSON');
ok(holes.length===0, 'the splitters lift with nothing missing', holes);
const F=new Function(lifted.code+'\nreturn {_mealTextSplit,_mealBulletsHtml,_mealNameSplit,_mealItemRows};')();
const split=t=>F._mealTextSplit({meal_text:t});
const names=t=>(split(t)||[]).map(r=>r.name);

// ------------------------------------------------- REAL ROWS THAT MUST SPLIT
const live=[
  ['Chow mein noodles, stirfry with avocado oil, cabbage, onion, chicken thighs', 5],
  ['Eggs, chicken sausage, sourdough, grapes, blackberries', 5],
  ['Greek yogurt, 3 eggs, turkey bacon, half sweet potato', 4],
  ['3/4 cup Greek yogurt, 1tsp honey, 1/3 cup granola', 3],
  ['Turkey sandwich on wheat bread with provolone, lettuce, tomato, peppers', 4]
];
live.forEach(([t,n])=>{
  ok((split(t)||[]).length===n, 'splits: '+t.slice(0,44), names(t));
});
ok(names('Eggs, chicken sausage, sourdough, grapes, blackberries')[1]==='Chicken sausage',
   'each food is capitalised, and nothing else about it is touched');
ok(names('3/4 cup Greek yogurt, 1tsp honey, 1/3 cup granola')[0]==='3/4 cup Greek yogurt',
   'a quantity the client wrote survives exactly as they wrote it');

// ------------------------------------- NO CALORIES ARE INVENTED ON THESE LINES
/* The row carries ONE total for the whole plate. Dividing it by the number of
   foods would put a figure nobody measured next to each name, and the card
   would then contradict itself. Names only. */
ok(split('Greek yogurt, 3 eggs, turkey bacon, half sweet potato').every(r=>r.calories===0),
   'no per-food calories - the row holds one total and it is not divided');
ok(!/mbC/.test(F._mealBulletsHtml(split('Greek yogurt, 3 eggs, turkey bacon, half sweet potato'))),
   'and no calorie badge is drawn on a single line of it');

// ---------------------------------------------------- THE ROWS THAT MUST NOT
/* This one is why the macro filter exists. It was in the first preview of the
   real backfill and it would have created a food called "48g protein". */
ok(split('Ate a few more bites of steak - but estimated ~640 calories | 48g protein | 44g, extra, more')===null,
   'a macro statement is never cut into foods');
ok(split('Eggs, Bacon & Ricotta Omelette with Biscuit')===null,
   'one model title with one comma is left alone');
ok(split('Chicken Breast Soup with Vegetables and Northern White Beans')===null,
   'and so is a title with no comma at all');
ok(split('I went out to a place downtown with my sister on Sunday, ordered the big plate off the specials board, and honestly did not finish any of it')===null,
   'prose is not a list, however many commas are in it');
ok(split('Eggs, bacon')===null, 'one comma is not a list');
ok(split('')===null && F._mealTextSplit(null)===null && F._mealTextSplit({})===null,
   'nothing in, nothing out');
ok(split('a, b, c')===null, 'single letters mean the split landed wrong, so it is abandoned');

// ------------------------------------------------- IT IS THE LAST SOURCE ONLY
/* Order matters and it is the whole design: rows logged together are the
   truth, the stored items column is next, the app's own separator after that,
   and only then the client's sentence. A guess never outranks a fact. */
const chain=src.slice(src.indexOf('_mealBulletsHtml(d&&d._groupRows)'), src.indexOf('_mealBulletsHtml(d&&d._groupRows)')+260);
ok(chain.indexOf('_groupRows')<chain.indexOf('_mealItemRows')
   && chain.indexOf('_mealItemRows')<chain.indexOf('_mealNameSplit')
   && chain.indexOf('_mealNameSplit')<chain.indexOf('_mealTextSplit'),
   'on the desktop card it is last, behind the grouped rows, the column and the separator');
ok((src.match(/_mealBulletsHtml\(_mealTextSplit\(/g)||[]).length===2,
   'and it is wired into BOTH renderers, because that is how the read reached one card and not the other',
   (src.match(/_mealBulletsHtml\(_mealTextSplit\(/g)||[]).length);

// a stored items column still wins over the sentence
ok(F._mealItemRows({items:[{n:'Chobani drink',cal:140},{n:'Homemade coffee',cal:5}],
                    meal_text:'chobani, coffee, and a banana'}).length===2,
   'a row that has the column does not fall through to the sentence');

console.log(fails? ('\n  '+fails+' FAILED\n') : '\n  all good\n');
process.exit(fails?1:0);
