const fs=require('fs');
const L=fs.readFileSync('index.html','utf8').split('\n');
function grab(p){ const a=L.findIndex(p); let b=a; while(L[b]!=='}') b++; return L.slice(a,b+1).join('\n'); }
function blk(sw){ const a=L.findIndex(l=>l.startsWith(sw)); let b=a; while(!L[b].startsWith('};')) b++; return L.slice(a,b+1).join('\n'); }
function one(sw){ return L[L.findIndex(l=>l.startsWith(sw))]; }
function multi(sw){ const a=L.findIndex(l=>l.trim().startsWith(sw)); let b=a; while(!/;\s*$/.test(L[b])) b++; return L.slice(a,b+1).join('\n'); }
const EX_LIB=eval('('+blk('var EX_LIB').replace(/^var EX_LIB\s*=\s*/,'').replace(/;\s*$/,'')+')');
const EX_ALIAS=eval('('+blk('var EX_ALIAS').replace(/^var EX_ALIAS\s*=\s*/,'').replace(/;\s*$/,'')+')');
const FOREARM_EX={}, FIN_GROUP={};
global.EX_LIB=EX_LIB; global.EX_ALIAS=EX_ALIAS; global.FOREARM_EX=FOREARM_EX; global.FIN_GROUP=FIN_GROUP;
eval([grab(l=>l.startsWith('function _exCanonical(')), grab(l=>l.startsWith('function _bfGroupOf(')),
 one('var _JIM_SPLIT_OF='), multi('var _JIM_SPLIT_RE=new RegExp('),
 multi('var _JIM_NAMED_DAY_RE=new RegExp('), grab(l=>l.startsWith('function _jimTitleFromWords(')),
 grab(l=>l.startsWith('function _titleCap(')), grab(l=>l.startsWith('function _jimWorkoutTitleFor(')), grab(l=>l.startsWith('function _jimSplitFromExercises(')),
 multi('var _JIM_CONN_RE=new RegExp('), grab(l=>l.startsWith('function _jimConnLevel(')),
 grab(l=>l.startsWith('function _jimConnByExercise('))].join('\n'));
require('./_guard.cjs')(['_JIM_CONN_RE','_JIM_NAMED_DAY_RE','_JIM_SPLIT_OF','_JIM_SPLIT_RE','_bfGroupOf','_exCanonical','_jimConnByExercise','_jimConnLevel','_jimSplitFromExercises','_jimTitleFromWords','_jimWorkoutTitleFor','_titleCap'], function(n){ return eval(n); });
let bad=0; const t=(l,g,w)=>{const ok=JSON.stringify(g)===JSON.stringify(w); if(!ok)bad++; console.log((ok?'  ok    ':'  FAIL  ')+l+'  -> '+JSON.stringify(g)+(ok?'':'   (wanted '+JSON.stringify(w)+')'));};

// HIS PUSH DAY, the real one off his programme
t('his push day', _jimSplitFromExercises(['Chest Press','Incline Chest Press','Shoulder Press','Lateral Raises','Tricep Extension','Push-Ups']), 'Push Day');
t('pull only',    _jimSplitFromExercises(['Barbell Row','Pull Downs / Pull Ups','Dumbbell Bicep Curls']), 'Pull Day');
t('legs only',    _jimSplitFromExercises(['Squat','Leg Press','Hamstring Curl']), 'Leg Day');
t('push + pull',  _jimSplitFromExercises(['Chest Press','Barbell Row']), 'Push & Pull');
t('push + legs',  _jimSplitFromExercises(['Chest Press','Squat']), 'Push & Legs');
t('all three -> no honest name', _jimSplitFromExercises(['Chest Press','Barbell Row','Squat']), '');
t('core does not decide', _jimSplitFromExercises(['Chest Press','Push-Ups']), 'Push Day');
t('nothing known', _jimSplitFromExercises(['Zercher Good Morning']), '');
t('empty', _jimSplitFromExercises([]), '');

console.log('\n  connection, only where he spoke:');
const said="chest press extremely heavy, great connection. incline chest press felt it a bit. lateral raises 3 sets of 12. tricep extension no connection";
t('per exercise', _jimConnByExercise(said, ['Chest Press','Incline Chest Press','Lateral Raises','Tricep Extension']),
  {'Chest Press':'felt','Incline Chest Press':'partial','Tricep Extension':'nothing'});
t('intensity is not connection', _jimConnLevel('extremely heavy'), '');
t('nothing said', _jimConnByExercise('chest press 3 sets of 8', ['Chest Press']), {});
console.log('\n  his words only when they were a NAME:');
t('he said push day', _jimWorkoutTitleFor('push day, bench 185 for 8', ['Chest Press']), 'Push Day');
t('body part inside an exercise does NOT win',
  _jimWorkoutTitleFor('chest press extremely heavy, lateral raises, tricep extension',
    ['Chest Press','Lateral Raises','Tricep Extension']), 'Push Day');
t('nothing known, his word is the last resort',
  _jimWorkoutTitleFor('legs felt strong', []), 'Legs');
console.log(bad? '\n'+bad+' FAILED' : '\nall pass');
process.exit(bad?1:0);
