// A CONNECTION GOES ON THE MOVEMENT HE NAMED — permanent (24 Aug).
//
// Two faults, both worse than losing the remark, because a wrong record looks
// exactly like a real one:
//   · a remark said BEFORE its movement attached to the previous one;
//   · two movements whose names end in the same word resolved to one position,
//     so one owned an empty span and the next swallowed the sentence.
//
// THE RULE WHEN IT CANNOT TELL IS SILENCE. A word two movements could answer to
// names neither of them; a word appearing twice names neither; a remark naming
// two movements attaches to neither.
const fs=require('fs');
const L=fs.readFileSync('index.html','utf8').split('\n');
function grab(p){ const a=L.findIndex(p); let b=a; while(L[b]!=='}') b++; return L.slice(a,b+1).join('\n'); }
function multi(sw){ const a=L.findIndex(l=>l.trim().startsWith(sw)); let b=a; while(!/;\s*$/.test(L[b])) b++; return L.slice(a,b+1).join('\n'); }
eval([
  multi('var _JIM_CONN_RE=new RegExp('),
  grab(l=>l.startsWith('function _jimConnLevel(')),
  grab(l=>l.startsWith('function _jimConnByExercise(')),
].join('\n'));
require('./_guard.cjs')(['_JIM_CONN_RE','_jimConnByExercise','_jimConnLevel'], function(n){ return eval(n); });
let bad=0;
const t=(got,want,label)=>{ const ok=JSON.stringify(got)===JSON.stringify(want); if(!ok) bad++;
  console.log((ok?'  ok    ':'  FAIL  ')+label+'  -> '+JSON.stringify(got)+(ok?'':'   (wanted '+JSON.stringify(want)+')')); };

console.log('  THE TWO REPORTED FAULTS:');
// 1. The remark is said BEFORE the movement, and names it.
t(_jimConnByExercise(
  'push day. bench press 185 for 8. incline press 60s for 10. i had a great connection with the cable flys today, 3 sets of 12.',
  ['Bench Press','Incline Press','Cable Flys']),
  {'Cable Flys':'felt'}, 'remark first, names cable flys');
// 2. Two movements sharing a last word must not collide.
t(_jimConnByExercise(
  'shoulder press 60s for 10, great connection, then bench press 185 for 8',
  ['Shoulder Press','Barbell Bench Press']),
  {'Shoulder Press':'felt'}, 'shared last word, remark on the shoulder press');

console.log('\n  WHAT ALREADY WORKED, AND STILL MUST:');
t(_jimConnByExercise('bench press 185 for 8, great connection, then incline press 60s for 10',
  ['Bench Press','Incline Press']), {'Bench Press':'felt'}, 'remark after, first movement');
t(_jimConnByExercise('bench press 185 for 8, then incline press 60s for 10, felt it a bit',
  ['Bench Press','Incline Press']), {'Incline Press':'partial'}, 'remark after, last movement');
t(_jimConnByExercise('squats 315 for 5, no connection, then leg press 400 for 10, great connection',
  ['Squats','Leg Press']), {'Squats':'nothing','Leg Press':'felt'}, 'a remark on each, middle and last');
t(_jimConnByExercise('bench press 185 for 8, extremely heavy', ['Bench Press']),
  {}, 'intensity is not connection');
t(_jimConnByExercise('bench press 185 for 8, great connection', ['Barbell Bench Press']),
  {'Barbell Bench Press':'felt'}, 'abbreviated name, nothing competing');

console.log('\n  AND WHEN IT CANNOT TELL, IT ATTACHES NOTHING:');
t(_jimConnByExercise('press 185 for 8, great connection', ['Bench Press','Shoulder Press']),
  {}, 'two movements want the same word');
t(_jimConnByExercise('great connection today', ['Bench Press']),
  {}, 'a remark with no movement anywhere before it');
t(_jimConnByExercise('bench press, cable flys, great connection on both',
  ['Bench Press','Cable Flys']), {'Cable Flys':'felt'},
  'a remark about "both" records the one just said, not both');
// STATED LIMIT, not an oversight. "on both" is a true remark about two
// movements, and it lands on the one he had just said. That is INCOMPLETE, not
// WRONG — the record it writes is one he actually made. Spreading it to every
// preceding movement would mean reading "both" and guessing how far back it
// reaches, which is the invention this file refuses; attaching nothing would
// throw away a remark he did make. Recorded here so the choice is visible.
t(_jimConnByExercise('bench press and cable flys great connection on both',
  ['Bench Press','Cable Flys']), {},
  'and with no clause break, two movements in one remark attaches nothing');
t(_jimConnByExercise('did a workout', ['Bench Press']), {}, 'no remark at all');
t(_jimConnByExercise('', ['Bench Press']), {}, 'nothing said');

console.log(bad? '\n'+bad+' FAILED' : '\nall pass');
process.exit(bad?1:0);
