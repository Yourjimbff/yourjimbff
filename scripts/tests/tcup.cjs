// A CUP IS A VOLUME (Yusuf, 3 Sep: "I have one client who insists on fact
// checking me against my fitness pal. And she says that my stats are different
// when it comes to rice. Please quadruple check rice").
//
// The rice numbers were right -- USDA cooked long-grain white rice is 130 cal
// per 100g and this table is built on exactly that. What was WRONG is that
// "1 cup of rice" returned nothing at all: no calories, no protein, a blank
// echo on the single commonest way an American says a portion of rice. The
// argument was about a phrase the app was silent on.
//
// A cup cannot be one number. Cooked rice is 158g a cup; raw spinach is 30g.
// So every row carries its own `cg` from that food's USDA standard portion,
// and a row without one refuses exactly as before.
const fs = require('fs');
const L = fs.readFileSync('index.html', 'utf8').split('\n');
function liftLine(sw){ const l=L.find(x=>x.startsWith(sw)); if(l==null) throw new Error('SEAM MOVED: '+sw); return l; }
function liftObj(name){ const s=L.findIndex(l=>l.startsWith('var '+name+' =')||l.startsWith('var '+name+'='));
  if(s<0) throw new Error('SEAM MOVED: var '+name);
  for(let i=s;i<L.length;i++) if(L[i].trimEnd().endsWith('};')) return L.slice(s,i+1).join('\n');
  throw new Error('SEAM MOVED: close of '+name); }
function liftVar(name){ const s=L.findIndex(l=>l.startsWith('var '+name+'='));
  if(s<0) throw new Error('SEAM MOVED: var '+name);
  for(let i=s;i<L.length;i++) if(L[i].trim()==='];') return L.slice(s,i+1).join('\n');
  throw new Error('SEAM MOVED: close of '+name); }
function lift(name){ const s=L.findIndex(l=>l.startsWith('function '+name+'('));
  if(s<0) throw new Error('SEAM MOVED: function '+name);
  let d=0,st=false;
  for(let i=s;i<L.length;i++){ for(const c of L[i]){ if(c==='{'){d++;st=true;} else if(c==='}'){d--;} } if(st&&d===0) return L.slice(s,i+1).join('\n'); }
  throw new Error('SEAM MOVED: close of '+name); }

const src = [
  liftLine('var MB_PALM_OZ'), liftLine('var MT_G_PER_OZ'),
  liftObj('MT_WEIGHT_G'), liftObj('MT_UNIT_ALIAS'), liftVar('MT_ROWS'), 'var _MT_BY=null;',
  lift('_mtIndex'), lift('_mtRow'), lift('_mtRound'), lift('_mtCal'), lift('_mtQty'), lift('_mtItem'),
  'module.exports={MT_ROWS,_mtRow,_mtQty,_mtItem};'
].join('\n');
const m = { exports: {} }; new Function('module','exports',src)(m,m.exports);
const O = m.exports;

let bad = 0, n = 0;
const t = (ok, msg, got) => { n++; if(!ok) bad++; console.log((ok?'  ok    ':'  FAIL  ')+msg+(got!=null?('  '+got):'')); };
const row = k => O.MT_ROWS.find(r => r.k === k);
const item = (name, qty, unit) => O._mtItem({name:name, qty:qty, unit:unit});

console.log('\nTHE PHRASE THE ARGUMENT WAS ABOUT NOW ANSWERS:');
const cupRice = item('rice', 1, 'cup');
t(!!cupRice, '"1 cup of rice" is priced at all — it used to return nothing');
t(!!cupRice && cupRice.calories > 0, 'and it carries calories', cupRice ? cupRice.calories+' cal' : '');

console.log('\nAND IT AGREES WITH USDA, which is the whole point:');
// FDC "Rice, white, long-grain, regular, enriched, cooked": 1 cup = 158g,
// 205 cal / 4.3P / 44.5C. Ours is computed 4/4/9 on rounded macros, so it
// lands a few calories under the label figure and never over.
t(cupRice && Math.abs(cupRice.calories - 205) <= 15,
  'a cup of rice is within 15 cal of USDA\'s 205', cupRice ? cupRice.calories+' vs 205' : '');
