/* WHICH GROUND BEEF, AND WHERE ONE FOOD ENDS (Yusuf, 18 Sep).

   TWO FAULTS, ONE SCREEN.

   1. "Certain percentage lean around beefs. Seventy percent lean or seventy
      forward slash thirty ground beef, eighty twenty, ninety ten, ninety three
      seven, ninety seven three. That does not appear, and it should appear
      because the different ground beefs are different calorie counts and
      protein counts."

      MT_ROWS carried ONE beef row, priced at 90/10, with "ground beef" as an
      alias - so every grind on the shelf returned the leanest number. Worse,
      a client who DID type the grind got it read as arithmetic: the fraction
      branch in _nlEchoParse turned "80/20 ground beef" into eighty divided by
      twenty and priced FOUR OUNCES. Writing the ratio made the answer worse
      than leaving it out.

   2. "If someone does not separate foods by comma, it seems it considers it
      all one unique food. For example, I wrote six ounces ground beef, three
      eggs, and the three eggs did not populate in the echo ... even the comma
      should act as a hard break. Still not having one should not break the
      system from working."

      Every separator this app knew was a MARK - comma, dash, slash, full stop,
      "and", "with". A sentence with none of them was one food, and the rest of
      the plate was never counted.

   USDA figures behind the ladder: ground beef, crumbles, cooked, pan-browned,
   per 100g. Cooked and drained, because that is what is on the plate. */
const fs=require('fs'), path=require('path');
const root=path.join(__dirname,'..','..');
process.chdir(root);
const {closure}=require('./_lift.cjs');
const src=fs.readFileSync(path.join(root,'index.html'),'utf8');
let fails=0;
const ok=(c,m,x)=>{ console.log((c?'  ok   ':'  FAIL ')+m+(x!==undefined?('  '+JSON.stringify(x)):'')); if(!c) fails++; };

console.log('\ntbeef - nine grinds, and a plate that comes apart without commas');

const lifted=closure(['_nlEcho','_nlEchoSplit','_nlQtyBreaks','_mtRow','_mtItem',
                      '_nlLeanLine','_nlLeanAsk','_splitFoods']);
/* _nlSameFood declares `var keys=[], _seen={}` and _lift.cjs registers only the
   first name in a multi-declarator var, so the second reads as a hole. */
const holes=lifted.unresolved.filter(n=>n!=='_seen');
ok(holes.length===0, 'it all lifts with nothing missing', holes);
const F=new Function('var window={};'+lifted.code
  +'\nreturn {_nlEcho,_nlEchoSplit,_nlQtyBreaks,_mtRow,_mtItem,_nlLeanLine,_nlLeanAsk,_splitFoods,MT_ROWS};')();

const price=(name,qty,unit)=>F._mtItem({name:name,qty:qty,unit:unit});
const split=t=>F._nlEchoSplit(t);
const echo=t=>F._nlEcho(t);
const rowOf=t=>{ const e=echo(t); return e.lines[0] && e.lines[0].row; };

// ============================================================ THE LADDER
const grinds=['70/30','73/27','80/20','85/15','90/10','93/7','95/5','96/4','97/3'];
const rows=grinds.map(g=>F.MT_ROWS.filter(r=>r.lean===g && !r.dflt)[0]);
ok(rows.every(Boolean), 'every grind he named, and the ones on the shelf beside them',
   grinds.filter((g,i)=>!rows[i]));

/* A LADDER HAS TO GO ONE WAY. If any rung is out of order the table is wrong
   whatever the individual figures say - more fat in the grind cannot mean less
   fat on the plate. */
let mono=true;
for(let i=1;i<rows.length;i++){ if(!(rows[i].f < rows[i-1].f)) mono=false; }
ok(mono, 'fat falls with every step up the shelf', rows.map(r=>r.lean+':'+r.f));
let pmono=true;
for(let i=1;i<rows.length;i++){ if(!(rows[i].p >= rows[i-1].p)) pmono=false; }
ok(pmono, 'and protein rises', rows.map(r=>r.lean+':'+r.p));

