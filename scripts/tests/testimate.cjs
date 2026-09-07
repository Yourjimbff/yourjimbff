// JUST LOG IT (Yusuf, order, 7 Sep). LeAndra M typed an iced vanilla latte
// with almond milk, answered "It's a local coffee shop. I had a 16oz", then
// "Let's say 250 to be on the safe side", then "250 cals" - and was asked the
// same question four times. Two faults, both fixed here:
//   1. a row the macro table does not cover, sent with no numbers on it, was
//      rounded to zero and its zero overwrote the meal total she gave;
//   2. a food with no numbers was refused and asked about, instead of priced
//      from what she said, her own history, or an estimate.
const fs=require('fs');
const {closure}=require('./_lift.cjs');
let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };
const src=fs.readFileSync('index.html','utf8');

console.log('\n  THE TABLE PASS KEEPS HER TOTAL:');
const w=src.slice(src.indexOf('async function logFoodFromChat('), src.indexOf("async function logFoodFromChat(")+12000);
t(/var _blank=0;[\s\S]{0,400}!_mtItem\(x\) && !\(\(\+x\.calories\)\|\|\(\+x\.protein\)\|\|\(\+x\.carbs\)\|\|\(\+x\.fat\)\)/.test(w), 'rows the table cannot price and that carry no numbers are counted BEFORE the table zeroes them');
t(/if\(_blank && _top>_mt\.calories\)\{[\s\S]{0,300}offer=Object\.assign\(\{\}, offer, \{items:_mi\}\);/.test(w), 'when such a row exists and the meal total said more than the table found, the total she gave stands');
t(/\} else \{\s*offer=Object\.assign\(\{\}, offer, \{items:_mi, protein:_mt\.protein/.test(w), 'otherwise the table is still law - the sum of the rows is the meal');
t(/if\(_foodMacrosAllZero\(offer\) && !_foodZeroIsPlausible\([\s\S]{0,120}var _est=await _jimEstimateFood\(offer, _code\);/.test(w), 'a meal still at zero after the table is sent to the estimator, not the gate');
t(/estimated:\(_estimated\|\|false\)/.test(src), 'the landed row remembers that its numbers were found, and how');

console.log('\n  THE THREE DOORS:');
global.window={addEventListener(){}, location:{search:""}}; global.document={addEventListener(){},querySelector(){return null},getElementById(){return null}}; global.localStorage={getItem(){return null},setItem(){}};
global.console={warn(){},error(){},log(){}};
const CL=closure(['_jimEstimateFood','_parseInlineMacros','_matchHistory']); eval(CL.code||'');
// the lifted real fetchers are replaced by plain assignment - eval declared them in this scope, so a global.* stub would be shadowed
var _foodMemoryFor, sbSelect, _nlEstimate, _savedFoods;
global.console=require('console');
(async()=>{
  // said
  _foodMemoryFor=async()=>({foods:[],meals:[],code:'x',failed:true});
  sbSelect=async()=>[];
  _nlEstimate=async()=>{ throw new Error('no network'); };
  let r=await _jimEstimateFood({name:'Iced Vanilla Latte with Almond Milk', meal_text:'250 cals'}, 'leandram1');
  t(r && r.how==='said' && r.calories===250, 'a calorie count in her own words is used first', JSON.stringify(r));
  r=await _jimEstimateFood({name:'Pancakes', meal_text:'2 pancakes, 60g carbs, 40g protein, 28g fat'}, 'x');
  t(r && r.how==='said' && r.calories===40*4+60*4+28*9 && r.protein===40, 'macros in her words give the calories by 4/4/9', JSON.stringify(r));
  // history - her own saved foods
  _foodMemoryFor=async()=>({foods:[{name:'Vanilla latte with almond milk',calories:240,protein:1,carbs:35,fat:8}],meals:[],code:'leandram1',failed:false});
  r=await _jimEstimateFood({name:'Vanilla latte with almond milk', meal_text:'had a vanilla latte with almond milk'}, 'leandram1');
  t(r && r.how==='history' && r.calories===240 && r.carbs===35, 'her own saved food by name comes next', JSON.stringify(r));
  // history - her past logged rows, when saved_foods has nothing
  let qSeen='';
  _foodMemoryFor=async()=>({foods:[],meals:[],code:'leandram1',failed:true});
  sbSelect=async(tbl,q)=>{ qSeen=tbl+'?'+q; return [{name:'Vanilla latte with almond milk',calories:240,protein:1,carbs:35,fat:8,sugar:0}]; };
  r=await _jimEstimateFood({name:'Iced Vanilla Latte with Almond Milk', meal_text:'Had an iced vanilla latte with almond milk'}, 'leandram1');
  t(r && r.how==='history' && r.calories===240, 'a past logged row is history too, even when it never reached saved_foods', JSON.stringify(r));
  t(/food_logs\?client_code=eq\.leandram1&calories=gt\.0/.test(qSeen) && /name=ilike\.\*vanilla\*/.test(qSeen), 'looked up on HER code, calories required, by the food words', qSeen);
  t(!/iced|with/.test(qSeen), 'size and filler words are not part of the match', qSeen);
  // no memory for the code: the signed-in account\'s own foods are never used
  _savedFoods=[{name:'Iced Vanilla Latte with Almond Milk',calories:999,protein:9,carbs:9,fat:9}];
  sbSelect=async()=>[];
  let est=null; _nlEstimate=async(p)=>{ est=p; return {calories:230,protein:2,carbs:32,fat:9,sugar:28}; };
  r=await _jimEstimateFood({name:'Iced Vanilla Latte with Almond Milk', meal_text:'It is a local coffee shop. I had a 16oz'}, 'leandram1');
  t(r && r.how==='estimate' && r.calories===230, 'with no history of her own it estimates - never borrowing the signed-in account\'s foods', JSON.stringify(r));
  t(/16oz/.test(est) && /Never all zeros/.test(est), 'the estimate is asked with the size she gave', est);
  // all doors shut
  _nlEstimate=async()=>({calories:0,protein:0,carbs:0,fat:0});
  r=await _jimEstimateFood({name:'Iced Vanilla Latte with Almond Milk', meal_text:'x'}, 'leandram1');
  t(r===null, 'zeros from every door mean null, so the caller keeps the old gate - never a zero row');

  console.log('\n  THE REPLY:');
  t(/I put '\+_en\.join\(' and '\)\+' on your day'/.test(src) && /from what you logged before\./.test(src) && /as an estimate\. Tap it on your day if you know the real numbers\./.test(src), 'an estimated row says so, once, and where to fix it');
  t(!/About how many calories was it, or tell me the size and where it was from, and I will log it/.test(src), 'the four-times question is gone');
  t(/I could not put numbers on ' \+ _nmName \+ ' just now, so it is not on your day yet\./.test(src), 'the rare all-doors-shut line is still honest');

  console.log();
  if(bad){ console.log('  '+bad+' FAILED'); process.exit(1); }
  console.log('  all estimate assertions pass');
  process.exit(0);
})();