t(cupRice && cupRice.calories <= 205,
  '...and it is UNDER, never over — this table does not inflate anyone', cupRice ? String(cupRice.calories) : '');

console.log('\nA CUP IS NOT ONE NUMBER — each food carries its own:');
[['white rice',158],['brown rice',202],['pasta',124],['oats',81],['potato',156],
 ['sweet potato',200],['broccoli',91],['spinach',30],['salad mix',35],
 ['cherry tomatoes',149],['peppers',149],['cucumber',104],['blueberries',148],
 ['strawberries',144],['raspberries',123],['grapes',151],['nuts',131],
 ['greek yogurt',245]].forEach(([k,g]) => {
  t(row(k) && row(k).cg === g, k + ' — 1 cup = ' + g + 'g (USDA standard portion)');
});
t(row('spinach').cg < row('white rice').cg / 4,
  'and a cup of spinach really is a fraction of a cup of rice, as it must be',
  row('spinach').cg + 'g vs ' + row('white rice').cg + 'g');

console.log('\nA CUP SCALES LIKE ANY OTHER AMOUNT:');
const half = item('rice', 0.5, 'cup'), two = item('rice', 2, 'cups');
// NOT EXACTLY half and double, and that is the table's own law rather than a
// defect: calories are computed on the ROUNDED macros (see tmtable.cjs), so a
// half cup's 2.15g of protein becomes 2 and its 0.25g of fat becomes 0 before
// anything is multiplied. Halving 201 gives 100.5; rounding first gives 96.
// The law exists so that what is displayed adds up to what is displayed, and
// it is worth more than exact proportionality. Tolerance here is set to what
// rounding can actually cost (6 cal), so a REAL scaling bug still fails.
t(half && Math.abs(half.calories - cupRice.calories/2) <= 6, 'half a cup is about half', half?half.calories+' cal vs '+(cupRice.calories/2):'');
t(two && Math.abs(two.calories - cupRice.calories*2) <= 6, 'two cups is about double', two?two.calories+' cal vs '+(cupRice.calories*2):'');
t(half && two && half.calories < cupRice.calories && cupRice.calories < two.calories,
  '...and they are strictly ordered, which is what a scaling bug would break',
  half.calories+' < '+cupRice.calories+' < '+two.calories);
t(item('rice',1,'cups') && item('rice',1,'cups').calories === cupRice.calories, '"cups" reads the same as "cup"');

console.log('\nAND A ROW WITH NO SOURCED CUP WEIGHT STILL REFUSES — silence, never a guess:');
// This is the rule that keeps the feature honest. Nobody has published what a
// cup of steak weighs, so the table declines to invent one, exactly as it
// declines every other unit it does not know.
[['ny strip','cup'],['egg','cup'],['olive oil','cup'],['avocado','cup'],['bread','cup']].forEach(([k,u]) => {
  t(item(k,1,u) === null, k + ' has no cup weight, so a cup of it is refused');
  t(row(k).cg === undefined, '...and carries no cg to be tempted by');
});

console.log('\nNOTHING ELSE MOVED — the units that already worked still do:');
t(item('rice',1,'handful').calories === 152, 'a handful of rice is still 152', String(item('rice',1,'handful').calories));
t(item('rice',158,'g').calories === item('rice',1,'cup').calories,
  '158g and 1 cup of rice are the same thing, because that is what a cup of rice is');
t(item('ny strip',12,'oz').calories === 978, '12oz of NY strip is still 978', String(item('ny strip',12,'oz').calories));
t(item('chicken breast',1,'palm').calories > 0, 'a palm still prices');
t(item('rice',1,'fistful') === null, 'and an invented unit is still refused');

console.log('\n' + (n-bad) + '/' + n + ' passed');
console.log('tcup: ' + (bad ? 'FAIL' : 'ok'));
process.exit(bad ? 1 : 0);
