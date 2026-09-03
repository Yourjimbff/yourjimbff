// A SESSION THAT IS THERE IS NEVER ANNOUNCED AS LOST (LeAndra M, 12-14 Aug).
//
// The food half of this was fixed for Carly on 1 Sep (tunsure.cjs). The
// workout and weigh-in halves were not, and they are the ones LeAndra
// reported:
//   "I'm having issues with the app not saving my stuff the last couple days"
//   "I don't know if my steps are saving... sometimes they're showing up,
//    sometimes they're not."
// Her workout_logs rows are what a false failure looks like from the outside:
//   12 Aug  Stairmaster 12:26:00  and  Stairmaster 12:26:55   (55s apart)
//   25 Jun  Cardio & Legs x2
//   14 Jun  Upper Pull x2
// A session logged, called lost, and logged again. The duplicate guard is a
// 10-second window, so 55 seconds sails through it.
//
// The chain was identical to Carly's: the POST lands, _sbRowLanded cannot read
// it back in time, insertWorkoutLog answers unconfirmed, and its caller
// (logWorkoutFromOffer) flattened that to null, which jimTurn speaks as
// "That didn't actually save — can you tell me again?"
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(ok,label,extra)=>{ if(!ok) bad++;
  console.log((ok?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };

console.log('  the weigh-in insert now answers the same three things as the other two:');
const wl=/async function insertWeightLog\(row\)\{[\s\S]*?\n\}\n/.exec(src)[0];
t(/var _wtPosted = attempt\.ok/.test(wl),      'it keeps the POST result before read-back can overwrite it');
t(/_rbwt===null/.test(wl),                     'it tells an unreachable read from an empty one');
t(/read-back unreachable/.test(wl),            'and says unreachable, not "found no row"');
t(/unconfirmed:true/.test(wl),                 'a landed-but-unverified write answers unconfirmed');
t(!/if\(!\(await _sbRowLanded\('weight_logs'/.test(wl), 'the old truthiness check is gone');

console.log('\n  the workout caller keeps the distinction the writer made:');
const lw=src.slice(src.indexOf('async function logWorkoutFromOffer'));
const lw2=lw.slice(0,7000);
t(/attempt\.unconfirmed/.test(lw2),             'unconfirmed is read, not thrown away');
t(/window\.__jimWoUnsure/.test(lw2),            'and carried out on the turn where the reply can read it');
t(/return null;/.test(lw2),                     'still null — nothing here claims a verified save');
t(!/if\(!attempt\.ok\) return null;/.test(lw2), 'the flat collapse is gone');

console.log('\n  and the tap-to-done board keeps it too:');
const tap=src.slice(src.indexOf('// insertWorkoutLog drops any column the schema is missing'));
const tap2=tap.slice(0,1600);
t(/_tapUnsure/.test(tap2),                      'the board asks whether the write merely went unverified');
t(/do not log it again/i.test(tap2),            'and says so rather than asking for it a second time');
t(/Could not log/.test(tap2),                   'a write that never landed still says it plainly');

console.log('\n  and so does the weigh-in caller:');
const lwt=src.slice(src.indexOf('var attempt = await insertWeightLog(row);'));
const lwt2=lwt.slice(0,1400);
t(/window\.__jimWtUnsure/.test(lwt2),           'a weigh-in carries its unsure write too');
t(/return false;/.test(lwt2),                   'still false — false means not verified');

console.log('\n  both lists are reset with the rest of the turn state:');
t(/window\.__jimWoUnsure=\[\]/.test(src),       'workouts');
t(/window\.__jimWtUnsure=\[\]/.test(src),       'weigh-ins');

console.log('\n  and the sentence is the true one:');
t(/_woAllUnsure/.test(src),                     'the workout reply asks whether every shortfall was an unsure write');
t(/_woUnsure\.length >= \(_woExpected-_woVerified\)/.test(src), 'every one of them, not merely one');
t(/_wtAllUnsure/.test(src),                     'the weigh-in reply asks the same question');
t(/_wtUnsure\.length >= \(_wtExpected-_wtVerified\)/.test(src), 'and counts them the same way');
const woTail=src.slice(src.indexOf('var _woAllUnsure'), src.indexOf('var _woAllUnsure')+1400);
t(/Do not log it again, it is there/.test(woTail), 'the uncertain line tells her NOT to log it twice');
t(/\} else \{[\s\S]*didn't actually save/.test(woTail), 'a genuinely lost session still gets the failure line');
const wtTail=src.slice(src.indexOf('var _wtAllUnsure'), src.indexOf('var _wtAllUnsure')+1200);
t(/Do not log it again, it is there/.test(wtTail), 'same for a weigh-in');
t(/\} else \{[\s\S]*tell me your weight again/.test(wtTail), 'and the same honest failure line survives');

console.log(bad? ('\n'+bad+' FAILED') : '\nall pass');
process.exit(bad?1:0);
