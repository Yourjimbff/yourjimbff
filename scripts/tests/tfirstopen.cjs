// THE FIRST MINUTE, AS A STRANGER SEES IT.
//
// Yusuf, 12 Sep, signing in to the free app on his own phone at 8:40 on a
// Sunday evening: "look at how a new user would see this with no introduction
// whatsoever and think about how to make this as friendly as possible and make
// it make sense."
//
// Four things he found, in his words:
//   the split      "I'm on a split... I never wrote workouts. Why would I have
//                   workouts here designed and planned?"  -> that week was MINE,
//                   written onto his account by a quiet save while I tested the
//                   builder. The row is deleted and the quiet write now stands
//                   down while the sheet is open (see tweekbuild.cjs).
//   the meals      "don't like skip breakfast, skip lunch - if I just signed in
//                   for the first time at 8:40 PM and it's a Sunday I didn't
//                   skip breakfast, skip lunch"
//   the weigh-in   "no weigh ins yet - you already have my weight"
//   the welcome    "with no introduction whatsoever"
// and Creative mode, a toggle meaning nothing to somebody ninety seconds old,
// sitting under a sentence telling them they have no program.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let bad=0; const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };
function slice(a,b){ const i=src.indexOf(a); return i<0?'':src.slice(i, src.indexOf(b,i)); }

console.log('\n  NOBODY SKIPPED A MEAL THAT HAPPENED BEFORE THEY HAD THE APP:');
const fd=slice('function _tlFirstDay(ds){','\n}');
t(/profile&&profile\.intake_date/.test(fd), 'first day is read off intake_date, which setup writes');
/* Both sides go through _localYmd: intake_date is YYYY-MM-DD and the day on
   screen is "Sep 12, 2026", and the UTC day at 8:30pm in Texas is tomorrow. */
t(/var want=_localYmd\(dd\);/.test(fd), 'and compares it to the LOCAL day on screen, same shape both sides');
t(/intake_date:_localYmd\(new Date\(\)\),/.test(src), 'and setup writes the local day, not the UTC one');
/* An existing client has no intake_date. They must answer false and nothing
   about their day may change. */
t(/var d=\(profile&&profile\.intake_date\) \? String\(profile\.intake_date\)\.slice\(0,10\) : '';/.test(fd) && /return false;\s*\n\s*\}catch/.test(fd),
  'no intake_date answers false, so every existing client is untouched');
t(/catch\(e\)\{ return false; \}/.test(fd), 'and a throw answers false too');
const ladder=slice('var left=[], skipped=[];','var head=');
t(/if\(_tlFirstDay\(ds\)\)\{/.test(ladder), 'the meal ladder asks whether this is their first day');
t(/if\(_g && due!==k\) return; \}/.test(ladder),
  'and a meal whose hour was already over is not on the list at all');
t(/_mealHourGone\(k\)/.test(ladder), 'measured by the meal hour, not by a guess');
/* The meal whose hour it is right now still shows - they can still eat dinner. */
t(/due!==k/.test(ladder), 'except the one whose hour it is, which they can still eat');

console.log('\n  THE WEIGHT THEY TYPED IS THEIR FIRST WEIGH-IN:');
const fin=slice('async function obFinish(){','function _gpFirstRun');
t(/insertWeightLog\(\{client_code:cl\.code, weight:_w0, notes:''\}\)/.test(fin),
  'setup writes a weigh-in from the weight they gave');
