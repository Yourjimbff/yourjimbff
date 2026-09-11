// HIS WORD ON THE MACROS IS THE MACROS (Yusuf, 10 Sep). Every loose shape of
// a stated figure reads, and a stated line is priced by nobody else.
const fs=require('fs'), vm=require('vm');
const src=fs.readFileSync('index.html','utf8');
let bad=0; const t=(p,l)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l); };
const a=src.indexOf('function _parseInlineMacros(q){'), b=src.indexOf('async function smartLogFromText(q){');
const ctx={Math,String,parseFloat,RegExp}; vm.createContext(ctx); vm.runInContext(src.slice(a,b), ctx);
const P=(q)=>vm.runInContext('_parseInlineMacros('+JSON.stringify(q)+')', ctx);
const S=(q)=>vm.runInContext('_nlStated('+JSON.stringify(q)+')', ctx);
function eq(q, want, label){ const m=P(q).macros; const got=[m.cal,m.protein,m.carbs,m.fat].map(x=>x==null?'null':x).join('/'); t(got===want, (label||q)+'  ->  '+got); }
console.log('\n  the shapes he types:');
eq('12oz ny strip 520 cal 60g protein 10g carbs 30g fat','520/60/10/30');
eq('12oz ny strip 520 cal 60p 10c 30f','520/60/10/30');
eq('ny strip p60 c10 f30','null/60/10/30');
eq('ny strip protein 60 carbs 10 fat 30','null/60/10/30');
eq('ny strip protein: 60g, carbs: 10g, fats: 30g, calories: 520','520/60/10/30');
eq('ny strip 60 pro 10 carb 30 fats 520kcal','520/60/10/30');
eq('ny strip 60 prot 10 carbs 30 fat','null/60/10/30');
eq('ny strip 60/10/30','null/60/10/30','a bare triple is P/C/F');
eq('chicken bowl 565 cal 68p 28c 20f','565/68/28/20');
eq('protein shake 250 cals','250/null/null/null');
console.log('\n  the shapes that are NOT macros:');
eq('12oz steak, 60 pcs of rice','null/null/null/null','"60 pcs" is not 60 protein');
eq('10 cups of rice','null/null/null/null','"10 cups" is not 10 carbs');
eq('2 fish tacos','null/null/null/null','"2 fish" is not 2 fat');
eq('12oz steak and 6 eggs','null/null/null/null','weights and counts are not macros');
eq('half a cup of rice, 3 eggs','null/null/null/null');
console.log('\n  what the one-line logger does with it:');
const st=S('12oz ny strip 520 cal 60p 10c 30f');
t(st && st.name==='12oz ny strip' && st.calories===520 && st.protein===60 && st.carbs===10 && st.fat===30, 'the name is the rest of the line and the numbers are his, verbatim');
const st2=S('ny strip p60 c10 f30');
t(st2 && st2.calories===60*4+10*4+30*9, 'no calorie figure given: 4/4/9 from his macros, not a guess');
t(S('12oz steak and 6 eggs')===null, 'a plain plate is not a stated line');
const echo=src.slice(src.indexOf('function _nlEcho(line){'), src.indexOf('function _nlEchoHtml(st){'));
t(/_nlStated\(line\)/.test(echo) && /out\.stated=true;\s*return out;/.test(echo), 'the echo shows one line of his numbers and leaves nothing for the table or the model');
const sub=src.slice(src.indexOf('async function nlSubmit(){'), src.indexOf('function nlEdit(el, f){'));
/* AND WHATEVER IS ATTACHED (11 Sep). A photo now sends a meal down the road
   that reads it - but not when he has already said the numbers. There is
   nothing for a model to work out, and his figures are his figures. */
t(/_nlStated\(line\) \|\| \(!st\.photo && _nlFastOn\(\)\)/.test(sub),
  'a stated line takes the fast road whatever the switch says and whatever is attached - no model');

console.log('\n  the one door every food log goes through:');
const door=src.slice(src.indexOf('async function logFoodFromChat(offer, photo, targetCode){'), src.indexOf('async function logFoodFromChat(offer, photo, targetCode){')+11000);   // widened 11 Sep: the echo fallback sits between _stated and the reconcile
t(/_parseInlineMacros\(offer\.meal_text\|\|''\)/.test(door) && /_stated=true;/.test(door), 'stated figures in their own words replace the model\'s and the table\'s');
t(/if\(!_stated && !_echoOwned && Array\.isArray\(offer\.items\)/.test(door), 'the table does not re-price a meal he priced');
/* ...NOR ONE THE TABLE ITSELF JUST PRICED (11 Sep). The echo's lines carry a
   name with no amount on it, so re-pricing them read "chicken thigh" as one
   ounce. Same rule, second reason: a meal that is already the table's
   arithmetic does not go through the table again. */
t(/var _stated=false, _echoOwned=false;/.test(door) && /_echoOwned=true;/.test(door),
  'and it does not re-price a meal the echo already priced either');
t(/if\(!_stated && !_macrosReconcileWithCalories\(/.test(door), 'and a stated calorie count is not rebalanced against its parts - no arguing');
console.log(bad?'\n  '+bad+' FAILED':'\n  all stated-macro assertions pass');
process.exit(bad?1:0);
