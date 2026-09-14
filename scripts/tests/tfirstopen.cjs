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
function slice(a,b){ const i=src.indexOf(a); if(i<0) return ''; const j=src.indexOf(b,i); if(j<0) throw new Error('stale end anchor, this suite was reading the rest of the file: '+b); return src.slice(i,j); }

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
t(/i trained legs today, 4 sets of squats/.test(demos),
  'the training demo types the exact sentence he wrote');
t(!/i did push today/.test(demos), 'and the push one it replaced is gone');
t(/163lbs today/.test(demos), 'and the progress demo types his weigh-in, his way');
/* THE ANSWER GOES WHERE THE EYE LANDS (Yusuf, 14 Sep, with a photo): "my eyes
   went to the 'today' part to see the weight logged, thats where the weight
   should be." The left slot is the bold one - it holds Eggs and Squats on the
   other two cards, where the THING is the answer. On a weigh-in the NUMBER is
   the answer and the day is the detail, so the two swap. */
t(/rows:\[\['163 lbs','Today'\]\]/.test(demos), 'and the weight sits in the bold slot, not the day');
t(!/\['Today','163/.test(demos), 'never the other way round again');
t(/two eggs and toast/.test(demos), 'food keeps the example the welcome card already used');
/* ONE LIFT TYPED, ONE ROW BACK. He typed one exercise, so a second row would
   be the card claiming the app invented something he never said. */
t(/\['Squats','4 sets'\]/.test(demos), '  it populates Squats, 4 sets');
const trainRows=(demos.match(/train:[\s\S]*?rows:(\[.*?\]\])/)||[])[1]||'';
t(trainRows.split('],[').length===1, '  and nothing he did not type', trainRows);
/* Yusuf, 14 Sep, on the served build: "the end result is quickly gone, let it
   linger for another 2 seconds." The typing you follow at a glance; the card
   underneath is the part you have to read. */
t(/var MS_DEMO_HOLD=4600;/.test(src), 'the answer stays up long enough to read');
t(/\}, MS_DEMO_HOLD\);/.test(src), 'and all three demos read that one number');

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
/* MEASURED ON THE SERVED BUILD, 14 Sep: a background tab's setTimeout asking
   for 40ms came back at 1006, 992, 1002. A demo left running through that does
   not pause, it crawls, and somebody who answers a text comes back to a
   sentence stuck half-typed finishing one letter a second. */
/* ANCHORED ON THE NAMED HANDLER, not on the event name. There are two
   visibilitychange listeners in this file - the foreground re-check owns the
   other one - and slicing on the event name grabbed that one instead, then ran
   to the end of the file when its end marker never matched. */
t(/document\.addEventListener\('visibilitychange', _obDemoVisibility\)/.test(src),
  'and a backgrounded tab does not leave one crawling');
const vis=slice('function _obDemoVisibility(){','\n}');
t(/if\(document\.hidden\)\{ _obDemoStop\(\); return; \}/.test(vis),
  'it stops when the page goes away');
t(/if\(isDemo\) _obDemoRun\(st\.demo\); else _obHomeRun\(\);/.test(vis),
  'and starts the right one again from the top when it comes back');
t(/if\(!isDemo && !isHome\) return;/.test(vis),
  'and does nothing at all on a screen that is neither');
t(!/wasSetup/.test(src), 'and the welcome hook it used to carry left nothing behind');
/* Nobody has to sit through an animation to get out of it: the button is drawn
   from the same place on every step, before the demo starts. */
t(/st\.fin\?'<button class="obGo" onclick="obFinish\(\)">Start<\/button>'/.test(src),
  'the last demo carries Start, so the write is still a button somebody pressed');
t((steps.match(/fin:true/g)||[]).length===1, 'exactly one screen commits',
  String((steps.match(/fin:true/g)||[]).length));

console.log('\n  AND THE LAST SCREEN PERFORMS IT TOO:');
/* Yusuf, 14 Sep, with two photos: "that save to home screen instruction is a
   little vague, its not as descriptive as the other animations, it should be an
   animation of you going on safari on mobile, and hitting the bottom right 3
   dots ... its hit 3 dots, share, scroll down to add to home screen."
   It drew a still picture of a button and explained the rest in a numbered
   list, which is the shape of a manual next to three screens that SHOW the
   thing happening. */
const share=slice('var _OB_SHARE_ROWS=[','\nvar _obDemoT');
/* HIS SCREENSHOT, not an invented menu. A plausible-sounding list would send
   somebody hunting for words that are not on their phone. */
[['Add Bookmark to','the row iOS puts first'],
 ['Add to Favorites','then favourites'],
 ['Find on Page','then find on page'],
 ['Add to Home Screen','and the one he is after, last']].forEach(function(p){
  t(share.indexOf(p[0])>=0, '  '+p[1]);
});
const order=(share.match(/t:'([^']+)'/g)||[]).map(x=>x.slice(3,-1));
t(order.length===4, 'four rows, the four on his screen', String(order.length));
t(order[3].indexOf('Home Screen')>=0, 'in his order, with Home Screen at the bottom');
t((share.match(/hit:true/g)||[]).length===1, 'exactly one row is the destination');
t(/Add to Home Screen', hit:true/.test(share.replace(/\s+/g,' ')) || /hit:true/.test(share.slice(share.indexOf('Add to Home Screen')-40)),
  'and it is Add to Home Screen');
t((share.match(/<svg /g)||[]).length===4, 'each row carries its own icon, drawn');

const home=slice('function _obHomeRun(){','\nfunction _obDemoVisibility');
t(/_obDemoStop\(\)/.test(home), 'it stops anything already running before it starts');
t(/classList\.add\('tap'\)/.test(home), 'the button gets pressed');
t(/classList\.add\('up'\)/.test(home), 'the sheet comes up');
t(/classList\.add\('lit'\)/.test(home), 'and the row he wants lights up');
t(/_obDemoT=setTimeout\(step, MS_DEMO_HOLD\)/.test(home),
  'and it holds as long as the other three before looping');
/* ONE TIMER IN THIS OVERLAY, NEVER TWO. Running through the same handle means
   leaving the screen, backgrounding the tab and closing setup all stop it for
   free - the three things that already stop a demo. */
t(!/setTimeout\((?!function|step)/.test(home) && (home.match(/_obDemoT=setTimeout/g)||[]).length>=4,
  'every one of its timers goes through the demo handle');
t(/_obReduceMotion\(\)/.test(home), 'reduced motion gets the finished state, not the movement');
t(/if\(st\.type==='home'\)\{ try\{ _obHomeRun\(\); \}catch\(e\)\{\} \}/.test(src),
  'and the screen starts it when it draws');
t(/isHome\)/.test(vis) || /st\.type==='home'/.test(vis),
  'a backgrounded tab stops this one too');
/* The arrow and the still ring it pointed at are gone - the animation IS the
   instruction now, so a second thing pointing at it is one thing too many. */
t(!/obPoint/.test(src), 'the old arrow-at-a-still-picture is gone');

console.log(bad? ('\n  '+bad+' FAILED\n') : '\n  all good (the first minute makes sense)\n');
process.exit(bad?1:0);
