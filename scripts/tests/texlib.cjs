// WHAT A REAL GYM HAS, AND WHAT THE LIBRARY HAD.
//
// Yusuf, 12 Sep: "I have a lot of exercises in there. I'm not sure which ones I
// don't have. You're welcome to find out, maybe compare my exercise database to
// maybe what every gym has. I believe I have everything though."
//
// He had 49 movements and no DEADLIFT of any kind - the first thing a lifter
// looks for. Also missing: back extension, skull crushers, close-grip bench,
// hip adduction, plank, cable crunch, ab wheel, farmer's carry, front and hack
// squat, step-ups, good mornings, the nordic/GHR, pec deck, chest-supported
// row, arnold press, upright row, front raises - and "Calves" was one entry for
// two muscles (a straight knee is the gastroc, a bent knee is the soleus).
//
// THE OLD NAMES ALL STILL RESOLVE. Nothing stored is ever rewritten - see the
// alias map's own note - so a week that already says "Calves" keeps working.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const {closure}=require('./_lift.cjs');
let bad=0; const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };

const CL=closure(['EX_LIB','EX_MUSCLE','EX_ALIAS','_bfGroupOf','_bfMuscleOf','_exCanonical','_bfMuscleSay','_titleCap','FOREARM_EX','FIN_GROUP']);
t(!CL.unparsable || !CL.unparsable.length, 'the library lifted cleanly', JSON.stringify(CL.unparsable||[]));
global.window={};
eval(CL.code||'');

const all=[]; Object.keys(EX_LIB).forEach(g=>EX_LIB[g].forEach(e=>all.push(e)));
const names=all.map(e=>e.n);

console.log('\n  THE GAPS ARE CLOSED:');
[['Deadlift','the one that was missing and gets noticed first'],
 ['Chest-Supported Row','a row with your chest on the pad'],
 ['Back Extension','every gym has the bench'],
 ['Skull Crushers','the tricep staple'],
 ['Close-Grip Bench Press','pressing for triceps'],
 ['Machine Chest Fly','the pec deck'],
 ['Arnold Press',''],['Front Raises',''],['Upright Row',''],['Face Pulls',''],
 ['Front Squat',''],['Hack Squat',''],['Goblet Squat',''],['Step-Ups',''],
 ['Good Mornings',''],['Nordic Curl','the hamstring one nobody has'],
 ['Hip Adduction','he had abduction and not its opposite'],
 ['Standing Calf Raise','straight knee'],['Seated Calf Raise','bent knee'],
 ['Plank',''],['Side Plank',''],['Cable Crunch',''],['Ab Wheel',''],
 ['Farmer’s Carry','grip and traps']].forEach(function(pair){
  t(names.indexOf(pair[0])>=0, pair[0]+(pair[1]?(' — '+pair[1]):''));
});

console.log('\n  NOTHING THAT WAS THERE IS GONE:');
['Chest Press','Squat','Romanian Deadlift','Pull Downs / Pull Ups','Calf Raise',
 'Rear Delt Flies','Ab Workout','Barbell Hip Thrust','Shrugs','Dips'].forEach(function(n){
  t(names.indexOf(n)>=0, n+' is still there');
});
t(names.length>=72, 'the library grew rather than moved', String(names.length));
t(new Set(names).size===names.length, 'and no movement is listed twice',
  names.filter((n,i)=>names.indexOf(n)!==i).join(','));

console.log('\n  EVERY MOVEMENT IS COMPLETE:');
const bads=all.filter(e=>!e.n || e.s==null || !e.r || (e.c!==0 && e.c!==1) || typeof e.v!=='string');
t(bads.length===0, 'each one carries a name, sets, reps, a compound flag and a variation note',
  bads.map(e=>e.n).join(','));

console.log('\n  AND EVERY ONE KNOWS ITS GROUP AND ITS MUSCLE:');
const nogroup=names.filter(n=>!_bfGroupOf(n));
t(nogroup.length===0, 'every movement resolves to a group', nogroup.join(','));
const saysitself=names.filter(n=>_bfMuscleOf(n)===n);
t(saysitself.length===0, 'and none of them prints its own name where the muscle goes',
  saysitself.join(','));
t(_bfMuscleOf('Deadlift')==='Whole Posterior Chain', 'Deadlift → Whole Posterior Chain', _bfMuscleOf('Deadlift'));
t(_bfMuscleOf('Standing Calf Raise')==='Calves' && _bfMuscleOf('Seated Calf Raise')==='Soleus',
  'and the two calf raises are told apart',
  _bfMuscleOf('Standing Calf Raise')+' / '+_bfMuscleOf('Seated Calf Raise'));

console.log('\n  HOW PEOPLE ACTUALLY SPELL THEM STILL LANDS:');
[['deadlifts','Deadlift'],['trap bar deadlift','Deadlift'],['skullcrushers','Skull Crushers'],
 ['t-bar row','Chest-Supported Row'],['hyperextension','Back Extension'],
 ['pec deck','Machine Chest Fly'],['calf raises','Calf Raise'],['calves','Calf Raise'],
 ['ghr','Nordic Curl'],['adduction','Hip Adduction'],['planks','Plank'],
 ['ab rollout','Ab Wheel'],['farmers carry','Farmer’s Carry']].forEach(function(p){
  t(_exCanonical(p[0])===p[1], '"'+p[0]+'" → '+p[1], _exCanonical(p[0]));
});

console.log(bad? '\n  '+bad+' FAILED\n' : '\n  all good ('+names.length+' movements)\n');
process.exit(bad?1:0);
