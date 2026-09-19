/* WHAT KIND OF FOOD EACH LINE IS (Yusuf, 19 Sep, off Rodrigo's Chipotle bowl).

   "Would be nice if we itemised it by food group. What primary macronutrient
   / type of food it is." His categories, his order. And the first bullet on
   that card read "Chipotle with white rice" - the restaurant, not a food. */
const fs=require('fs'), path=require('path');
const root=path.join(__dirname,'..','..');
process.chdir(root);
const {closure}=require('./_lift.cjs');
const src=fs.readFileSync(path.join(root,'index.html'),'utf8');
let fails=0;
const ok=(c,m,x)=>{ console.log((c?'  ok   ':'  FAIL ')+m+(x!==undefined?('  '+JSON.stringify(x)):'')); if(!c) fails++; };

console.log('\ntfoodgroup - every line says what kind of food it is, in his words');

const L=closure(['_foodGroup','_mealItemRows','_mealTextSplit','_mealBulletsHtml','_foodItemsShape','_foodTier','_mealRowsSorted','_jimLoggedHtml']);
/* _g is declared inside a try on one line in _foodItemsShape; the lifter misses it. */
const holes=L.unresolved.filter(n=>['JSON','_g'].indexOf(n)<0);
ok(holes.length===0, 'it lifts with nothing missing', holes);
const F=new Function('var FOOD_ITEM_MAX=20;'+L.code+'\nreturn {_foodGroup,_mealItemRows,_mealTextSplit,_mealBulletsHtml,_foodItemsShape,_foodTier,_mealRowsSorted,_jimLoggedHtml};')();
const g=(n,m)=>F._foodGroup(n,m||null);

// ------------------------------------------------------ RODRIGO'S BOWL
ok(g('white rice')==='Natural carbohydrate', 'white rice: natural carbohydrate');
ok(g('pinto beans')==='Natural carbohydrate', 'pinto beans: natural carbohydrate');
ok(g('double carnitas', {p:40,c:0,f:24})==='Protein & fat', 'carnitas: protein & fat', g('double carnitas', {p:40,c:0,f:24}));
ok(g('sour cream')==='Fat', 'sour cream: fat');
ok(g('guac')==='Fat', 'guac: fat');
ok(g('lettuce')==='Vegetable', 'lettuce: vegetable');

// ------------------------------------------------------- HIS CATEGORIES
[['chicken breast', {p:8.5,c:0,f:1}, 'Lean protein'],
 ['egg whites', null, 'Lean protein'],
 ['97/3 ground beef', {p:8.3,c:0,f:1.6}, 'Lean protein'],
 ['eggs', {p:6,c:0.5,f:5}, 'Protein & fat'],
 ['80/20 ground beef', {p:7.7,c:0,f:4.9}, 'Protein & fat'],
 ['salmon', {p:6.3,c:0,f:3.5}, 'Protein & fat'],
 ['oats', null, 'Natural carbohydrate'],
 ['sweet potato', null, 'Natural carbohydrate'],
 ['banana', null, 'Natural carbohydrate'],
 ['sourdough bread', null, 'Processed carbohydrate'],
 ['flour tortilla', null, 'Processed carbohydrate'],
 ['blueberry bagel', null, 'Processed carbohydrate'],
 ['hash browns', null, 'Processed carbohydrates & fat'],
 ['french fries', null, 'Processed carbohydrates & fat'],
 ['chocolate chip cookies', null, 'Processed carbohydrates & fat'],
 ['chicken nuggets', null, 'Fried protein'],
 ['fried chicken tenders', null, 'Fried protein'],
 ['grilled chicken wings', null, 'Protein & fat'],
 ['Big Mac', null, 'Processed junk food'],
 ['milkshake', null, 'Processed junk food'],
 ['broccoli', null, 'Vegetable'],
 ['mixed vegetables', null, 'Vegetable'],
 ['olive oil', null, 'Fat'],
 ['half avocado', null, 'Fat'],
 ['almonds', null, 'Fat']
].forEach(([n,m,want])=>{ ok(g(n,m)===want, n+' → '+want, g(n,m)); });
ok(g('zzyx', null)==='', 'a name it does not know, with no numbers, gets no tag - never a guess dressed as a fact');
ok(g('zzyx', {p:30,c:2,f:3})==='Lean protein', 'but the numbers alone can decide when there are numbers');

// ------------------------------------ HIS OWN BREAKFAST, ONE FOOD PER LINE
/* Typed on his phone as four lines with no commas, logged through the fast
   lane as one row with no foods on it, and drawn nowhere a client looks. */
const hb=F._mealTextSplit({meal_text:'3 eggs\n1 slice sourdough\n2 slices turkey bacon\n1 slice pepper jack cheese'});
ok(hb && hb.length===4, 'a line break is a separator', hb&&hb.map(x=>x.name));
ok(hb && hb.map(x=>x.group).join('|')==='Protein & fat|Processed carbohydrate|Protein & fat|Protein & fat',
   'eggs, sourdough, turkey bacon and pepper jack each get their kind - and pepper jack is cheese, not a pepper', hb&&hb.map(x=>x.group));
ok(/items:_items,/.test(src) && /THE FOODS THE TABLE PRICED ARE THE FOODS/.test(src), 'the fast lane now writes its foods onto the row');
ok(/_mealBulletsHtml\(_mealItemRows\(e\)\)/.test(src), 'the sheet they log from draws the list');
ok(/_mealBulletsHtml\(_mealItemRows\(rows\[0\]\)\)/.test(src), 'and so does the day card, for a meal of one row');

