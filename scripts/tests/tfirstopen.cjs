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
/* HE TOOK THE FIRST FIX BACK (14 Sep): "even if I'm signing in at 9 o'clock at
   night I should be allowed to log breakfast and lunch today ... I want to take
   back so add it back." Dropping the meals removed the word AND the door, and
   the door was never the problem. The ladder is whole on day one; what comes
   off is the Skipped chip, down at the render. */
t(!/if\(_tlFirstDay\(ds\)\)\{/.test(ladder), 'the ladder no longer drops a meal on day one');
t(!/if\(_g && due!==k\) return; \}/.test(ladder), 'every meal stays loggable, whatever the hour');
const ask=slice('    left.forEach(function(pair){','    skipped.forEach(');
t(/_tlFirstDay\(ds\)/.test(ask), 'and the first day is asked about at the word instead');
t(/\(gone && !first\)/.test(ask),
  'so Skipped needs the hour gone AND a day that is not their first');
t(/_mealHourGone\(due\)/.test(ask), 'measured by the meal hour, not by a guess');

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
/* SOURDOUGH, AND EACH FOOD SHOWS WHAT IT IS FOR (Yusuf, 14 Sep): "wouldnt it
   be better if that said the protein count under the eggs, and then the carb
   count? 2 eggs and sourdough should be it."
   "Eggs - 2 large" only proved the app counted. "2 eggs - 12g protein" proves
   it knows what an egg IS, which is the whole lesson of the screen. */
t(/two eggs and sourdough/.test(demos), 'food types the breakfast he named');
t(!/toast/i.test(demos), 'and toast is gone');
t(/\['2 eggs','12g protein'\]/.test(demos), '  eggs answer in protein');
t(/\['1 slice sourdough','23g carbs'\]/.test(demos), '  and the bread answers in carbs');
/* HIS OWN SHELF, not numbers anybody picked: meal_components on the live
   project prices Eggs at 6g protein an egg and Sourdough Bread at 23g carbs a
   slice, so the card cannot claim a breakfast the app would price differently.
   If the shelf ever changes, this assertion is the thing that notices. */
t(/macro:\{calories:264, protein:16, carbs:23, fat:11\}/.test(demos),
  'and the total is what those two foods actually come to');
/* THREE LIFTS TYPED, THREE ROWS BACK (Yusuf, 15 Sep: "add 4 sets of leg press,
   and 3 sets of hamstring curls"). The old rule here was one lift, one row -
   correct while he had typed one. The rule it was protecting is not the COUNT,
   it is that the card never shows a lift the sentence did not name, so that is
   what this checks now: every row on the training card has to be findable in
   the sentence above it. */
