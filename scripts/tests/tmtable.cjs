// THE MACRO TABLE IS LAW (Yusuf, ruling, 30 Aug).
// Three things this proves, all of them things that were actually wrong:
//   · EVERY ROW CARRIES P, C AND F. The first cut gave potatoes and blueberries
//     carbs only, and the protein in the worked examples came from nowhere.
//   · CALORIES ARE COMPUTED, NEVER QUOTED, and computed on the ROUNDED macros,
//     so what is displayed adds up to what is displayed. Jim's live answer for
//     "2 handfuls salad, 1.5 handfuls potatoes, 3 handfuls blueberries" came
//     back 320 cal for 6P/77C/1F, which is 341 — it did not add up to itself.
//   · A MEAL TOTAL IS THE SUM OF ITS ITEMS, both ways round: summing the item
//     calories and applying 4/4/9 to the summed macros give the same number.
//
// Lifted out of index.html by name, like every other suite here, so it breaks
// when the seam moves rather than testing a copy.
const fs = require('fs');
const L = fs.readFileSync('index.html', 'utf8').split('\n');

function lift(name) {
  const s = L.findIndex(l => l.startsWith('function ' + name + '(') || l.startsWith('async function ' + name + '('));
  if (s < 0) throw new Error('SEAM MOVED: function ' + name + ' not found');
  let d = 0, st = false;
  for (let i = s; i < L.length; i++) {
    for (const c of L[i]) { if (c === '{') { d++; st = true; } else if (c === '}') { d--; } }
    if (st && d === 0) return L.slice(s, i + 1).join('\n');
  }
  throw new Error('SEAM MOVED: no close found for ' + name);
}
// The table itself is a var, not a function, so it gets its own reader.
function liftVar(name) {
  const s = L.findIndex(l => l.startsWith('var ' + name + '='));
  if (s < 0) throw new Error('SEAM MOVED: var ' + name + ' not found');
  for (let i = s; i < L.length; i++) if (L[i].trim() === '];') return L.slice(s, i + 1).join('\n');
  throw new Error('SEAM MOVED: no close found for var ' + name);
}
function liftLine(startsWith) {
  const l = L.find(x => x.startsWith(startsWith));
  if (l == null) throw new Error('SEAM MOVED: line not found: ' + startsWith);
  return l;
}

// SEEDING THE NAMES THE LIFTER NEVER TOOK (3 Sep). This suite could not run at
// all -- it died on "MT_G_PER_OZ is not defined" before reaching a single table
// assertion, so the one test that guards the macro table was silently proving
// nothing. The three constants _mtQty actually reads were simply never in the
// list. Seeding them is the sanctioned remedy for this lifter's blind spot.
function liftObj(name) {
  const s = L.findIndex(l => l.startsWith('var ' + name + ' =') || l.startsWith('var ' + name + '='));
  if (s < 0) throw new Error('SEAM MOVED: var ' + name + ' not found');
  for (let i = s; i < L.length; i++) if (L[i].trimEnd().endsWith('};')) return L.slice(s, i + 1).join('\n');
  throw new Error('SEAM MOVED: no close found for var ' + name);
}
const src = [
  liftLine('var MB_PALM_OZ'),
  liftLine('var MT_G_PER_OZ'),
  liftObj('MT_WEIGHT_G'), liftObj('MT_UNIT_ALIAS'),
  liftVar('MT_ROWS'),
  'var _MT_BY=null;',
  lift('_mtIndex'), lift('_mtRow'), lift('_mtRound'), lift('_mtCal'),
  lift('_mtQty'), lift('_mtItem'), lift('_mtApplyItems'), lift('_mtSum'),
  lift('_mtApplyResult'), liftLine('var _MT_UNIT_RE'), lift('_mtParse'), lift('_mtFromPhrase'), lift('_mtPromptBlock'),
  'module.exports={MT_ROWS,MT_G_PER_OZ,_mtRow,_mtRound,_mtCal,_mtQty,_mtItem,_mtApplyItems,_mtSum,_mtApplyResult,_mtParse,_mtFromPhrase,_mtPromptBlock,MB_PALM_OZ};'
].join('\n');
const m = { exports: {} };
new Function('module', 'exports', src)(m, m.exports);
const O = m.exports;

let fails = 0, n = 0;
function ok(cond, msg) { n++; if (cond) { console.log('  PASS ' + msg); } else { fails++; console.log('  FAIL ' + msg); } }
function eq(a, b, msg) { ok(a === b, msg + '  (got ' + a + ', want ' + b + ')'); }

