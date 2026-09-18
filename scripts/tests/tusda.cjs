// THE TABLE WAS AUDITED, AND THE AUDIT IS NOW LAW TOO (Yusuf, 3 Sep:
// "audit these numbers against a nutrition database... triple check your work
// because this is going to be the new backbone selling feature").
//
// Until this suite existed the 41 rows were nobody's numbers. They had been
// written by hand on 30 Aug and quoted back as ground truth ever since,
// including by me, all day, without one of them ever having been checked.
// On 3 Sep every row was compared against USDA FoodData Central at the
// preparation state the table's own header states -- COOKED for the oz meats
// and the starch handfuls, raw for veg and fruit. 24 rows came back inside 10%
// and were not touched. 17 were moved.
//
// This file pins the AUDITED figure for every row that moved, and the USDA
// source it was moved to, so the next person to "tidy" the table has to argue
// with FoodData Central rather than with a comment. Each expectation carries
// the FDC food description it came from.
//
// It also guards the thing the audit found and the old suite could not see:
// the table must not drift back toward the pre-audit numbers.
const fs = require('fs');
const L = fs.readFileSync('index.html', 'utf8').split('\n');
function liftVar(name) {
  const s = L.findIndex(l => l.startsWith('var ' + name + '='));
  if (s < 0) throw new Error('SEAM MOVED: var ' + name + ' not found');
  for (let i = s; i < L.length; i++) if (L[i].trim() === '];') return L.slice(s, i + 1).join('\n');
  throw new Error('SEAM MOVED: no close found for var ' + name);
}
const m = { exports: {} };
new Function('module', 'exports', liftVar('MT_ROWS') + '\nmodule.exports={MT_ROWS};')(m, m.exports);
const ROWS = m.exports.MT_ROWS;
const OZ = 28.3495;

let fails = 0, n = 0;
function ok(c, msg) { n++; if (c) console.log('  ok    ' + msg); else { fails++; console.log('  FAIL  ' + msg); } }
function row(k) { const r = ROWS.find(x => x.k === k); if (!r) throw new Error('SEAM MOVED: row ' + k + ' gone'); return r; }
function near(a, b, tol) { return Math.abs(a - b) <= tol; }

// [key, P, C, F per the row's own unit, FDC description the figure came from]
const AUDITED = [
  ['tuna',             6.0, 0,    0.3,  'Fish, tuna, light/white, canned in water, drained (5.6-6.7P per oz)'],
  ['salmon',           6.3, 0,    3.5,  'Fish, salmon, Atlantic, farmed, cooked, dry heat (22.1P/12.4F per 100g)'],
  ['lean beef',        8.1, 0,    3.4,  'Beef, ground 90/10, crumbles, cooked, pan-browned (28.5P/12.0F per 100g)'],
  ['ribeye',           6.7, 0,    6.2,  'Beef, rib eye steak, boneless lip-on, lean+fat, 1/8in, grilled (23.6P/21.8F)'],
  ['shrimp',           6.5, 0.4,  0.5,  'Crustaceans, shrimp, mixed species, cooked, moist heat (22.8P/1.5C/1.6F)'],
  ['salad mix',        0.5, 1.3,  0.1,  'Lettuce, cos or romaine, raw (1.2P/3.3C/0.3F per 100g)'],
  ['spinach',          2.4, 3.1,  0.3,  'Spinach, raw (2.87P/3.67C/0.4F per 100g)'],
  ['broccoli',         2.4, 5.6,  0.3,  'Broccoli, raw (2.86P/6.59C/0.37F per 100g)'],
  ['cucumber',         0.5, 2.9,  0.1,  'Cucumber, with peel, raw (0.65P/3.6C/0.11F per 100g)'],
  ['mixed vegetables', 1.8, 5.0,  0.2,  'non-starchy reading; USDA frozen corn/peas/carrots mix is 65 cal/100g'],
  ['white rice',       3.4, 35,   0.4,  'Rice, white, long-grain, cooked, without salt (2.7P/28.2C per 100g)'],
  ['potato',           2.1, 25,   0.1,  'Potatoes, boiled, cooked without skin, flesh (1.7P/20.0C per 100g)'],
  ['sweet potato',     2.7, 28,   0.2,  'Sweet potato, cooked, baked in skin, flesh (2.0P/20.7C per 100g)'],
  ['pasta',            6.4, 34,   1.1,  'Pasta, cooked, enriched, without added salt (5.8P/30.9C/0.97F per 100g)'],
  ['oats',             7.3, 37,   3.6,  'Cereals, oats, regular and quick, not fortified, dry (13.2P/67.7C/6.5F)'],
  ['bread',            3.5, 18.5, 1.2,  'Bread, white, commercially prepared (9.0P/49.3C/3.3F per 100g)'],
  ['avocado',          1.4, 6,    10.5, 'Avocados, raw (2P/8.5C/15F per 100g); half a real one is ~70g, not 100g'],
];

