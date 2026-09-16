// A PICTURE IS NOT AN ANGLE, AND THE APP WAS SAYING OTHERWISE (Yusuf, 16 Sep).
//
//   "This photo still says progress photo. It should be something else -
//    because it's also not front."
//
// Two faults, one card. The row he was looking at is a screenshot somebody
// imported, filed before imports were recognised as their own thing, so it
// reads "Progress photo". And it says "Front" - which nobody ever chose. The
// upload sheet arrived with Front already lit in gold and wrote it whether or
// not anybody touched the question, so EVERY photo row on the app carries a
// "Front" that means nothing, and the feed printed it back as though it had
// been told.
//
// WHAT AN UNANSWERED QUESTION IS WORTH. Less than nothing, when it looks like
// an answer. A default that fills in a claim on somebody's behalf is worse than
// a blank, because a blank is honest and cannot be argued with.
//
// AND NOTHING ON THE ROW CAN FIX ITSELF. A screenshot and a photo of somebody's
// back are the same shape in that table - a picture, a date, an angle. There is
// no honest inference here, so the fix is a hand: one tap, in the feed, where
// the mistake is actually visible.
const fs=require('fs');
let bad=0;
const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };

const srv=fs.readFileSync('netlify/functions/trainer.js','utf8');
const app=fs.readFileSync('index.html','utf8');

