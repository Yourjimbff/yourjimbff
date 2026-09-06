// CARDIO (Yusuf, order, 6 Sep).
//
// His words: "we should add a cardio button there. that actually is a toggle for
// something useful. it acts as a reminder that they should in fact be doing
// cardio." Opening it gives an open-type screen with the echo, a photo, and room
// for sentiment - "30 minutes of stairs and it kicked my ass. thats a great log."
//
// The thing this file really guards is the requirement under the whole redesign:
// THE LOGGING HAS TO ACTUALLY SAVE AND SHOW UP ON HIS END. A cardio row that
// quietly fails and closes the sheet anyway is worse than no button.
const fs=require('fs');
const guard=require('./_guard.cjs');
const {closure, defOf}=require('./_lift.cjs');

let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };

global.window={}; global.document={getElementById:()=>null};
global._escHtml=x=>String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const MINE=['_tlHasCardio','_tlCardioRow'];
eval(closure([]).code||'');
eval(MINE.map(defOf).join('\n'));
guard(MINE, n=>eval(n));

const src=fs.readFileSync('index.html','utf8');

// ===== IT IS A REMINDER, NOT FURNITURE =================================
console.log('\n  WHEN IT ASKS AND WHEN IT SHUTS UP:');
t(_tlCardioRow('2026-09-06', true, false, {workout:[]})!=='', 'a day with no cardio asks for it');
t(_tlCardioRow('2026-09-06', true, false, {workout:[{title:'Cardio'}]})==='',
  'once cardio is logged it stops asking - a prompt that keeps prompting gets ignored');
t(_tlCardioRow('2026-09-06', true, false, {workout:[{title:'cardio - stairmaster'}]})==='',
  'and it matches the real title the sheet writes, whatever case it lands in');
t(_tlCardioRow('2026-09-06', true, false, {workout:[{title:'Legs'}]})!=='',
  'a leg session is not cardio, so it still asks');
t(_tlCardioRow('2026-09-07', false, true, {workout:[]})==='', 'a day that has not happened asks nothing');
t(_tlHasCardio({})===false && _tlHasCardio({workout:null})===false, 'an empty day does not throw');

// ===== THE TRAINER'S COPY GETS NO CONTROLS =============================
console.log('\n  READ-ONLY SURFACES:');
global.window._tlRO=true;
t(_tlCardioRow('2026-09-06', true, false, {workout:[]})==='',
  'the trainer read-only view draws no button - his copy of a client day is not a control panel');
global.window._tlRO=false;

// ===== THE SAVE, WHICH IS THE WHOLE POINT ==============================
console.log('\n  IT SAVES, AND IT SAYS SO HONESTLY:');
const save=src.slice(src.indexOf('async function cardioSave(){'), src.indexOf('function _tlDaySectionHtml('));
t(/await insertWorkoutLog\(row\)/.test(save),
  'writes through insertWorkoutLog - the same proven path the workout sheet uses');
t(/title: 'Cardio'/.test(save), 'titled Cardio, which is what the reminder checks for');
t(/client_code: cl\.code/.test(save), 'against the signed-in client, never a guessed code');
t(/date_str: _cdDs \|\| _tlDateStr\(new Date\(\)\)/.test(save),
  'stamped with the day they are looking at, not the UTC day');
const _fail = save.indexOf('!saved || saved.ok===false');
t(_fail>0 && /return;/.test(save.slice(_fail, _fail+200)) && _fail < save.indexOf("closeM('mCardio')"),
  'A FAILED SAVE DOES NOT CLOSE THE SHEET - the client never loses a log without knowing');
t(save.indexOf('closeM(\'mCardio\')')>save.indexOf('saved.ok===false'),
  'the sheet closes only after the write is confirmed');
t(/renderDayTimeline\(true\)/.test(save), 'and the day redraws so they see it land');
t(/dropped\|\|\[\]\)\.indexOf\('photo'\)/.test(save), 'a dropped photo column is said out loud, not swallowed');

// ===== THE SHEET ========================================================
console.log('\n  WHAT THE SHEET OFFERS:');
const sheet=src.slice(src.indexOf('<div class="mbg" id="mCardio">'), src.indexOf('<div class="mbg" id="mWorkout">'));
t(/30 minutes on the stairmaster/.test(sheet), 'the placeholder is his own example');
t(/and it kicked my ass/.test(sheet), 'and the note field invites sentiment, which he called a great log');
t(/cardioMic\(\)/.test(sheet), 'the echo is there for dictation');
t(/accept="image\/\*"/.test(sheet), 'a photo can go on it');
t(!/cdPhotoWrap[^>]*>\s*<div[^>]*placeholder/i.test(sheet) && /id="cdPhotoWrap" style="margin-top:10px;"><\/div>/.test(sheet),
  'NO PLACEHOLDER BOX - his rule, the photo slot is empty until there is a photo');
const mic=src.slice(src.indexOf('function cardioMic(){'), src.indexOf('async function cardioSave(){'));
t(/t\.value\.trim\(\) \? \(t\.value/.test(mic), 'dictation appends to what they typed rather than wiping it');

// ===== WIRING ===========================================================
console.log('\n  WIRED IN:');
t(/if\(a==='cardio'\)\{ ev\.stopPropagation\(\); cardioOpen/.test(src), 'the row is tappable through the day dispatcher');
t(/try\{ html\+=_tlCardioRow\(ds, isToday, isAhead, slots\); \}catch\(e\)\{\}/.test(src),
  'and drawn inside a guard, so it can never take the day down with it');
const day=src.slice(src.indexOf('rows.forEach(function(r){ html+=_drawRow(r); });'), src.indexOf('html+=_tlMealSection('));
t(/_tlCardioRow/.test(day), 'placed under the session and above the meals, where activity goes');
t(/\.tlCardioRow\{/.test(src) && /backdrop-filter:blur/.test(src.slice(src.indexOf('.tlCardioRow{'), src.indexOf('.tlCardioRow{')+400)),
  'styled, and kept glass');

console.log();
if(bad){ console.log('  '+bad+' FAILED'); process.exit(1); }
console.log('  all cardio assertions pass');
process.exit(0);
