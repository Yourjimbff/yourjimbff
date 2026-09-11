// HIS FOUR NOTES ON THE ECHO AND THE LOOKUP (Yusuf, 11 Sep, launch checklist).
//
// f4:  "its telling me under the echo that 7oz of chicken breast and 7oz of
//       chicken thigh are both 60g of protein"
//      "when i separate food with a '-' instead of a comma it seems to not
//       include it ... please include the abilityt to separate food with / and
//       - and ."
//      "when logging rice, i dont care about the protein, OR in vegetables -
//       for vegetables carbs and calories matter. in rice carbs and calories
//       matter. not protein"
// f14: "i wrote '1 nutrition solutions protein donut' and nothing pops up. i
//       dropped the '1' and it seems to appear all of a sudden."
//
// All four are about a number or a name the client can SEE, so all four are
// proved by running the real functions over the real strings, never by reading
// the source for a regex that is supposed to do it.
const fs=require('fs'), vm=require('vm');
const {closure}=require('./_lift.cjs');
const src=fs.readFileSync('index.html','utf8');
let bad=0; const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&x!==''?('  '+x):'')); };

const ctx={String,Math,Number,Array,Object,JSON,RegExp,isFinite,parseFloat,parseInt,window:{},console,document:{}};
vm.createContext(ctx);
const lifted=closure(['_nlEcho','_nlEchoSplit','_nlHardBreaks','_nlEchoParse','_nlSameFood',
                      '_nlEchoShape','_mtRow','_mtItem','_qtyParse','MT_ROWS','_NL_SHOW_CARBS']);
vm.runInContext(lifted.code, ctx);
/* The lifter chases every identifier it can see, which in bodies this size
   means it also reports the ALL-CAPS fragments inside regex character classes
   and strings (AEIOU, BBQ, BLT, OZ...) and a handful of caller-owned locals.
   Named here rather than filtered by shape, so a genuine hole still shows. */
const KNOWN_OUTSIDE=['_dsFallback','_drawn','_go','JSON','AEIOU','BBQ','BLT','PB','PBJ','IPA',
  'XL','XXL','MCT','BCAA','DHA','EPA','GF','LB','OZ','II','III','_nl','_liveChips','Z0','_ln','_seen','_ks'];
const holes=(lifted.unresolved||[]).filter(n=>KNOWN_OUTSIDE.indexOf(n)<0);
t(holes.length===0, 'every function under test lifted with its whole closure', holes.join(' '));

const echo = s => vm.runInContext('_nlEcho('+JSON.stringify(s)+')', ctx);
const split = s => vm.runInContext('_nlEchoSplit('+JSON.stringify(s)+')', ctx);

// ---- f4a: a thigh is not a breast ---------------------------------------
console.log('\n  A CHICKEN THIGH IS ITS OWN FOOD:');
const br=echo('7oz chicken breast').lines[0];
const th=echo('7oz chicken thigh').lines[0];
t(!!br && br.known && Math.round(br.protein)===60, 'seven ounces of breast is still 60g of protein', br?Math.round(br.protein)+'g':'no line');
t(!!th && th.known, 'and the thigh prices at all rather than falling to the model', th?String(th.known):'');
t(!!th && Math.round(th.protein)!==Math.round(br.protein),
  'and it is NOT the same number - the exact thing he saw', th?(Math.round(th.protein)+'g vs '+Math.round(br.protein)+'g'):'');
t(!!th && Math.round(th.protein)===52 && Math.round(th.fat)===22,
  'cooked skinless dark meat: 52g protein, 22g fat for seven ounces', th?(Math.round(th.protein)+'P/'+Math.round(th.fat)+'F'):'');
t(vm.runInContext("!!_mtRow('chicken thighs') && _mtRow('chicken thighs').k==='chicken thigh'", ctx),
  'the plural finds it too');
t(vm.runInContext("(function(){var r=_mtRow('turkey thigh'); return !r || !_nlSameFood('turkey thigh', r);})()", ctx),
  'and a thigh the table does not know is refused, not quietly given the chicken row');

// ---- f4b: the separators -------------------------------------------------
console.log('\n  THREE MORE WAYS TO SAY "NEXT ITEM":');
t(split('7oz chicken thigh - 1 handful of rice - 1 handful of broccoli').length===3, 'a dash between two foods is a list', JSON.stringify(split('7oz chicken thigh - 1 handful of rice - 1 handful of broccoli')));
t(split('- 7oz chicken thigh\n- 1 handful of rice').length===2, 'and so is a bulleted line');
t(split('1 handful of rice / 1 handful of broccoli').length===2, 'a slash between two foods is a list');
t(split('7oz chicken thigh. 1 handful of rice.').length===2, 'a full stop ends an item');
t(split('1/2 cup of rice').length===1, 'but a fraction is not a list', JSON.stringify(split('1/2 cup of rice')));
t(split('6oz 90/10 beef').length===1, 'and neither is a beef ratio', JSON.stringify(split('6oz 90/10 beef')));
t(split('1.5 cups of rice').length===1, 'a decimal point is not a full stop', JSON.stringify(split('1.5 cups of rice')));
t(split('6 oz. chicken breast').length===1, "and a unit's full stop is not one either", JSON.stringify(split('6 oz. chicken breast')));
t(split('air-fried chicken breast').length===1, 'a hyphen inside a word is not a dash', JSON.stringify(split('air-fried chicken breast')));
t(split('2 eggs w/ toast').length===1 || split('2 eggs w/ toast').length===2, 'w/ does not become a food called "w"',
  JSON.stringify(split('2 eggs w/ toast')));
