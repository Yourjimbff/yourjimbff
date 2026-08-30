// Does the prompt the model ACTUALLY receives still contain the food rules?
// Extracts buildCoachVoice by line range out of index.html and evaluates it.
const fs=require('fs');
const file=process.argv[2]||'index.html';   // defaults to the working tree; pass a path to check a fetched copy
const src=fs.readFileSync(file,'utf8').split('\n');
let start=-1;
for(let i=0;i<src.length;i++){ if(src[i].startsWith('function buildCoachVoice(')){ start=i; break; } }
if(start<0){ console.log('FAIL: buildCoachVoice not found'); process.exit(1); }
let end=-1;
for(let i=start+1;i<src.length;i++){ if(src[i]==='}'){ end=i; break; } }
const body=src.slice(start,end+1).join('\n');
const cl={code:'testday1',name:'Test Day'};
function isTrainer(c){ return c==='thegoat'; }
var YOURJIMBFF_NUTRITION_FORMULA='<<nutrition formula>>';
var JIM_ASK_RULES='<<ask rules>>';
// THE REAL TABLE, LIFTED — not a stub. The prompt now carries the macro table,
// and the point of this suite is what ACTUALLY reaches the model, so stubbing
// _mtPromptBlock here would prove the one thing it must not: that the rules are
// present when they might not be. (Calendar, 30 Aug.)
function _liftFn(name){
  const i=src.findIndex(l=>l.startsWith('function '+name+'('));
  if(i<0){ console.log('FAIL: '+name+' not found — the macro table seam moved'); process.exit(1); }
  let d=0,st=false;
  for(let j=i;j<src.length;j++){ for(const c of src[j]){ if(c==='{'){d++;st=true;} else if(c==='}'){d--;} } if(st&&d===0) return src.slice(i,j+1).join('\n'); }
  console.log('FAIL: no close for '+name); process.exit(1);
}
function _liftVar(name){
  const i=src.findIndex(l=>l.startsWith('var '+name+'='));
  if(i<0){ console.log('FAIL: var '+name+' not found — the macro table seam moved'); process.exit(1); }
  for(let j=i;j<src.length;j++) if(src[j].trim()==='];') return src.slice(i,j+1).join('\n');
  console.log('FAIL: no close for var '+name); process.exit(1);
}
eval(src.find(l=>l.startsWith('var MB_PALM_OZ'))+'\n'+_liftVar('MT_ROWS')+'\nvar _MT_BY=null;\n'+_liftFn('_mtIndex')+'\n'+_liftFn('_mtPromptBlock'));
let out;
eval(body+'\nout=buildCoachVoice();');
// The rules this prompt is supposed to be teaching. Each one is a line that was
// written, shipped, and reported as "not taking" — because it never arrived.
const MUST=[
  ['the macro table itself',          'MACRO TABLE (authoritative)'],
  ['a row the app computes with',     'chicken breast [oz] 8.5P/0C/1F'],
  ['the rows-in-the-marker rule',     'ROWS IN THE MARKER'],
  ['the sum-of-parts promise',        'the meal total is always the sum of its parts'],
  ['the FOOD_LOG worked example',      '[FOOD_LOG]{"name":"Chicken, rice & broccoli"'],
  ['LOGGED requires the marker',       'REQUIRES THE MARKER'],
  ['the food-led naming rule',         'NAME IT WITH THE FOOD, NOT THE PLACE'],
  ['the never-ask-which-day rule',     'NEVER ASK WHICH DAY'],
  ['the daysAgo back-dating rule',     'WHICH DAY (important)'],
  ['one sitting is one meal',          'A meal is a SITTING'],
  ['the cardio-is-its-own-entry rule', 'CARDIO BESIDE A LIFT'],
  ['multiple markers allowed',         'You may emit MULTIPLE'],
  ['the photo food/workout split',     'PHOTO TYPE'],
  ['the workout MARKER RULES block',   'MARKER RULES:'],
  ['the boundaries block',             'This is a PERSISTENT coaching jou'],
  // ===== 27 AUG. Both of these were MISSING from this prompt entirely. The
  // food-math rules and the cooked/dry carb reference live in analyze()'s
  // prompt, which the gold bar's text path never reads. His quantity test
  // passed on the model being sensible, not on the app being right.
  ['quantity multiplies, once',        'QUANTITY MULTIPLIES THE MACROS THEY GAVE, ONCE'],
  ['per-item macros are multiplied',   'PER ITEM (a label, one container'],
  ['a stated total is never doubled',  'ALREADY THE TOTAL'],
  ['unsure takes them as given',       'UNSURE which it is'],
  ['a brand meal works in one line',   'A BRAND MEAL WITH A QUANTITY MUST WORK IN ONE SENTENCE'],
  ['quantity does not split the entry','STILL ONE ENTRY'],
  ['weights are cooked by default',    'WEIGHTS ARE COOKED UNLESS THEY SAY OTHERWISE'],
  ['and the assumption is said back',  'AND SAY WHICH YOU USED']
];
console.log('lines '+(start+1)+'-'+(end+1)+' of '+file);
console.log('prompt delivered to the model: '+out.length.toLocaleString()+' chars');
let bad=0;
MUST.forEach(function(p){
  const ok=out.indexOf(p[1])>=0;
  if(!ok) bad++;
  console.log((ok?'  ok    ':'  MISSING ')+p[0]);
});
console.log(bad? ('\nFAIL: '+bad+'/'+MUST.length+' rules never reach the model') : '\nPASS: all '+MUST.length+' rules reach the model');
process.exit(bad?1:0);