/* THE POINT OF THE WHOLE THING: the same six ounces is a different meal. */
const six=g=>price(g+' ground beef', 6, 'oz').calories;
ok(six('70/30') - six('97/3') > 150,
   'six ounces of the fattiest beats the leanest by more than 150 calories',
   {fat:six('70/30'), lean:six('97/3')});
ok(six('80/20') > six('90/10'),
   'and the grind most people actually buy is dearer than the one the app assumed',
   {'80/20':six('80/20'), '90/10':six('90/10')});

/* NOBODY'S HISTORY MOVED. The default row is the number it has always been, so
   every beef meal already on the roster prices today exactly as it did
   yesterday. A silent default change would have re-priced the whole book. */
const dflt=F.MT_ROWS.filter(r=>r.k==='lean beef')[0];
ok(dflt && dflt.p===8.1 && dflt.f===3.4, 'the default row is untouched at 90/10', dflt&&{p:dflt.p,f:dflt.f});
ok(dflt && dflt.dflt===1 && dflt.lean==='90/10', 'and it says out loud which grind that is');
ok(F._mtRow('ground beef')===dflt, 'a bare "ground beef" still lands on it');

// ===================================== A RATIO IS NOT A FRACTION, AND NOT FOUR
/* THE BUG THAT MADE WRITING THE GRIND WORSE THAN LEAVING IT OUT. */
const bare=echo('80/20 ground beef').lines[0];
ok(bare && bare.row && bare.row.lean==='80/20', 'the grind they typed is the grind that prices', bare&&bare.row&&bare.row.k);
ok(bare && bare.calories>240 && bare.calories<290,
   'and it is ONE palm of it, not four ounces read off the slash', bare&&bare.calories);
ok(price('1/2 cup white rice', 0.5, 'cup') && price('1/2 cup white rice', 0.5, 'cup').calories>0,
   'a real fraction is still a fraction');
const half=echo('1/2 cup rice').lines[0];
ok(half && half.calories>80 && half.calories<120, 'half a cup of rice is still half a cup', half&&half.calories);

// every way a person writes it lands on the same row
[['80/20',           '80/20'],
 ['80/20 beef',      '80/20'],
 ['ground beef 80/20','80/20'],
 ['6 oz 93/7 ground beef','93/7'],
 ['8oz 70/30 ground beef','70/30']].forEach(([typed,want])=>{
  const r=F._mtRow(typed);
  ok(r && r.lean===want, 'resolves: '+typed, r&&r.k);
});

// ==================================================== THE ECHO SAYS WHICH ONE
ok(F._nlLeanAsk(echo('6 oz ground beef')),
   'a plate with no grind on it gets asked');
ok(!F._nlLeanAsk(echo('6 oz 80/20 ground beef')),
   'a plate that named its grind is never asked');
ok(!F._nlLeanAsk(echo('3 eggs and a banana')),
   'and a plate with no beef in it is never asked either');

/* THE CORRECTION RIDES ON THE STATE. Their sentence is not rewritten - the same
   law the photo-vs-words ask follows. This only says what the working copy
   looks like once they tap. */
ok(F._nlLeanLine('6 oz ground beef with rice','80/20')==='6 oz 80/20 ground beef with rice',
   'tapping a grind writes it into the working copy, in place', F._nlLeanLine('6 oz ground beef with rice','80/20'));
ok(F._nlLeanLine('3 eggs and toast','80/20')==='3 eggs and toast',
   'and leaves a line with no beef in it exactly alone');
ok(F._nlLeanLine('6 oz ground beef','')==='6 oz ground beef', 'nothing tapped, nothing changed');
const picked=echo(F._nlLeanLine('6 oz ground beef','70/30')).lines[0];
ok(picked && picked.row.lean==='70/30' && picked.calories>440,
   'and the number moves when they tap', picked&&picked.calories);

