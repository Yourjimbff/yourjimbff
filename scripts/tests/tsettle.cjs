// THE MEAL THAT CHANGED ITS MIND (Laylee Khan, 11 Sep, on video: she logged
// chicken and vegetables, it submitted at 335 calories, the screen redrew, and
// it was 360 with two more grams of protein. The row was also filed as
// "Chicken, of Zucchini").
//
// Two faults, one screen. This holds both closed.
const fs=require('fs'), vm=require('vm');
const src=fs.readFileSync('index.html','utf8');
let bad=0; const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };

function slice(from, to){
  const a=src.indexOf(from); if(a<0) throw new Error('not found: '+from);
  const b=src.indexOf(to, a); if(b<0) throw new Error('end not found: '+to);
  return src.slice(a, b);
}
const ctx={String,Object,Math,Array,JSON,Date,Number,window:{},console,
  _escHtml:(x)=>String(x==null?'':x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;')};
vm.createContext(ctx);
vm.runInContext(slice('function _titleCap(s){', '\nfunction ', ), ctx);
vm.runInContext(slice('var _NL_SETTLING={};', '/* A name off their own words'), ctx);
vm.runInContext(slice('var _NL_QTY_RE=', '/* The fast path.'), ctx);
vm.runInContext(slice('function _tlTotLine(slots, dayState, ds){', '\nfunction _fdMealHtml'), ctx);

// ===== THE NAME =========================================================
const strip=(x)=>vm.runInContext('_nlStripQty('+JSON.stringify(x)+')', ctx);
t(strip('2 handfuls of zucchini')==='zucchini', 'the quantity, the unit AND the "of" all come off - one pass left the "of" behind', strip('2 handfuls of zucchini'));
t(strip('1 cup of zucchinis')==='zucchinis', 'and again with a cup', strip('1 cup of zucchinis'));
t(strip('8oz chicken breast')==='8oz chicken breast'||strip('8oz chicken breast')==='chicken breast', 'a stuck-together unit is left alone or taken whole, never half', strip('8oz chicken breast'));
t(strip('grilled chicken')==='grilled chicken', 'a food that opens with a real word is untouched');
t(strip('canned tuna')==='canned tuna', '"canned" is not the unit "can"');
t(strip('a handful of rice')==='rice', 'the article goes too');
t(strip('2 cups')==='', 'a phrase that is nothing but quantity peels to nothing, and the caller drops it');

function name(lines){ ctx.__e={lines:lines}; return vm.runInContext('_nlFastName(__e, "")', ctx); }
t(name([{known:true,name:'chicken',said:'chicken'},{known:false,name:'zucchini',said:'2 handfuls of zucchini'}])==='Chicken, Zucchini',
  'HER MEAL: "Chicken, Zucchini", not "Chicken, of Zucchini"',
  name([{known:true,name:'chicken',said:'chicken'},{known:false,name:'zucchini',said:'2 handfuls of zucchini'}]));
t(name([{known:false,name:'',said:'2 slices of sourdough'}])==='Sourdough',
  'a line the echo could not even name falls back to their own words, cleaned', name([{known:false,name:'',said:'2 slices of sourdough'}]));
t(/^[A-Z]/.test(name([{known:true,name:'chicken',said:'chicken'}])), 'it is title cased like every other name on the day');

// ===== THE NUMBER =======================================================
const row={id:'r1',name:'Chicken, Zucchini',calories:335,protein:60,carbs:8,fat:6,meal:'Dinner'};
let out=vm.runInContext('_nlDayRow('+JSON.stringify(row)+')', ctx);
t(out.calories===335 && out._pending===undefined, 'a row nobody is waiting on is handed straight through');

vm.runInContext('_nlSettleStart("r1")', ctx);
ctx.__r=row;
out=vm.runInContext('_nlDayRow(__r)', ctx);
t(out.calories===0 && out.protein===0 && out.carbs===0 && out.fat===0, 'a settling row reports NO macros, so no total can include a figure it is not showing');
t(out._pending===true, 'and says why, so a row can print "counting..." instead of "no numbers"');
t(out.name==='Chicken, Zucchini' && out.id==='r1', 'everything else about it survives');
t(row.calories===335, 'THE RECORD IS NOT TOUCHED - it is a copy. Zeroing the cached row would put the zeroes on her actual meal');

// the day's own line
function tot(list){ return vm.runInContext('_tlTotLine({breakfast:[],lunch:[],dinner:__L,snack:[]}, "today", "Sep 11, 2026")', Object.assign(ctx,{__L:list})); }
let line=tot([vm.runInContext('_nlDayRow(__r)', ctx)]);
t(/>0<\/b>|<b>0<\/b>/.test(line) || /\b0\b/.test(line), 'the day total leaves the settling meal out until it lands');
t(line.indexOf('without numbers')<0, 'and does NOT call it a meal without numbers - there is nothing for her to go and fill in');
line=tot([{id:'r2',calories:0,protein:0,carbs:0,fat:0}]);
t(line.indexOf('without numbers')>=0, 'a meal that genuinely has no numbers still says so');

vm.runInContext('_nlSettleEnd("r1")', ctx);
t(vm.runInContext('_nlDayRow(__r)', ctx).calories===335, 'once it lands the real figure is what every reader gets');

// the dead-man's switch
vm.runInContext('_nlSettleStart("r3"); _NL_SETTLING["r3"]=Date.now()-120000;', ctx);
t(vm.runInContext('_nlSettling("r3")', ctx)===false, 'a mark nothing ever came back to clear expires, so no row counts for ever');

// the cache patch
ctx.window._tlCache={foods:[{id:'r1',calories:335,protein:60},{id:'r9',calories:10}]};
t(vm.runInContext('_nlCachePatch("r1",{calories:360,protein:62,carbs:9,fat:6})', ctx)===true
  && ctx.window._tlCache.foods[0].calories===360 && ctx.window._tlCache.foods[0].protein===62,
  'the estimate is written onto the row the page already holds');
t(vm.runInContext('_nlCachePatch("nope",{calories:1,protein:1,carbs:1,fat:1})', ctx)===false, 'and says so when the row is not there, so the caller can fall back to a read');

// ===== THE WIRING, read off the source ==================================
const fast=slice('async function nlSubmitFast(st, line){', '\n/* THE ONE EXIT');
t(fast.indexOf('_nlSettleStart(rowId)') < fast.indexOf('_tlRefreshDay'),
  'THE ORDER: the mark goes on BEFORE the day paints, or the first paint carries the number she is not meant to see');
t(/dayFoods\.forEach\(function\(f\)\{ slots\[_mealSlotFor\(f\)\]\.push\(_nlDayRow\(f\)\); \}\);/.test(src),
  'every meal on the day is built through the one door, so no reader can miss it');
const exit=slice('async function _nlEnrich(st, echo, rowId){', 'async function _nlEnrichRun');
t(/catch\(e\)\{ fields=null; \}/.test(exit) && exit.indexOf('_nlSettleEnd(rowId)')>0,
  'the settle mark is cleared on EVERY exit, thrown or returned - a meal stuck counting is worse than the bug');
t(/if\(patched\) _tlPatchDay\(st\.ds\); else _tlRefreshDay\(st\.ds\)/.test(exit),
  'and the day is patched in place, not reloaded - the reload is the "hard refresh" she filmed');
t(/_nlEnrichRun[\s\S]{0,4000}return null;/.test(src), 'the worker returns null rather than half-finishing');

console.log(bad?('\n  '+bad+' FAILED'):'\n  all settle assertions pass');
process.exit(bad?1:0);
