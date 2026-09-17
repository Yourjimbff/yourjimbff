/* A FOOD LOG IS NEVER NAMED WITH A SENTENCE (17 Sep).
   Yusuf: "logs for the food should always be neat. No typos, everything case
   sensitive products, brands, all need to be accurate... Poor transcription
   reads as poor app function."

   Every string below is a REAL row, read off the server, not invented. The
   counts are real too, measured across the 1,363 rows of the last 45 days:
   186 named with the whole sentence, 139 over 55 characters, 55 carrying a
   doubled name, 21 entirely lower case.

   This suite RUNS the function. A name rule that reads correctly and answers
   "Half a C" is the same family as a clamp that reads correctly and tells a
   man to eat four and a half handfuls of berries - only arithmetic on the real
   inputs catches either. */
const fs=require('fs'), path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','..','index.html'),'utf8');
let fails=0;
const ok=(c,m,x)=>{ console.log((c?'  ok   ':'  FAIL ')+m+(x!==undefined?('  '+JSON.stringify(x)):'')); if(!c) fails++; };
function lift(n){
  const m=src.match(new RegExp('\\nfunction '+n+'\\([^]*?\\n\\}\\n'));
  if(!m) throw new Error('tfoodname: cannot lift '+n);
  return m[0];
}
function liftVar(n){
  const m=src.match(new RegExp('\\nvar '+n+'\\s*=[^]*?;\\n'));
  if(!m) throw new Error('tfoodname: cannot lift var '+n);
  return m[0];
}
console.log('\ntfoodname - the name is the app’s guess, and it is tidied once');

eval(liftVar('_FN_LEAD_RE')+liftVar('_FN_STOP')
  +lift('_fnIsSentence')+lift('_fnClip')+lift('_fnUnDouble')+lift('_fnFoodWords')
  +lift('_titleCap')+lift('_foodNameClean')+lift('_dictFix'));

// ---- the two real rows that started this
const chia='For Breakfast, I’m Having Chia Seed Pudding. It Has Half a C';
const c1=_foodNameClean(chia);
ok(!/^For Breakfast/i.test(c1), 'the narration comes off the front', c1);
ok(!/\bI\b|’m|Having/i.test(c1), 'and nobody is talking in a meal name', c1);
ok(/chia/i.test(c1), 'the food survives', c1);
ok(!/Half a C$/.test(c1), 'and it never ends mid-word', c1);
ok(!/[, ]C$/.test(c1) && !/\b[A-Za-z]\b\s*$/.test(c1),
   'and a one-letter leftover from a truncation is dropped, not named', c1);

const taco='To Taco Bell flatbread melts, medium Pepsi, cheesy fiesta potato five mild packets · Taco Bell flatbread melts';
const c2=_foodNameClean(taco);
ok(c2.length<=55, 'a 110-character name is cut to the limit the prompt asks for', c2.length);
ok((c2.match(/·/g)||[]).length===0 || c2.indexOf('Taco Bell flatbread melts')>=0,
   'the doubled name resolves to the side that is a name', c2);
ok(/taco bell/i.test(c2), 'and the brand is still in it', c2);

// ---- the quantity the microphone lost. Two melts is about 40g of protein;
// that row saved 16, because "To" ate the two.
ok(_dictFix('To Taco Bell flatbread melts')==='2 Taco Bell flatbread melts',
   'a line opening with "to" is the number two', _dictFix('To Taco Bell flatbread melts'));
ok(_dictFix('too eggs and toast')==='2 eggs and toast', 'and so is "too"', _dictFix('too eggs and toast'));
// The ones it must NOT touch, and "for" is the reason it is not in the rule:
// both of these are real rows.
ok(_dictFix('For breakfast, I had three eggs')==='For breakfast, I had three eggs',
   '"for breakfast" is never the number four');
ok(_dictFix('For dinner I had 4 chicken wings')==='For dinner I had 4 chicken wings',
   'nor is "for dinner"');
ok(_dictFix('toast with butter')==='toast with butter', 'and "toast" is not "to ast"');
ok(_dictFix('tomato soup')==='tomato soup', 'nor is "tomato" touched');

// ---- casing: the app may case its own guess and may never re-case a brand
ok(_foodNameClean('chicken and rice')==='Chicken and Rice', 'the app cases what it assembled itself',
   _foodNameClean('chicken and rice'));
const brand=_foodNameClean('Anabolic Marinara Meatballs · Nutrition Solutions');
ok(/Anabolic Marinara Meatballs/.test(brand) && /Nutrition Solutions/.test(brand),
   'a brand reading off a label is left exactly as it was read', brand);

// ---- names that are already fine must come out untouched. A tidier that
// changes good data is worse than the mess it was written for.
['Chicken Wings, Hot Dogs, Bacon, Pulled Pork',
 'Eggs and baby potatoes',
 'Chicken Legs, Rice & Fries',
 'Grilled Chicken Breast, Flatbread & Pickles',
 'Coke Zero',
 'Greek Yogurt'].forEach(function(n){
  ok(_foodNameClean(n)===n, 'left alone: '+n, _foodNameClean(n));
});

// ---- and it never hands back nothing, whatever it is given
['', '   ', 'I had it', 'today', 'ate'].forEach(function(n){
  const r=_foodNameClean(n);
  ok(typeof r==='string' && (n.trim()===''? r.trim()==='' : r.trim().length>0),
     'never empties a row that had a name: '+JSON.stringify(n), r);
});

// ---- the one door, and meal_text kept out of it
ok(/row\.name=_cn/.test(src), 'the clean runs inside insertFoodLog, the one door');
ok(!/meal_text\s*=\s*_foodNameClean|_foodNameClean\(\s*row\.meal_text/.test(src),
   'and it never touches meal_text - that is what they actually said');
ok(/meal_text:\(st\.line\|\|line\|\|''\)/.test(src),
   'the fast road records the raw line, not the corrected copy');

console.log(fails?('\n  '+fails+' FAILED\n'):'\n  all passed\n');
process.exit(fails?1:0);
