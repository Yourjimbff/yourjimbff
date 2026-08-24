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
let out;
eval(body+'\nout=buildCoachVoice();');
// The rules this prompt is supposed to be teaching. Each one is a line that was
// written, shipped, and reported as "not taking" — because it never arrived.
const MUST=[
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
  ['the boundaries block',             'This is a PERSISTENT coaching jou']
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