// ------------------------------------------------- THE RESTAURANT IS GONE
const bl=F._mealTextSplit({meal_text:'Chipotle with white rice, pinto beans, double carnitas, sour cream, guac, and lettuce'});
ok(bl && bl[0].name==='White rice', 'the first bullet is the rice, not the restaurant', bl&&bl.map(x=>x.name));
ok(bl && bl.length===6, 'six foods');
ok(bl.every(x=>x.group), 'and every one carries its kind', bl.map(x=>x.name+' / '+x.group));
const sh=F._foodItemsShape([{name:'Chipotle white rice', qty:1, unit:'each', calories:210},{name:'double carnitas', calories:380, protein:40, fat:24}]);
ok(sh && sh[0].n==='White Rice' && sh[0].b==='Chipotle', 'on a stored row the restaurant becomes the brand beside the food', sh&&sh[0]);
ok(sh && sh[0].g==='Natural carbohydrate' && sh[1].g==='Protein & fat', 'and the stored row carries the kind', sh&&sh.map(x=>x.g));

// ------------------------------------------------------------- THE BULLET
const rows=F._mealItemRows({items:[{n:'white rice', cal:210, g:'Natural carbohydrate'},{n:'carnitas', cal:380}]});
ok(rows[0].group==='Natural carbohydrate' && rows[1].group==='Protein & fat', 'a tagged row keeps its tag, an untagged one is decided', rows.map(r=>r.group));
const html=F._mealBulletsHtml(rows);
ok(/<span class="mbG">Natural carbohydrate<\/span>/.test(html) && /<span class="mbG">Protein &amp; fat<\/span>/.test(html), 'the kind is drawn under the food on the bullet');
ok(/"group" - the kind of food it is, EXACTLY one of: "Protein & fat", "Lean protein"/.test(src), 'and the model is asked to tag every row it writes from the same list');
ok(/A restaurant is never a food: "Chipotle with white rice" is a row called "white rice"/.test(src), 'and told the restaurant is not a food');

// ------------------------------------------- PROTEIN, THEN VEG, THEN CARBS
/* Yusuf, 19 Sep, off his own Day card: "Food should start in order of protein
   than vegetables than carbohydrates. That is how they should be listed." */
const tiers=[['eggs',0],['chicken breast',0],['chicken nuggets',0],['broccoli',1],['white rice',2],['sourdough',2],['french fries',2],['olive oil',3],['Big Mac',4],['zzyx',5]];
tiers.forEach(([n,t])=>{ ok(F._foodTier({name:n})===t, n+' sits in tier '+t, F._foodTier({name:n})); });
ok(F._foodTier({name:'zzyx', group:'Vegetable'})===1, 'a row that already carries its kind is ranked by it, not re-read');

const typed=[{name:'1 sourdough',cal:90},{name:'lettuce'},{name:'3 eggs',cal:210},{name:'olive oil'},{name:'6 slices turkey bacon',cal:180},{name:'white rice'}];
const sorted=F._mealRowsSorted(typed).map(r=>r.name);
ok(sorted.join('|')==='3 eggs|6 slices turkey bacon|lettuce|1 sourdough|white rice|olive oil',
   'protein first, then the vegetable, then the carbohydrates, then the fat', sorted);
ok(sorted.indexOf('3 eggs')<sorted.indexOf('6 slices turkey bacon') && sorted.indexOf('1 sourdough')<sorted.indexOf('white rice'),
   'inside a tier the foods keep the order they were logged in');
ok(F._mealRowsSorted(typed)!==typed && typed[0].name==='1 sourdough', 'the logged rows are not reordered in place');
const one=[{name:'3 eggs'}];
ok(F._mealRowsSorted(one)===one, 'a plate of one is handed back as it is');
ok(F._mealRowsSorted(null)===null, 'and nothing stays nothing');

const bh=F._mealBulletsHtml([{name:'1 sourdough',calories:90,group:'Processed carbohydrate'},{name:'3 eggs',calories:210,group:'Protein & fat'},{name:'lettuce',calories:5,group:'Vegetable'}]);
const order=(bh.match(/<span class="mbN">([^<]+)/g)||[]).map(x=>x.replace('<span class="mbN">',''));
ok(order.join('|')==='3 eggs|lettuce|1 sourdough', 'the bullet list every surface draws leads with the protein', order);
ok(/_mealRowsSorted\(rows\)\.map\(function\(r\)\{/.test(src), 'the Day card breakdown of a many-row meal is sorted the same way');
const cl=F._jimLoggedHtml([{n:'Breakfast',cal:480,p:32,c:30,f:24,items:[{n:'sourdough',q:1,u:'slice',cal:90},{n:'eggs',q:3,cal:210},{n:'turkey bacon',q:6,u:'slice',cal:180}]}]);
const clo=(cl.match(/<span class="clN">([^<]+)/g)||[]).map(x=>x.replace('<span class="clN">',''));
ok(clo.join('|')==='3 eggs|6 slice turkey bacon|1 slice sourdough', 'and so is the card Jim shows in the chat', clo);

console.log(fails? ('\n  '+fails+' FAILED\n') : '\n  all good\n');
process.exit(fails?1:0);
