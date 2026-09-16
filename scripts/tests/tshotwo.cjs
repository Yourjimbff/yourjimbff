// A PHOTO OF A SCREEN IS NOT A PROGRESS PHOTO (Yusuf, 15 Sep).
//
// Lauren Burnam uploaded three photos in four minutes. Two were her in a gym
// mirror. The first was a screenshot of a run - 9.15 km, 6:58 per km, 1:03:44 -
// filed under "Front" and drawn on his feed as "Progress photo · Front". His
// ruling: "even if someone hits a progress photo, but you see workout data in
// there and, like, no person ... it should automatically log as a workout."
//
// THE TEST THAT MATTERS IS THE PERSON TEST. A progress photo taken in a gym has
// screens, monitors and machines in the background and is still a progress
// photo. So a divert needs all three - a screen, exercise numbers, and nobody
// in frame - and an absent answer is never read as "nobody there".
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const L=src.split('\n');
function fnAt(n){
  const a=L.findIndex(l=>l.indexOf('function '+n+'(')===0 || l.indexOf('async function '+n+'(')===0);
  if(a<0) return '';
  let b=a,d=0,seen=false;
  for(; b<L.length; b++){
    for(const ch of L[b]){ if(ch==='{'){ d++; seen=true; } else if(ch==='}'){ d--; } }
    if(seen && d===0) break;
  }
  return L.slice(a,b+1).join('\n');
}
let bad=0;
const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined?('  '+x):'')); };

const readSrc=fnAt('_ppShotRead');
const woSrc  =fnAt('_ppAsWorkout');
const saveSrc=fnAt('saveProgressPhoto');
const promptSrc=fnAt('_ppShotPrompt');
t(!!readSrc && !!woSrc && !!saveSrc && !!promptSrc, 'all four pieces exist');
if(bad){ console.log('tshotwo: FAILED'); process.exit(1); }

// ---- the gate: all three, and absence is never consent -------------------
t(/if\(o\.person!==false\) return null;/.test(readSrc), 'a person anywhere in frame means it stays a progress photo');
t(/if\(o\.screen!==true\)\s*return null;/.test(readSrc), 'it must be a screen');
/* IT MUST CARRY NUMBERS, and since 16 Sep there are two kinds that count: the
   exercise figures this file was built for, and a body weight or a step count
   off a health summary - see tshotstats.cjs. What has not changed is that a
   screen carrying NEITHER is left alone, which is the assertion that matters
   here. */
t(/var hasNums = \(o\.stats===true\) \|\| _ppShotWeight\(o\)!=null \|\| _ppShotSteps\(o\)!=null;/.test(readSrc),
  'it must carry exercise numbers, a body weight, or a step count');
t(/if\(!hasNums\) return null;/.test(readSrc),  '  and a screen with none of them stays a progress photo');
// !==false / !==true rather than falsy checks: a missing field must not divert.
t(!/if\(!o\.person\)/.test(readSrc), 'a MISSING person field does not count as "nobody there"');

// Simulate the gate on the four shapes that matter.
function gate(o){
  if(o.person!==false) return false;
  if(o.screen!==true) return false;
  if(o.stats!==true) return false;
  return true;
}
t(gate({person:false,screen:true,stats:true})===true,  "Lauren's run screenshot diverts");
t(gate({person:true, screen:true,stats:true})===false, 'a mirror selfie with a screen behind her does NOT divert');
t(gate({person:false,screen:true,stats:false})===false,'a screenshot with no exercise numbers does not divert');
t(gate({person:false,screen:false,stats:true})===false,'a race bib photo - numbers, not a screen - does not divert');
t(gate({screen:true,stats:true})===false,              'no person answer at all: stays a photo');
t(gate({person:null,screen:true,stats:true})===false,  'null person: stays a photo');

// ---- it fails open -------------------------------------------------------
t(/catch\(e\)\{ return null; \}/.test(readSrc), 'any throw returns null, which means "save it as a photo"');
t(/if\(!res\.ok\) return null;/.test(readSrc), 'a reader that answers an error returns null');
t(/if\(i<0\|\|j<i\) return null;/.test(readSrc), 'an unparsable answer returns null');
t(/\}catch\(e\)\{\}\s*\n\s*if\(btn\) btn\.textContent='Saving\.\.\.';/.test(saveSrc),
  'the whole divert is wrapped, and the ordinary save runs after it');
t(/\/\/ The workout would not save\./.test(saveSrc),
  'if the workout insert fails it still falls through to saving the photo');

// ---- the workout it writes ----------------------------------------------
const _ppAsWorkout = new Function('cl','return ('+woSrc+')')({code:'uws7rg892k3'});
const run = _ppAsWorkout({activity:'Run', detail:'9.15 km | 6:58 /km | 1:03:44', minutes:64}, 'https://x/p.jpg', 'Sep 15, 2026');
t(run.title==='Run', 'the activity names itself - Run, not Cardio', run.title);
t(run.description.indexOf('9.15 km')>=0, 'the figures are copied off the screen', run.description);
t(run.description.indexOf('6:58')>=0, '...pace too');
t(run.photo==='https://x/p.jpg', 'the screenshot rides along on the workout');
t(run.date_str==='Sep 15, 2026', 'it keeps the date they chose');
t(run.client_code==='uws7rg892k3', 'and their code');

// A read with no activity must not invent one.
const bare = _ppAsWorkout({activity:'', detail:'', minutes:null}, 'u', 'Sep 15, 2026');
t(bare.title==='Workout', 'no activity read: falls back to Workout, never a guess', bare.title);
t(bare.description===null, 'no figures read: no description invented');
// Minutes are added only when they are not already in the copied line.
const m1 = _ppAsWorkout({activity:'Walk', detail:'2.1 mi', minutes:31}, 'u', 'd');
t(/31 min/.test(m1.description), 'duration appended when the line does not carry it', m1.description);
const m2 = _ppAsWorkout({activity:'Row', detail:'20 min · 5000 m', minutes:20}, 'u', 'd');
t((m2.description.match(/20/g)||[]).length===1, 'and never doubled when it does', m2.description);

// ---- the prompt asks the right question ----------------------------------
t(/If you are unsure at all, answer true/.test(promptSrc),
  'the prompt biases the person test toward keeping the photo');
t(/Do not invent or convert any number/.test(promptSrc), 'figures are copied, never converted');
t(/Never "Workout" or "Cardio" if you can see what it actually was/.test(promptSrc),
  'the activity is named, per the sauna ruling');

// ---- the read happens BEFORE anything is written -------------------------
const iRead = saveSrc.indexOf('_ppShotRead');
const iPost = saveSrc.indexOf("'/rest/v1/progress_photos'") >= 0
            ? saveSrc.indexOf("'/rest/v1/progress_photos'") : saveSrc.indexOf('progress_photos');
t(iRead>0 && iPost>iRead, 'the screenshot is caught before the photo row is written');

console.log(bad? ('tshotwo: '+bad+' FAILED') : 'tshotwo: all passed');
process.exit(bad?1:0);
