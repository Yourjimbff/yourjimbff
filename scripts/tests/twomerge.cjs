// ONE DAY, ONE SESSION, FOR A FREE ACCOUNT (Yusuf, 15 Sep, off Nick Santiago's
// feed - two workouts forty-nine seconds apart).
//
// WHAT NICK ACTUALLY DID, read off his own rows rather than guessed at:
//   03:17:11  Push Day   - Incline Dumbbell Press 4 sets @ 150 lbs,
//                          Kettlebell Ab Workouts 3 sets of 10, Sauna 20 minutes
//   03:18:00  Chest Day  - Incline dumbbell press 60 lbs x10 x4,
//                          Pec deck machine 130 lbs x10 x4, Kettlebell ab work
//
// He was not training twice. He was correcting himself and adding what he left
// out, which is how anybody talks. 150 lbs on an incline dumbbell press became
// 60 lbs x 10, which is the number he actually lifted.
//
// THE GUARD THAT EXISTED COULD NOT SEE IT: it blocks an IDENTICAL re-insert
// inside ten seconds. Different title, different description, forty-nine
// seconds. Never a double tap - a second sentence.
//
// And the floor underneath all of it: a log must never be LOST. Every path that
// cannot merge falls through to the ordinary insert.
const fs=require('fs');
const guard=require('./_guard.cjs');
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
let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra!==undefined?('  '+extra):'')); };

eval([fnAt("_woMoveKey"), fnAt('_woSameMove'), fnAt('_woMergeLists'), fnAt('_woMergeDesc')].join('\n'));
guard(['_woMoveKey','_woSameMove','_woMergeLists','_woMergeDesc'], n=>eval(n));

// His two rows, verbatim off the database.
const PUSH = [{name:'Incline Dumbbell Press', detail:'4 sets @ 150 lbs'},
              {name:'Kettlebell Ab Workouts', detail:'3 sets of 10'},
              {name:'Sauna', detail:'20 minutes'}];
const CHEST= [{name:'Incline dumbbell press', detail:'60 lbs x 10, 60 lbs x 10, 60 lbs x 10, 60 lbs x 10'},
              {name:'Pec deck machine', detail:'130 lbs x 10, 130 lbs x 10, 130 lbs x 10, 130 lbs x 10'},
              {name:'Kettlebell ab work', detail:'3 sets x 10'}];

console.log('\n  NICK’S TWO SESSIONS BECOME ONE');
const m=_woMergeLists(PUSH, CHEST);
const names=m.map(e=>e.name);
t(m.length===4, 'four movements, not six', names.join(' | '));
// Said twice under two spellings - one entry, and the LATER telling wins,
// because the later telling is the correction.
t(names.filter(n=>/incline/i.test(n)).length===1, 'the incline press appears once');
t(/60 lbs/.test((m.find(e=>/incline/i.test(e.name))||{}).detail||''),
  'carrying the real weight, not the 150 he said first',
  (m.find(e=>/incline/i.test(e.name))||{}).detail);
t(names.filter(n=>/kettlebell/i.test(n)).length===1, 'the kettlebell work appears once, across two spellings');
t(names.some(n=>/pec deck/i.test(n)), 'the pec deck he added the second time is kept');
t(names.some(n=>/sauna/i.test(n)), 'and the sauna from the first telling is not thrown away');

console.log('\n  CASE AND PUNCTUATION ARE NOT A NEW MOVEMENT');
t(_woMoveKey('Incline Dumbbell Press')===_woMoveKey('incline dumbbell press'), 'case');
// And the other direction, which is the one that must never over-join:
t(_woMergeLists([{name:'Incline dumbbell press'}],[{name:'Incline barbell press'}]).length===2,
  'dumbbell and barbell stay two movements');
t(_woMergeLists([{name:'Leg press'}],[{name:'Leg curl'}]).length===2, 'leg press and leg curl stay two');
t(_woMergeLists([{name:'Squat'}],[{name:'Squats'}]).length===1, 'but a plural is not a new movement');
t(_woMergeLists([{name:'Row'}],[{name:'Rowing machine'}]).length===2,
  'and a three-letter name never swallows a longer one');
t(_woMergeLists([{name:'Squat'}],[{name:'SQUAT!'}]).length===1, 'punctuation');
t(_woMergeLists([{name:'Leg Press'}],[{name:'leg  press'}]).length===1, 'double spaces');
t(_woMergeLists([],[{name:'Squat'}]).length===1, 'an empty first list is fine');
t(_woMergeLists([{name:'Squat'}],[]).length===1, 'and an empty second');
t(_woMergeLists(null,null).length===0, 'and no lists at all');
t(_woMergeLists([{name:''},null,'   '],[{name:'Squat'}]).length===1, 'nameless junk is dropped');

console.log('\n  THE LINE UNDERNEATH MERGES THE SAME WAY');
const d=_woMergeDesc('Incline Dumbbell Press 4 sets @ 150 lbs, Kettlebell Ab Workouts 3 sets of 10, Sauna 20 minutes',
                     'Incline dumbbell press, pec deck machine, kettlebell ab work, sauna');
t(!/150/.test(d) || d.indexOf('60')<0, 'the later telling replaces the earlier for the same movement', d.slice(0,90));
t((d.match(/incline/ig)||[]).length===1, 'and it is not said twice', d.slice(0,90));
t(/pec deck/i.test(d), 'the new movement is in the line');
t(_woMergeDesc('', 'just this')==='just this', 'nothing on one side is fine');
t(_woMergeDesc('a bulleted line', '')==='a bulleted line', 'or the other');

console.log('\n  WHO IT APPLIES TO, AND WHAT IT REFUSES TO DO');
const mi=fnAt('_woMergeIntoToday');
t(/isFreeApp\(code\)/.test(mi), 'free accounts only - a paying client trains twice a day for real');
t(/date_str=eq\./.test(mi), 'the test is the DAY, not the keystroke');
t(/if\(!prev \|\| prev\.id==null\) return null/.test(mi), 'no session yet today: an ordinary insert');
t(/if\(!res\.ok\) return null/.test(mi), 'a patch that fails falls through and logs it rather than losing it');
t(/catch\(e\)\{ return null; \}/.test(mi), 'and so does anything that throws');
const ins=fnAt('insertWorkoutLog');
t(/_woMergeIntoToday\(row\)/.test(ins), 'the one workout door asks first');
t(ins.indexOf('_woMergeIntoToday') < ins.indexOf('var payload = Object.assign'),
  'before it writes a new row, not after');

console.log(bad? ('\n  '+bad+' FAILED') : '\n  all passed');
process.exit(bad?1:0);