// ===== THE DOOR OP, RUN FOR REAL =======================================
console.log('\n  THE HAND THE DOOR GIVES HIM:');
eval(srv.split('\n').filter(l=>/^function (str|num)\(/.test(l)).join('\n'));
const opSrc=srv.slice(srv.indexOf('  photoRelabel: (a) => {'), srv.indexOf('\n  },', srv.indexOf('  photoRelabel: (a) => {'))+5);
t(opSrc.length>0, 'photoRelabel exists in trainer.js');
const photoRelabel=eval('('+opSrc.replace(/^\s*photoRelabel:\s*/,'').replace(/,\s*$/,'')+')');

const r1=photoRelabel({id:141, angle:'Update'});
t(r1.method==='PATCH', 'it is a PATCH', r1.method);
t(r1.path==='progress_photos?id=eq.141', 'on one row, by id', r1.path);
t(r1.body.angle==='Update', 'and it writes the label asked for', String(r1.body.angle));
t(Object.keys(r1.body).length===1, '  and touches nothing else on the row', JSON.stringify(r1.body));

/* Null is its own answer: "this is a photo after all" says nothing about which
   side of somebody the camera was on, so it clears rather than replaces. */
t(photoRelabel({id:141, angle:null}).body.angle===null, 'coming back clears the column');
t(photoRelabel({id:141}).body.angle===null, '  and so does leaving it out');
t(photoRelabel({id:141, angle:''}).body.angle===null, '  and so does an empty one');

console.log('\n  AND IT IS FOUR VALUES, NOT FREE TEXT:');
['Front','Side','Back','Update'].forEach(a=>{
  t(photoRelabel({id:9, angle:a}).body.angle===a, '  '+a+' is allowed');
});
[['front','lowercase is not one of them'],
 ['Sideways','nor anything that merely looks like one'],
 ['Update; drop table','nor a sentence with one at the front'],
 ['A'.repeat(400),'nor a long one']].forEach(([a,why])=>{
  let threw=false; try{ photoRelabel({id:9, angle:a}); }catch(e){ threw=true; }
  t(threw, why, a.slice(0,24));
});
[[0,'zero'],[-1,'a negative id'],[null,'no id'],['abc','a non-numeric id']].forEach(([id,why])=>{
  let threw=false; try{ photoRelabel({id:id, angle:'Update'}); }catch(e){ threw=true; }
  t(threw, 'refuses '+why);
});
/* It writes to progress_photos and to nothing else - the id is a number by the
   time it reaches the path, so there is nothing to escape and nothing to smuggle. */
t(/path: `progress_photos\?id=eq\.\$\{id\}`/.test(opSrc), 'the path is built from the checked number');
t(!/enc\(a\.id\)|\$\{a\.id\}/.test(opSrc), '  and never from the raw argument');

// ===== THE CARD STOPS ASSERTING AN ANGLE ===============================
console.log('\n  WHAT THE CARD SAYS NOW:');
const row=app.slice(app.indexOf("} else if(it.kind==='photo'){"), app.indexOf("} else if(it.kind==='steps'){"));
t(/what='Update';/.test(row) && /meta='Imported from a screenshot';/.test(row),
  'an import is an Update, and says where it came from');
t(/what='Progress photo';/.test(row), 'a photo is a progress photo');
t(!/meta\s*=\s*d\.angle/.test(row), 'and the card no longer prints an angle nobody chose');
t(/meta='';/.test(row), '  it prints nothing there instead', row.slice(-90).replace(/\s+/g,' '));

console.log('\n  THE SHEET STOPS CHOOSING FOR THEM:');
const modal=app.slice(app.indexOf('function openProgressPhotoModal(){'), app.indexOf('function closeProgressPhotoModal()'));
t(/_ppNewAngle = null;/.test(modal), 'the sheet opens with nothing chosen');
t(!/background:'\+\(a==='Front'\?'var\(--gold\)'/.test(modal), '  and no button arrives already lit');
t(/Angle \(optional\)/.test(modal), '  and the label says the question can be skipped');
t(/var _ppNewAngle=null;/.test(app), 'the value itself starts empty');
t(/_ppAngle = \(_ppImported && _ppImported\.length\) \? PP_UPDATE : \(_ppNewAngle \|\| null\)/.test(app),
  'and nothing is written unless somebody tapped one');
t(!/_ppNewAngle\|\|'Front'/.test(app), "  the old default is gone, not merely unused");

console.log('\n  AND THE PHOTO TAB STOPS COLLECTING THEM UNDER FRONT:');
t(/String\(ph\.angle\|\|''\)===_ppFilter/.test(app), 'the Front chip shows what actually says Front');
t(!/\(ph\.angle\|\|'Front'\)===_ppFilter/.test(app), '  not everything that says nothing');
t(/var ang = String\(ph\.angle\|\|''\);/.test(app), 'and the corner chip reads the column as it is');
t(/\(ang\?\('<div style="position:absolute;top:5px;left:5px/.test(app), '  and is simply absent when there is none');

// ===== THE TAP =========================================================
console.log('\n  THE HAND, WHERE THE MISTAKE IS VISIBLE:');
const acts=app.slice(app.indexOf("var _rid0=(d.id!=null?String(d.id):'');"), app.indexOf('var thumb = photo ?'));
t(/var isUpd=\(it\.kind==='photo'\) && _ppIsUpdate\(d\);/.test(acts), 'the row knows which way round it is');
t(/it\.kind==='photo'/.test(acts) && /pfPhotoLabel\(/.test(acts), 'a photo row carries the action');
t(/isUpd\?'false':'true'/.test(acts), 'and it points the other way when the row is already an update');
t(/Not a photo/.test(acts) && /It\\u2019s a photo/.test(acts), '  both directions have their own words');
/* It sits with Like and Share rather than in a settings screen, because the
   only place the wrong label is visible is the feed. */
t(acts.indexOf('pfRowShare')<acts.indexOf('pfRowLabel'), 'it sits with the other row actions');

const fn=app.slice(app.indexOf('async function pfPhotoLabel('), app.indexOf('async function jvUnlike('));
t(/trainerWrite\('photoRelabel', \{id:id, angle:\(makeUpdate\?PP_UPDATE:null\)\}\)/.test(fn),
  'it goes through the door, never straight at the table');
t(!/SB_URL/.test(fn), '  and never talks to Supabase itself');
/* An empty representation means the id matched nothing. A tick over a row that
   never moved is the worst outcome available here. */
t(/w\.rows && w\.rows\.length/.test(fn), 'an empty answer is a failure, not a success');
t(/did not save/.test(fn), '  and it says so');
t(/el\._busy/.test(fn), 'a double tap cannot fire it twice');
t(/loadTrainerFeed\(\)/.test(fn), 'and it repaints from the source rather than editing the card');
t(!/textContent='✓/.test(fn), '  so no part of the card can be left saying the old thing');

console.log(bad?('\n  '+bad+' FAILED'):'\n  all good (the app stops claiming what nobody told it)');
process.exit(bad?1:0);