console.log('\n-- every row is complete --');
const incomplete = O.MT_ROWS.filter(r => typeof r.p !== 'number' || typeof r.c !== 'number' || typeof r.f !== 'number');
ok(incomplete.length === 0, 'every row carries P, C and F — no number comes from nowhere');
ok(O.MT_ROWS.length >= 40, 'the table has real coverage (' + O.MT_ROWS.length + ' rows)');
const keys = O.MT_ROWS.map(r => r.k);
ok(new Set(keys).size === keys.length, 'no duplicate keys');
const seen = {}; const coll = [];
O.MT_ROWS.forEach(r => [r.k].concat(r.a || []).forEach(a => { if (seen[a]) coll.push(a); seen[a] = r.k; }));
ok(coll.length === 0, 'no alias resolves to two different foods' + (coll.length ? ' — ' + coll.join(', ') : ''));

console.log('\n-- the arithmetic law --');
eq(O._mtCal(10, 10, 10), 170, 'calories are P*4 + C*4 + F*9');
eq(O._mtCal(0, 0, 0), 0, 'nothing is nothing');
// rounded FIRST: 2.4P rounds to 2 and the calories follow the 2, not the 2.4
eq(O._mtCal(2.4, 0, 0), 8, 'calories are computed on the ROUNDED macros, not the fractions behind them');

console.log('\n-- a palm is this file\'s own palm --');
const chicken = O._mtRow('chicken breast');
eq(O._mtQty(2, 'palm', chicken), 2 * O.MB_PALM_OZ, '2 palms is 2 x MB_PALM_OZ ounces, not a second opinion');
eq(O._mtQty(12, 'oz', chicken), 12, 'ounces pass through');
eq(O._mtQty(null, '', chicken), O.MB_PALM_OZ, 'an unquantified protein is ONE PALM, the rule the prompt states');
eq(O._mtQty(null, '', O._mtRow('potato')), 1, 'and an unquantified handful food is one handful');

console.log('\n-- the table beats the model, always --');
const modelSaid = { name: '12 oz NY strip steak', table_key: 'ny strip', qty: 12, unit: 'oz', protein: 1, carbs: 999, fat: 1, calories: 4321 };
const fixed = O._mtItem(modelSaid);
eq(fixed.protein, 96, 'table protein replaces whatever the model said');
eq(fixed.carbs, 0, 'table carbs replace the model\'s 999');
eq(fixed.calories, 96 * 4 + 66 * 9, 'and the calories are recomputed from the table macros');

console.log('\n-- a food OFF the table keeps its estimate but still obeys 4/4/9 --');
const off = [{ name: 'Grandma\'s casserole', table_key: null, protein: 20.4, carbs: 30.6, fat: 10.2, calories: 9999 }];
ok(O._mtApplyItems(off) === 0, 'the table answers nothing for an unknown food');
eq(off[0].protein, 20, 'its macros are rounded');
eq(off[0].calories, 20 * 4 + 31 * 4 + 10 * 9, 'and its calories are computed, never quoted');

console.log('\n-- THE FOUR PHRASES, exactly as ruled --');
function meal(items) { const r = { items: items.slice() }; O._mtApplyResult(r); return r; }
function line(r) { return r.calories + ' cal · ' + r.protein + 'P/' + r.carbs + 'C/' + r.fat + 'F'; }

const p1 = meal([{ name: '12 oz NY strip', table_key: 'ny strip', qty: 12, unit: 'oz' }]);
console.log('   "12oz NY strip steak" -> ' + line(p1));
eq(p1.protein, 96, 'p1 protein'); eq(p1.carbs, 0, 'p1 carbs'); eq(p1.fat, 66, 'p1 fat'); eq(p1.calories, 978, 'p1 calories');

const p2 = meal([{ name: '2 palms chicken breast', table_key: 'chicken breast', qty: 2, unit: 'palm' }]);
console.log('   "2 palms of chicken breast" -> ' + line(p2));
eq(p2.protein, 60, 'p2 protein'); eq(p2.carbs, 0, 'p2 carbs'); eq(p2.fat, 7, 'p2 fat'); eq(p2.calories, 303, 'p2 calories');

const p3 = meal([
  { name: '2 handfuls salad mix', table_key: 'salad mix', qty: 2, unit: 'handful' },
  { name: '1.5 handfuls potatoes', table_key: 'potato', qty: 1.5, unit: 'handful' },
  { name: '3 handfuls blueberries', table_key: 'blueberries', qty: 3, unit: 'handful' }
]);
console.log('   "salad + potatoes + blueberries" -> ' + line(p3));
// NUMBERS MOVED BY THE USDA AUDIT (3 Sep), not by a change of mind: salad
// mix and potato were both re-priced off FoodData Central, potato because its
// carbs read 13% low against 'Potatoes, boiled, cooked without skin, flesh'.
eq(p3.protein, 6, 'p3 protein'); eq(p3.carbs, 74, 'p3 carbs'); eq(p3.fat, 1, 'p3 fat'); eq(p3.calories, 329, 'p3 calories');
ok(p3.items.every(i => i.protein != null), 'every row in p3 carries a protein — the gap that started this');

