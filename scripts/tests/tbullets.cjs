/* A MEAL IS A LIST OF FOODS (Yusuf, 18 Sep, off Jasmin Dervi's snack).

     HU Milk Chocolate Cashew Butter Filled - Trader Joe's Low Fat Cottage
     Cheese - Half Envy Apple - Turkey and Cheese Lavash - 2 Medjool Dates
     745 cal  46P 103C 33F

   Five foods glued into one line with dots, and one lump of macros under them.
   "It should be a bullet point itemized breakdown of all the individual food
   that they logged so that they can truly actually see each itemized breakdown
   of what they said they ate."

   NO MIGRATION NEEDED FOR THIS ONE. Those five foods are already five rows -
   the feed groups them and then joins their names for display. The breakdown
   is in _groupRows and is thrown away at the last step. */
const fs=require('fs'), path=require('path');
const root=path.join(__dirname,'..','..');
process.chdir(root);
const {closure}=require('./_lift.cjs');
const src=fs.readFileSync(path.join(root,'index.html'),'utf8');
let fails=0;
const ok=(c,m,x)=>{ console.log((c?'  ok   ':'  FAIL ')+m+(x!==undefined?('  '+JSON.stringify(x)):'')); if(!c) fails++; };

console.log('\ntbullets - a plate of several foods reads as a list, not a title with dots in it');

const lifted=closure(['_mealBulletsHtml']);
ok(lifted.unresolved.length===0, 'the builder lifts with nothing missing', lifted.unresolved);
const F=new Function(lifted.code+'\nreturn {_mealBulletsHtml};')();

