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
function slice(a,b){ const i=src.indexOf(a); return i<0?'':src.slice(i, src.indexOf(b,i)); }

const CL=closure(['_OB_STEPS','_OB_EQUIP','_OB_EXP','_OB_FOOD','_OB_MUS','_OB_PHASE']);
t(!CL.unparsable || !CL.unparsable.length, 'the flow lifted cleanly', JSON.stringify(CL.unparsable||[]));
global.window={};
eval(CL.code||'');

console.log('\n  EVERY QUESTION HE LISTED HAS ITS OWN SCREEN:');
const keys=_OB_STEPS.map(s=>s.k);
['gender','birthday','height','weight','train_days',
 'equipment','experience'].forEach(function(k){
  t(keys.indexOf(k)>=0, k);
});
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
t(keys[keys.length-1]==='plan', 'and it ends on their plan, not on a form');
t(_OB_STEPS.filter(s=>s.q||s.type==='intro'||s.type==='plan').length===_OB_STEPS.length,
  'every screen asks exactly one thing');

console.log('\n  SCREEN ONE IS A PROMISE AND NOTHING ELSE:');
/* Yusuf, seeing the first build on his phone: "too many words - just start with
   a promise - welcome to your last fitness tracker". */
const intro=slice("if(st.type==='intro'){", "if(st.type==='pick'){");
t(/Welcome to your last fitness tracker\./.test(intro), 'it opens on the promise');
t(!/Fourteen questions|Two minutes/.test(intro),
  'it does not brief them on the flow they have not agreed to yet');
t(!/calisthenics/.test(intro), 'and the who-it-is-not-for line is not here');
/* Yusuf, 12 Sep, picking from four drafts: the promise, then three verbs. */
t(/Track your food\./.test(intro) && /Track your training\./.test(intro) &&
  /Watch the number move\./.test(intro), 'then three lines, three verbs');
t(!/[Bb]uild your workout/.test(intro),
  'and nothing on it promises a builder that is not on the screen yet');
t((intro.match(/<div>/g)||[]).length===3, 'exactly three of them, no fourth',
  String((intro.match(/<div>/g)||[]).length));
const steps=slice('var _OB_STEPS=[', 'var _ob=null;');
t(/q:'What do you have access to\?'/.test(steps),
  'equipment asks what they can walk into, not what they own');
const eq=slice('var _OB_EQUIP=[','var _OB_EXP=[');
t(/A commercial gym/.test(eq) && /An apartment gym/.test(eq) && /A home gym/.test(eq),
  'commercial, apartment, home - his three');
t(!/hotel/i.test(eq), 'and nobody is asked whether they are in a hotel gym');
t(!/Barbell, dumbbells, a bench/.test(eq),
  'and the app stops telling people what is in their own home gym');
const ex=slice('var _OB_EXP=[','/* WHAT THEY CAN WALK INTO');
const ex2=slice('var _OB_EXP=[','var _OB_MUS=');
t(/Beginner/.test(ex2) && /Intermediate/.test(ex2) && /Advanced/.test(ex2),
  'experience is beginner, intermediate, advanced');
t(!/I know my way around/.test(ex2), 'and "I know my way around" is gone');
t(/q:'What is your experience level\?'/.test(steps), 'asked as a level, not as a length of time');

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
const plan=slice('function _obPlanHtml(){','function _obTargets(){');
t(/You eat for the body underneath the fat/.test(plan),
  'and the plan screen says WHY that number is not their scale weight');

console.log('\n  WEEK ONE ONLY — NO PROJECTION:');
t(/This week has one job/.test(plan), 'the plan gives them one job');
t(!/weeks? to go|goal date|by [A-Z][a-z]+ \d|on track to/.test(plan),
  'and never shows a date they hit the goal');
t(/We are not looking at that yet\. One week at a time\./.test(plan),
  'a big goal is explicitly parked');

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
['height','cardio','sleep'].forEach(function(k){
  const i=src.indexOf("if(st.type==='"+k+"')");
  const b=(i<0?'':src.slice(i, src.indexOf("if(st.type===", i+20)));
  t((b.match(/<input/g)||[]).length>=2, '  the '+k+' screen really does have two boxes',
    String((b.match(/<input/g)||[]).length));
});

console.log('\n  THEIR ANSWERS SURVIVE A BAD NETWORK:');
const fin=slice('async function obFinish(){','function obRender()');
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
t(fin.indexOf('localStorage.removeItem(_obSetupKey())') > fin.indexOf('if(!ok){'),
  'and the local copy is only cleared AFTER the server took it');

console.log('\n  IT WRITES WHERE THE APP ALREADY READS:');
['gender','birthday','age','height','weight','start_weight','goal_weight','phase',
 'train_days','cardio_days','cardio_min','bed_time','wake_time','intake_json','setup_done']
 .forEach(function(c){ t(new RegExp(c+':').test(fin), 'profiles.'+c); });
t(/food_method|equipment|experience|priority/.test(fin),
  'and the four with no column of their own ride in intake_json');

console.log(bad? '\n  '+bad+' FAILED\n' : '\n  all good ('+keys.length+' screens)\n');
process.exit(bad?1:0);