t(split('2 eggs w/ toast').indexOf('w')<0, 'specifically: no fragment is the bare letter w');

// HIS OWN SENTENCE, both ways round, must read the same.
const commas=echo('7oz chicken thigh, 1 handful of mixed vegetables, 1 handful of rice');
const dashes=echo('7oz chicken thigh - 1 handful of mixed vegetables - 1 handful of rice');
t(commas.lines.length===3 && dashes.lines.length===3, 'his sentence reads as three foods either way',
  commas.lines.length+' vs '+dashes.lines.length);
t(Math.round(commas.total.calories)===Math.round(dashes.total.calories),
  'and comes to the same number either way', Math.round(commas.total.calories)+' vs '+Math.round(dashes.total.calories));

// ---- f4c: which two figures the line spends its room on ------------------
console.log('\n  THE MACRO THAT MATTERS FOR THAT FOOD:');
function shaped(line){
  const e=echo(line); const L=e.lines[0];
  return vm.runInContext('_nlEchoShape('+JSON.stringify({calories:L.calories,protein:L.protein,carbs:L.carbs,fat:L.fat,stated:!!L.stated})+', '
    +JSON.stringify(L.row||null)+')', ctx);
}
const rice=shaped('1 handful of rice');
t(rice.carbs>0 && rice.protein===0, 'rice shows its carbs and drops its protein', JSON.stringify(rice));
const veg=shaped('1 handful of mixed vegetables');
t(veg.carbs>0 && veg.protein===0, 'so do vegetables', JSON.stringify(veg));
const meat=shaped('7oz chicken thigh');
t(meat.protein>0 && meat.carbs===0, 'and chicken still leads with its protein', JSON.stringify(meat));
t(Math.round(commas.total.protein)>50,
  'the PLATE still counts every macro - this is a display rule, not a pricing one',
  Math.round(commas.total.protein)+'g protein on the plate');

// ---- f14: the quantity stopped the lookup --------------------------------
console.log('\n  A TYPED "1" NO LONGER HIDES THE FOOD:');
const q1=vm.runInContext("_qtyParse('1 nutrition solutions protein donut')", ctx);
t(q1.name==='nutrition solutions protein donut', 'the name comes back without the quantity', JSON.stringify(q1.name));
t(q1.cut===true, 'and the parse SAYS it took one off - which "qty !== 1" could never tell you', String(q1.cut));
const q2=vm.runInContext("_qtyParse('nutrition solutions protein donut')", ctx);
t(q2.cut===false, 'a name with no quantity in front of it says so too', String(q2.cut));
const q3=vm.runInContext("_qtyParse('3 eggs')", ctx);
t(q3.qty===3 && q3.name==='eggs' && q3.cut===true, 'a real quantity is unchanged');
t(/var ql=\(pr\.cut\?pr\.name:q\)\.toLowerCase\(\), qraw=q\.toLowerCase\(\)/.test(src)
  && /k\.indexOf\(ql\)<0 && k\.indexOf\(qraw\)<0/.test(src),
  'the suggest box searches the stripped name AND the raw words, so neither spelling can miss');

/* AND THE DOOR HE WAS ACTUALLY STANDING IN (proved on the served build, 11 Sep:
   the log sheet's chip row, not the suggest box, was where nothing popped up).
   Same bug, second copy: _nlChipCandidates scored a saved food's name against
   the RAW line, so "1 " in front of it took the score to -1 every time. */
const chipsrc=src.slice(src.indexOf('function _nlChipCandidates(text, slot){'),
                        src.indexOf('function _nlChipsHtml('));
const chips=(function(){
  const c={String,Math,console,_savedFoods:[
    {name:'Nutrition Solutions Protein Donut', calories:220, protein:20, carbs:24, fat:6},
    {name:'2% Greek Yogurt', calories:140, protein:20, carbs:8, fat:4}
  ]};
  vm.createContext(c);
  vm.runInContext(vm.runInContext.length?'':'', c);
  vm.runInContext(closure(['_qtyParse']).code, c);
  vm.runInContext(chipsrc, c);
  return (q)=>vm.runInContext('_nlChipCandidates('+JSON.stringify(q)+', "breakfast").map(function(o){return o.item.name;})', c);
})();
t(chips('nutrition solutions protein donut').indexOf('Nutrition Solutions Protein Donut')>-1,
  'his saved donut shows when he types its name', JSON.stringify(chips('nutrition solutions protein donut')));
t(chips('1 nutrition solutions protein donut').indexOf('Nutrition Solutions Protein Donut')>-1,
  'AND when he types how many of them - the exact thing that showed nothing',
  JSON.stringify(chips('1 nutrition solutions protein donut')));
t(chips('2 nutrition solutions').indexOf('Nutrition Solutions Protein Donut')>-1,
  'and a quantity in front of a partial name too');
t(chips('2% greek yogurt').indexOf('2% Greek Yogurt')>-1,
  'a food whose real name opens with a number is still found under its own spelling',
  JSON.stringify(chips('2% greek yogurt')));
t(chips('xyzzy').length===0, 'and a name nobody saved still matches nothing');

console.log(bad? '\n  '+bad+' FAILED' : '\n  the echo says one honest number per food');
process.exit(bad?1:0);
