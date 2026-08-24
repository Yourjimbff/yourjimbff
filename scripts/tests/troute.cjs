// THE ROUTING PROOF — permanent, by his ruling (24 Aug, the strip, ship 1).
//
// A client's plain log sentence must reach the ENGINE. It must never be taken
// away from the logger by the calendar on the way. That is the bug a real
// client hit, and this suite is the thing that stops it coming back: a widening
// of the calendar's claim that swallows a log sentence turns this list red.
//
// Kept as SENTENCES, not shapes. Every line below is the kind of thing someone
// actually says into the box; a test written against a regex would agree with
// the regex, which is exactly how the earlier steps hole survived its own tests.
const fs=require('fs');
const L=fs.readFileSync('index.html','utf8').split('\n');
function grab(p){ const a=L.findIndex(p); let b=a; while(L[b]!=='}') b++; return L.slice(a,b+1).join('\n'); }
function multi(sw){ const a=L.findIndex(l=>l.trim().startsWith(sw)); let b=a; while(!/;\s*$/.test(L[b])) b++; return L.slice(a,b+1).join('\n'); }
eval([
  multi('var _JT_SCHED_INTENT_RE=new RegExp('),
  multi('var _JT_PAST_MEAL_RE=new RegExp('),
  multi('var _JIM_CAL_PUT_RE=new RegExp('),
  grab(l=>l.startsWith('function _jimHarvestSteps(')),
  grab(l=>l.startsWith('function _jimHarvestWeight(')),
  grab(l=>l.startsWith('function _jimCalendarAsked(')),
].join('\n'));
require('./_guard.cjs')(['_JIM_CAL_PUT_RE','_JT_PAST_MEAL_RE','_JT_SCHED_INTENT_RE','_jimCalendarAsked','_jimHarvestSteps','_jimHarvestWeight'], function(n){ return eval(n); });

// Twenty ordinary log sentences. Every one of these must reach the engine.
const LOGS=[
  'Can you update my steps for today to 7,250',
  'Log my steps for today at 7,250',
  'I did a 30 minute walk after eating dinner at 7',
  'post meal walk at 10:45',
  'I did a walk at lunch',
  'went for a walk on my break',
  'did my workout at 6 this morning',
  'finished training at 7am',
  'leg day at the gym, squats 315 for 5',
  'my workout at home today was chest press and push ups',
  'cardio at 6am done',
  'I did yoga at 7',
  'pilates at 9 was tough',
  'walk at the park, 45 minutes',
  'had a class at 6 and it wrecked me',
  'I ate lunch at noon',
  'chicken and rice for lunch at 1',
  'bench 185 for 8 8 6 then incline dumbbell press',
  '8000 steps yesterday',
  'scale said 198 this morning',
];
// Eight plain scheduling requests. Every one of these must reach the calendar.
const CAL=[
  'put Pilates at 6am on Tuesdays',
  'schedule my walk for tomorrow at 6am',
  'move my workout Thursday to one',
  'remind me to train at 6 every day',
  'book me in for pilates Thursday at 9',
  'cancel my Tuesday walk',
  'set up a walk every morning at 7',
  'from now on my lunch is at noon',
];
// A report wearing a scheduling word is still a report — the veto, on its own.
const VETO=[
  'I had lunch at 1 every day this week',
  'I ate 300 calories and set up my gym bag',
  'I hit 9,000 steps every day this week',
  'I weighed 198 and moved my walk to the evening',
];

let bad=0;
const t=(pass,label,s)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+'  '+JSON.stringify(s)); };

console.log('  twenty ordinary log sentences must reach the ENGINE:');
LOGS.forEach(s=>t(_jimCalendarAsked(s)===false, 'engine  ', s));
console.log('\n  eight plain scheduling requests must reach the CALENDAR:');
CAL.forEach(s=>t(_jimCalendarAsked(s)===true, 'calendar', s));
console.log('\n  a report wearing a scheduling word still LOGS:');
VETO.forEach(s=>t(_jimCalendarAsked(s)===false, 'engine  ', s));

console.log(bad? '\n'+bad+' FAILED' : '\nall '+(LOGS.length+CAL.length+VETO.length)+' pass');
process.exit(bad?1:0);
