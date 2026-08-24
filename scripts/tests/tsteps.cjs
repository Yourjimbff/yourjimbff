const fs=require('fs');
const L=fs.readFileSync('index.html','utf8').split('\n');
function grab(p){ const a=L.findIndex(p); let b=a; while(L[b]!=='}') b++; return L.slice(a,b+1).join('\n'); }
function multi(sw){ const a=L.findIndex(l=>l.trim().startsWith(sw)); let b=a; while(!/;\s*$/.test(L[b])) b++; return L.slice(a,b+1).join('\n'); }
eval([multi('var _JT_CAL_RE=new RegExp('), multi('var _JT_PAST_MEAL_RE=new RegExp('),
 multi('var _JT_SCHED_INTENT_RE=new RegExp('), multi('var _JIM_CARDIO_RE=new RegExp('),
 multi('var _JIM_SESSION_DAY ='), multi('var _JIM_WO_RE=new RegExp('), multi('var _JIM_MEALREL_RE=new RegExp('),
 multi('var _JIM_MEALREL2_RE=new RegExp('),
 grab(l=>l.startsWith('function _titleCap(')), grab(l=>l.startsWith('function _jtCalendarClaims(')),
 grab(l=>l.startsWith('function _jimHarvestSteps(')), grab(l=>l.startsWith('function _jimLooksLikeWorkout(')),
 grab(l=>l.startsWith('function _jimMealRelTitle('))].join('\n'));
let bad=0; const t=(l,g,w)=>{const ok=JSON.stringify(g)===JSON.stringify(w); if(!ok)bad++; console.log((ok?'  ok    ':'  FAIL  ')+l+'  -> '+JSON.stringify(g)+(ok?'':'   (wanted '+JSON.stringify(w)+')'));};

console.log('  the real client\'s two sentences must NOT go to the calendar:');
t('update my steps',  _jtCalendarClaims('Can you update my steps for today to 7,250'), false);
t('log my steps',     _jtCalendarClaims('Log my steps for today at 7,250'), false);
console.log('  and a real calendar sentence still must:');
t('pilates tuesdays', _jtCalendarClaims('put Pilates at 6am on Tuesdays'), true);

console.log('\n  steps harvested BOTH ways round:');
t('word first, his',  _jimHarvestSteps('Log my steps for today at 7,250'), 7250);
t('update to',        _jimHarvestSteps('Can you update my steps for today to 7,250'), 7250);
t('number first',     _jimHarvestSteps('I walked 9,000 steps'), 9000);
t('plain',            _jimHarvestSteps('steps 8000'), 8000);
t('not a step count', _jimHarvestSteps('steps were fine, I ate 300 calories'), null);
t('no steps at all',  _jimHarvestSteps('I had eggs'), null);
// The figure can sit further from the word than one filler (24 Aug). The list
// stays a WHITELIST, which is what keeps the two refusals above intact.
t('a week between',   _jimHarvestSteps('my steps every day this week were 9,000'), 9000);
t('averaged',         _jimHarvestSteps('steps averaged 8,400 this week'), 8400);
t('so far today',     _jimHarvestSteps('steps so far today 6,200'), 6200);
t('still refuses',    _jimHarvestSteps('steps every day were solid, I ate 300 calories'), null);

console.log('\n  his walk after dinner:');
t('a walk is a session', _jimLooksLikeWorkout('I did a 30 minute walk After eating dinner'), true);
t('titled his way',      _jimMealRelTitle('I did a 30 minute walk After eating dinner'), 'Post Dinner Walk');
t('other order still',   _jimMealRelTitle('post meal walk at 10:45'), 'Post Meal Walk');
t('not a meal-relative', _jimMealRelTitle('I walked the dog'), '');
// ===== STEPS TAKE A NAMED DAY (ship 2) ==================================
// The day chain itself: what he SAID, turned into a real date. Same two
// functions the write runs through, in the same order.
eval([grab(l=>l.startsWith('function _dateStrDaysAgo(')),
      L[L.findIndex(l=>l.startsWith('var _JIM_DAY_MAX='))]].join('\n'));
const dsBack=(n)=>_dateStrDaysAgo(n);
console.log('\n  the day he named becomes a real date:');
t('yesterday differs from today', dsBack(1)!==dsBack(0), true);
t('two days back differs again',  dsBack(2)!==dsBack(1), true);
// (Reading "yesterday" out of the sentence is _jimAnchorDay's job and is
// already proved in tgate.cjs — not restated here.)

// AND THE WIRING, structurally — this is the bug itself, so it gets a guard.
// The write and its read-back must use the RESOLVED day, never the day the app
// happens to be showing. A regression here is silent on every other test.
const src=fs.readFileSync('index.html','utf8');
// The ENGINE's steps write specifically — `_forCode||cl.code` is unique to it.
// The other step_logs writers in this file are tap surfaces (the tile, the
// steps sheet), which correctly save the day they were opened on.
const upsert=(src.match(/sbUpsert\('step_logs', \{client_code:\(_forCode\|\|cl\.code\)[^\n]*/)||[''])[0];
const readback=(src.match(/step_logs\?client_code=eq\.'\+encodeURIComponent\(_stepCode\)[\s\S]{0,160}/)||[''])[0];
console.log('\n  the write and its read-back use the resolved day:');
t('write not on the screen day',    /date_str:_stepDate/.test(upsert), true);
t('write never uses todayDateStr',  /todayDateStr/.test(upsert), false);
t('read-back on the same day',      /encodeURIComponent\(_stepDate\)/.test(readback), true);
t('read-back never todayDateStr',   /todayDateStr/.test(readback), false);

console.log(bad? '\n'+bad+' FAILED' : '\nall pass');
process.exit(bad?1:0);
