// ONE NUMBER, AND IT IS DECIDED BEFORE SHE IS ASKED.
//
// Lailee, 12 Sep, third report: "it did not [log right] lol, it rearranged
// itself again, but i just went back copy and pasted"
// Yusuf: "she sees two different numbers upon logging. It must be one number
// moving forward, and you must explain to me why it is still doing this. This
// is a major defect on your part."
//
// IT WAS. Two engines priced the same plate, one after the other:
//   1. the reading road put the MODEL's figure on the confirm screen - the
//      number she reads and taps Log it under;
//   2. logFoodFromChat then re-priced the whole plate off the macro table on
//      the way to the database and wrote a different one.
// Her breakfast - "4 eggs (1 without yolk), 2 handfuls of blueberries, 2
// slices uncured turkey bacon, zero sugar added ketchup" - landed at 481 cal.
// The table can price exactly one of those four things (blueberries, 101), so
// the two engines had no way to agree on that meal.
//
// The table re-pricing is not the mistake - it is what fixed chicken thigh and
// salmon. Applying it AFTER she had agreed to a different number was.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let bad=0; const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };
function slice(a,b){ const i=src.indexOf(a); return i<0?'':src.slice(i, src.indexOf(b,i)); }

const door=slice('async function logFoodFromChat(offer, photo, targetCode, dry){',
                 'async function insertFoodLog(');
t(door.length>3000, 'the one door is where this test says it is', String(door.length));

console.log('\n  THE DOOR CAN PRICE WITHOUT WRITING:');
t(/async function logFoodFromChat\(offer, photo, targetCode, dry\)\{/.test(src),
  'it takes a dry flag');
t(/if\(dry\) return \{/.test(door), 'and a dry run returns instead of writing');
const dryAt=door.indexOf('if(dry) return {');
t(dryAt>0 && dryAt < door.indexOf('var _ins = await insertFoodLog('),
  'the dry exit is BEFORE the write, so nothing can land on a dry run');
t(dryAt > door.indexOf('_mtApplyItems(_mi)'),
  'and AFTER the table, so what it returns is the table\u2019s own answer');
t(dryAt > door.indexOf('_macrosReconcileWithCalories'),
  'and after the reconciliation');
t(/_priced: 1/.test(door), 'what comes back is stamped as already priced');

console.log('\n  AND A PRICED OFFER IS WRITTEN VERBATIM:');
t(/var _preP = !!\(offer && offer\._priced\);/.test(door), 'the door reads that stamp');
['if(!_preP && _sm && _sm.hasMacro){',
 'if(!_preP && !_stated){',
 'if(!_preP && !_stated && !_echoOwned && Array.isArray(offer.items)',
 'if(!_preP && !_stated && !_macrosReconcileWithCalories(',
 'if(!_preP && _foodMacrosAllZero(offer)'].forEach(function(g){
  t(door.indexOf(g)>0, 'this pricing step stands down for a priced offer: '+g.slice(0,46)+'\u2026');
});
t((door.match(/!_preP/g)||[]).length===5,
  'FIVE gates and no more - a pricing step left ungated is the second number coming back',
  String((door.match(/!_preP/g)||[]).length));

console.log('\n  THE SCREEN SHOWS THE PRICE THE WRITE WILL USE:');
const sub=slice('async function nlSubmit(){', 'function nlEdit(el, f){');
t(/\}, null, null, true\);/.test(sub), 'the reading road prices it dry');
const price=sub.indexOf('}, null, null, true);'), show=sub.indexOf("st.est=est; st.stage='res'; nlRender();");
t(price>0 && show>0 && price<show, 'BEFORE she is shown anything, not after');
t(/est\._priced=1;/.test(sub), 'and the answer is stamped so the write cannot redo it');
t(/if\(_pf && \(\+_pf\.calories \|\| \+_pf\.protein \|\| \+_pf\.carbs \|\| \+_pf\.fat\)\)\{/.test(sub),
  'a dry run that comes back empty changes nothing - the old figure still shows');
t(/catch\(e\)\{ console\.error\('dry price', e\); \}/.test(sub),
  'and a dry run that throws cannot cost her the meal');

console.log('\n  AND THE WRITE CARRIES THE STAMP:');
const conf=slice('async function nlConfirm(){', 'function _tlRefreshDay');
t(/_priced:\(st\.est\._priced\?1:0\)/.test(conf), 'Log it hands the stamp back');
t(/items:\(st\.est\.items\|\|null\)/.test(conf), 'with the rows it was priced from');
t(conf.indexOf('_priced:(st.est._priced?1:0)') < conf.indexOf('}, st.photo||null);'),
  'on the same call that writes the meal');

console.log('\n  HER OWN CORRECTION IS FINAL TOO:');
const ed=slice('function nlEdit(el, f){', 'async function nlConfirm(){');
t(!/\._priced=0/.test(ed) && !/delete st\.est\._priced/.test(ed),
  'editing a macro by hand does not clear the stamp, so the table cannot re-price what she typed');

console.log('\n  THE FAST ROAD IS UNTOUCHED:');
const fast=slice('async function nlSubmitFast(st, line){', 'var _NL_ENRICH_MAX_CAL');
t(!/null, null, true/.test(fast), 'it does not price twice - it never showed the model a plate');
t(/e\.partial\?'\\u2026'/.test(src) || /partial\?'\u2026'/.test(src),
  'and a plate it could only part-price still shows no number at all until it settles');

console.log(bad? '\n  '+bad+' FAILED\n' : '\n  all good\n');
process.exit(bad?1:0);
