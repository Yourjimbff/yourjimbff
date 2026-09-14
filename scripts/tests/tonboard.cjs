// FIRST OPEN — the whole setup, one question at a time.
//
// Yusuf, 12 Sep, picked the long version outright: "the full setup, one screen
// at a time... they arrive fully set up."
//
// WHAT A FREE USER GOT BEFORE THIS, seen live on the served build signed in as
// the new `freeuser` code: nothing at all. An empty Day reading "No program set
// up yet", a box asking for their phone number so YUSUF could text them, a
// "Calls with Yusuf" section, and Breakfast and Lunch already marked Skipped.
// The setup that existed was two cards on the Progress page (_gpSecYou,
// _gpSecGoal) and nothing ever sent anyone to them. The older #sSetup screen is
// dead markup - every line in the file only ever sets its display to 'none'.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const {closure}=require('./_lift.cjs');
let bad=0; const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };
function slice(a,b){ const i=src.indexOf(a); if(i<0) return ''; const j=src.indexOf(b,i); if(j<0) throw new Error('stale end anchor, this suite was reading the rest of the file: '+b); return src.slice(i,j); }

const CL=closure(['_OB_STEPS','_OB_EQUIP','_OB_ACTIVE','_OB_FOOD','_OB_MUS','_OB_PHASE']);
t(!CL.unparsable || !CL.unparsable.length, 'the flow lifted cleanly', JSON.stringify(CL.unparsable||[]));
global.window={};
eval(CL.code||'');

console.log('\n  EVERY QUESTION HE LISTED HAS ITS OWN SCREEN:');
const keys=_OB_STEPS.map(s=>s.k);
['gender','birthday','height','weight',
 'active'].forEach(function(k){
  t(keys.indexOf(k)>=0, k);
});
/* 13 Sep, two more off the flow, both in his words.
   train_days: "I believe someone should be working out everyday. that's my
               belief, it's baked in now. fitness or training is daily, I'd
               rather use it as a selling point." A question you already know
               the answer to is not a question - and "the week you have, not
               the week you want" invited somebody to negotiate themselves down
               before they had started. Seven, for everybody, said out loud on
               the Week One screen.
   equipment:  replaced by the thing his whole method turns on - "what are your
               strengths & weaknesses? and then it's just a run down of all the
               muscle groups, organized". */
['train_days','equipment'].forEach(function(k){
  t(keys.indexOf(k)<0, '  '+k+' is off the flow');
});
t(/var OB_TRAIN_DAYS=7;/.test(src), 'and seven is a constant, not a default a screen could argue with');
t(!/a\.train_days/.test(src), 'nothing reads a training-days ANSWER any more');
t((src.match(/train_days:OB_TRAIN_DAYS/g)||[]).length===2,
  'both the calorie engine and the saved profile take it from that one place',
  (src.match(/train_days:OB_TRAIN_DAYS/g)||[]).length);
/* CUT, 12 Sep, screen by screen, in his words.
   food:     "that question doesn't need to be there... just remove that
              question in general" - and "whole foods" means nothing to somebody
              who has not been coached.
   phase:    "right now we shouldn't even have the choice to do that because it
              doesn't look very - we haven't come up with that. Select your mode
              will be added later."
   priority: "anything you want to bring up? Why the fuck... this looks fucking
              AI written." It comes back as a muscle-connection assessment.
   cardio:   "why would I decide how much cardio? If a person is left to decide
              how much cardio they should do..." - it gets prescribed, not asked.
   sleep:    "that is such a random question to ask at that point... I don't
              think that's even really needed" right now. */
['food','phase','priority','cardio','sleep'].forEach(function(k){
  t(keys.indexOf(k)<0, '  '+k+' is off the flow');
});
/* Yusuf, 12 Sep: "weight and goal weight should be... two separate fields on
   one page". They are one thought; they were two taps apart. */
t(_OB_STEPS.filter(s=>s.type==='weight2').length===1, 'weight and goal share one screen');
t(keys.indexOf('goal_weight')<0, 'and goal weight is no longer a screen of its own');
t(keys[0]==='intro', 'it opens by saying what this is, before anything personal is asked');
/* It ended on the plan until 13 Sep: "I'd prefer this be a sign in to the home
   screen, and save this to your home screen ... then go to home screen." The
   plan is still the last thing they READ; the last thing they DO is put the
   icon on their phone, because a tab is something you close. */
