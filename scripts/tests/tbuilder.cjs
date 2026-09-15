// THE BUILDER — picking Push has to hand you a push day, not an empty one.
//
// Yusuf, 15 Sep, on the served build:
//   "when i hit the program page: all it says is: Your program / Build your
//    program / it should go right into their strength and weakness
//    questionnaire ... skipping it lands on the weekly calendar and picking
//    Push silently assigns a workout unseen. it should show a builder with the
//    exercise list."
//   "bad at it 12-15 reps to build connection. moderate 8-12. good at it 4-6
//    hard reps."
//   "first 2-3 exercises hard & maximum effort, compounds only. next 2-4 high
//    connection & intensity accessories. core always available as a finisher."
//
// TWO THINGS THIS GUARDS, and they are different kinds of thing.
// The FIRST is that the lists are his, movement for movement - every name he
// wrote is offered, and a name he did not write is never offered. That is a
// content test and it belongs in text.
// The SECOND is the prescription: what a person who said they are bad at chest
// actually gets when they tap Chest Press. That cannot be read off the source,
// so the real functions are lifted and run.
const fs=require('fs');
const guard=require('./_guard.cjs');
const {closure, defOf}=require('./_lift.cjs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };

// ---- the world the lifted code needs -----------------------------------
let PROF={};
global.window={}; global.profile=PROF;
global.document={ getElementById:()=>null, querySelector:()=>null, body:{getAttribute:()=>''} };
global._obEsc=x=>String(x==null?'':x);

const MINE=['_PB_LIB','_PB_CORE','_PB_REPS','_PB_CAP','_PB_MIN','_pbSets','pbCanBuild',
            '_pbRating','_pbLibRow','_pbReps','_pbSetsFor','_pbRow','_msIntake'];
eval(closure(['EX_LIB']).code||'');
eval(MINE.map(defOf).join('\n'));
guard(MINE, n=>eval(n));
const setProfile=o=>{ PROF=o; global.profile=o; };

console.log('\n  EVERY MOVEMENT HE NAMED IS IN THE LIBRARY:');
/* A builder that offers a name EX_LIB has never heard of writes a day the rest
   of the app cannot read - no history, no group, no swap. Six of his had to be
   added before any of this could be built, so this is the assertion that says
   they are still there. */
const HIS=['Chest Press','Incline Chest Press','Decline Chest Press','Dips','Shoulder Press',
           'Cable Chest Fly','Lateral Raises','Front Raises','Tricep Extension',
           'Pull Downs / Pull Ups','Barbell Row','Deadlift',
           'High Row','Single-Arm Row','Rear Delt Flies','Shrugs',
           'Squat','Hack Squat','Leg Press','Barbell Hip Thrust','Forward Lunges','Walking Lunges',
           'Leg Extension','Hamstring Curl','Calf Raise','Seated Calf Raise','Hip Adduction','Hip Abduction',
           'Sit-Ups','Plank','Side Plank','Cross-Body Sit-Ups','Cable Woodchop','Russian Twists'];
const missing=HIS.filter(n=>!_pbLibRow(n));
t(missing.length===0, 'all '+HIS.length+' of his movements resolve to a real library row', missing.join(', '));

console.log('\n  AND THE BUILDER OFFERS HIS LIST AND NOTHING ELSE:');
const names=o=>o.map(x=>x.n);
t(JSON.stringify(names(_PB_LIB.Push.hard))===JSON.stringify(
   ['Chest Press','Incline Chest Press','Decline Chest Press','Dips','Shoulder Press']),
  'push compounds, in his order', names(_PB_LIB.Push.hard).join(', '));
t(JSON.stringify(names(_PB_LIB.Push.work))===JSON.stringify(
   ['Cable Chest Fly','Lateral Raises','Front Raises','Tricep Extension']),
  'push accessories', names(_PB_LIB.Push.work).join(', '));
t(JSON.stringify(names(_PB_LIB.Pull.hard))===JSON.stringify(
   ['Pull Downs / Pull Ups','Barbell Row','Deadlift']),
  'pull compounds', names(_PB_LIB.Pull.hard).join(', '));
t(JSON.stringify(names(_PB_LIB.Pull.work))===JSON.stringify(
   ['High Row','Single-Arm Row','Rear Delt Flies','Shrugs']),
  'pull accessories', names(_PB_LIB.Pull.work).join(', '));
t(JSON.stringify(names(_PB_LIB.Legs.hard))===JSON.stringify(
   ['Squat','Hack Squat','Leg Press','Barbell Hip Thrust','Forward Lunges','Walking Lunges']),
  'leg compounds', names(_PB_LIB.Legs.hard).join(', '));
t(JSON.stringify(names(_PB_LIB.Legs.work))===JSON.stringify(
   ['Leg Extension','Hamstring Curl','Calf Raise','Seated Calf Raise','Hip Adduction','Hip Abduction']),
  'leg accessories', names(_PB_LIB.Legs.work).join(', '));
t(JSON.stringify(names(_PB_CORE))===JSON.stringify(
   ['Sit-Ups','Plank','Side Plank','Cross-Body Sit-Ups','Cable Woodchop','Russian Twists']),
  'and the core finisher list', names(_PB_CORE).join(', '));

console.log('\n  THE SPLITS HE WROTE, AND THE TWO HE DID NOT:');
t(pbCanBuild('Push') && pbCanBuild('Pull') && pbCanBuild('Legs'), 'his three build');
t(pbCanBuild('Lower'), 'Lower is Legs - he wrote them as one list');
t(pbCanBuild('Upper') && pbCanBuild('Full body'), 'Upper and Full body are his lists joined');
/* NOT A GUESS. He has written no arm list and no cardio list, so the builder
   refuses and pgWakeDo falls back to naming the day. Offering an invented list
   would be putting words in his mouth on the screen that tells a client what
   to train. */
t(!pbCanBuild('Arms'), 'Arms does NOT build - he has not written that list');
t(!pbCanBuild('Cardio'), 'and neither does Cardio');
t(!pbCanBuild(''), 'nor does a session with no name');
/* Composed, never invented: every movement in Upper came from Push or Pull. */
const upper=_pbSets('Upper');
const pool=names(_PB_LIB.Push.hard).concat(names(_PB_LIB.Pull.hard));
t(names(upper.hard).every(n=>pool.indexOf(n)>=0),
  'and nothing appears in Upper that is not already in Push or Pull');

console.log('\n  WHAT THE QUESTIONNAIRE ACTUALLY BUYS YOU:');
/* This is the whole point of the good/bad screen and until now the answers went
   into a program nobody could see them in. */
setProfile({intake_json:JSON.stringify({muscles:{pec_major:'weak', quads:'strong'}})});
t(_pbRating('pec_major')==='weak', 'bad at chest is read back', _pbRating('pec_major'));
t(_pbRating('quads')==='strong', 'good at quads is read back', _pbRating('quads'));
t(_pbRating('triceps')==='none', 'and an unanswered muscle is moderate', _pbRating('triceps'));
const chest=_pbRow('hard', {n:'Chest Press', m:'pec_major'});
const squat=_pbRow('hard', {n:'Squat', m:'quads'});
const press=_pbRow('hard', {n:'Shoulder Press', m:'front_delts'});
t(chest.r==='12-15', 'bad at it -> 12-15 reps, to build connection', chest.r);
t(press.r==='8-12',  'moderate -> 8-12', press.r);
t(squat.r==='4-6',   'good at it -> 4-6 hard reps', squat.r);
/* THE ACCESSORY LADDER IS THE SAME LADDER, FLOORED AT EIGHT. His three numbers
   are a sentence about a compound - "4-6 hard reps" - and four reps of a
   lateral raise is a wasted set, not a heavy one. Direction is kept, the floor
   is not. If he wants his three numbers everywhere, it is _PB_REPS and nothing
   else. */
t(_pbRow('work',{n:'Cable Chest Fly',m:'pec_major'}).r==='12-15', 'a bad accessory is still 12-15');
t(_pbRow('work',{n:'Leg Extension',m:'quads'}).r==='8-10', 'a good accessory floors at 8-10');
t(_pbRow('work',{n:'Lateral Raises',m:'side_delts'}).r==='10-12', 'and a moderate one is 10-12');
/* CORE TAKES THE LIBRARY'S OWN REPS. Half of his list is a hold, and there is
   no rep prescription that covers a plank and a sit-up at once. */
t(_pbRow('core',{n:'Plank',m:'abs'}).r==='AMRAP', 'a plank is still a hold, not four reps');
t(_pbRow('core',{n:'Sit-Ups',m:'abs'}).r==='20', 'and a sit-up keeps its own number');

console.log('\n  AND A ROW ARRIVES READY TO BE A PROGRAM DAY:');
t(chest.s>0 && chest.s<=12 && typeof chest.n==='string' && 'c' in chest && 'v' in chest,
  'name, sets, reps, compound flag and variation - the shape a saved day holds');
/* Dips is filed at 1 set to failure, which is what it is as a finisher. In the
   hard slot it is a compound and takes a compound's sets, via a slot override
   rather than by editing the library row out from under everything else. */
t(_pbLibRow('Dips').s===1, 'the library still has Dips as one set to failure');
t(_pbRow('hard',{n:'Dips',m:'pec_major',s:3}).s===3, 'but in the hard slot it is three');
t(_pbRow('hard',{n:'Chest Press',m:'pec_major'}).v==='Any variation: dumbbell, machine, or smith',
  'and the variation note comes from the library, not retyped here');
setProfile({});
t(_pbRow('hard',{n:'Chest Press',m:'pec_major'}).r==='8-12',
  'somebody who skipped the questionnaire gets the middle of the road');

console.log('\n  HIS CAPS:');
t(_PB_CAP.hard===3 && _PB_MIN.hard===2, 'two or three hard ones');
t(_PB_CAP.work===4 && _PB_MIN.work===2, 'two to four for connection');
t(_PB_CAP.core===2 && _PB_MIN.core===undefined, 'core is capped but never required');

console.log('\n  THE WIRING:');
t(/try\{ if\(pbOpen\(dk, type\)\)\{ _pgWakeAsk=null; renderProgramTab\(\); return; \} \}catch\(e\)\{\}/.test(src),
  'picking a session opens the builder instead of writing an empty day');
t(/_tpPlan\[dk\]=\{type:type, ex:ex\};/.test(src), 'and the day is written with what they chose in it');
t(/function _pgAutoBuild\(\)/.test(src) && /try\{ _pgAutoBuild\(\); \}catch\(e\)\{\}/.test(src),
  'the program tab goes straight in rather than drawing a button that says so');
t(/if\(!window\._pgFreeEmpty\) return;/.test(src),
  'off the same test the card was drawn from, never a second opinion');
t(/if\(_pgTab\(\)!=='Program'\) return;/.test(src),
  'and never because a background repaint touched the host');
t(/if\(document\.getElementById\('msOv'\)\|\|document\.getElementById\('pbOv'\)\) return;/.test(src),
  'and never on top of a sheet that is already open');

console.log(bad?('\n  '+bad+' FAILED'):'\n  all good (his lists, his reps, his caps)');
process.exit(bad?1:0);
