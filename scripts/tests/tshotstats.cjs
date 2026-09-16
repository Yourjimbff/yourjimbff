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

console.log('\n  AND IT FILES IT ON THE DAY THE SCALE SAID IT:');
/* READ OFF THE REAL ONE. Raul's screen shows 219.6 lbs under a card footed
   "Updated Aug 15" - a month-old reading on a summary he took today, while his
   app already had a newer 222 from this evening. Filing the screenshot's number
   as today's weigh-in would have drawn a 2.4 lb drop he never had. The number
   and the day it was taken are two separate facts and only one of them is
   about the photo. */
t(/"weight_updated":/.test(prompt), 'the prompt asks for the date printed with the weight');
t(/Updated Aug 15/.test(prompt), '  named with the shape health apps actually print');
const day=between('function _ppShotWeightDay(read, fallback){','async function _ppFileStats(read, dateStr){');
t(day.length>0, '_ppShotWeightDay exists');
t(/if\(!txt\) return fallback;/.test(day), 'no date on the screen falls back to the photo\u2019s own day');
t(/if\(isNaN\(d\.getTime\(\)\)\) return fallback;/.test(day), 'and so does one it cannot read');
t(/if\(days < 0 \|\| days > 400\) return fallback;/.test(day), 'a date more than a year back is refused, not guessed at');
t(/d\.setFullYear\(d\.getFullYear\(\)-1\)/.test(day), 'and a bare "Aug 15" in January is last August, not next');
t(/logWeightFromChat\(\{weight:wt, dateStr:wday/.test(src), 'the weigh-in is filed on that day');
t(/\(wday!==dateStr \? \(' on ' \+ wday\) : ''\)/.test(src), 'and the toast says so when it is not today');

console.log('\n  WHAT IT WRITES GOES THROUGH THE DOORS THAT ALREADY VERIFY:');
const file=between('async function _ppFileStats(read, dateStr){','function _ppAsWorkout(read, photoVal, dateStr){');
t(/logWeightFromChat\(\{weight:wt, dateStr:wday/.test(file),
  'the weigh-in uses the door that reads its own row back');
t(/sbUpsert\('step_logs'/.test(file), 'and the steps use the same upsert the workout sheet uses');
t(/'client_code,date_str'/.test(file), '  keyed so a second screenshot of the same day replaces rather than doubles');
t(/notes:'Read from a screenshot'/.test(file), 'and the row says where the number came from');
t(/var did = \[\];/.test(file) && /return did;/.test(file),
  'it reports what actually landed rather than what it tried');

console.log('\n  AND THE CARD IS KEPT, RENAMED (Yusuf, 16 Sep):');
/* "We should just keep that card. So it's not a progress photo. It's like a
   progress update or daily update. It's like an import of sorts."
   The first version filed the numbers and DROPPED the picture - which threw away
   the thing he was actually looking at. The row is saved either way now, through
   the one save path, and marked so every surface calls it what it is. */
t(/var PP_UPDATE = 'Update';/.test(src), 'there is one marker, named once');
t(/function _ppIsUpdate\(row\)\{/.test(src), '  and one test for it');
t(/var _ppAngle = \(_ppImported && _ppImported\.length\) \? PP_UPDATE : \(_ppNewAngle\|\|'Front'\);/.test(src),
  'a screenshot that carried numbers is filed as an Update, not as an angle');
t(/if\(saved\.angle==null\) saved\.angle = _ppAngle;/.test(src), '  and the local copy agrees with the row');
t(!/return;\n      \}\n      \/\/ Nothing landed/.test(src), 'nothing returns early any more, so the picture is never dropped');
t(/if\(_did\.length\)\{ _ppImported = _did; \}/.test(src), '  it records what it imported and carries on to the save');

console.log('\n  AND EVERY SURFACE CALLS IT THAT:');
t(/what='Update';/.test(src) && /meta='Imported from a screenshot';/.test(src),
  'the feed card reads Update, not Progress photo - Front');
t(/_ppIsUpdate\(it\.data\)\?'shared an update':'shared a progress photo'/.test(src),
  'and the line above it says shared an update');
t(/_ppIsUpdate\(r\) \? 'Update imported from a screenshot' : 'Progress photo'/.test(src),
  'the day summary says it too');
t(/if\(progressPhotos\.some\(_ppIsUpdate\)\) _ppTabs\.push\(PP_UPDATE\);/.test(src),
  'the album grows a fourth filter only once there is one to show');
t(/_ppImported\.join\(' and '\) \+ ' \\u2014 imported from your screenshot'/.test(src),
  'and the toast names what was taken off it');

console.log('\n  THE ORDER IS RIGHT, AND NOTHING IS EVER LOST:');
const save=between('async function saveProgressPhoto(){','if(btn) btn.textContent=\'Saving...\';');
t(/!String\(\(_shot\.activity\)\|\|''\)\.trim\(\)/.test(save),
  'a screen that names an activity is still a workout');
t(save.indexOf('_ppFileStats') < save.indexOf('_ppAsWorkout'),
  'and the numbers branch is checked first, because a health summary carries both');
t(/\/\/ Nothing landed\? Then it is an ordinary photo and nothing above changed\./.test(save),
  'and a failed write leaves it an ordinary progress photo');
t(/\}catch\(e\)\{\}/.test(save), 'every failure path here keeps the photo');

console.log(bad?('\n  '+bad+' FAILED'):'\n  all good (a number on a screen becomes a point on his chart)');
process.exit(bad?1:0);
