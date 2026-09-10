// THE NATIONAL DATABASE BEHIND THE ESTIMATE (Yusuf, 10 Sep). The USDA door
// answers in the app's shape, and the meal logger hands its rows to the model
// as references for anything the table cannot price.
const fs=require('fs'), vm=require('vm');
const src=fs.readFileSync('index.html','utf8');
let bad=0; const t=(p,l)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l); };
// the function's shaping, on a USDA-shaped row
const fn=fs.readFileSync('netlify/functions/usda.js','utf8');
const a=fn.indexOf('const N = {'), b=fn.indexOf('exports.handler');
const ctx={Math,String,Number,Array,RegExp}; vm.createContext(ctx); vm.runInContext(fn.slice(a,b), ctx);
const branded={fdcId:1, dataType:'Branded', description:'PROTEIN BAR, CHOCOLATE CHIP COOKIE DOUGH', brandOwner:'Costco', servingSize:60, servingSizeUnit:'g', householdServingFullText:'1 bar',
  foodNutrients:[{nutrientName:'Energy',unitName:'KCAL',value:317},{nutrientName:'Protein',unitName:'G',value:35},{nutrientName:'Carbohydrate, by difference',unitName:'G',value:36.7},{nutrientName:'Total lipid (fat)',unitName:'G',value:11.7}]};
vm.runInContext('globalThis.__b='+JSON.stringify(branded), ctx);
const r=vm.runInContext('shape(__b)', ctx);
t(r.serving==='1 bar' && r.serving_g===60 && r.calories===190.2 && r.protein===21 && r.carbs===22 && r.fat===7, 'a branded row is priced per its printed serving: 1 bar (60 g) = 190 cal / 21P / 22C / 7F');
const generic={fdcId:2, dataType:'Survey (FNDDS)', description:'Pancakes, plain, from fast food / restaurant', foodNutrients:[{nutrientName:'Energy',unitName:'KCAL',value:227},{nutrientName:'Protein',unitName:'G',value:6.4},{nutrientName:'Carbohydrate, by difference',unitName:'G',value:28},{nutrientName:'Total lipid (fat)',unitName:'G',value:10}]};
vm.runInContext('globalThis.__g='+JSON.stringify(generic), ctx);
const g=vm.runInContext('shape(__g)', ctx);
t(g.serving==='100 g' && g.calories===227, 'a generic row says it is per 100 g');
t(/verify\(auth\.replace/.test(fn) && /GET only/.test(fn) && /DEMO_KEY/.test(fn) && /USDA_API_KEY/.test(fn), 'same session gate as analyze; runs on DEMO_KEY until the real key is set');
// the client side
const c=src.slice(src.indexOf('var _USDA_MS=2500'), src.indexOf('async function _nlEstimate(content, signal){'));
const c2={String,RegExp}; vm.createContext(c2); vm.runInContext(c.slice(c.indexOf('function _usdaFoodWords(said){'), c.indexOf('async function _usdaRefs(items){')), c2);
const W=(q)=>vm.runInContext('_usdaFoodWords('+JSON.stringify(q)+')', c2);
t(W('2 kirkland protein bars')==='kirkland protein bars' && W('a handful of walnuts')==='walnuts' && W('6oz chicken breast')==='chicken breast', 'the search is the food words, not the amount  -> '+[W('2 kirkland protein bars'),W('a handful of walnuts'),W('6oz chicken breast')].join(' | '));
t(/Authorization'\]='Bearer '\+t/.test(c) && /_sbTimeout\(_USDA_MS\)/.test(c), 'the lookup carries the session and gives up at 2.5s');
t(/Never let a reference override a number the client typed/.test(c), 'a reference never outranks a typed number');
const enrich=src.slice(src.indexOf('async function _nlEnrich(st, echo, rowId){'), src.indexOf('async function nlSubmit(){'));
t(/refs=await _usdaRefs\(left\)/.test(enrich) && /\+refs\s*\n/.test(enrich), 'the enrich road hands the unpriced items\' USDA rows to the model');
const sub=src.slice(src.indexOf('async function nlSubmit(){'), src.indexOf('function nlEdit(el, f){'));
t(/_refs=await _usdaRefs\(_nlEchoSplit\(line\)\)/.test(sub) && /_nlItemsRule\(\)\+_refs\+/.test(sub), 'and so does the model road');
console.log(bad?'\n  '+bad+' FAILED':'\n  all USDA assertions pass');
process.exit(bad?1:0);
