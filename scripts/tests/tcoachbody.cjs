// THE COACH HAS A BODY TOO (Yusuf, 16 Sep): "can i have the program page for
// myself on thegoat?"
//
// He could not. loadClientAssignedProgram opened with a blanket return for any
// trainer, so his own programme was never fetched and his own workout card was
// hidden on his own Day tab.
//
// AND EVERY PIECE WAS ALREADY THERE, read off the database the same day: a
// profile row reading 166 lb against a goal of 175, phase build, seven days a
// week, assigned_program_id 5, one active row in programs and one saved week in
// training_plans. He had done the setup. One line decided he was staff instead
// of a person and threw all of it away.
//
// WHAT THIS GUARDS. That the line is gone, that nothing else re-introduces it,
// and - the part that would actually hurt if it broke - that a trainer with NO
// programme still ends up with an empty surface rather than somebody else's.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };

const fn=src.slice(src.indexOf('async function loadClientAssignedProgram(){'),
                   src.indexOf('async function loadClientAssignedProgram(){')+3200);

console.log('\n  HE LOADS HIS OWN PROGRAMME:');
t(!/if\(typeof isTrainer==='function' && isTrainer\(cl\.code\)\)\{ hideClientAssignedProgramSection\(\)/.test(src),
  'the blanket trainer return is gone');
t(!/isTrainer\(cl\.code\)/.test(fn.slice(0, fn.indexOf('clientAssignedProgram = null;'))),
  '  and nothing else turns him away at the door');
t(/if\(!cl\) return;/.test(fn), 'a signed-out session still returns, which is the one real guard');

console.log('\n  AND THE HIDES STILL HAPPEN:');
/* They used to run inside the return. They have to keep running on the way in,
   or a trainer with no programme keeps whatever was on screen before. */
const head=fn.slice(0, fn.indexOf('if(!programDisplayEnabled())'));
t(/clientAssignedProgram = null;/.test(head), 'the programme is cleared first');
t(/todayProgramWorkout = null;/.test(head), 'and so is today\'s workout');
t(/hideTodayWorkoutCard\(\);/.test(head), 'the workout card is hidden before the fetch');
t(/hideClientAssignedProgramSection\(\);/.test(head), 'and so is the programme section');

console.log('\n  HIS OWN ROW IS WHAT IT READS:');
t(/profiles\?client_code=eq\.'\+encodeURIComponent\(cl\.code\)/.test(fn),
  'it asks for the signed-in code, never a hardcoded one');
t(/assigned_program_id/.test(fn), 'and takes the programme his profile names');
/* His profile names one (5), so this never fires for him. It matters that it
   stays BELOW the real lookup: a trainer whose profile names a programme must
   get that one, not the men's template. */
t(fn.indexOf('assignedId = profs[0].assigned_program_id') < fn.indexOf('templatePrograms.men'),
  'the template fallback stays below the real lookup, so his own programme wins');

console.log('\n  AND HE IS NOT SOLD TO:');
/* The consult card is free-app only and he is not a free account - checked the
   same day, clients.is_free_app is false for thegoat. Worth a test because the
   card lives on the same tab this change lights up. */
t(/if\(!_meFreeApp\(\)\) return '';/.test(src), 'the Program tab card is still free-app only');

console.log(bad?('\n  '+bad+' FAILED'):'\n  all good (he gets his own programme, like anybody else with one)');
process.exit(bad?1:0);
