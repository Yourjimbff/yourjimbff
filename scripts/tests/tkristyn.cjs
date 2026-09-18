/* A WEIGHT IS NOT A COUNT (Kristyn Perin, 17 Sep, 3:30pm).

   "Pre workout snack was 49 g sourdough bread with a drizzle of honey"
   became 3,612 cal / 128g P / 676g C / 44g F on Yusuf's feed.

   Divide every figure by 49: 74 cal, 2.6P, 13.8C, 0.9F. One slice of bread.
   The 49 grams was read as forty-nine slices.

   THIRD TIME, THIRD ROAD. Scott on 2 Sep (34,750 cal), Kristyn on 15 Sep
   ("115 g of rice" -> 18,078 cal), Kristyn again on the 17th. _mtQty has
   converted grams correctly since the first one; what kept reaching it was a
   number whose unit had already been thrown away.

   This suite RUNS the pricer on her row. */
const fs=require('fs'), path=require('path');
const root=path.join(__dirname,'..','..');
process.chdir(root);
const {closure}=require('./_lift.cjs');
const src=fs.readFileSync(path.join(root,'index.html'),'utf8');
let fails=0;
const ok=(c,m,x)=>{ console.log((c?'  ok   ':'  FAIL ')+m+(x!==undefined?('  '+JSON.stringify(x)):'')); if(!c) fails++; };

console.log('\ntkristyn - a number that cannot be a portion of food is not priced as one');

const lifted=closure(['_mtItem','_mtQty','_mtRow','_mtCal','_mtRound']);
ok(lifted.unresolved.length===0, 'the pricer lifts with nothing missing', lifted.unresolved);
const F=new Function(lifted.code+'\nreturn {_mtItem,_mtQty,_mtRow};')();

// ---- the table has to know bread by weight for any of this to matter
const bread=F._mtRow('sourdough bread') || F._mtRow('bread');
ok(!!bread, 'the macro table knows bread', bread && bread.k);
ok(!!bread && +bread.g>0, 'and knows what one of its units weighs, so grams convert', bread && bread.g);

// ---------------------------------------------------------- HER ROW
const asCount=F._mtItem({name:'sourdough bread', table_key:bread&&bread.k, qty:49, unit:'slice'});
ok(!!asCount, 'her item still prices - it is corrected, not thrown away');
if(asCount){
  ok(asCount.carbs < 60, 'and the carbs are a snack, not 676g', asCount.carbs);
  ok(asCount.calories < 300, 'and the calories are a snack, not 3,612', asCount.calories);
  /* Yusuf, reading the card: "It's like 30g carbs max." 49g of sourdough is
     about 26g of carbohydrate; the honey is logged separately. */
  ok(asCount.carbs >= 15 && asCount.carbs <= 40, 'it lands where he said it should', asCount.carbs);
}

// stated properly as grams, the answer is the same - the correction agrees with the road that always worked
const asGrams=F._mtItem({name:'sourdough bread', table_key:bread&&bread.k, qty:49, unit:'g'});
ok(!!asGrams && !!asCount && Math.abs(asGrams.carbs-asCount.carbs)<1,
   'and it matches what 49 g priced honestly gives', asGrams&&asCount?[asGrams.carbs,asCount.carbs]:null);

// ---------------------------------------------------- THE OTHER TWO
const rice=F._mtRow('white rice') || F._mtRow('rice');
if(rice && +rice.g>0){
  const r=F._mtItem({name:'rice', table_key:rice.k, qty:115, unit:'handful'});
  ok(!!r && r.calories<600, '115 g of rice is not 18,078 calories any more', r&&r.calories);
}
const sp=F._mtRow('sweet potato');
if(sp && +sp.g>0){
  const s2=F._mtItem({name:'sweet potato', table_key:sp.k, qty:200, unit:'handful'});
  ok(!!s2 && s2.calories<600, '200 g of sweet potato is not 24,920 calories any more', s2&&s2.calories);
}

// ------------------------------------------------- NO REAL PORTION MOVES
/* The gate may only fire on an answer that is not food. Every one of these is
   a portion a person actually eats and must come back untouched. */
const SAFE=[
  ['12 oz steak',        {name:'steak',        qty:12,  unit:'oz'}],
  ['2 palms of chicken', {name:'chicken breast',qty:2,  unit:'palm'}],
  ['3 eggs',             {name:'eggs',          qty:3,  unit:'each'}],
  ['2 handfuls of rice', {name:'white rice',    qty:2,  unit:'handful'}],
  ['1 tbsp olive oil',   {name:'olive oil',     qty:1,  unit:'tbsp'}],
  ['2 slices of bread',  {name:'bread',         qty:2,  unit:'slice'}],
  ['200 g of chicken',   {name:'chicken breast',qty:200,unit:'g'}],
  ['a bare tuna',        {name:'tuna',          qty:null,unit:''}]
];
SAFE.forEach(([label,it])=>{
  const row=F._mtRow(it.name);
  if(!row){ console.log('  --   (table does not carry '+it.name+', skipped)'); return; }
  const plain=F._mtQty(it.qty, it.unit, row);
  const got=F._mtItem(Object.assign({table_key:row.k}, it));
  ok(!!got, label+' still prices');
  if(got && plain!==null){
    const want=Math.round(row.c*plain);
    ok(Math.abs(got.carbs-want)<=1, label+' is untouched by the gate', [got.carbs, want]);
  }
});

// ------------------------------------------------------- THE RULE ITSELF
/* It lives INSIDE _mtItem on purpose - five suites lift that function with a
   hand-rolled regex and a helper beside it is a name they have never heard of.
   So it is tested through the door, which is the honest test anyway. */
const body=(()=>{ const i=src.indexOf('function _mtItem(item){');
  return src.slice(i, src.indexOf('\n}\n', i)); })();
ok(/var absurd=function/.test(body), 'the rule is inside the pricer, not a helper beside it');
ok(/MAX_MACRO_G=300/.test(body) && /MAX_CAL=2500/.test(body), 'and carries its own two ceilings');
ok(!/^var MT_ITEM_MAX/m.test(src), 'with no new top-level var, which CLAUDE.md names as a trap');

// ------------------------------------------------- THE MODEL IS TOLD
const block=(()=>{ const i=src.indexOf('function _mtPromptBlock(){');
  return src.slice(i, src.indexOf('\n}\n', i)); })();
ok(/one of g\/oz\/palm/.test(block), 'the prompt now offers grams as a unit');
ok(/SEND IT AS A WEIGHT/.test(block), 'and says plainly what to do with a weight');
ok(/ORDERED, AND NOW TAKEN/.test(block), 'and the note that deferred this for sixteen days is answered in place');

console.log(fails? ('\ntkristyn: '+fails+' FAILED\n') : '\ntkristyn: all good\n');
process.exit(fails?1:0);