t(keys[keys.length-1]==='home', 'and it ends by putting it on their home screen');
/* 14 Sep, his executive decision: "im making the executive decision which is
   to remove this page; i think instead it should be the tutorial". YOUR WEEK
   ONE is gone and the three things the app does are shown instead, so the last
   thing they read before the home-screen step is the third of those. */
t(keys[keys.length-2]==='t_prog', 'straight after the last of the three demos');
t(keys.indexOf('plan')<0, 'and the WEEK ONE page is off the flow entirely');
t(!/_obPlanHtml/.test(src), 'with nothing left behind to draw it');
t(_OB_STEPS.filter(s=>s.q||s.type==='intro'||s.type==='home').length===_OB_STEPS.length,
  'every screen carries exactly one thing');

console.log('\n  SCREEN ONE IS A PROMISE AND NOTHING ELSE:');
/* Yusuf, seeing the first build on his phone: "too many words - just start with
   a promise - welcome to your last fitness tracker". */
const intro=slice("if(st.type==='intro'){", "if(st.type==='pick'){");
t(/Welcome to your last fitness tracker\./.test(intro), 'it opens on the promise');
t(!/Fourteen questions|Two minutes/.test(intro),
  'it does not brief them on the flow they have not agreed to yet');
t(!/calisthenics/.test(intro), 'and the who-it-is-not-for line is not here');
/* Yusuf, 12 Sep, picking from four drafts: the promise, then three verbs.
   13 Sep, tightening it: "watch the number move should just be track your
   progress." That line was a promise about the scale, made to somebody who has
   not logged anything yet, and it was the only one of the three that was not a
   thing they DO. */
t(/Track your food\./.test(intro) && /Track your training\./.test(intro) &&
  /Track your progress\./.test(intro), 'then three lines, and the same verb three times');
t(!/Watch the number move/.test(src), 'the scale promise is gone');
t(!/[Bb]uild your workout/.test(intro),
  'and nothing on it promises a builder that is not on the screen yet');
t((intro.match(/<div>/g)||[]).length===3, 'exactly three of them, no fourth',
  String((intro.match(/<div>/g)||[]).length));
const steps=slice('var _OB_STEPS=[', 'var _ob=null;');
/* BOTH OF THEM ARE OFF THIS FLOW NOW. Equipment went on 13 Sep (a question
   about a room, not about them); strengths and weaknesses replaced it and then
   left too on 14 Sep - "it is genuinely a lot of questions ... it might be
   worth putting in the training tab instead, before accessing programs".
   The options survive as _OB_EQUIP, unreferenced, the same way restTextSet
   does. If a room question is ever wanted again it is a line in _OB_STEPS. */
t(keys.indexOf('muscles')<0, 'and strengths and weaknesses is off the flow too');
t(!/type:'mus'/.test(steps), 'with no step left carrying it');
t(!/function obMus\(/.test(src), 'and the setup-only picker gone with it');
/* The only survivor of "hotel gym" is the comment recording why it went, which
   is what that comment is for. */
t(!/t:'[^']*hotel/i.test(src), 'and nobody is asked whether they are in a hotel gym');
t(!/Barbell, dumbbells, a bench/.test(src),
  'and the app stops telling people what is in their own home gym');

console.log('\n  SEVENTEEN MUSCLES, EACH ONE NAMING ITS LIFT:');
/* Yusuf, 13 Sep, handing over his own Physical Questionnaire: "muscles
   (corresponding exercises) ------ weak or strong ... break it down by muscle
   groups: push pull core legs". A muscle on its own is a word; a muscle with
   its lift beside it is a thing you have either felt working or you have not,
   and that is the whole question. */
