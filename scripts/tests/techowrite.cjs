// THE PREVIEW AND THE WRITE READ THE SAME (Yusuf's founding rule for this
// feature, and the one thing it must never get wrong).
//
// Caught on the served build, 11 Sep, proving f16: "for lunch I had 7oz chicken
// thigh and a handful of rice" into Jarvis. The echo under the box priced it on
// the keystroke - 406 + 152 cal, 55g protein - and the row that landed said
// 550 cal / 35g protein. Worse, 35P/55C/12F is 468 calories, so the row did not
// agree with itself either.
//
// THE TABLE IS LAW already existed and could not run: it needs offer.items, and
// the model returned ONE food with no rows at all. So the number the app can
// compute with no model, and had already put on his screen, was discarded for a
// guess that was wrong twice.
//
// The gate is the point of this suite. The echo may only speak when the table
// priced EVERY piece of the sentence and guessed at none - one unpriced
// fragment, one estimated row, or numbers in his own words, and the existing
// behaviour has to stand untouched.
const fs=require('fs'), vm=require('vm');
const {closure}=require('./_lift.cjs');
const src=fs.readFileSync('index.html','utf8');
let bad=0; const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&x!==''?('  '+x):'')); };

const block=src.slice(src.indexOf("  /* ...AND THE TABLE IS LAW EVEN WHEN THE MODEL SENDS NO ROWS"),
                      src.indexOf("  // THE TABLE IS LAW (Yusuf, 30 Aug), applied BEFORE the reconciliation"));
t(block.length>1200 && block.length<4000, 'the fallback sits in logFoodFromChat, before the rows path', String(block.length)+' chars');

console.log('\n  IT IS THE PREVIEW, NOT A SECOND IMPLEMENTATION OF IT:');
t(/typeof _nlEcho==='function'/.test(block) && /_nlEcho\(_said\)/.test(block),
  'it calls _nlEcho itself - the same function the box under his thumb is running');
t(/offer\.meal_text/.test(block),
  'over their own verbatim words, which is what meal_text carries');
t(!/_nlEchoSplit|_mtItem|MT_ROWS/.test(block),
  'and re-implements none of it - a second copy is how the two numbers drift apart');
t(/_nlSaidFoods\(_said\)/.test(block),
  'with only the wrapper taken off the sentence first');

console.log('\n  WHEN IT MAY SPEAK:');
t(/!\(Array\.isArray\(offer\.items\) && offer\.items\.length\)/.test(block),
  'only when the model sent no rows at all - the rows path is untouched');
t(/!_stated/.test(block),
  'never over numbers he stated in his own words');
t(/!_e\.stated/.test(block),
  'nor over numbers the echo itself read out of the sentence');
t(/!_e\.unpriced/.test(block),
  'never when one piece of the plate went unpriced');
t(/L\.known && !L\.est/.test(block),
  'never when a row was the table ESTIMATING rather than pricing');
t(/_priced===_e\.lines\.length/.test(block),
  'only when every line the splitter produced was priced');
t(/_priced>0/.test(block),
  'and never on an empty read');

console.log('\n  WHAT IT WRITES:');
t(/items:_e\.lines\.map/.test(block),
  'the echo\'s lines become the meal\'s rows, so the card can show which food carried it');
t(/calories:Math\.round\(_e\.total\.calories\)/.test(block) && /protein:Math\.round\(_e\.total\.protein\)/.test(block)
  && /carbs:Math\.round\(_e\.total\.carbs\)/.test(block) && /fat:Math\.round\(_e\.total\.fat\)/.test(block),
  'and the echo\'s total becomes the meal\'s total - all four, character for character');
t(/console\.warn\('FOOD_LOG: no rows from the model/.test(block),
  'and it says in the console when it overrode the model, so this is never silent');

// ---- and the arithmetic it produces, run for real ------------------------
console.log('\n  HIS SENTENCE, PRICED THE WAY HE SAW IT:');
const ctx={String,Math,Number,Array,Object,JSON,RegExp,isFinite,parseFloat,parseInt,window:{},console,document:{}};
vm.createContext(ctx);
vm.runInContext(closure(['_nlEcho','_nlSaidFoods','_qtyParse']).code, ctx);
const said=(q)=>vm.runInContext('_nlSaidFoods('+JSON.stringify(q)+')', ctx);
const echoSaid=(q)=>vm.runInContext('_nlEcho(_nlSaidFoods('+JSON.stringify(q)+'))', ctx);
t(said('for lunch I had 7oz chicken thigh and a handful of rice')==='7oz chicken thigh and a handful of rice',
  'the wrapper comes off his sentence', JSON.stringify(said('for lunch I had 7oz chicken thigh and a handful of rice')));
t(said('I had 2 eggs and toast')==='2 eggs and toast', 'and off the shortest shape of it');
t(said('I just ate a handful of nuts for a snack')==='a handful of nuts',
  'front and back', JSON.stringify(said('I just ate a handful of nuts for a snack')));
t(said('7oz chicken thigh, 1 handful of rice')==='7oz chicken thigh, 1 handful of rice',
  'a line typed into the log box is handed back untouched');
t(said('chicken and rice bowl')==='chicken and rice bowl',
  'and a food is never mistaken for a wrapper');
t(said('had 12oz ny strip steak')==='12oz ny strip steak', 'a bare verb opens it too');
const e=echoSaid('for lunch I had 7oz chicken thigh and a handful of rice');
t(e.lines.length===2 && e.lines.every(L=>L.known && !L.est),
  'the table prices both halves of it', JSON.stringify(e.lines.map(L=>L.name)));
t(e.unpriced===0, 'with nothing left over');
t(Math.round(e.total.protein)===55,
  'so the write would say 55g protein, not the 35 that landed', Math.round(e.total.protein)+'g');
t(Math.round(e.total.calories)===558,
  'and 558 calories, not 550', Math.round(e.total.calories));
const P=Math.round(e.total.protein), C=Math.round(e.total.carbs), F=Math.round(e.total.fat);
t(Math.abs((P*4+C*4+F*9) - Math.round(e.total.calories))<=4,
  'AND THE ROW AGREES WITH ITSELF - 4/4/9 against its own total, which the model\'s did not',
  P+'P '+C+'C '+F+'F = '+(P*4+C*4+F*9)+' vs '+Math.round(e.total.calories));

const half=vm.runInContext("_nlEcho('7oz chicken thigh and a nutrition solutions protein donut')", ctx);
t(half.unpriced>0, 'a sentence with a food the table does not know still reports it unpriced',
  String(half.unpriced));

console.log(bad? '\n  '+bad+' FAILED' : '\n  the number he was shown is the number that lands');
process.exit(bad?1:0);