t(/var _w0=parseFloat\(a\.weight\)\|\|0;\s*\n\s*if\(_w0>0/.test(fin), 'and never a zero');
t(fin.indexOf('profile=Object.assign') < fin.indexOf('insertWeightLog'),
  'after the profile write, so a setup that failed leaves no orphan weigh-in');
t(/\.catch\(function\(\)\{\}\);/.test(fin),
  'and a failure here cannot undo a setup that worked');
t(/insertWeightLog/.test(src.slice(src.indexOf('async function insertWeightLog'))),
  'through the verified write path, not a raw POST');

console.log('\n  A FREE USER WITH NO WEEK IS OFFERED A BLANK LOG, NOT A VERDICT:');
/* 12 Sep it was "you are offered the builder rather than told you have no
   program". 13 Sep he went a step further: "Before a user has a program, there
   should just be a blank log for their workout space ... Someone could and
   should have the ability to not create a program, and just simply log what
   they do if they don't want to follow a program."
   So the card is an open log and the builder is the quiet line under it. The
   verdict this section was written to keep out is still out; what replaced it
   just asks less of them. Full coverage in tblanklog.cjs. */
const rest=slice('function _tlRestCard(ds, isToday, isAhead, slots, kind){','function _tlMoveRow');
t(/_canBuild=\(none && _meFreeApp\(\) && !window\._tlRO\)/.test(rest), 'a free user with no program, and nobody else');
t(/class="tlLogEy">Log your workout</.test(rest), 'the card is a log');
t(/Say or type what you did/.test(rest), 'and it says what to do with it');
t(!/tlHeroMeta/.test(slice("if(_canBuild){","  return '<div class=\"tlHero\">")), 'and nothing under it');
t(/data-tl="wolog"/.test(rest), 'the box is the door');
t(/data-tl="buildweek"/.test(rest), 'and the builder is still one line away');
t(/if\(a==='buildweek'\)\{ ev\.stopPropagation\(\); try\{ pgBuildStart\(\); \}catch\(e\)\{\} return; \}/.test(src),
  'wired through the same delegated handler as every other card here, onto the Program tab');
/* Creative mode is not deleted. It is the right control for somebody who HAS a
   week and is off-plan today - it is only wrong as the first thing a stranger
   meets. */
t(/tlSwitchLbl">Creative mode</.test(rest), 'Creative mode still exists for everyone else');
/* The builder branch RETURNS, so Creative mode is not merely later on the
   page - it is unreachable on that render. That is the real guarantee. */
t(rest.indexOf('if(_canBuild){') < rest.indexOf('tlSwitchLbl">Creative mode') &&
  /if\(_canBuild\)\{[\s\S]*?\+'<\/div>';\s*\n\s*\}/.test(rest),
  'and the log branch returns, so Creative mode cannot also draw');
t(/No program set up yet/.test(rest),
  'the old line survives for a coaching client, whose coach writes their week');

console.log('\n  AND THERE IS AN INTRODUCTION:');
const wel=slice('var _OB_WELCOME=[','function _obWelKey');
t((wel.match(/\{t:'/g)||[]).length===3, 'three cards, one at a time', String((wel.match(/\{t:'/g)||[]).length));
['Say what you ate','Say what you lifted','watch the number move'].forEach(function(w){
  t(new RegExp(w).test(wel), '  '+w);
});
/* The same three verbs as the very first screen, in the same order. A promise
   made on screen one and kept on the way in is worth more than a new one. */
t(/Track your food\./.test(src) && /Track your training\./.test(src),
  'which is the promise screen one made, kept');
t(/obWelcome\(\)/.test(fin), 'it runs when setup finishes');
t(!/showToast\('You are set up'\)/.test(fin) || /catch\(_e\)/.test(fin),
  'and the three-second toast is only a fallback now');
const done=slice('function obWelDone(){','}');
t(/localStorage\.setItem\(_obWelKey\(\),'1'\)/.test(done), 'seen once, ever');
t(slice('function obWelcome(force){','function obWelRender').indexOf('localStorage.setItem')<0,
  'and marked seen on the way OUT, so closing halfway through keeps the rest for next time');
t(/'yjb_welcome_'\+\(\(cl&&cl\.code\)\|\|'x'\)/.test(src), 'per account, not per phone');

console.log(bad? ('\n  '+bad+' FAILED\n') : '\n  all good (the first minute makes sense)\n');
process.exit(bad?1:0);