const mus=slice('var MI_MUSCLES = [','var MI_BY_KEY=');
const ms=slice('function msRender(){','\nfunction msSkip');
[['pec_major','Chest press'],['upper_pec','Incline chest press'],
 ['front_delts','Shoulder press'],['side_delts','Lateral raises'],
 ['triceps','Tricep extensions'],['traps','Shrugs'],
 ['rear_delts','Rear delt flys'],['outer_back','Pull ups, lat pulldowns'],
 ['centre_back','Rows, deadlifts'],['low_back','Back extensions'],
 ['biceps','Curls'],['abs','Sit ups, leg raises'],
 ['obliques','Side crunches, twists'],['quads','Lunges, leg extensions'],
 ['glutes','Hip thrusts'],['hamstrings','Hamstring curls'],
 ['calves','Calf raises']].forEach(function(pair){
  t(new RegExp("k:'"+pair[0]+"'[\\s\\S]{0,80}?x:'"+pair[1].replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+"'").test(mus),
    '  '+pair[0]+' \u2192 '+pair[1]);
});
t(/var MI_GROUPS=\['Push','Pull','Core','Legs'\];/.test(src), 'grouped push, pull, core, legs - his order');
/* Low back sat under Core. His own list puts it at the foot of pull, and back
   extensions are a pull movement. */
t(/k:'low_back'[\s\S]{0,90}?group:'Pull'/.test(mus), 'low back moved to pull, where he put it');
/* Forearms is not on his questionnaire, but it is in the Strength Check, which
   is a longer conversation than the first two minutes of the app. */
t(/k:'forearms'[\s\S]{0,110}?intake:false/.test(mus), 'forearms stays in the Strength Check and off the setup screen');
t(/function miIntakeMuscles\(sex\)/.test(src), 'and one function decides which is which');

console.log('\n  AND THE ONE QUESTION A WOMAN IS NOT ASKED:');
/* Yusuf, 13 Sep: "main differentiating factor here is that females dont need
   the traps question, they wont be doing shrugs." He had already ruled that
   men and women get the same list - "everyone should be the same, male and or
   female" - so this is the single exception he carved out of his own rule, and
   it is carved at SETUP ONLY. The Strength Check keeps all eighteen: a woman
   who does shrug can still rate it there, and nobody loses a rating they have
   already given. What comes off is the QUESTION. */
t(/k:'traps'[\s\S]{0,110}?intakeSex:'male'/.test(mus), "traps is marked as a men's question");
t((mus.match(/intakeSex:/g)||[]).length===1, 'and it is the only muscle in the list that is sexed',
  String((mus.match(/intakeSex:/g)||[]).length));
const MI=closure(['MI_MUSCLES','miIntakeMuscles']);
t(!MI.unparsable || !MI.unparsable.length, 'the muscle list lifted cleanly', JSON.stringify(MI.unparsable||[]));
eval(MI.code||'');
const _f=miIntakeMuscles('female').map(m=>m.k);
const _m=miIntakeMuscles('male').map(m=>m.k);
const _u=miIntakeMuscles('').map(m=>m.k);
t(_f.indexOf('traps')<0, 'a woman is never asked about shrugs');
t(_f.length===16, 'sixteen questions for her, not seventeen', String(_f.length));
t(_m.indexOf('traps')>=0, 'a man still is');
t(_m.length===17, 'seventeen for him', String(_m.length));
/* An unknown sex shows everything. A question is only dropped when there is a
   reason, never on a guess - and setup asks gender before it asks this, so in
   practice the guess never has to be made. */
t(_u.indexOf('traps')>=0, 'and an answer nobody gave yet drops nothing');
t(_u.length===17, 'so the unsexed list is the full setup list', String(_u.length));
/* The only thing either list drops is forearms, which is not on his
   questionnaire at all. Everything else is a matter of sex, and there is
   exactly one of those. */
t(MI_MUSCLES.length===18, 'while the Strength Check still carries all eighteen', String(MI_MUSCLES.length));
t(MI_MUSCLES.filter(m=>m.k==='traps').length===1, 'traps among them, rateable by anyone who wants to');
/* The screen has to pass the answer through, or the filter is a function that
   is never asked a question. */
t(/miIntakeMuscles\(sex\)/.test(ms), 'and the screen hands it the gender on their profile');

console.log('\n  ASKED AT THE PROGRAM DOOR, NOT IN THE FIRST TWO MINUTES:');
/* Yusuf, 14 Sep: "it might be worth putting in the training tab instead,
   before accessing programs." */
