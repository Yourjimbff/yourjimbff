const fs=require('fs');
const L=fs.readFileSync('index.html','utf8').split('\n');
function grab(p){ const a=L.findIndex(p); let b=a; while(L[b]!=='}') b++; return L.slice(a,b+1).join('\n'); }
function multi(sw){ const a=L.findIndex(l=>l.trim().startsWith(sw)); let b=a; while(!/;\s*$/.test(L[b])) b++; return L.slice(a,b+1).join('\n'); }
eval([multi('var _JT_CAL_RE=new RegExp('), multi('var _JT_PAST_MEAL_RE=new RegExp('),
 multi('var _JT_SCHED_INTENT_RE=new RegExp('), multi('var _JIM_CARDIO_RE=new RegExp('),
 multi('var _JIM_WO_RE=new RegExp('), multi('var _JIM_MEALREL_RE=new RegExp('),
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

console.log('\n  his walk after dinner:');
t('a walk is a session', _jimLooksLikeWorkout('I did a 30 minute walk After eating dinner'), true);
t('titled his way',      _jimMealRelTitle('I did a 30 minute walk After eating dinner'), 'Post Dinner Walk');
t('other order still',   _jimMealRelTitle('post meal walk at 10:45'), 'Post Meal Walk');
t('not a meal-relative', _jimMealRelTitle('I walked the dog'), '');
console.log(bad? '\n'+bad+' FAILED' : '\nall pass');
process.exit(bad?1:0);
