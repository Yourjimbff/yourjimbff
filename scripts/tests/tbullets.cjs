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

// ------------------------------------------------------------- ON THE CARD
ok(/_mealBulletsHtml\(it\.data&&it\.data\._groupRows\)/.test(src), 'the feed card builds it off the grouped rows');
ok(/_groupCount\+' foods'/.test(src), 'and the heading says how many, instead of naming them all again');
ok(/\.mbList\{/.test(src) && /\.mbList \.mbC\{/.test(src), 'the list and its figures are styled');
ok(/font-variant-numeric:tabular-nums/.test(src.slice(src.indexOf('.mbList .mbC{'), src.indexOf('.mbList .mbC{')+220)),
   'the calorie column lines up');

console.log(fails? ('\ntbullets: '+fails+' FAILED\n') : '\ntbullets: all good\n');
process.exit(fails?1:0);
