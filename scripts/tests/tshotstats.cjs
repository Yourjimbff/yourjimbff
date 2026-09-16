// A SCREENSHOT OF YOUR WEIGHT IS NOT A PROGRESS PHOTO.
//
// Yusuf, 16 Sep, off a real one a client posted: "User logged a screenshot
// where he has his weight and his steps, and it's not a progress photo, but we
// should extract that information and save it to his profile accordingly."
//
// The divert already existed for one case - a run screen tapped into the
// progress-photo slot is logged as the run it is. This is the second case, and
// it is the more valuable one: a weight and a step count are two facts this app
// already has columns and charts for, so reading them off the picture turns a
// dead entry in the album into a point on his chart.
//
// WHAT THIS GUARDS, and every line is a way of not being wrong about somebody's
// body: a body photo is never diverted, a dumbbell is never read as a body
// weight, and nothing is written that cannot be read back.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+JSON.stringify(x)+']'):'')); };
const between=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b); return (i<0||j<0||j<i)?'':src.slice(i,j); };

console.log('\n  A BODY PHOTO IS NEVER TAKEN OUT OF THE ALBUM:');
const read=between('async function _ppShotRead(dataUrl){','/* WHAT THE SCREEN SAID');
t(/if\(o\.person!==false\) return null;/.test(read),
  'anything with a person in it stays a progress photo');
t(/if\(o\.screen!==true\) return null;/.test(read), 'and it has to be a screen at all');
const prompt=between('function _ppShotPrompt(){','async function _ppShotRead(dataUrl){');
t(/If you are unsure at all, answer true/.test(prompt),
  '  and an unsure answer counts as a person, not as a screen');

console.log('\n  IT READS THE TWO FACTS THE APP HAS COLUMNS FOR:');
t(/"body_weight":/.test(prompt) && /"steps":/.test(prompt), 'the prompt asks for a body weight and a step count');
t(/"weight_unit":"lb"\|"kg"\|""/.test(prompt), '  and the unit beside the weight');
t(/NEVER a dumbbell, a barbell, a plate, a machine stack or a lifted load/.test(prompt),
  'a lifted weight is explicitly not a body weight');
t(/never a distance, a calorie figure, a heart rate or a rep count/.test(prompt),
  'and a step count is explicitly not a distance');
t(/var hasNums = \(o\.stats===true\) \|\| _ppShotWeight\(o\)!=null \|\| _ppShotSteps\(o\)!=null;/.test(read),
  'a screen carrying either one is enough to divert');
t(/if\(!hasNums\) return null;/.test(read), '  and a screen carrying neither is not');

console.log('\n  AND IT REFUSES A NUMBER IT CANNOT BELIEVE:');
const w=between('function _ppShotWeight(read){','function _ppShotSteps(read){');
t(/if\(n < 50 \|\| n > 700\) return null;/.test(w), 'a body weight outside 50-700 lb is a machine stack, not a person');
t(/if\(unit\.indexOf\('kg'\)>=0\) n = n \* 2\.20462;/.test(w), 'kg is converted once, here, where it can be seen');
const st=between('function _ppShotSteps(read){','/* FILE WHAT IT SAID');
t(/if\(n < 100 \|\| n > 200000\) return null;/.test(st), 'and a step count outside 100-200,000 is something else');

console.log('\n  WHAT IT WRITES GOES THROUGH THE DOORS THAT ALREADY VERIFY:');
const file=between('async function _ppFileStats(read, dateStr){','function _ppAsWorkout(read, photoVal, dateStr){');
t(/logWeightFromChat\(\{weight:wt, dateStr:dateStr/.test(file),
  'the weigh-in uses the door that reads its own row back');
t(/sbUpsert\('step_logs'/.test(file), 'and the steps use the same upsert the workout sheet uses');
t(/'client_code,date_str'/.test(file), '  keyed so a second screenshot of the same day replaces rather than doubles');
t(/notes:'Read from a screenshot'/.test(file), 'and the row says where the number came from');
t(/var did = \[\];/.test(file) && /return did;/.test(file),
  'it reports what actually landed rather than what it tried');

console.log('\n  THE ORDER IS RIGHT, AND NOTHING IS EVER LOST:');
const save=between('async function saveProgressPhoto(){','if(btn) btn.textContent=\'Saving...\';');
t(/!String\(\(_shot\.activity\)\|\|''\)\.trim\(\)/.test(save),
  'a screen that names an activity is still a workout');
t(save.indexOf('_ppFileStats') < save.indexOf('_ppAsWorkout'),
  'and the numbers branch is checked first, because a health summary carries both');
t(/if\(_did\.length\)\{/.test(save), 'it only diverts when something actually saved');
t(/\/\/ Nothing landed\. Fall through and keep the picture rather than lose it\./.test(save),
  'and a failed write falls through to the ordinary save');
t(/\}catch\(e\)\{\}/.test(save), 'every failure path here keeps the photo');

console.log(bad?('\n  '+bad+' FAILED'):'\n  all good (a number on a screen becomes a point on his chart)');
process.exit(bad?1:0);
