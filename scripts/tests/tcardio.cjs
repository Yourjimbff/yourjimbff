// CARDIO, STEPS, WEIGH-IN, PROGRESS PHOTO — the day's four asks (Yusuf, 6 Sep).
//
// His words for the button: "we should add a cardio button there. that actually
// is a toggle for something useful. it acts as a reminder that they should in
// fact be doing cardio." And for the sheet: "opensup an open type screen with
// the echo as well."
//
// Then his three corrections, which are what most of this file now guards:
//   "you also added 2 emojis which violate law."      -> NO EMOJI ANYWHERE
//   "the echo is not there. i instructed that did i not?"  -> A LIVE READ-BACK
//   "and it shuold say log, not log it / or log cardio"
//   "and the buttons are inconsistent. why didnt you move steps and weigh in?"
//
// The requirement under the whole redesign has not moved: THE LOGGING HAS TO
// ACTUALLY SAVE AND SHOW UP ON HIS END. A cardio row that quietly fails and
// closes the sheet anyway is worse than no button.
const fs=require('fs');
const guard=require('./_guard.cjs');
const {closure, defOf}=require('./_lift.cjs');

let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };

global.window={}; global.document={getElementById:()=>null};
global._escHtml=x=>String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const MINE=['_tlHasCardio','_tlAskRow','_tlCardioRow','_tlLateAsks','_tlStatsBlock','_dayWeightHtml',
            '_cdActivity','_cdMinutes','_cdDistance','_cdEchoHtml'];
const CL=closure(MINE);
eval(CL.code||'');
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

// ===== ONE SHAPE FOR EVERY ASK ==========================================
// "and the buttons are inconsistent. why didnt you move steps and weigh in?"
console.log('\n  EVERY ASK IS THE SAME ROW:');
const cardio=_tlCardioRow('2026-09-06', true, false, {workout:[]});
t(/class="tlMealAsk"/.test(cardio), 'cardio draws as .tlMealAsk, the row the meals already ask with');
t(/tlMealAskP/.test(cardio) && /tlMealAskT/.test(cardio), 'same ring and same label class');
t(!/tlCardioRow|tlCardioIco|tlCardioTx|tlCardioAdd/.test(cardio),
  'the bespoke glass box is gone - it was the inconsistency he was looking at');