console.log('\nEVERY ROW THE AUDIT MOVED STAYS MOVED:');
AUDITED.forEach(([k, p, c, f, src]) => {
  const r = row(k);
  ok(r.p === p && r.c === c && r.f === f,
     k + ' is ' + p + 'P/' + c + 'C/' + f + 'F  <- ' + src);
});

console.log('\nAND THE ROWS THE AUDIT CONFIRMED ARE NOT "FIXED" BY SOMEONE WHO DID NOT CHECK:');
// These two were both guessed wrong by eye before FoodData Central was actually
// read, and both turned out to be right. They are pinned so the next eye cannot
// undo them either.
ok(row('ny strip').p === 8.0 && row('ny strip').f === 5.5,
   'ny strip stays 8.0P/5.5F  <- Beef, short loin, top loin steak, lean+fat, 1/8in, choice, grilled (26.1P/18.5F per 100g) -- inside 6%');
ok(row('chicken breast').p === 8.5 && row('chicken breast').f === 1.0,
   'chicken breast stays 8.5P/1.0F  <- Chicken, breast, meat only, cooked, roasted (31.0P/3.6F per 100g)');
ok(row('egg').p === 6.0 && row('egg').g === 50,
   'an egg stays 6.0P at 50g  <- USDA 1 large egg = 50g, 6.3P/4.8F');
ok(row('butter').f === 11.5 && row('butter').g === 14,
   'butter stays 11.5F per 14g tbsp  <- Butter, salted (81.1F per 100g), 1 tbsp = 14g');

console.log('\nAND THE PER-100G ARITHMETIC STILL LANDS WHERE USDA IS:');
// The check the audit itself ran, kept live: normalise the row to 100g and put
// it beside FoodData Central. Tolerance is deliberately loose (15%) because
// these are coaching estimates across cuts and brands, not a lab result -- it
// is there to catch a row that is WRONG, not a row that is rounded.
const PER100 = [
  ['salmon',         OZ,  22.1, 0,    12.4, 'Fish, salmon, Atlantic, farmed, cooked'],
  ['ribeye',         OZ,  23.6, 0,    21.8, 'Beef, rib eye steak, 1/8in, grilled'],
  ['lean beef',      OZ,  28.5, 0,    12.0, 'Beef, ground 90/10, pan-browned'],
  /* THE WHOLE SHELF, every rung against the FDC entry it was taken from
     (18 Sep). Six measured, and they are the ones that hold this ladder
     upright - if a rung drifts, six ounces of somebody's dinner drifts with
     it, and beef is the food on this roster with the widest spread between
     what people buy and what the app assumed. All: crumbles, cooked,
     pan-browned, per 100g. */
  ['70/30 ground beef', OZ, 26.0, 0, 18.0, 'Beef, ground 70/30, crumbles, cooked, pan-browned'],
  ['80/20 ground beef', OZ, 27.0, 0, 17.4, 'Beef, ground 80/20, crumbles, cooked, pan-browned'],
  ['85/15 ground beef', OZ, 27.8, 0, 15.3, 'Beef, ground 85/15, crumbles, cooked, pan-browned'],
  ['90/10 ground beef', OZ, 28.5, 0, 12.0, 'Beef, ground 90/10, crumbles, cooked, pan-browned'],
  ['93/7 ground beef',  OZ, 28.8, 0,  9.5, 'Beef, ground 93/7, crumbles, cooked, pan-browned'],
  ['95/5 ground beef',  OZ, 29.2, 0,  7.5, 'Beef, ground 95/5, crumbles, cooked, pan-browned'],
  ['ny strip',       OZ,  26.1, 0,    18.5, 'Beef, top loin steak, 1/8in, grilled'],
  ['chicken breast', OZ,  31.0, 0,     3.6, 'Chicken breast, meat only, roasted'],
  ['white rice',    125,   2.7, 28.2,  0.28,'Rice, white, long-grain, cooked'],
  ['potato',        125,   1.7, 20.0,  0.10,'Potatoes, boiled, without skin'],
  ['sweet potato',  135,   2.0, 20.7,  0.15,'Sweet potato, baked in skin'],
  ['pasta',         110,   5.8, 30.9,  0.97,'Pasta, cooked, enriched'],
  ['oats',           55,  13.2, 67.7,  6.5, 'Oats, regular and quick, dry'],
  ['broccoli',       85,   2.86, 6.59, 0.37,'Broccoli, raw'],
  ['spinach',        85,   2.87, 3.67, 0.40,'Spinach, raw'],
  ['avocado',        70,   2.0,  8.5, 15.0, 'Avocados, raw'],
];
const cal = (p, c, f) => p * 4 + c * 4 + f * 9;
PER100.forEach(([k, g, up, uc, uf, src]) => {
  const r = row(k);
  const mine = cal(r.p, r.c, r.f);
  const theirs = cal(up * g / 100, uc * g / 100, uf * g / 100);
  const off = Math.abs(mine - theirs) / theirs * 100;
  ok(near(mine, theirs, theirs * 0.15),
     k + ' is within 15% of USDA  (' + Math.round(mine) + ' vs ' + Math.round(theirs)
     + ' cal, off by ' + off.toFixed(0) + '%)  <- ' + src);
});