const p4 = meal([
  { name: 'Tuna', table_key: 'tuna', qty: 1, unit: 'palm' },
  { name: 'Greens', table_key: 'salad mix', qty: 1, unit: 'handful' },
  { name: 'Cherry tomatoes', table_key: 'cherry tomatoes', qty: 1, unit: 'handful' },
  { name: 'Sesame seeds', table_key: 'sesame seeds', qty: 1, unit: 'tbsp' }
]);
console.log('   "tuna greens cherry tomatoes sesame seed" -> ' + line(p4));
// Tuna dropped from 7.0P/oz to 6.0: FDC's canned-in-water light is 5.6/oz and
// white/albacore 6.7, and 7.0 was above both.
eq(p4.protein, 25, 'p4 protein'); eq(p4.carbs, 6, 'p4 carbs'); eq(p4.fat, 6, 'p4 fat'); eq(p4.calories, 178, 'p4 calories');

console.log('\n-- a total is the sum of its items, both ways round --');
[['p1', p1], ['p2', p2], ['p3', p3], ['p4', p4]].forEach(([nm, r]) => {
  const s = O._mtSum(r.items);
  ok(s.protein === r.protein && s.carbs === r.carbs && s.fat === r.fat, nm + ': macros are the sum of the rows');
  eq(r.calories, s.calories, nm + ': calories are the sum of the rows\' calories');
  eq(r.calories, O._mtCal(r.protein, r.carbs, r.fat), nm + ': and that equals 4/4/9 on the summed macros');
});

console.log('\n-- the same phrase gives the same numbers on a re-run --');
[['p1', p1], ['p2', p2], ['p3', p3], ['p4', p4]].forEach(([nm, r]) => {
  const again = meal(r.items.map(i => ({ name: i.name, table_key: i.mt, qty: i.qty, unit: i.unit })));
  ok(JSON.stringify([again.protein, again.carbs, again.fat, again.calories]) ===
     JSON.stringify([r.protein, r.carbs, r.fat, r.calories]), nm + ': identical on a second run');
});

console.log('\n-- the model is shown the same rows the app computes with --');
const block = O._mtPromptBlock();
ok(O.MT_ROWS.every(r => block.indexOf(r.k + ' [' + r.u + ']') > -1), 'every row appears in the prompt block');
ok(block.indexOf(String(O.MB_PALM_OZ) + 'oz') > -1, 'and the prompt states the same palm this file uses');

console.log('\n-- the phrases a client actually types, priced with no model at all --');
const typed = [
  ['12oz NY strip steak',                      978, 96, 0, 66],
  ['2 palms of chicken breast (roughly 7-8oz)', 303, 60, 0, 7],
  ['2 handfuls of salad mix',                    16,  1, 3, 0],
  ['1.5 handfuls of potatoes',                  164,  3, 38, 0],
  ['3 handfuls of blueberries',                 149,  2, 33, 1],
  ['tuna',                                       93, 21, 0, 1]
];
typed.forEach(([phrase, cal, p, c, f]) => {
  const t = O._mtFromPhrase(phrase);
  ok(!!t, 'the table answers "' + phrase + '" without asking anyone');
  if (t) {
    eq(t.calories, cal, '  ' + phrase + ' calories');
    eq(t.protein, p, '  ' + phrase + ' protein');
    eq(t.carbs, c, '  ' + phrase + ' carbs');
    eq(t.fat, f, '  ' + phrase + ' fat');
    eq(t.calories, O._mtCal(t.protein, t.carbs, t.fat), '  ' + phrase + ' obeys 4/4/9');
  }
});
ok(O._mtFromPhrase('grandmothers lasagne') === null, 'and it says nothing about a food it does not know');

console.log('\n-- the parenthetical is their working out, not a second portion --');
const par = O._mtParse('2 palms of chicken breast (roughly 7-8oz)');
eq(par.qty, 2, 'quantity comes from the front of the phrase');
eq(par.unit, 'palms', 'and so does the unit');
ok(par.name.indexOf('7') < 0 && par.name.indexOf('oz') < 0, 'the bracket is dropped, so 7-8oz cannot become the portion');
eq(O._mtParse('12oz NY strip steak').qty, 12, 'a number stuck to its unit still reads');
eq(O._mtParse('12oz NY strip steak').unit, 'oz', 'and the unit separates from it');

console.log('\n' + (n - fails) + '/' + n + ' passed');
if (fails) { console.log('tmtable: FAIL'); process.exit(1); }
console.log('tmtable: ok');
process.exit(0);