t(/\['Squats','4 sets'\]/.test(demos), '  it populates Squats, 4 sets');
t(/\['Leg press','4 sets'\]/.test(demos), '  and the leg press he added');
t(/\['Hamstring curls','3 sets'\]/.test(demos), '  and the hamstring curls');
const trainCard=(demos.match(/\n  train: \{[\s\S]*?\n    foot:'Added to today',/)||[''])[0];
const trainSay=((trainCard.match(/say:'([^']*)'/)||[])[1]||'').toLowerCase();
const trainRows=(trainCard.match(/rows:(\[\[[\s\S]*?\]\])/)||[])[1]||'';
const trainNames=[...trainRows.matchAll(/\['([^']+)','/g)].map(m=>m[1].toLowerCase());
t(trainNames.length===3, '  three rows, one per lift', trainNames.join(','));
t(trainNames.every(n=>trainSay.indexOf(n)!==-1),
  '  and nothing he did not type', trainNames.filter(n=>trainSay.indexOf(n)===-1).join(',')||'-');

console.log('\n  AND EACH ONE SHOWS MORE THAN A SINGLE EXAMPLE:');
/* ONE EXAMPLE TEACHES THE EXAMPLE, NOT THE RANGE (15 Sep). Somebody who
   watched the food card learned the app can do eggs. Each demo now carries a
   `more` list and the loop walks it, first card first, so a glance still gets
   the short obvious one and staying gets the truer one. */
t(/function _obDemoCards\(kind\)/.test(src), 'a demo is a list of cards, not one card');
t(/var d=_obDemoCards\(kind\)\[0\]; if\(!d\) return '';/.test(src),
  'the markup draws card one, so the screen is never blank on arrival');
t(/var cards=_obDemoCards\(kind\);/.test(src), 'and the runner owns the rotation from there');
t(/n=\(n\+1\)%cards\.length; d=cards\[n\];/.test(src), 'it advances once per loop, and wraps');
/* THE SWAP HAPPENS WHERE NOBODY CAN SEE IT: after the old answer has faded and
   before the new sentence starts typing. And the card is PAINTED at the reveal,
   not at the swap, because it carries aria-live - writing into it while it is
   invisible would read the next answer out four seconds early. */
const runner=slice('function _obDemoRun(kind){','\n}');
t(runner.indexOf("out.classList.remove('in')")<runner.indexOf('n=(n+1)%cards.length'),
  'the card changes only after the old one is off screen');
t(/paint\(\);\s*\n\s*out\.classList\.add\('in'\);/.test(runner),
  'and it is written into the page in the same breath as the fade-in');
t(/function _obDemoBody\(d\)/.test(src) && /\+_obDemoBody\(d\)/.test(src),
  'both surfaces build the card from one function, so they cannot drift');
/* A NINETY-CHARACTER SENTENCE AT THUMB SPEED IS SIX SECONDS OF WATCHING
   SOMEBODY ELSE TYPE. Same rhythm, same jitter, shorter beats once it is long
   enough to matter. */
t(/if\(d\.say\.length>45\) wait=Math\.round\(wait\*0\.55\);/.test(src),
  'a long sentence is typed faster, or it stops being a demo and becomes a wait');

/* THE PLATE HE ACTUALLY TELLS PEOPLE TO BUILD (Yusuf, 15 Sep): "12 ounces of
   New York strip steak, one handful of potatoes, one handful of mixed salad".
   Breakfast is the easy case. This is the sentence that proves the box takes
   ounces AND handfuls in one breath. */
t(/say:'12 ounces of New York strip steak, one handful of potatoes, one handful of mixed salad'/.test(demos),
  'food rotates to the dinner he described, word for word');
t(/\['12 oz NY strip steak','106g protein'\]/.test(demos), '  the steak answers in protein');
t(/\['1 handful potatoes','13g carbs'\]/.test(demos), '  the potatoes answer in carbs');
t(/\['1 handful salad mix','Vegetables are free'\]/.test(demos),
  '  and the salad says his rule out loud');
/* HIS SHELF AND THE APP'S OWN PALM CONSTANT, the same way the eggs card is
   priced. meal_components on the live project: Steak 220 cal / 31p / 0c / 11f
   per palm, Potatoes 58 / 1 / 13 / 0 per handful, Salad Mix 10 / 0 / 2 / 0 per
   handful. MB_PALM_OZ is 3.5, so 12 oz is 3.4286 palms. If the shelf or the
   palm constant ever moves, this is the assertion that notices. */
const palmOz=Number((src.match(/var MB_PALM_OZ = ([\d.]+);/)||[])[1]);
t(palmOz===3.5, 'a palm is still 3.5 oz', String(palmOz));
const palms=12/palmOz;
const want={calories:Math.round(220*palms+58+10), protein:Math.round(31*palms+1),
            carbs:Math.round(0*palms+13+2), fat:Math.round(11*palms)};
t(new RegExp('macro:\\{calories:'+want.calories+', protein:'+want.protein
             +', carbs:'+want.carbs+', fat:'+want.fat+'\\}').test(demos),
  '  and the total is what that plate really comes to',
  JSON.stringify(want));
/* NOT EVERYBODY'S TRAINING IS A BARBELL (Yusuf, 15 Sep: "45 minute pilates ...
   should save accordingly"). A tutorial that only ever shows lifts tells a
   class-goer this app is not for them. */
t(/say:'45 minute pilates'/.test(demos), 'training rotates to a class, not just lifts');
t(/\['Pilates','45 minutes'\]/.test(demos), '  and it comes back as one row with the time on it');
/* PROGRESS IS NOT ONLY A NUMBER (15 Sep). Both sentences are his, written the
   way he wrote them. */
t(/say:'Feeling really recharged after going to bed at 10pm\. i feel the will to live omfg'/.test(demos),
  'progress rotates to a journal entry, his words exactly');
t(/say:'day 10 no junk food\. my stomach feels SO good\.'/.test(demos),
  '  and a second one on the nutrition pill');
/* PRESS, THEN WRITE (Yusuf, 15 Sep, correcting the first pass: "thats not what
   i meant ... someone clicks energy, then they write the text"). The first
   version typed "Energy: " as part of the sentence, because that is the string
   ciPill stores. It is not what a person DOES: on their screen there is a row
   of five pills above an empty box. So the row is drawn, the pill is lit, and
   the sentence types bare. */
t(!/say:'Energy: /.test(demos) && !/say:'Nutrition: /.test(demos),
  '  and the pill is never typed as if it were part of the sentence');
t(/pills:_CI_PILLS, hit:'Energy'/.test(demos) && /pills:_CI_PILLS, hit:'Nutrition'/.test(demos),
  '  the row is the real journal row, not a second hand-typed copy of it');
t(/function _obDemoPillsHtml\(d\)/.test(src), 'the demo can draw a pill row');
t(/\+_obDemoPillsHtml\(d\)\+/.test(src), 'and the markup carries it above the box');
t(/if\(i===0 && d\.hit && !lit\)\{/.test(runner),
  '  the pill lights BEFORE the first character, not after');
t(/lit=true; lightPill\(\);/.test(runner) && /_obDemoT=setTimeout\(step, 620\);/.test(runner),
  '  and the two actions are a beat apart, so they read as two');
t(/idle\(\); pills\(\); i=0; lit=false;/.test(runner),
  '  a new card redraws its pills unlit, so the next loop presses it again');
t(/\.obDemoPill\.on\{/.test(src) && /\.obDemoPills:empty\{display:none;\}/.test(src),
  '  a lit pill has a look, and a card with no pills has no row');
t(/\['Energy','Today'\]/.test(demos) && /\['Nutrition','Today'\]/.test(demos),
  '  each filed under the pill it was typed with');
t((demos.match(/head:'Journal entry saved'/g)||[]).length===2,
  '  and called what the app calls it for a free user');
/* SETUP ONLY EVER RUNS FOR A FREE APP USER (_obShouldRun), so the demo can say
   "journal entry" flat out - there is no paid client on the other side of this
   screen who would then go looking for a Journal tab and find Check-in. */
t(/if\(!isFreeApp\(cl\.code\)\) return false;/.test(slice('function _obShouldRun(srv){','\n}')),
  '  which is safe because setup is free-app only');
t(/s:'Weigh in, or write how it is going\.'/.test(steps),
  'and the line under it names both, now that both are on screen');
t(!/Weigh in when you can/.test(steps), 'not just the scale, which is half of it');
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
t(order.length===5, 'five rows, the five on his screen', order.join(' / '));
t(order[3].indexOf('Home Screen')>=0, 'in his order');
/* THE ROW HE WANTS IS NOT THE LAST ONE, because on a real phone it is not -
   and without something under it the list ended halfway up the sheet with a
   block of dead grey beneath it. */
t(order[4]==='Markup', 'and something under it, the way the real sheet has');
t((share.match(/hit:true/g)||[]).length===1, 'exactly one row is the destination');
t(/Add to Home Screen', hit:true/.test(share.replace(/\s+/g,' ')) || /hit:true/.test(share.slice(share.indexOf('Add to Home Screen')-40)),
  'and it is Add to Home Screen');
t((share.match(/<svg /g)||[]).length===5, 'each row carries its own icon, drawn');
/* NOBODY'S CONTACTS. The real sheet's top row is other people's names and
   faces - his screenshot has four of them on it, by name. A demo does not need
   them and must never put somebody's friends on a stranger's setup screen. */
const homeSrc=slice("  if(st.type==='home'){","  if(st.type==='multi'){");
const homeDraw=homeSrc.replace(/\/\*[\s\S]*?\*\//g,'');
t(!/AirDrop|Messages|MacBook|Lailee|Gioia/.test(homeDraw),
  'and no real contacts are drawn into it');
t(!/obShPpl|avatar/i.test(homeDraw), 'there is no people row at all');

/* SAFARI GOES STRAIGHT THERE. EVERYTHING ELSE HAS A MENU IN THE WAY (Yusuf,
   14 Sep, with two screenshots off his own phone): "you might need to hit
   share first in this animation and scroll down." He is on Chrome, where the
   dots open a CHROME menu whose first row is Share, and only that opens the
   iOS sheet. An animation that skipped it would have people tap the dots, not
   find Add to Home Screen on the menu in front of them, and stop. */
t(/var viaMenu = \(plat!=='ios'\);/.test(homeSrc), 'the extra step is decided by which browser they are in');
t(/viaMenu[\s\S]{0,80}?obMenu/.test(homeSrc), 'and only drawn when it is real');
t(/<span>Share<\/span>/.test(homeSrc), 'the menu names the row they have to press');
t(/\(viaMenu\?'<li>Tap <b>Share<\/b><\/li>':''\)/.test(homeSrc),
  'and the written steps gain that step too, never on Safari');
/* Safari's toolbar button opens the sheet directly, so putting a step on its
   screen that is not on their phone would be worse than leaving it out. */
t(/_OB_SHARE_GLYPH/.test(homeSrc), 'the toolbar button and the Share row are the same drawing');

console.log('\n  AND THE SCROLL IS SHOWN, NOT JUST SAID:');
/* "Scroll down to Add to Home Screen" is the step people actually miss - on a
   real phone the list sits well below the site row and the icons. */
t(/obShTrack/.test(homeSrc), 'the sheet has a track inside a fixed window');
t(/\.obSheet\.scrolled \.obShTrack\{transform:translateY\(-\d+px\)/.test(src),
  'and scrolling it is what moves the list into view');
t(/classList\.add\('scrolled'\)/.test(src), 'which the loop actually does');

const home=slice('function _obHomeRun(){','\nfunction _obDemoVisibility');
t(/_obDemoStop\(\)/.test(home), 'it stops anything already running before it starts');
t(/classList\.add\('tap'\)/.test(home), 'the button gets pressed');
t(/classList\.add\('up'\)/.test(home), 'the sheet comes up');
t(/classList\.add\('lit'\)/.test(home), 'and the row he wants lights up');
t(/at\(MS_DEMO_HOLD, run\)/.test(home),
  'and it holds as long as the other three before looping');
/* ONE TIMER IN THIS OVERLAY, NEVER TWO. Running through the same handle means
   leaving the screen, backgrounding the tab and closing setup all stop it for
   free - the three things that already stop a demo. */
/* ONE TIMER IN THIS OVERLAY, NEVER TWO. Running through the same handle means
   leaving the screen, backgrounding the tab and closing setup all stop it for
   free - the three things that already stop a demo. */
t((home.match(/setTimeout\(/g)||[]).length===(home.match(/_obDemoT=setTimeout\(/g)||[]).length,
  'every one of its timers goes through the demo handle',
  (home.match(/setTimeout\(/g)||[]).length+' timers');
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