console.log('\n' + (n - fails) + '/' + n + ' passed');
console.log('tusda: ' + (fails ? 'FAIL' : 'ok'));
// ===== "JUST SAY ESTIMATED" (Yusuf, ruling, 4 Sep) =========================
// 'mixed vegetables' was the one row the audit refused to settle by itself: a
// frozen corn/peas/carrots bag is 65 cal per 100g and a non-starchy mix is about
// half that, and only the client knows which is in the bowl. His ruling was not
// to pick - it was to stop pretending. The numbers stay where the audit put
// them and the row says the word.
{
  const fs2=require('fs');
  const src2=fs2.readFileSync('index.html','utf8');
  let b2=0;
  const t2=(ok,label)=>{ if(!ok) b2++; console.log((ok?'  ok    ':'  FAIL  ')+label); };
  console.log('\n  the estimated flag:');
  t2(/\{k:'mixed vegetables',u:'handful',p:1\.8,c:5\.0,f:0\.2,g:85,est:1,/.test(src2),
     'mixed vegetables carries est:1 and its numbers are unchanged');
  t2(/est:!!\(row && row\.est\)/.test(src2),
     'the echo reads the flag off the ROW, it does not decide it');
  t2(/L\.est\?'<span class="nlEchoEst">estimated<\/span>':''/.test(src2),
     'and says it beside the food, not instead of the number');
  t2(/\.nlEchoEst\{/.test(src2), 'it has a style of its own');
  // Matched INSIDE the row, between its own commas. A naive comment-stripper is
  // what check.sh got caught by - a stray /* pairing with a */ far below ate the
  // whole table - so this does not strip anything, it just asks a question prose
  // cannot accidentally answer.
  /* IT USED TO BE ONE ROW. It is four now: mixed vegetables, and the three
     ground beef grinds that sit between measured rungs - 73/27, 96/4 and 97/3
     (18 Sep). Counting rows was never the ruling; the ruling is that a row
     only carries the flag when its numbers are NOT measured, and that the
     table stays mostly measured. Both of those are what is asked below. */
  const _est=(src2.match(/,est:1,/g)||[]).length;
  t2(_est>=1 && _est<=6, 'the flag is on a handful of rows, not sprinkled everywhere ('+_est+')');
  t2(_est < (src2.match(/\{k:'/g)||[]).length/4,
     'and the table is still mostly measured food, so the flag still means something');
  /* EVERY GRIND THAT IS GUESSED SAYS SO, and every grind that was measured does
     not. 70/30, 80/20, 85/15, 90/10, 93/7 and 95/5 come straight off USDA
     crumbles-cooked-pan-browned; the other three are read between them. */
  [['70/30',false],['73/27',true],['80/20',false],['85/15',false],
   ['90/10',false],['93/7',false],['95/5',false],['96/4',true],['97/3',true]].forEach(function(pair){
    var re=new RegExp("\\{k:'"+pair[0].replace('/','\\/')+" ground beef',[^\\n]*");
    var row=(src2.match(re)||[''])[0];
    t2(!!row && (/,est:1,/.test(row)===pair[1]),
       pair[0]+' ground beef '+(pair[1]?'says it is estimated':'is measured and says nothing'));
  });
  if(b2){ console.log('\n'+b2+' FAILED'); process.exit(1); }
  console.log('\n  all pass');
}

process.exit(fails ? 1 : 0);
