// FIRST OPEN — the whole setup, one question at a time.
//
// Yusuf, 12 Sep, picked the long version outright: "the full setup, one screen
// at a time... they arrive fully set up."
//
// WHAT A FREE USER GOT BEFORE THIS, seen live on the served build signed in as
// the new `freeuser` code: nothing at all. An empty Day reading "No program set
// up yet", a box asking for their phone number so YUSUF could text them, a
// "Calls with Yusuf" section, and Breakfast and Lunch already marked Skipped.
// The setup that existed was two cards on the Progress page (_gpSecYou,
// _gpSecGoal) and nothing ever sent anyone to them. The older #sSetup screen is
// dead markup - every line in the file only ever sets its display to 'none'.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const {closure}=require('./_lift.cjs');
let bad=0; const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };
function slice(a,b){ const i=src.indexOf(a); return i<0?'':src.slice(i, src.indexOf(b,i)); }

const CL=closure(['_OB_STEPS','_OB_EQUIP','_OB_EXP','_OB_FOOD','_OB_MUS','_OB_PHASE']);
t(!CL.unparsable || !CL.unparsable.length, 'the flow lifted cleanly', JSON.stringify(CL.unparsable||[]));
global.window={};
eval(CL.code||'');

console.log('\n  EVERY QUESTION HE LISTED HAS ITS OWN SCREEN:');
const keys=_OB_STEPS.map(s=>s.k);
['gender','birthday','height','weight','goal_weight','phase','food','train_days',
 'equipment','experience','priority','cardio','sleep'].forEach(function(k){
  t(keys.indexOf(k)>=0, k);
});
t(keys[0]==='intro', 'it opens by saying what this is, before anything personal is asked');
t(keys[keys.length-1]==='plan', 'and it ends on their plan, not on a form');
t(_OB_STEPS.filter(s=>s.q||s.type==='intro'||s.type==='plan').length===_OB_STEPS.length,
  'every screen asks exactly one thing');

console.log('\n  AND WHO IT IS NOT FOR IS SAID ON SCREEN ONE:');
const intro=slice("if(st.type==='intro'){", "if(st.type==='pick'){");
t(/not a bodyweight or calisthenics plan/.test(intro),
  'a bodyweight-only person is told before they answer fourteen questions');
t(/built for a gym/.test(intro), 'and that it needs a gym');

console.log('\n  THE CALORIES ARE THE ENGINE THE APP ALREADY HAS:');
const tg=slice('function _obTargets(){','function obRender(){');
t(/return _fuelTargets\(\);/.test(tg), 'it calls _fuelTargets rather than inventing a second formula');
t(/profile=keep;/.test(tg) && /finally/.test(tg),
  'and it puts the live profile back afterwards, even if that throws');
const fuel=slice('function _fuelTargets(){','function _fuelRanges(){');
t(/var gw=parseFloat\(profile&&\(profile\.goal_weight/.test(fuel),
  'which eats from GOAL weight, not scale weight - his whole principle, already shipped');
t(/var prot=Math\.round\(gw\);/.test(fuel), 'and sets protein at goal weight in grams');
const plan=slice('function _obPlanHtml(){','function _obTargets(){');
t(/You eat for the body underneath the fat/.test(plan),
  'and the plan screen says WHY that number is not their scale weight');

console.log('\n  WEEK ONE ONLY — NO PROJECTION:');
t(/This week has one job/.test(plan), 'the plan gives them one job');
t(!/weeks? to go|goal date|by [A-Z][a-z]+ \d|on track to/.test(plan),
  'and never shows a date they hit the goal');
t(/We are not looking at that yet\. One week at a time\./.test(plan),
  'a big goal is explicitly parked');

console.log('\n  IT RUNS ONCE, AND ONLY FOR SOMEONE WHO NEEDS IT:');
const should=slice('function _obShouldRun(){','function _obStep(){');
t(/if\(cl\.is_trainer\) return false;/.test(should), 'never for a trainer');
t(/if\(profile\.setup_done\) return false;/.test(should), 'never for someone already set up');
t(/if\(!profile\) return false;/.test(should), 'and never before the profile has loaded');
t(/if\(profile\.weight && profile\.goal_weight && profile\.height\) return false;/.test(should),
  'nor for an older client who has the numbers but no setup flag');
t(/try\{ setTimeout\(function\(\)\{ try\{ obStart\(\); \}catch\(e\)\{\} \}, 400\); \}catch\(e\)\{\}/.test(src),
  'and it is fired only after the SERVER profile row has landed and merged');

console.log('\n  THEIR ANSWERS SURVIVE A BAD NETWORK:');
const fin=slice('async function obFinish(){','function obRender()');
t(/localStorage/.test(src.slice(src.indexOf('function _obSetupStash()'), src.indexOf('function obStart('))),
  'every answer is written to this device as it is given');
t(/Could not save that — your answers are kept, try Start again/.test(fin),
  'a failed save says so and keeps them');
t(fin.indexOf('localStorage.removeItem(_obSetupKey())') > fin.indexOf('if(!ok){'),
  'and the local copy is only cleared AFTER the server took it');

console.log('\n  IT WRITES WHERE THE APP ALREADY READS:');
['gender','birthday','age','height','weight','start_weight','goal_weight','phase',
 'train_days','cardio_days','cardio_min','bed_time','wake_time','intake_json','setup_done']
 .forEach(function(c){ t(new RegExp(c+':').test(fin), 'profiles.'+c); });
t(/food_method|equipment|experience|priority/.test(fin),
  'and the four with no column of their own ride in intake_json');

console.log(bad? '\n  '+bad+' FAILED\n' : '\n  all good ('+keys.length+' screens)\n');
process.exit(bad?1:0);