t(!/\.tlCardioRow\{/.test(src), 'and its CSS went with it, so nothing can drift back to two designs');
t(/<svg viewBox="0 0 12 12"/.test(cardio),
  'the plus is the DRAWN one - a typed + sits on the font math axis and no CSS moves ink in its own em box');

// TODAY IS THE STATS BLOCK NOW (Yusuf, 6 Sep, after picking Three Blocks):
// the weight card off Progress, then Steps and Photo as two cells. The late
// asks below the food are for PAST days only, where steps and a weigh-in can
// still be backfilled.
global.profile=null; global.wUnit=()=>'lbs'; global.wToDisp=(v)=>Math.round(v*10)/10;
global._pgStartWeight=(p,first)=>({ok:false,val:first,source:'first'});
global._tlDateStr=(d)=>'2026-09-06';
const stats=_tlStatsBlock('2026-09-06', true, false, {weigh:[]});
t(/tlMealsEy">Stats</.test(stats), 'today has a Stats block, headed like the Food block is');
t(/id="dayWeightHost"/.test(stats), 'and the weight card sits in it');
t(/data-tl="steps"/.test(stats) && /data-tl="progphoto"/.test(stats), 'steps and the photo are cells under the card');
t(/data-tl="weighview"/.test(stats), 'the weigh-in door is INSIDE the weight card, not a row of its own');
t((stats.match(/tlStatCell"/g)||[]).length===2, 'two cells, not three - the weight has the card');
t(_tlLateAsks('2026-09-06', true, false, {weigh:[]})==='', 'so today draws no late asks - one set of doors, not two');
const late=_tlLateAsks('2026-09-03', false, false, {weigh:[]});
t(/Steps/.test(late) && /Weigh in/.test(late), 'a past day still offers steps and a weigh-in, to backfill');
t(/aria-label="Weigh in"/.test(late) && !/aria-label="Log Weigh in"/.test(late),
  'the aria label is the label alone - role=button already says it is a button');
// openProgressPhotoModal stamps todayDateStr and has no date field at all.
const past=_tlLateAsks('2026-09-03', false, false, {weigh:[]});
t(!/Progress photo/.test(past),
  'a past day offers NO photo door - that modal can only write today, and a row that lies about its date is worse than no row');
t(/Steps/.test(past) && /Weigh in/.test(past),
  'but steps and the weigh-in stay, because both of those doors take the day they were tapped on');
t(/data-tl="steps"/.test(late) && /data-tl="weighview"/.test(late),
  'each wired to the door that already existed, nothing new invented');
t(/aria-label="Weigh in"/.test(late) && !/aria-label="Log Weigh in"/.test(late),
  'the aria label is the label alone - role=button already says it is a button');
t(_tlLateAsks('2026-09-07', false, true, {weigh:[]})==='', 'a day that has not happened asks nothing');
t(_tlStatsBlock('2026-09-07', false, true, {weigh:[]})==='', 'and gets no stats block either');
const weighed=_tlLateAsks('2026-09-03', false, false, {weigh:[{weight:181}]});
t(!/Weigh in/.test(weighed), 'once they have weighed in it stops asking - optional, not owed');

// ===== THE HEADER HE WANTED EMPTIED =====================================
// "remove top header all together? today, sep 6, steps? or it should just say
//  today."  All three things were in that row. Two of them are gone.
console.log('\n  THE DAY TITLE:');
const title=src.slice(src.indexOf("var _mwOn = isToday && !_mwCalendarOff();"),
                      src.indexOf("// Directly under \"Today\", and only there."));
t(/isToday \? '' : \('<span style="font-size:13px/.test(title),
  'today drops its date - "Today Sep 6" says one thing twice');
t(/month:'short',day:'numeric'/.test(title),
  'every other day keeps its date, because a weekday alone does not say which Monday');
t(/if\(!window\._tlRO\) return '';/.test(title),
  'the steps chip is off the header - Steps has its own row under the food now');
t(/_dayStepsForRow/.test(title),
  'and it survives in the trainer read-only view, which draws no ask rows at all');

// ===== THE TRAINER'S COPY GETS NO CONTROLS =============================
console.log('\n  READ-ONLY SURFACES:');
global.window._tlRO=true;
t(_tlCardioRow('2026-09-06', true, false, {workout:[]})==='',
  'the trainer read-only view draws no cardio button - his copy of a client day is not a control panel');
t(_tlLateAsks('2026-09-03', false, false, {weigh:[]})==='' && _tlStatsBlock('2026-09-06', true, false, {weigh:[]})==='',
  'and no steps, weigh-in or photo door either - never a write into somebody else\'s account');
global.window._tlRO=false;

// ===== THE ECHO, WHICH HE HAD TO ASK FOR TWICE =========================
// "the echo is not there. i instructed that did i not?"  He did.
// Its law is the food echo's law: NO NUMBER RATHER THAN A GUESSED ONE.
console.log('\n  THE ECHO READS BACK, AND NEVER GUESSES:');
t(_cdEchoHtml('')==='', 'nothing typed, nothing said');
const e1=_cdEchoHtml('30 minutes on the stairmaster');
t(/Stairmaster/.test(e1), 'it names the activity it recognised');
t(/30 min/.test(e1), 'and the time it was actually given');
const e2=_cdEchoHtml('stairmaster');
t(/no time given/.test(e2) && !/\d+ min/.test(e2),
  'NO NUMBER RATHER THAN A GUESSED ONE - a machine name is not a duration');
t(/class="cdEchoRow dim"/.test(e2), 'and it reads as missing, not as a fact');
t(_cdMinutes('an hour and a half')===null,
  'a duration written in words is not a number we were handed, so it is not one we show');
t(_cdMinutes('1 hour 20')===80 && _cdMinutes('45 min')===45 && _cdMinutes('45 minutes')===45,
  'the times it can actually read, it reads');
t(_cdMinutes('')===null && _cdMinutes('stairs')===null, 'and it does not invent one out of nothing');
t(_cdDistance('ran 3 miles')==='3 miles' && _cdDistance('5k on the treadmill')==='5 km',
  'a distance that was given is shown');
t(_cdDistance('30 minutes')==='' , 'and minutes are never read as metres');
const e3=_cdEchoHtml('pushed the sled until my legs quit');
t(/logged as cardio/.test(e3) && /pushed the sled/.test(e3),
  'when it recognises nothing it says so and echoes their own words - never a summary of them');
t(!/\bcal\b|calorie/i.test(e1+e2+e3), 'it never prices cardio, because the app has no honest way to');
t(/id="cdEcho"/.test(src) && /oninput="cardioEcho\(\)"/.test(src),
  'and it is LIVE - wired to every keystroke, not to the save');
t(/function cardioEcho\(\)/.test(src), 'the function he asked for exists');
t(/\.cdEcho\{/.test(src) && /\.cdEchoRow\{/.test(src), 'and it is styled, so it is visible on his phone');

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
// "photo 2 of the cardio bar, remove the placeholder text. it shuold just say
//  note under the note."
t(!/and it kicked my ass/.test(sheet), 'the note field carries NO placeholder - his correction, 6 Sep');
t(/class="cdLbl">Note<\/div>/.test(sheet) && /id="cdNote"/.test(sheet),
  'it just says Note above the box, which is what he asked for');
t(/\.cdLbl\{/.test(src), 'and the label is styled');
// "you also added 2 emojis which violate law." HOUSE LAW. SVG is fine, emoji is not.
const EMOJI=/[‼-㊙\u{1F000}-\u{1FAFF}\u{FE0F}]/u;
t(!EMOJI.test(sheet), 'NO EMOJI IN THE SHEET - house law, and it was broken here once');
t(!EMOJI.test(cardio+late), 'and none in any of the day rows either');
t((sheet.match(/<svg /g)||[]).length>=2, 'the mic and the camera are the app\'s own SVG glyphs');
t(/cardioMic\(\)/.test(sheet), 'dictation is offered');
t(/accept="image\/\*"/.test(sheet), 'a photo can go on it');
t(!/cdPhotoWrap[^>]*>\s*<div[^>]*placeholder/i.test(sheet) && /id="cdPhotoWrap" style="margin-top:10px;"><\/div>/.test(sheet),
  'NO PLACEHOLDER BOX - his rule, the photo slot is empty until there is a photo');
// "and it shuold say log, not log it / or log cardio"
t(/>Log cardio<\/button>/.test(sheet), 'the button says Log cardio - his exact correction');
t(!/Log it/.test(sheet) && !/Log it/.test(save), 'and Log it is gone from the sheet and from the save path');
const mic=src.slice(src.indexOf('function cardioMic(){'), src.indexOf('async function cardioSave(){'));
t(/t\.value\.trim\(\) \? \(t\.value/.test(mic), 'dictation appends to what they typed rather than wiping it');
t(/cardioEcho\(\)/.test(mic), 'and dictated words move the echo too, or the read-back lies for a beat');

// ===== WIRING ===========================================================
console.log('\n  WIRED IN:');
t(/if\(a==='cardio'\)\{ ev\.stopPropagation\(\); cardioOpen/.test(src), 'the cardio row is tappable through the day dispatcher');
t(/if\(a==='progphoto'\)/.test(src), 'so is the progress photo');
t(/if\(a==='steps'\)/.test(src) && /if\(a==='weighview'\)/.test(src), 'steps and the weigh-in were already wired, and still are');
t(/try\{ html\+=_tlCardioRow\(ds, isToday, isAhead, slots\); \}catch\(e\)\{\}/.test(src),
  'cardio is drawn inside a guard, so it can never take the day down with it');
t(/try\{ html\+=_tlStatsBlock\(ds, isToday, isAhead, slots\); \}catch\(e\)\{\}/.test(src)
  && /try\{ html\+=_tlLateAsks\(ds, isToday, isAhead, slots\); \}catch\(e\)\{\}/.test(src),
  'and so are the stats block and the late asks below it');
const day=src.slice(src.indexOf('rows.forEach(function(r){ html+=_drawRow(r); });'), src.indexOf('html+=_tlMealSection('));
t(/_tlCardioRow/.test(day), 'cardio sits under the session and above the food, where activity goes');
const after=src.slice(src.indexOf('html+=_tlMealSection('), src.indexOf('html+=_tlMealSection(')+600);
t(/_tlStatsBlock/.test(after) && /_tlLateAsks/.test(after), 'stats sit UNDER the food - "the final tally for the day"');
// A name that only ever appears as window.X is a property on the window object,
// not a top-level declaration - the static chase reports it because it strips
// the "window." off, and it is not a hole. Anything else unresolved IS a hole,
// which is the whole reason this assertion exists: the lifter's own note says a
// suite can go green over a chain with a gap in it.
const holes=CL.unresolved.filter(function(n){
  // Comments out first: a name mentioned in prose is not a reference to it.
  const stripped=src.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/[^\n]*/g,'').split('window.'+n).join('window.__WINPROP__');
  return new RegExp('(^|[^.A-Za-z0-9_$])'+n+'(?![A-Za-z0-9_$])').test(stripped);
});
t(holes.length===0, 'the lifted closure has no holes', holes.join(','));

console.log();
if(bad){ console.log('  '+bad+' FAILED'); process.exit(1); }
console.log('  all cardio assertions pass');
process.exit(0);