// ------------------------------------------------------------- HER SNACK
const JAS=[
  {name:'HU Milk Chocolate Cashew Butter Filled', calories:210},
  {name:"Trader Joe's Low Fat Cottage Cheese",    calories:90},
  {name:'Half Envy Apple',                        calories:50},
  {name:'Turkey and Cheese Lavash',               calories:255},
  {name:'2 Medjool Dates',                        calories:140},
];
const h=F._mealBulletsHtml(JAS);
ok(/<ul class="mbList">/.test(h), 'it is a list');
ok((h.match(/<li>/g)||[]).length===5, 'one line per food she logged', (h.match(/<li>/g)||[]).length);
JAS.forEach(f=>{ ok(h.indexOf(f.name.replace(/'/g,'&#39;'))>=0 || h.indexOf(f.name)>=0,
  'her "'+f.name.slice(0,26)+'" is on its own line'); });
ok(/210/.test(h) && /255/.test(h), 'each line carries what that food cost');
ok(!/ · /.test(h), 'and nothing is joined with a separator any more');

// -------------------------------------------------- WHEN IT MUST NOT FIRE
ok(F._mealBulletsHtml([{name:'Eggs and yogurt bowl', calories:505}])==='',
   'one food stays a title - a bullet with nothing under it is furniture');
ok(F._mealBulletsHtml([])==='', 'an empty meal draws nothing');
ok(F._mealBulletsHtml(null)==='', 'and a missing list does not throw');
ok(F._mealBulletsHtml([{name:''},{name:''}])==='', 'nameless rows draw nothing');

// a row with no calories still gets its line - the food is the point
const noCal=F._mealBulletsHtml([{name:'Black coffee'},{name:'Two eggs', calories:140}]);
ok((noCal.match(/<li>/g)||[]).length===2, 'a food with no calories is still listed');
ok(/Black coffee/.test(noCal), 'by name');

// Angela's two wordings of one plate must not become two bullets
const dup=F._mealBulletsHtml([{name:'Eggs and Bacon', calories:497},{name:'Eggs and Bacon', calories:533}]);
ok(dup==='', 'and the same name twice is not a two-item plate');

// the list is capped, so a twenty-row day cannot become a wall
const many=[]; for(let i=0;i<20;i++) many.push({name:'Food '+i, calories:50});
ok((F._mealBulletsHtml(many).match(/<li>/g)||[]).length<=10, 'a very long plate is capped');

// ------------------- A SINGLE ROW THAT HOLDS SEVERAL FOODS (Angela's sentence)
/* She typed one sentence and got one row titled with the whole meal squashed
   into five words. The foods ride on the row itself now, so the same list is
   drawn from `items` when the meal is one row and from the grouped rows when
   it is several. */
const L2=closure(['_mealItemRows']);
/* JSON is a browser global, not something this file declares - the lifter's
   report keeps ALL_CAPS names it cannot resolve. */
const h2=L2.unresolved.filter(n=>n!=='JSON');
ok(h2.length===0, 'the row reader lifts with nothing missing', h2);
const G=new Function(L2.code+'\nreturn {_mealItemRows};')();

const ANGELA={items:[
  {n:'Eggs', q:2, u:'each', cal:140},
  {n:'Ricotta cheese', q:1, u:'tbsp', cal:40},
  {n:'Bacon', q:4, u:'slice', b:'black label', cal:180},
  {n:'Biscuit', q:1, u:'each', b:'Great Value', cal:190}
]};
const rowsA=G._mealItemRows(ANGELA);
ok(rowsA && rowsA.length===4, 'her one sentence reads back as four foods', rowsA&&rowsA.length);
ok(/Eggs \u00d72/.test(rowsA[0].name), 'with the quantity on the line', rowsA&&rowsA[0].name);
ok(/black label/.test(rowsA[2].name), 'and the brand beside the food, not inside its name', rowsA&&rowsA[2].name);
ok(rowsA[3].calories===190, 'each line carries its own calories');

const hA=F._mealBulletsHtml(rowsA);
ok((hA.match(/<li>/g)||[]).length===4, 'and it draws as four bullets');

// the column comes back as text from PostgREST on some paths
ok(G._mealItemRows({items:JSON.stringify(ANGELA.items)}).length===4, 'a JSON string from the column parses too');
ok(G._mealItemRows({items:[{n:'Eggs',cal:140}]})===null, 'one item is not a list');
ok(G._mealItemRows({})===null && G._mealItemRows(null)===null, 'and a row with no items does not throw');

// ---- it is stored, and asked for
ok(/if\(_shp && _shp\.length>1\) row\.items=_shp; else delete row\.items;/.test(src),
   'the door shapes them and drops an empty array rather than storing a false claim');
ok(/foodRow\.items=r\.items_shaped/.test(src), 'the estimate path hands them over');
ok(/select=id,insight,items&limit=40/.test(src), 'and the feed actually asks the database for the column');
ok(/if\(!_blts\) _blts=_mealBulletsHtml\(_mealItemRows\(it\.data\)\)/.test(src),
   'the card falls back to the row\u2019s own foods when it is not a group');

// ------------- EVERYTHING ALREADY LOGGED, WITH NO DATABASE WRITE (18 Sep)
/* "Go back to last 2 days having bullets as well." A grouped meal has had them
   retroactively since v547. What had none was a single row whose name is
   several foods joined by the app's own separator, written before the items
   column existed. */
const L3=closure(['_mealNameSplit']);
ok(L3.unresolved.length===0, 'the title splitter lifts with nothing missing', L3.unresolved);
const H=new Function(L3.code+'\nreturn {_mealNameSplit};')();

const old=H._mealNameSplit({name:"HU Milk Chocolate Cashew Butter Filled \u00b7 Trader Joe's Low Fat Cottage Cheese \u00b7 Half Envy Apple \u00b7 Turkey and Cheese Lavash \u00b7 2 Medjool Dates"});
ok(old && old.length===5, 'a five-food title already logged splits into five', old&&old.length);
ok(old && old[0].name==='HU Milk Chocolate Cashew Butter Filled', 'names come back whole', old&&old[0].name);
ok(old && old.every(x=>x.calories===0),
   'and NO per-food calories are invented - the row holds one total for the plate');
ok(H._mealNameSplit({name:'Chobani \u00b7 Homemade Coffee'}).length===2, 'Dustin\u2019s two-food title splits');

/* Commas are NOT safe. "Eggs, Bacon & Ricotta Omelette with Biscuit" is one
   model-written title, and cutting it at the comma invents a food. */
ok(H._mealNameSplit({name:'Eggs, Bacon & Ricotta Omelette with Biscuit'})===null,
   'a comma-written title is left alone rather than guessed at');
ok(H._mealNameSplit({name:'Fish and chips with sides'})===null, 'and a plain title is left alone');
ok(H._mealNameSplit({name:'Eggs \u00b7 Eggs'})===null, 'the same food twice is not a two-food plate');
ok(H._mealNameSplit({})===null && H._mealNameSplit(null)===null, 'a missing name does not throw');

ok(/if\(!_blts\) _blts=_mealBulletsHtml\(_mealNameSplit\(it\.data\)\)/.test(src),
   'and the card falls back to it last, after the group and the stored items');

// ------------------------------------------------------------- ON THE CARD
ok(/_mealBulletsHtml\(it\.data&&it\.data\._groupRows\)/.test(src), 'the feed card builds it off the grouped rows');
ok(/_groupCount\+' foods'/.test(src), 'and the heading says how many, instead of naming them all again');
ok(/\.mbList\{/.test(src) && /\.mbList \.mbC\{/.test(src), 'the list and its figures are styled');
ok(/font-variant-numeric:tabular-nums/.test(src.slice(src.indexOf('.mbList .mbC{'), src.indexOf('.mbList .mbC{')+220)),
   'the calorie column lines up');

// ============ THE TITLE STAYS, AND BOTH SURFACES GET THE LIST (18 Sep)
/* "We should still have the titles of the food somewhere" - replacing the title
   with "3 foods" threw away the one line that says what the meal WAS at a
   glance. And "not only should this persist on mobile equally as well as
   desktop": the phone card and the desktop row are different renderers, which
   is how Jim's read reached one and not the other the night before. */
/* "logged 3 foods" is the VERB on the header line and stays - it is the card
   saying what happened. What had to go is the count standing in for the meal's
   NAME in the body. */
ok(!/line=\(_blts \?/.test(src), 'the title is no longer replaced by a count');
ok(/'logged '\+it\.data\._groupCount\+' foods'/.test(src),
   'while the header still says how many were logged, which is a different line');
const phone=(()=>{ const i=src.indexOf('THE TITLE STAYS (Yusuf, 18 Sep)');
  return src.slice(i, i+700); })();
ok(/f\.name\|\|'a meal'/.test(phone), 'the phone card still draws the real title');
ok(/'<\/div>'\+_blts/.test(phone), 'with the breakdown under it');

const desk=(()=>{ const i=src.indexOf('THE SAME BREAKDOWN ON THE DESKTOP');
  return src.slice(i, i+700); })();
ok(/_mealBulletsHtml\(d&&d\._groupRows\)/.test(desk), 'the desktop row draws it off the grouped rows');
ok(/_mealItemRows\(d\)/.test(desk) && /_mealNameSplit\(d\)/.test(desk),
   'and falls back the same three ways the phone does, so they cannot drift');

// ---- the name cap that ate "Beans"
/* "Chicken Breast Soup with Vegetables and Northern White Beans" is 59
   characters and arrived as "...and Northern White". */
ok(/_fnClip\(s, 80\)/.test(src), 'a food name is clipped at 80 now, not 55');
ok(!/_fnClip\(s, 55\)/.test(src), 'and the old cap is gone');
const L4=closure(['_fnClip']);
const K=new Function(L4.code+'\nreturn {_fnClip};')();
const JAZ='Chicken Breast Soup with Vegetables and Northern White Beans';
ok(K._fnClip(JAZ,80)===JAZ, 'so Jasmin\u2019s soup keeps its beans', K._fnClip(JAZ,80));
ok(K._fnClip(JAZ,55).indexOf('Beans')<0, 'which the old cap did not', K._fnClip(JAZ,55));
ok(K._fnClip('a '.repeat(90),80).length<=80, 'and a sentence is still cut');

console.log(fails? ('\ntbullets: '+fails+' FAILED\n') : '\ntbullets: all good\n');
process.exit(fails?1:0);
