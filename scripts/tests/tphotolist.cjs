// A SCREENSHOT IS A LIST, NOT A HEADLINE (Yusuf, 15 Sep, off Mary
// Ngigi-Mwaniki's log - workout_logs row 1424).
//
//   "there's a screenshot inside of what she did, and that did not make it to
//    the rendering of the actual capture of the workout... it just says workout
//    and, like, hip airplanes, which I don't even know what that is. but
//    there's two other exercises inside of the image that she logged. When
//    someone logs a workout like this, it should take the text and assess the
//    format and put it in our format."
//
// WHAT HER PICTURE ACTUALLY HELD, read off the stored photo: two stacked
// screenshots in one image. Her coach's programme page - Lat bias pulldown
// 2x8-12, Lat bias pulldown 1xAMRAP, then a superset of Dumbbell Seated Lateral
// Raise 2x12-20 and Dumbbell Incline Biceps Curl 2x10-15 - and under it a
// checklist headed LOWER BODY A whose first row reads "Hip Airplane - 2 x 5-8".
// Her log kept the last of those five and threw the other four away.
//
// TWO FAULTS, BOTH IN THE 15 Sep photo route, both fixed:
//   the prompt asked for ONE activity and ONE detail (it was written for a
//   Strava card), and the image was squashed to 900px, at which "Sets: 2 Reps:
//   8-12" in nine-point grey is gone while "Hip Airplane" in big white letters
//   survives - which is exactly the line that came back.
const fs=require('fs');
const guard=require('./_guard.cjs');
const {defOf}=require('./_lift.cjs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+JSON.stringify(x)+']'):'')); };

const MINE=['_jimPhotoExList','_jimPhotoExRow'];
eval(MINE.map(defOf).join('\n'));
guard(MINE, n=>eval(n));