// ================================================== NO COMMA IS STILL A LIST
[['6 oz ground beef 3 eggs',            2],
 ['six ounces ground beef three eggs',  2],
 ['6 oz 80/20 ground beef 3 eggs',      2],
 ['80/20 ground beef 3 eggs',           2],
 ['ground beef 80/20 3 eggs',           2],
 ['2 scoops whey 1 banana',             2],
 ['1 cup rice 2 eggs 4 oz chicken',     3]].forEach(([t,n])=>{
  ok(split(t).length===n, 'splits with no comma: '+t, split(t));
});
const be=echo('6 oz ground beef 3 eggs');
ok(be.lines.length===2 && be.lines[1].calories>200,
   'and the eggs he watched vanish are priced and on the screen',
   be.lines.map(L=>L.said+' '+L.calories));

/* THE GUARDS. Each of these is a line that would come apart wrongly without
   one, and every one of them must stay whole. */
[['1 cup 2% milk',        'a number wearing a percent is not an amount'],
 ['chicken breast 6 oz',  'an amount at the END belongs to the food in front of it'],
 ['3 4 oz burgers',       'two numbers in a row are one amount'],
 ['1/2 cup rice',         'a fraction opens one item'],
 ['12 oz steak',          'one food stays one food'],
 ['two banana walnut and chocolate chip pancakes from silver diner',
                          'and the pancakes stay one dish, as ruled on 10 Sep']
].forEach(([t,why])=>{
  ok(split(t).length===1, why+': '+t, split(t));
});

/* BOTH ROADS. The log box and the chat sheet are two readers of one sentence,
   and a plate that comes apart on one screen and not the other is the exact
   shape of last night's bug. */
ok(F._splitFoods('6 oz ground beef 3 eggs').length===2,
   'the log box reads it the same way as the chat sheet', F._splitFoods('6 oz ground beef 3 eggs'));
ok(F._splitFoods('chicken breast 6 oz').length===1, 'and holds the same line where it must');

// ================================================ "1 SOURDOUGH" IS ONE SLICE
/* Yusuf, 19 Sep, logging his own breakfast: "3 eggs, 1 sourdough" priced the
   eggs and answered "worked out when you log it" for the bread. One sourdough
   is one slice of sourdough. */
[['1 sourdough',1],['2 slices sourdough',2],['sourdough toast',1],['1 slice of wheat bread',1],['2 ezekiel',2]].forEach(([t,n])=>{
  const L=echo(t).lines[0];
  /* the app rounds each macro at the plate, so two slices is 194 not 202 */
  ok(L && L.known && L.row.k==='bread' && L.calories>=95*n && L.calories<=105*n, t+' is '+n+' slice'+(n>1?'s':'')+' of bread', L&&L.calories);
});
ok(echo('3 eggs, 1 sourdough').lines.every(L=>L.known), 'and his breakfast prices whole');

/* AND NOBODY SAYS THE WORD SLICE. "Two turkey bacon" is two slices; so is
   two bacon, two cheese, two ham, two pizza. The unit on the row decides. */
[['two turkey bacon','turkey bacon',2],['2 bacon','bacon',2],['3 cheese','cheese slice',3],['2 ham','deli ham',2],
 ['2 pizza','pizza',2],['4 turkey slices','deli turkey',4],['1 sourdough','bread',1]].forEach(([t,row,n])=>{
  const L=echo(t).lines[0];
  ok(L && L.known && L.row.k===row && L.row.u==='slice', t+' is '+n+' slices of '+row, L&&(L.row&&L.row.k)+' '+L.calories);
});
const tb=echo('two turkey bacon').lines[0];
ok(tb && tb.calories>=50 && tb.calories<=70, 'two turkey bacon is about sixty calories, not two palms of turkey breast', tb&&tb.calories);
ok(!echo('cottage cheese').lines[0].known, 'and "cottage cheese" is not priced as a slice of cheese - the gate holds');

// ============================================ THE AMOUNT NUDGE IS ON THE LINE
ok(/say it \(6 oz, 2 eggs, 1 cup\)/.test(src), 'the echo asks for an amount when a food has none');
ok(/_nlQtyBreaks/.test(src) && (src.match(/_nlQtyBreaks\(/g)||[]).length>=3,
   'and the break is wired into both splitters, not just the one he was looking at',
   (src.match(/_nlQtyBreaks\(/g)||[]).length);

console.log(fails? ('\n  '+fails+' FAILED\n') : '\n  all good\n');
process.exit(fails?1:0);