const bs=slice('function pgBuildStart(){','function _pgBuildGo(){');
t(/msAsked\(\)/.test(bs) && /msOpen\(\)/.test(bs), 'tapping Build a program opens it first');
t(/return;/.test(bs), 'and the builder does not also draw behind it');
/* ONE DOOR. The blank log's "Rather plan it?" line and the Program tab's own
   hero both call pgBuildStart, so one gate covers both. */
t((src.match(/pgBuildStart\(\)/g)||[]).length>=3, 'both ways in go through the one gate',
  String((src.match(/pgBuildStart\(\)/g)||[]).length));
t(!/pgBuildStart\(\)\{[\s\S]{0,120}?window\._pgBuilding=true/.test(src),
  'the gate runs before anything sets the building flag');

console.log('\n  GOOD AND BAD ON THE SCREEN, strong AND weak IN THE TABLE:');
t(/>Good</.test(ms) && />Bad</.test(ms), 'the buttons say what he asked them to say');
t(!/>Strong</.test(ms) && !/>Weak</.test(ms), 'and no longer say Strong and Weak');
t(/Are you good at these, or bad\?/.test(ms), 'asked the way he asked it');
t(/This goes into building your program\./.test(ms), 'and it says what the answer is for');
/* RENAMING A BUTTON IS NOT A REASON TO MIGRATE A TABLE. The Strength Check,
   the pre-call brief and every mi_checkins row already speak strong/weak. */
t(/msPick\('+[^']*',\s*'strong'\)|\\'strong\\'/.test(ms), 'Good still stores strong');
t(ms.indexOf("\\'weak\\'")>=0, 'and Bad still stores weak');

console.log('\n  AND WHAT THEY SAY IS THEIR BASELINE, NOT A SECOND OPINION:');
const fin2=slice('async function _msCommit(picks, skipped){','\n}');
t(/sbInsert\('mi_checkins', _mrow\)/.test(fin2), 'it writes the row the Strength Check already reads');
t(/kind:'baseline'/.test(fin2), 'as their baseline');
t(/_rt\[k\]=\{r:clean\[k\]\}/.test(fin2), 'in the same shape miCommit writes');
t(fin2.indexOf("sbUpsert('profiles'") < fin2.indexOf("sbInsert('mi_checkins'"),
  'after the profile, so a saved answer is never reported as failed because one extra table was missing');
t(/sqPush\('mi_checkins', _mrow, 'POST'\)/.test(fin2), 'and it queues if the network is not there');
t(/j\.muscles=clean;/.test(fin2), 'the answers ride in intake_json too, which is what the pre-call brief reads');
t(/j=Object\.assign\(\{\}, j\|\|\{\}\);/.test(fin2),
  'merged into the intake they already have, never written over the top of it');

console.log('\n  ASKED ONCE, AND A SKIP IS AN ANSWER:');
t(/j\.muscles_at=/.test(fin2), 'every trip through here records that they were asked');
t(/function msSkip\(\)\{ _msCommit\(\{\}, true\); \}/.test(src),
  'including a skip, so nobody is asked again every time they build');
const asked=slice('function msAsked(){','\n}');
t(/j\.muscles && Object\.keys\(j\.muscles\)\.length/.test(asked),
  'and anybody who answered on the old setup screen is not asked a second time');
t(/if\(skipped\)\{ msClose\(\); _pgBuildGo\(\); return; \}/.test(fin2),
  'a skip that failed to save still opens the builder - it is not worth a roadblock');
t(/f\.textContent='That did not save/.test(fin2),
  'but seventeen taps that failed to save say so and stay on the screen');

console.log('\n  SAVE IT TO YOUR HOME SCREEN:');
const home=slice("  if(st.type==='home'){","  if(st.type==='multi'){");
t(/Add to Home Screen/.test(home), 'it says the words iOS says');
t(/Tap the share button at the bottom/.test(home), 'and points at the right control on iOS Safari');
t(/Tap the \\u00b7\\u00b7\\u00b7 at the bottom right/.test(home), 'the dots on iOS Chrome');
t(/Tap the \\u22ee at the top right/.test(home), 'and the other dots on Android');
t(/class="obRing" id="obRing"/.test(home), 'the button is circled');
/* THE ARROW WENT WITH THE STILL PICTURE (14 Sep). It pointed at a button in a
   drawing that never did anything; the drawing now performs the whole thing,
   so a second graphic pointing at it is one thing too many. */
t(!/class="obPoint"/.test(home), 'and the arrow that pointed at a still picture is gone');
t(/id="obSheet"/.test(home), 'because the share sheet comes up instead');
t(/function _obInstalled\(\)/.test(src), 'and somebody already installed never sees it');
t(/if\(!_obInstalled\(\) && _obStepIndex\('home'\)>=0\)/.test(src), 'checked before it is shown');
t(/st\.type!=='home'/.test(src), 'it carries its own Done and no second button');
/* ARE YOU ACTIVE RIGHT NOW (Yusuf, 14 Sep). "What is your experience level?"
   was still on the flow four versions after he picked this, which he caught:
   "this question is still here?" It was.
   Two things were wrong with it. His own: "for what? this might not have
   context anymore." And one the file showed: the answer was written to
   intake_json.experience and NO line in the app ever read it back - not the
   calories, not the builder, not one display. Same fault as the training-days
   question and the equipment question before it. */
const ex2=slice('var _OB_ACTIVE=[','var _OB_MUS=');
t(/q:'Are you active right now\?'/.test(steps), 'asked about this week, not about a CV');
t(!/experience level/.test(src), 'and nobody is asked to grade themselves any more');
t(!/_OB_EXP\b/.test(src), 'with the old list gone rather than left lying about');
[['Not yet','none'],['On and off','some'],['Every week','weekly']].forEach(function(p){
  t(new RegExp("v:'"+p[1]+"'[\\s\\S]{0,30}?t:'"+p[0]+"'").test(ex2), '  '+p[0]+' \u2192 '+p[1]);
});
t(!/Beginner|Intermediate|Advanced/.test(ex2), 'no beginner, intermediate, advanced');
/* Every answer says what it MEANS underneath, the same shape as the mode
   screen - a name and a line, not a word to be compared against strangers. */
t((ex2.match(/s:'/g)||[]).length===3, 'each one says what it means');

console.log('\n  FEW WORDS, BETTER WORDS:');
/* Yusuf, 12 Sep, on "What do you weigh today? Rough is fine. It only has to
   start somewhere.": "What the fuck is that, bro? Why'd you make this, like,
   really fucking wordy?" And on "Where do you want to land?": "Am I a fucking
   airplane?" And on the mode options: "They're fucking filler text, dude." */
t(!/Rough is fine/.test(steps), 'the weigh-in padding is gone');
t(!/Where do you want to land/.test(steps), 'and so is the airplane');
t(!/How hard do you want to run this/.test(steps), 'and so is "run this"');
/* The mode table stays in the file untouched - _fuelTargets reads comp,
   fatloss and build, and obFinish still writes one. It is the SCREEN that is
   parked, not the concept. */
const ph=slice('var _OB_PHASE=[','var _OB_STEPS=[');
['comp','fatloss','build'].forEach(function(v){
  t(new RegExp("v:'"+v+"'").test(ph), '  '+v+' survives, so _fuelTargets is untouched');
});
t(/phase:a\.phase\|\|'comp'/.test(slice('async function obFinish(){','function _gpFirstRun')),
  'and a flow with no mode screen still writes a phase');
/* No question and no subtitle in the whole flow runs past a phone line. */
_OB_STEPS.forEach(function(st){
  if(st.q) t(st.q.length<=34, '  short question: '+st.q, String(st.q.length));
  if(st.s) t(st.s.length<=54, '  short subtitle: '+st.s, String(st.s.length));
});

console.log('\n  THE CALORIES ARE THE ENGINE THE APP ALREADY HAS:');
const tg=slice('function _obTargets(){','function obRender(){');
t(/return _fuelTargets\(\);/.test(tg), 'it calls _fuelTargets rather than inventing a second formula');
t(/profile=keep;/.test(tg) && /finally/.test(tg),
  'and it puts the live profile back afterwards, even if that throws');
const fuel=slice('function _fuelTargets(){','function _fuelRanges(){');
t(/var gw=parseFloat\(profile&&\(profile\.goal_weight/.test(fuel),
  'which eats from GOAL weight, not scale weight - his whole principle, already shipped');
t(/var prot=Math\.round\(gw\);/.test(fuel), 'and sets protein at goal weight in grams');
/* THE NUMBERS OUTLIVED THE PAGE THEY WERE ON. Yusuf, 14 Sep: "it should say
   on the food page, these are your nutrition goals based on your goals."
   The Week One page had promised in writing that these would not be lost, so
   deleting it without giving them a home would have made that a lie. */
const goal=slice('function fdGoalHtml(){','\n}');
t(/Your nutrition goals/.test(goal), 'the numbers now live on the Food page');
t(/_fuelTargets\(\)/.test(goal) && !/gw\*|\*\s*0\.|Math\.round\(w\s*\*/.test(goal),
  'printed from the one engine, not computed a second time');
['calories','protein','carbs','fat'].forEach(function(w){
  t(new RegExp('<i>'+w+'</i>').test(goal), '  '+w);
});
t(/You eat for the body underneath the fat/.test(goal),
  'and it still says WHY that number is not their scale weight');
t(!/weeks? to go|goal date|by [A-Z][a-z]+ \d|on track to/.test(goal),
  'and never shows a date they hit the goal');
/* His ask, exactly: "somewhere they can click x and close the subtext /
   explanation and just keep the numbers there." */
t(/fdWhyClose\(\)/.test(goal) && goal.indexOf('\u00d7</i>')>=0, 'the explanation closes with an x');
t(/_fdWhyHidden\(\)/.test(goal), 'and the numbers stay when it does');
t(/fdWhyOpen\(\)/.test(goal), 'a closed explanation can be opened again, so one stray tap is not final');
t(/localStorage\.setItem\(_fdWhyKey\(\),'1'\)/.test(src), 'and closing it is remembered');
t(/gw>0 && w>0 && gw!==w/.test(goal),
  'somebody already at their goal weight is never told their food is built from a weight they are at');
t(/if\(!T \|\| !\(\+T\.cal>0\)\) return '';/.test(goal),
  'and no targets draws no card, rather than a card of dashes');

console.log('\n  RIGHT NOW IT REACHES ONE ACCOUNT AND NO OTHER:');
const should=slice('function _obShouldRun(srv){','function _obStep(){');
/* Yusuf, having seen it on his own phone: "the only person it should be on
   right now is freeuser". A list with one name on it, checked first - and it
   is now the SAME list that decides which surfaces are coach furniture, so
   there is one place to add the next free code. */
t(/var FREE_APP_CODES=\{freeuser:1\};/.test(src), 'there is a list, and freeuser is on it');
t(/if\(!isFreeApp\(cl\.code\)\) return false;/.test(should),
  'and any code not on that list is turned away before anything else is read');
t(should.indexOf('isFreeApp') < should.indexOf('setup_done'),
  'it is the FIRST thing checked, not the last');
t(!/_OB_ONLY/.test(src), 'the old one-off list is gone - one list now, not two');

console.log('\n  AND IT RUNS ONCE, ONLY FOR SOMEONE WHO NEEDS IT:');
t(/if\(cl\.is_trainer\) return false;/.test(should), 'never for a trainer');
t(/if\(srv\.setup_done\) return false;/.test(should), 'never for someone already set up');

console.log('\n  IT JUDGES THE SERVER ROW AND NEVER THE STAND-IN:');
/* THE DEFECT THAT MADE IT UNREACHABLE (Yusuf, 12 Sep): "I don't see the free
   user having the onboarding screen at all." An account with no profiles row
   is handed a local stand-in carrying goal 'maintain', cal_target 1800 and
   protein_target 150 so the Day page has numbers to draw. Three of those sit
   on the signs-of-life list, so the gate read the app's own invented numbers
   as a filled-in profile and stood down for everybody, forever. */
t(/function _obShouldRun\(srv\)\{/.test(src), 'the gate is handed the server row');
t(!/profile\[known\[i\]\]/.test(should),
  'and it never reads the merged profile, which is never empty for anyone');
t(/var v=srv\[known\[i\]\];/.test(should), 'it reads the server row instead');
t(/if\(srv===null \|\| srv===undefined\) return true;/.test(should),
  'no row on the server at all means brand new, which is the case that was unreachable');
t(/var _obSrv=\(profiles && profiles\.length>0\) \? profiles\[0\] : null;/.test(src),
  'and the row handed in is the one the server actually answered with');
t(/obStart\(0, _obSrv\)/.test(src),
  'it is fired only after the SERVER profile row has landed');
t(/goal:'maintain', cal_target:1800/.test(src),
  'the stand-in that caused this is still there for the Day page - it is just not judged any more');

/* HE SAW IT ON HIS OWN PHONE: "remove this for clients. you just placed this on
   every client or something." The first gate wanted weight AND goal_weight AND
   height together, and height is free text plenty of clients never filled - one
   empty field made a two-year client look brand new. */
t(/var known=\[/.test(should), 'the gate reads a whole list of signs of life');
['weight','goal_weight','age','gender','height','phase','goal','train_days',
 'cal_target','protein_target','split_key','birthday'].forEach(function(c){
  t(new RegExp("'"+c+"'").test(should), '  '+c+' alone is enough to stand down');
});
t(/if\(v!==null && v!==undefined && v!=='' && v!==0\) return false;/.test(should),
  'and ANY one of them present means this is not a new person');
t(!/profile\.weight && profile\.goal_weight && profile\.height/.test(should),
  'the old all-three test is gone - it is what let this reach real clients');

console.log('\n  THE WAY FORWARD IS REACHABLE WITH A KEYBOARD UP:');
/* A client, 12 Sep: she "got stuck on the height question and isnt letting her
   move forward". Height is the first screen with a typing keyboard on it, and
   the button was pinned to the bottom of a fixed column - the keyboard came up
   over it. */
const rend=slice('function obRender(){','async function obFinish(){');
t(rend.indexOf('obGo') > rend.indexOf("'<div class=\"obScroll\">'") &&
  rend.indexOf('obGo') < rend.lastIndexOf("+'</div>'"),
  'the button is INSIDE the scroller, so it can always be scrolled to');
t(/padding-bottom:46vh/.test(src),
  'and there is room under it for a keyboard to sit');
t(/enterkeyhint/.test(rend), 'the keyboard paints its own key next/done');

console.log('\n  AND "NEXT" MEANS THE NEXT BOX, NOT THE NEXT SCREEN:');
/* Yusuf, 12 Sep, on the first version of that handler: "the number field in
   the height section is what is not working. You can write the number in the
   feet, but not the inches."
   It called obNext() from EVERY field. Height counts as answered on feet
   alone, so typing 5 and pressing the key the keyboard had painted "Next"
   left the screen entirely - which is indistinguishable, to the person
   holding the phone, from an inches box that will not take a number. Cardio
   and sleep have two boxes each and carried the same trap. */
t(/var isLast=\(ix===ins\.length-1\);/.test(rend),
  'the handler knows whether this is the last box on the screen');
t(/el\.setAttribute\('enterkeyhint', \(isLast\?'done':'next'\)\);/.test(rend),
  'the word painted on the key comes from that same fact');
t(/if\(!isLast\)\{ try\{ ins\[ix\+1\]\.focus\(\); \}catch\(e\)\{\} return; \}/.test(rend),
  'a middle box moves to the next box and goes no further');
t(rend.indexOf('ins[ix+1].focus()') < rend.indexOf('obNext();'),
  'and it returns BEFORE obNext can be reached');
t(/try\{ el\.blur\(\); \}catch\(e\)\{\}\s*\n\s*obNext\(\);/.test(rend),
  'only the last box drops the keyboard and moves the screen');
/* The screens this actually protects. If a two-box screen is ever added, it is
   covered by the same rule - but these three are the ones that were broken. */
/* sleep came out of the flow entirely on 12 Sep and took its two native time
   pickers with it - see tobwidth.cjs. These two are what the rule protects. */
['height','cardio'].forEach(function(k){
  const i=src.indexOf("if(st.type==='"+k+"')");
  const b=(i<0?'':src.slice(i, src.indexOf("if(st.type===", i+20)));
  t((b.match(/<input/g)||[]).length>=2, '  the '+k+' screen really does have two boxes',
    String((b.match(/<input/g)||[]).length));
});

console.log('\n  THEIR ANSWERS SURVIVE A BAD NETWORK:');
const fin=slice('async function obFinish(){','/* ===== THE FIRST MINUTE');
t(/localStorage/.test(src.slice(src.indexOf('function _obSetupStash()'), src.indexOf('function obStart('))),
  'every answer is written to this device as it is given');
/* A TOAST WAS NOT ENOUGH (Yusuf, 12 Sep: "when I hit start absolutely nothing
   thanks a lot for that asshole"). Start WAS working; every write it made was
   being refused by the session guard, and the only thing that said so slid
   away in three seconds. */
t(/var box=document\.getElementById\('obFail'\);/.test(fin),
  'a failed save writes the reason onto the card, where it stays');
t(/if\(_sessionFlipped\(\)\)/.test(fin),
  'and when the reason is the session guard it says THAT, not "try again"');
t(/Stay as them/.test(src), 'which names the button that actually fixes it');
t(/if\(btn\)\{ btn\.disabled=false; btn\.textContent='Start'; \}/.test(fin),
  'and the button comes back rather than sitting there dead');

console.log('\n  THE NUMBERS ON THE LAST SCREEN FOLLOW THEM IN:');
/* Caught by running the flow through as a beginner on the served build: every
   answer landed and cal_target came back null. The Day page then falls back to
   its 1800 stand-in and prints no target at all - one screen after promising
   in writing that these numbers live there now. */
t(/row\.cal_target=Math\.round\(_T\.cal\)/.test(fin), 'the calorie target is written');
t(/row\.protein_target=Math\.round\(_T\.prot\)/.test(fin), 'and the protein target with it');
t(/var _T=_obTargets\(\);/.test(fin), 'from the same engine the Food page draws');
t(/if\(_T && _T\.cal>0\)/.test(fin), 'and never a zero, which would read as a real choice');
t(/These sit on your Day page from now on/.test(src), 'which is what the screen promises out loud');
t(fin.indexOf('localStorage.removeItem(_obSetupKey())') > fin.indexOf('if(!ok){'),
  'and the local copy is only cleared AFTER the server took it');

console.log('\n  IT WRITES WHERE THE APP ALREADY READS:');
['gender','birthday','age','height','weight','start_weight','goal_weight','phase',
 'train_days','cardio_days','cardio_min','bed_time','wake_time','intake_json','setup_done']
 .forEach(function(c){ t(new RegExp(c+':').test(fin), 'profiles.'+c); });
t(/food_method|equipment|active|priority/.test(fin),
  'and the four with no column of their own ride in intake_json');
t(/active:a\.active\|\|null/.test(fin), 'the new answer is what gets written, under its own name');
t(!/experience:a\./.test(fin), 'and the old one is not still being written beside it');

console.log('\n  THE YEAR CAN BE FINISHED, AND BACK FITS:');
/* Yusuf, 13 Sep: "I'm stuck on my birth year. I'm not able to type beyond the
   1 on 1997." The box SHOWS "MM / DD / YYYY" - 14 characters with the spaces -
   and carried maxlength="10", which is exactly "09 / 27 / ". The first digit
   landed because obDate sets el.value itself and maxlength does not apply to a
   programmatic write; the second keystroke was refused. */
t(/class="obField obDate1" id="obIn" type="text" inputmode="numeric" maxlength="14"/.test(src),
  'the cap counts what is displayed, not what is typed');
t(/d=String\(el\.value\|\|''\)\.replace\(\/\\D\/g,''\)\.slice\(0,8\)/.test(src),
  'and the real limit is still eight digits, inside obDate');
/* Two different things were called .obBack - a 32x32 icon button on the
   trainer board, declared first, and this text link. Both applied. */
t(/<div class="obBk" onclick="obBack\(\)"/.test(src), 'Back wears a class of its own');
t(/\.obBk\{font-size:13px;font-weight:700/.test(src), 'with a rule nothing else shares');
t(/\.obBack\{flex:0 0 auto;width:32px;height:32px/.test(src), 'and the 32px icon button keeps its own');

console.log(bad? '\n  '+bad+' FAILED\n' : '\n  all good ('+keys.length+' screens)\n');
process.exit(bad?1:0);
