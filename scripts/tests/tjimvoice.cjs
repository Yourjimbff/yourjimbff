// Jim reads the person before he reads the plate.
//
// Built 16 Sep, after Yusuf reacted to ten real logs one at a time and every word
// was written down at Client Files/JIM-FEEDBACK-VOICE.md. Two faults were found
// in the shipped code while doing it, and both are asserted here:
//
//   1. THE GOAL FIELD LIES. profiles.goal went into the prompt as a fact. Three
//      of the ten test subjects carry a label contradicting their own two
//      weights, so three in ten were being given the opposite advice.
//   2. THE FEEDBACK WAS WITHHELD AT THE ONE MOMENT IT MATTERED. trulyBad
//      suppressed the insight, so the worst log of someone's week got silence.
//      His own reaction to the worst food of the ten was the LONGEST of them.
const fs=require('fs');
const guard=require('./_guard.cjs');
const {defOf}=require('./_lift.cjs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };

global.window={};
global.localStorage={_d:{},getItem(k){return this._d[k]==null?null:this._d[k];},setItem(k,v){this._d[k]=String(v);}};
const MINE=['_jimGoalRead','_jimGoalLine','_jimTurboUnlocked','_jimTone','_jimToneSet',
            '_jimNoCritique','_jimNoCritiqueSet','_jimToneName','_jimToneBlock','_jimTenLogs',
            /* 17 Sep: _jimToneBlock now opens every delivery with the no-dash rule */ '_jimPunct'];
eval(MINE.map(defOf).join('\n'));
eval(src.match(/var _JIM_TONE_KEY=[^\n]*\n/)[0]);
eval(src.match(/var JIM_TONES=\[[\s\S]*?\];\n/)[0]);
eval(src.match(/var JIM_TONE_DEFAULT=\d+;/)[0]);
eval(src.match(/var JIM_CLASH_LB=\d+;/)[0]);
guard(MINE, n=>eval(n));

console.log('\n  THE DIRECTION COMES OFF THE TWO WEIGHTS, NEVER THE LABEL:');
/* All three are real rows from his roster on 16 Sep. */
const zadkiel={weight:170, goal_weight:185, goal:'cut'};       // says cut, wants to GAIN 15
const nick   ={weight:165, goal_weight:175, goal:'cut'};       // says cut, wants to GAIN 10
const adriana={weight:162, goal_weight:145, goal:'maintain'};  // says maintain, LOSING 17
const alex   ={weight:184, goal_weight:145, goal:'cut'};       // agrees
t(_jimGoalRead(zadkiel).dir==='gain', 'Zadkiel is gaining, whatever his label says', _jimGoalRead(zadkiel).dir);
t(_jimGoalRead(nick).dir==='gain',    'Nick is gaining too');
t(_jimGoalRead(adriana).dir==='lose', 'Adriana is losing, not maintaining');
t(_jimGoalRead(alex).dir==='lose',    'Alex is losing, and his label agrees');
t(_jimGoalRead(zadkiel).clash===true, 'the contradiction is detected on Zadkiel');
t(_jimGoalRead(nick).clash===true,    '  and on Nick');
t(_jimGoalRead(adriana).clash===true, '  and on Adriana');
t(_jimGoalRead(alex).clash===false,   'and NOT raised on someone whose label is right');

console.log('\n  THREE IN TEN. THAT IS THE SIZE OF THE FAULT:');
const ten=[zadkiel,alex,{weight:130,goal_weight:127,goal:'cut'},{weight:170,goal_weight:165,goal:'maintain'},
  nick,{weight:180,goal_weight:145,goal:'cut'},{weight:162,goal_weight:152,goal:'cut'},
  {weight:185,goal_weight:160,goal:'cut'},{weight:224.9,goal_weight:199,goal:'cut'},adriana];
const clashes=ten.filter(p=>_jimGoalRead(p).clash).length;
t(clashes===3, 'exactly three of the ten real profiles contradict themselves', 'found '+clashes);
/* The fourth candidate, and why it is NOT one. Kelly G is saved as maintain while
   aiming five pounds down; that is how people use the word. Adriana is saved as
   maintain while dropping seventeen, which is a different claim entirely. A rule
   that cannot tell those apart flags people who are fine and gets ignored. */
t(_jimGoalRead({weight:170,goal_weight:165,goal:'maintain'}).clash===false,
  'maintain with five pounds to go is not a contradiction');
t(_jimGoalRead({weight:162,goal_weight:145,goal:'maintain'}).clash===true,
  '  but maintain with seventeen is');
t(_jimGoalRead({weight:170,goal_weight:185,goal:'cut'}).opposite===true,
  'and cut-while-gaining clashes at ANY distance, because it is a straight opposite');
t(_jimGoalRead({weight:170,goal_weight:174,goal:'cut'}).clash===true,
  '  including a four pound one');

console.log('\n  NEITHER A MISSING WEIGHT NOR A TINY GAP INVENTS A DIRECTION:');
t(_jimGoalRead({goal:'cut'}).dir===null, 'no weights on file means no direction claimed');
t(/UNCONFIRMED/.test(_jimGoalLine({goal:'cut'})), '  and the prompt says so out loud');
t(_jimGoalRead({weight:180,goal_weight:179,goal:'cut'}).dir==='hold', 'one pound apart is holding, not cutting');

console.log('\n  THE PROMPT LINE CARRIES THE FINDING, NOT JUST THE NUMBER:');
const line=_jimGoalLine(zadkiel);
t(/GAIN about 15 lb/.test(line), 'it states the direction and the gap', line.slice(0,60));
t(/not from any saved label/.test(line), '  and says where the direction came from');
t(/THEIR SAVED GOAL SAYS "cut" AND THEIR NUMBERS SAY THE OPPOSITE/.test(line),
  'the clash is named rather than quietly overruled');
t(/look better/.test(line) && /ORDER/.test(line), '  with his own read on what it means');
t(!/THEIR SAVED GOAL SAYS/.test(_jimGoalLine(alex)), 'and a profile that agrees gets no lecture');

console.log('\n  THE OLD LABEL NO LONGER GOES IN AS A FACT:');
t(!/pBits\.push\('Goal: '\+profile\.goal\)/.test(src), "the bare \"Goal: <label>\" push is gone");
t(/goalLine=_jimGoalLine\(profile\)/.test(src), 'the derived line took its place');

console.log('\n  HOW LOUD, AND THE SWITCH THAT SITS ABOVE IT:');
t(_jimTone({})===3, 'the default is straight up');
t(_jimToneName(3)==='Straight up', '  which is what it is called');
t(_jimTone({jim_tone:1})===1, 'a stored setting is honoured');
t(_jimTone({jim_tone:9})===3, 'and a nonsense one falls back rather than throwing');
t(_jimTone({jim_tone:5})===4, 'TURBO IS GATED: a stored 5 reads as 4 while it is locked', String(_jimTone({jim_tone:5})));
window._jimTurboOn=true;
t(_jimTone({jim_tone:5})===5, '  and reaches 5 only once it is unlocked');
window._jimTurboOn=false;
t(JIM_TONES.length===5 && JIM_TONES[4].name==='Turbo roast', 'five settings, turbo last');

console.log('\n  "DO NOT CRITIQUE ME" OUTRANKS THE SETTING, NOT REPLACES IT:');
t(_jimNoCritique({})===false, 'off by default');
const facts=_jimToneBlock({jim_no_critique:true, jim_tone:5});
t(/FACTS ONLY/.test(facts), 'on, the delivery is facts only even at turbo');
t(/DO NOT SUGGEST ANYTHING/.test(facts), '  and suggesting is forbidden in as many words');
t(/If a sentence would change what they do next, cut it/.test(facts), '  with the test he can apply');
t(!/FACTS ONLY/.test(_jimToneBlock({jim_tone:3})), 'off, the ordinary delivery returns');
t(/where he actually lives/.test(_jimToneBlock({jim_tone:3})), '  which is straight up');
t(/almost nothing at all/.test(_jimToneBlock({jim_tone:1})), 'easy is allowed to say nearly nothing');

console.log('\n  THE TEN LOGS REACHED THE PROMPT, NOT A DESCRIPTION OF THEM:');
t(/WHAT IT IS MADE OF OUTRANKS WHAT IT ADDS UP TO/.test(src), 'the rule that sorts most meals is in');
t(/this is not a bad food\s+whatsoever/.test(src), '  carrying his own words as the evidence');
t(/textbook, I couldn't have written a better one\s+myself/.test(src), 'the top of the scale is quoted');
t(/A suggestion bolted onto a meal that\s+needed none is a mistake/.test(src), 'and praise gets no "but"');
t(/HAND THEM AN EXPERIMENT, NOT A RULE/.test(src), 'the experiment beats the rule');
t(/thirty minute walk/.test(src), 'the walk made it in');
t(/SAY "I DON'T KNOW" WHEN YOU DO NOT KNOW/.test(src), 'and so did not bluffing');
t(/QUESTION A NUMBER THAT LOOKS WRONG/.test(src), 'a wrong number gets asked about, not coached on');
t(/JIM-FEEDBACK-VOICE\.md/.test(src), 'the source file is cited in the code');

/* THREE MISSES MEASURED ON REAL SHIPPED INSIGHTS, 17 Sep, first run of the food
   feedback loop. All three came off logs Jim actually answered, and none of the
   three was covered by the ten-log block as it stood. Each assertion below is
   the rule that would have caught the one named above it. */
console.log('\n  THE THREE MISSES THE LOOP MEASURED, AND THE RULES THAT CATCH THEM:');

/* u6gpr563954, 15 Sep. Popcorn and "Hard Boiled Eggs & Cheese" were logged as the
   SAME snack at the SAME eat time, twenty six seconds apart. Jim judged the
   popcorn row alone - "mostly air and carbs, fills the belly without much
   protein" - when the snack he was actually looking at was 21g of protein
   against 18g of carbohydrate. This is Adriana Picarella's six rows again. */
t(/GROUP THE ROWS BEFORE YOU JUDGE ANY ONE OF THEM/.test(src),
  'the rows are grouped before anything is scored');
t(/the put together is good/.test(src), '  carrying his own words from the six-row log');
t(/the same meal label, the same eat time, or logged within a few minutes/.test(src),
  '  and naming the three signals that say two rows are one plate');
t(/do not hand down a verdict on the single row/.test(src),
  '  with the single-row verdict forbidden outright');
/* A rule the prompt cannot act on is decoration. The day context has to print the
   meal label and the eat time on every row, or there is nothing to group by. */
t(/\(e\.meal\?e\.meal\+' ':''\)/.test(src), "TODAY'S FOOD prints each row's meal label");
t(/\(\(e\.eat_time\|\|e\.eatTime\)\?'@'\+\(e\.eat_time\|\|e\.eatTime\)/.test(src),
  '  and its eat time, so the grouping rule has something to read');

/* uwbhpzh6hgd, 15 Sep. "A banana and a spoonful of peanut butter. A handful of dry
   roasted peanuts and 4 ounces of 85/15 ground beef" came back as "most calories
   are the nuts and peanut butter - next time, swap those for a cleaner carb like
   berries or rice." Every item in that log is whole food, and his ruling on the
   walnut log was "the nuts are amazing". */
t(/This holds for fat exactly as it\s+holds for carbohydrate/.test(src),
  'whole food is not punished for its FAT either, not only its carbs');
t(/never swap a whole-food fat out for a carbohydrate/.test(src),
  '  and swapping a real fat for a carb is named as the error it is');

/* unwt3bwjczr, 15 Sep. "Chipotle protein bowls & tortillas" came back as "most
   calories are the breading and oils". There is no breading in it. The same
   sentence shape also blamed "the breading and fries" on a meal logged at 18g of
   carbohydrate, so the fault is a template, not one bad guess. */
t(/DO NOT INVENT THE CULPRIT/.test(src), 'the calories are not blamed on an invented ingredient');
t(/A Chipotle bowl\s+has no breading in it/.test(src), '  with the log that proved it');
t(/the macros have to agree with you/.test(src),
  '  and the claim has to survive the row it is written about');

console.log('\n  THE FLOOR, AND NO SETTING IS ABOVE IT:');
t(/STOP COACHING THE FOOD/.test(src), 'there is a hard stop');
t(/whatever the delivery setting says, including turbo/.test(src), '  that turbo cannot override');
t(/Acknowledge them first/.test(src), '  acknowledgement comes first');
t(/ask what they want from you rather than guessing/.test(src), '  then they choose what they want');

console.log('\n  AND THE WORST LOG OF SOMEONE\'S WEEK IS NO LONGER MET WITH SILENCE:');
t(!/var insight = \(!trulyBad && r\.insight\)/.test(src), 'the suppression is gone');
/* The shape changed when the card shipped: the insight is no longer an inline
   string here, it is built by the one card builder. The claim is the same. */
t(/var insight = _jimCardHtml\(r\.insight\);/.test(src), 'every log gets an answer now, through the card');
t(/trulyBad\?'Log it anyway'/.test(src), 'and the honest button text is untouched');


/* A RULE ONE WRITER OBEYS IS NOT A RULE (17 Sep, the loop's second run).
   Anjel-Ali got three insights inside one minute. The matcha was blamed on
   "whole milk and vanilla syrup", the cutlet sandwich on "mayo", and the tacos
   on a juice carrying "35g sugar" - on a row whose WHOLE MEAL logged 32g. The
   tiramisu sitting in the same log was never mentioned. Every one of those is
   already forbidden by DO NOT INVENT THE CULPRIT, shipped the run before.
   It never reached her: the block was a local string inside the photo/analyze
   prompt, and she had typed to Jim in chat. Four prompts write
   food_logs.insight and exactly one of them had the rules. */
console.log('\n  THE TEN LOGS REACH EVERY PROMPT THAT WRITES AN INSIGHT:');
const TEN=_jimTenLogs();
t(typeof TEN==='string' && TEN.length>3000, 'the block is one function, not a local string', typeof TEN);
t(/DO NOT INVENT THE CULPRIT/.test(TEN),        '  and it carries the culprit rule');
t(/NAME THE MEAL TIME FIRST/.test(TEN),         '  and the meal time rule');
t(/THERE IS ALWAYS A MOVE AFTER THE MEAL/.test(TEN), '  and the move at the end');
t(/QUESTION A NUMBER THAT LOOKS WRONG/.test(TEN),    '  and the bad-number rule the juice broke');
t((src.match(/=== WHAT HE ACTUALLY SAYS, MEASURED ON TEN REAL LOGS ===/g)||[]).length===1,
  'ONE copy of his words in the file, so a fix cannot land on three of four paths');

/* Named one at a time, because a count would pass while the one that actually
   failed went without. The chat path is the one all 82 clients talk to. */
const writers={
  'the photo / analyze prompt': /coachVoice \+= _jimTenLogs\(\)/,
  'the chat prompt (buildCoachVoice)': /_jimTenLogs\(\)\+'\\n\\n'\+\s*\n\s*'WHOLE-FOOD NUDGE/,
  'the plate grader (_gradePlateMeal)': /no preamble, no quotes\.'\+_jimTenLogs\(\)/,
  'the re-grade after a clarify (clarifyMeal)': /so commit to a rating\.'\s*\n\s*\+_jimTenLogs\(\)/
};
Object.keys(writers).forEach(k=>t(writers[k].test(src), '  '+k+' reads it'));

/* A rule with nothing to read is decoration - the same finding as v499, where
   NAME THE MEAL TIME FIRST shipped over a prompt that was never told the time. */
t(/Meal: '\+foodsText\+' \('\+\(entry\.meal\|\|'Meal'\)\+\(entry\.eat_time/.test(src),
  'the plate grader is told the meal slot and the clock');
t(/\(e\.meal\|\|'Meal'\)\+\(\(e\.eat_time\|\|e\.eatTime\)/.test(src),
  'and so is the re-grade');


console.log(bad?('\n  '+bad+' FAILED'):'\n  all good (he reads the person, then the plate)');
process.exit(bad?1:0);
