// LAUREN BURNAM'S THREAD, 15 Sep. Four failures in a row, each one caused by
// the next. She texted Yusuf: "I tried this!! But it thought it was a progress
// photo." His order: "Make jim more communicative in helping them know what he
// can do and make his memory not so [bad]."
//
// WHAT ACTUALLY HAPPENED, in order:
//   1. She sent a training screenshot. Jim asked "Meal or progress photo?" -
//      a false choice; her photo was neither.
//   2. She answered "Training". It matched NOTHING, so Jim said "I don't think
//      that actually saved". Every later failure follows from this one.
//   3. She sent another photo and got the IDENTICAL question back.
//   4. Four turns later she typed "Boxing, cardio and strength (full body)" and
//      Jim answered "Progress photo added for today." She replied "??".
//      Cause: the pending-answer branch tested a bare \b(progress|physique|body)\b,
//      and "full body" matched on "body".
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
function constAt(name){
  const a=L.findIndex(l=>l.indexOf('var '+name+'=')===0);
  if(a<0) return '';
  let b=a; while(b<L.length && !/;\s*$/.test(L[b])) b++;
  return L.slice(a,b+1).join('\n');
}
let bad=0;
const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined?('  '+x):'')); };

const route=fnAt('_jimPhotoRoute');
t(!!route, 'the photo route exists');

// ---- 4. THE ONE THAT MADE HER SAY "??" -----------------------------------
t(!/\/\\b\(progress\|physique\|body\)\\b\/i\.test\(t\)/.test(route),
  'the bare \\b(progress|physique|body)\\b is GONE from the route');
t(/if\(_jimSaysProgress\(t\)\)\{/.test(route), '...replaced by _jimSaysProgress');

const world = constAt('_JIM_PROGRESS_RE') + '\n' + fnAt('_jimSaysProgress');
t(!!world.trim(), 'the progress reader is liftable');
const _jimSaysProgress = new Function(world + '; return _jimSaysProgress;')();

t(_jimSaysProgress('Boxing, cardio and strength (full body)')===false,
  'HER SENTENCE no longer files a progress photo');
t(_jimSaysProgress('boxing + full body strength')===false, 'nor the shorter one she typed later');
t(_jimSaysProgress('full body day')===false, '"full body day" is a workout, not a physique shot');
// ...while the real answers still work.
t(_jimSaysProgress('progress')===true, 'a one-word "progress" is still the answer to his question');
t(_jimSaysProgress('Progress.')===true, '...with a full stop');
t(_jimSaysProgress('physique')===true, '"physique" alone');
t(_jimSaysProgress('body check')===true, '"body check" alone');
t(_jimSaysProgress('progress photo')===true, 'the full phrase');
t(_jimSaysProgress('this is my progress photo for the week')===true, 'said inside a sentence');
t(_jimSaysProgress('progress photo after my meal')===false, 'a meal word still wins');
t(_jimSaysProgress('')===false, 'empty is not an answer');
t(_jimSaysProgress(null)===false, 'null does not throw');

// ---- 2. "TRAINING" IS AN ANSWER ------------------------------------------
const woRe = new Function(constAt('_JIM_WO_ANS_RE') + '; return _JIM_WO_ANS_RE;')();
t(woRe.test('Training')===true, 'HER ANSWER "Training" is now recognised');
t(woRe.test('workout')===true, '"workout"');
t(woRe.test('gym')===true, '"gym"');
t(woRe.test('boxing')===true, '"boxing"');
t(woRe.test('run')===true, '"run"');
t(woRe.test('my workout')===true, '"my workout"');
t(woRe.test('todays session')===true, '"todays session"');
t(woRe.test('meal')===false, '"meal" is not a workout answer');
t(woRe.test('progress')===false, '"progress" is not a workout answer');
t(/_JIM_WO_ANS_RE\.test\(t\)/.test(route), 'the route asks it');
t(/_jimPhotoWorkoutReply\(/.test(route), '...and has somewhere to send it');

// ---- 1. HE LOOKS BEFORE HE ASKS ------------------------------------------
t(/await _jimPhotoWhat\(photos\[0\]\)/.test(route), 'the photo is READ before any question');
const what=fnAt('_jimPhotoWhat');
t(/Prefer unsure over guessing/.test(what), 'the reader is told to prefer unsure over a guess');
t(/if\(w!=='meal' && w!=='workout' && w!=='progress'\) return '';/.test(what),
  'anything but the three answers is treated as unsure');
t(/catch\(e\)\{ return ''; \}/.test(what), 'a reader that throws returns unsure, never a guess');
// THE MEAL PATH IS STILL SACRED: this function may never write a meal.
t(/if\(seen && seen\.what==='meal'\)\{[\s\S]{0,140}return null;/.test(route),
  'a meal photo is handed straight back, still no opinion about food here');

// ---- 3. HE DOES NOT REPEAT HIMSELF ---------------------------------------
t(!/return 'Meal or progress photo\?';/.test(route), 'the old two-option question is gone');
t(/a meal, a progress photo, or a training session\?/.test(route),
  'the question now offers the third thing her photo actually was');
t(/var again=_jimPhotoPendLive\(\);/.test(route), 'he knows he has already asked');
t(/if\(again\) return 'Still not sure/.test(route), '...and says something different the second time');
t(/Or just say what you did and I will log that instead/.test(route),
  '...and offers a way out that does not need the photo');

// ---- what he can do, said out loud ---------------------------------------
// Both surfaces keep HIS sentence - "Your AI logging assistant" - and both now
// name the inputs after it, because "tell me your day" told Lauren nothing
// about the screenshot she was holding.
t(/Tell me your day\. Food, training, a photo or a screenshot/.test(src),
  'the Jim tab names what he takes');
t(/Say what you ate or trained, or send a photo or a screenshot/.test(src),
  'the chat bubble does too, in its own words');
t((src.match(/Your AI logging assistant/g)||[]).length===2,
  'and his own sentence survives on both surfaces');
t(/I cannot open links/.test(src), 'a link he cannot open says so');
t(/Send me the screenshot and I will log it/.test(src),
  '...and names the thing that DOES work, which nobody had ever told her');

console.log(bad? ('tjimphoto: '+bad+' FAILED') : 'tjimphoto: all passed');
process.exit(bad?1:0);