console.log('\n  IT IS ASKED FOR THE WHOLE LIST NOW:');
t(/"exercises":\[\{"name":"<exercise exactly as written>"/.test(src),
  'the reader asks for an exercises array, not one activity');
t(/READ THE ENTIRE IMAGE, TOP EDGE TO BOTTOM EDGE/.test(src),
  'and for every one of them, edge to edge');
/* MEASURED ON HER PHOTO, NOT REASONED ABOUT. The first pass of this prompt got
   four of her five: it read the programme table and ignored the dark checklist
   under it. These two paragraphs are what turned four into five. */
t(/a white \n?app page above and a DARK NOTES PAGE OR CHECKLIST below/.test(src)
  || (/a white /.test(src) && /DARK NOTES PAGE OR CHECKLIST below/.test(src)),
  'it is told her exact case - a white page above, a dark checklist below');
t(/Missing the bottom section is the single most common failure here/.test(src),
  'and told plainly which half it tends to drop');
t(/A checklist row like "\[ \] Hip Airplane - 2 x 5-8" is an exercise/.test(src),
  'her own missing row is the worked example');
/* The prompt is built by concatenation, so a sentence can straddle a string
   break. Matched in halves rather than pretending the source is one line. */
t(/superset - list supersetted exercises separately/.test(src),
  'a superset is two exercises, which is how her picture wrote it');
t(/"title":"<the name of the SESSION, e\.g\. LOWER BODY A or Push Day/.test(src),
  'and it is asked for the session name her picture actually showed');
/* The first pass answered "Training" - the nav header of the app she
   screenshotted, not the name of anything she did. */
t(/NEVER use an app name, a screen name or a navigation header such as "Training"/.test(src),
  'and told that a nav header is not a session name');

console.log('\n  AND IT CAN SEE THE SMALL PRINT:');
/* 1179x2556 capped at 900 put the whole thing at 35%. 1568 is as large as this
   is read at anyway, so nothing is wasted by sending it legible. */
const reader=src.slice(src.indexOf('async function _jimPhotoWhat('), src.indexOf('function _jimPhotoExList('));
t(/downscaleImage\(dataUrl, 1568, 0\.9\)/.test(reader), 'the image goes in at 1568, not 900',
  (reader.match(/downscaleImage\([^)]*\)/)||[])[0]);
t(!/downscaleImage\(dataUrl, 900/.test(reader), 'and the size that lost her four exercises is gone');
t(/max_tokens:1400/.test(reader), 'with room to answer with a list rather than a line');

console.log('\n  HER PICTURE, THROUGH THE CLEANER:');
const HERS=[
  {name:'Lat bias pulldown', did:'2 x 8-12'},
  {name:'Lat bias pulldown', did:'1 x AMRAP'},
  {name:'Dumbbell Seated Lateral Raise', did:'2 x 12-20'},
  {name:'Dumbbell Incline Biceps Curl', did:'2 x 10-15'},
  {name:'Hip Airplane', did:'2 x 5-8'}
];
const got=_jimPhotoExList(HERS);
t(got.length===5, 'all five survive', got.map(x=>x.name));
/* THE SAME MOVEMENT TWICE IS TWO SETS OF IT. Her own picture has Lat bias
   pulldown on two rows with different prescriptions, so a name-only dedupe
   would have thrown one of them away - which is the bug, in miniature. */
t(got[0].name==='Lat bias pulldown' && got[1].name==='Lat bias pulldown',
  'including the same movement twice, because hers is prescribed twice');
t(got[0].did==='2 x 8-12' && got[1].did==='1 x AMRAP', '  with its own numbers each time');
const dup=_jimPhotoExList([{name:'Squat',did:'3 x 8'},{name:'Squat',did:'3 x 8'}]);
t(dup.length===1, 'but the identical row twice IS the model reading one row twice', dup);

console.log('\n  AND NOTHING SILLY GETS IN:');
t(_jimPhotoExList(null).length===0, 'nothing in, nothing out');
t(_jimPhotoExList([{name:''},{name:'   '}]).length===0, 'a row with no name is not an exercise');
t(_jimPhotoExList([{name:'x'.repeat(80), did:'3 x 8'}]).length===0,
  'and a paragraph mistaken for a name is refused');
t(_jimPhotoExList(new Array(40).fill(0).map((_,i)=>({name:'Move '+i}))).length===20,
  'twenty is the cap - past that it is a programme, not a session');

console.log('\n  "2 x 8-12" IS TWO FIELDS, NOT A STRING:');
/* formatExerciseDetail is what every workout card prints an exercise through,
   and it draws "2 × 8-12" from sets and reps. Handed a lump of text it can only
   echo the lump, so a screenshot-read session would look nearly like one Yusuf
   wrote instead of exactly like one. */
t(JSON.stringify(_jimPhotoExRow({name:'Lat bias pulldown', did:'2 x 8-12'}))
  ==='{"name":"Lat bias pulldown","sets":2,"reps":"8-12"}',
  'sets and reps come apart', _jimPhotoExRow({name:'Lat bias pulldown', did:'2 x 8-12'}));
t(_jimPhotoExRow({name:'Lat bias pulldown', did:'1 x AMRAP'}).reps==='AMRAP',
  'AMRAP is a rep target like any other');
t(_jimPhotoExRow({name:'Row', did:'3 \u00d7 10'}).sets===3, 'a real multiplication sign reads too');
t(_jimPhotoExRow({name:'Run', did:'3 miles'}).detail==='3 miles',
  'and anything that is not sets-by-reps is left whole rather than guessed at',
  _jimPhotoExRow({name:'Run', did:'3 miles'}));
t(_jimPhotoExRow({name:'Plank'}).name==='Plank' && _jimPhotoExRow({name:'Plank'}).sets===undefined,
  'a movement with no numbers carries none');
/* The app's own renderer has to agree, or this is a shape only this file knows. */
t(/var rep = \(e\.reps != null\) \? e\.reps : \(e\.detail != null \? e\.detail : null\);/.test(src),
  '  and formatExerciseDetail reads both shapes, which is why either is safe');

console.log('\n  WHAT ACTUALLY GETS WRITTEN:');
const writer=src.slice(src.indexOf('async function _jimPhotoWorkoutReply('), src.indexOf('// ===== THE ROUTE'));
t(/desc=list\.map\(function\(e\)\{ return e\.name\+\(e\.did\?\(' \\u2014 '\+e\.did\):''\); \}\)\.join\('\\n'\);/.test(writer),
  'one exercise per line, which is the format the rest of the app already reads');
t(/if\(list\.length\) row\.exercises=list\.map\(_jimPhotoExRow\);/.test(writer),
  'and the structured array rides along, which wins wherever the app prefers it');
t(/var title=shotTitle \|\| act;/.test(writer),
  'the session name beats the first exercise in it - hers said LOWER BODY A');
t(/list\.length\+' exercise'\+\(list\.length===1\?'':'s'\)/.test(writer),
  'and it says how many it got, so she can see it read the whole picture');
/* The cardio case is what this route was built for and must not have been lost
   on the way to fixing the lifting case. */
t(/desc=det;\s*\n\s*if\(mins && det\.indexOf\(String\(mins\)\)<0\)/.test(writer),
  'a run screen with no exercise list still logs the way it did');

console.log(bad?('\n  '+bad+' FAILED'):'\n  all good (the whole picture, in his format)');
process.exit(bad?1:0);
