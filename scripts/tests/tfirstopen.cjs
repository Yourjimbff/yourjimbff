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

console.log('\n  AND THERE IS AN INTRODUCTION — SHOWN, NOT DESCRIBED:');
/* IT USED TO BE A SECOND FLOW AFTER THE FIRST ONE. Three cards on their own
   overlay (_OB_WELCOME) fired the instant obClose ran: right words, wrong
   moment - three more taps after somebody had just finished tapping through
   setup, on a screen they had every reason to read as over.
   Yusuf, 14 Sep, deleting the YOUR WEEK ONE page that ended setup: "i think
   instead it should be the tutorial ... would be great if there was a graphic
   or short video of someone typing 'i did push today, 4 sets of chest press,
   4 sets of shoulder press' and then enter, and show it populating."
   Same three things, now the last three steps OF setup, each demonstrating
   itself. One flow, one set of dots, two screens shorter than what it
   replaced. */
t(!/_OB_WELCOME/.test(src) || !/function obWelcome\(/.test(src),
  'the separate welcome overlay is gone, not left running alongside');
t(!/obWelcome\(\)/.test(src), 'and nothing still calls it');
const demos=slice('var _OB_DEMOS={','function _obDemoHtml');
t((demos.match(/^  \w+: \{/gm)||[]).length===3, 'three demos, one per thing the app does',
  String((demos.match(/^  \w+: \{/gm)||[]).length));
const steps=slice('var _OB_STEPS=[','var _ob=null;');
const dkeys=(steps.match(/\{k:'(t_\w+)',\s*type:'demo'/g)||[]).map(m=>m.match(/'(t_\w+)'/)[1]);
t(dkeys.length===3, 'and three steps carrying them', dkeys.join(','));
t(dkeys.join(',')==='t_food,t_train,t_prog', 'food, then training, then progress - his order');
/* The same three verbs as the very first screen, in the same order. A promise
   made on screen one and kept on the way in is worth more than a new one. */
t(/Track your food\./.test(src) && /Track your training\./.test(src),
  'which is the promise screen one made, kept');
const shown=(steps.match(/\b[qs]:'[^']*'/g)||[]).join(' | ');
t(/Track your progress\./.test(shown), 'and the third one finally says it the way he does');
t(!/watch the number move/i.test(shown), 'not "watch the number move", which he struck');

console.log('\n  EACH ONE TYPES A REAL SENTENCE AND SHOWS WHAT IT MADE:');
/* His sentence, typed the way he typed it - lower case, no punctuation at the
   end, because that is what somebody actually thumbs in. */
t(/i did push today, 4 sets of chest press, 4 sets of shoulder press/.test(demos),
  'the training demo types the exact sentence he wrote');
t(/163lbs today/.test(demos), 'and the progress demo types his weigh-in, his way');
t(/two eggs and toast/.test(demos), 'food keeps the example the welcome card already used');
['Chest press','Shoulder press'].forEach(function(w){
  t(new RegExp(w).test(demos), '  it populates '+w);
});
const run=slice('function _obDemoRun(kind){','var _obDemoI');
t(/_obReduceMotion\(\)/.test(src),
  'somebody who asked their phone to stop animating gets the finished state, not the movement');
/* A TIMER OUTLIVING ITS SCREEN IS THE WHOLE RISK HERE. obRender replaces the
   card on every step, so a tick that fires afterwards would be writing into a
   node nobody can see. */
t(/_obDemoStop\(\)/.test(slice('function obRender(){','var st=_obStep')) ||
  /_obDemoStop\(\);/.test(src), 'every repaint stops the demo that was running');
t((src.match(/document\.getElementById\('obDemo[TO]\w*'\)!==/g)||[]).length>=2,
  'and each tick checks its own element is still the one on the page');
t(/_obDemoStop\(\)/.test(slice('function obClose(){','function obBack')),
  'closing setup stops it too');
t(!/wasSetup/.test(src), 'and the welcome hook it used to carry left nothing behind');
/* Nobody has to sit through an animation to get out of it: the button is drawn
   from the same place on every step, before the demo starts. */
t(/st\.fin\?'<button class="obGo" onclick="obFinish\(\)">Start<\/button>'/.test(src),
  'the last demo carries Start, so the write is still a button somebody pressed');
t((steps.match(/fin:true/g)||[]).length===1, 'exactly one screen commits',
  String((steps.match(/fin:true/g)||[]).length));

console.log(bad? ('\n  '+bad+' FAILED\n') : '\n  all good (the first minute makes sense)\n');
process.exit(bad?1:0);
