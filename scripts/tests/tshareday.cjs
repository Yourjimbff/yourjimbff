// SHARE DAY CITES THE WHOLE DAY (Yusuf, ruling, 27 Aug).
//
// Live: he tapped Share day on Carly Long's Wednesday — four meals and a walk —
// and the thread came up holding ONE line, the most recent meal. The button
// said day and delivered an item.
//
// It was never wired to a day. It called citeFeedItem with the newest entry's
// index, and the comment above it admitted as much: "until then it opens the
// same cite composer seeded from the day's newest entry".
//
// The fixture below is HER REAL WEDNESDAY, read out of the database: four meals
// in the order she logged them, and a Walk whose duration is the STRING
// "15 min" — which is what caught the numeric duration test, and is why this
// runs on a real day rather than a tidy invented one.
const fs=require('fs');
const guard=require('./_guard.cjs');
const src=fs.readFileSync('index.html','utf8');
const L=src.split('\n');
function varAt(n){ const a=L.findIndex(l=>l.indexOf('var '+n+'=')===0); if(a<0) return '';
  let b=a; while(b<L.length && !/;\s*$/.test(L[b])) b++; return L.slice(a,b+1).join('\n'); }
function fnAt(n){ const a=L.findIndex(l=>l.indexOf('function '+n+'(')===0); if(a<0) return '';
  let b=a; while(b<L.length && L[b]!=='}') b++; return L.slice(a,b+1).join('\n'); }
let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };

global.window={};
global.wUnit=()=>'lb';
// THE REAL _bfItemsFor NOW, NOT A STUB THAT RETURNS NOTHING.
// It used to be `()=>({items:[]})`, which was honest while the workout line was
// one clipped sentence and useless the moment the exercises had to list out: a
// stub that answers "no exercises" can never fail an exercise assertion. Its
// dependencies are chased out of index.html by _lift.cjs rather than named by
// hand, because naming them by hand is how three of them went missing in one
// day and every one was swallowed by a try/catch.
const {closure}=require('./_lift.cjs');
const CL=closure(['_citeDayBody','_citeSessionNoun','_bfItemsFor','_citeClip','_jvNum','_citeWhen','CITE_MAX']);
eval(CL.code);
guard(['CITE_MAX','_jvNum','_citeClip','_citeWhen','_citeDayBody','_citeSessionNoun','_bfItemsFor'], n=>eval(n));
// AND THE LIFTED CHAIN WORKS, not merely arrived — the guard can only see the
// names a suite thought to ask for.
t(_bfItemsFor({description:'Squat: 100 lb \u00d7 5'}).items.length===1, 'smoke: the exercise parser answers');
t(_citeSessionNoun('Glutes')==='glute training session', 'smoke: the session namer answers');

// HER REAL WEDNESDAY, IN THE SHAPE THE BUTTON ACTUALLY RECEIVES.
//
// THIS IS THE CORRECTION THAT MATTERS. The first version of this suite built
// its rows from the DATABASE, where a workout carries `duration`. The button
// does not read the database — it reads the feed cache, and the feed selects
// id, client_code, title, intensity, description, exercises, notes, logged_at,
// date_str, photo, performed_at. NO DURATION.
//
// So my draft read "Walk: 15 min" and his real paste read "Walk", and the
// builder was right both times: I had fed it a richer row than production ever
// hands it. A test that is given better data than the caller gets will pass
// over a difference the user can see. These rows are now exactly what the feed
// puts in _feedItems and nothing more.
//
// AND THE ITEM CARRIES .ts, WHICH THE ROW DOES NOT. The feed builds items as
// {kind, ts, data} and sorts on ts; a fixture without it makes every workout
// look like midnight, which sorted her walk to the top of the day and read as a
// product bug. Same lesson as the duration, one layer up.
// The eat times and timestamps below are her REAL Aug 26 rows.
const DAY=[
  {kind:'food', ts:Date.parse('2026-08-26T15:00:00Z'), data:{id:1, client_code:'carlyl1', meal:'Breakfast', name:'Mozzarella Cheese Stick',            emoji:'', calories:80,  protein:7,  carbs:1,  fat:6,  rating:'good', date_str:'Aug 26, 2026', eat_time:'8:00 AM',  logged_at:'2026-08-26T15:00:00+00:00', meal_text:null}},
  {kind:'wo',   ts:Date.parse('2026-08-26T15:15:00Z'), data:{id:2, client_code:'carlyl1', title:'Walk', intensity:null, description:'Walk', exercises:null, notes:null, date_str:'Aug 26, 2026', logged_at:'2026-08-26T15:15:00+00:00', photo:null, performed_at:null}},
  {kind:'food', ts:Date.parse('2026-08-26T18:00:00Z'), data:{id:3, client_code:'carlyl1', meal:'Lunch',  name:'Tofu with Teriyaki Sauce',              emoji:'', calories:360, protein:32, carbs:20, fat:16, rating:'good', date_str:'Aug 26, 2026', eat_time:'11:00 AM', logged_at:'2026-08-26T18:00:00+00:00', meal_text:null}},
  {kind:'food', ts:Date.parse('2026-08-26T22:00:00Z'), data:{id:4, client_code:'carlyl1', meal:'Snack',  name:'Tofu with Teriyaki Sauce',              emoji:'', calories:360, protein:32, carbs:20, fat:16, rating:'good', date_str:'Aug 26, 2026', eat_time:'3:00 PM',  logged_at:'2026-08-26T22:00:00+00:00', meal_text:null}},
  {kind:'food', ts:Date.parse('2026-08-27T01:30:00Z'), data:{id:5, client_code:'carlyl1', meal:'Dinner', name:'Chicken Strips, Waffle Fries & Sprite', emoji:'', calories:890, protein:28, carbs:98, fat:38, rating:'okay', date_str:'Aug 26, 2026', eat_time:'6:30 PM',  logged_at:'2026-08-27T01:30:00+00:00', meal_text:null}}
];
const body=_citeDayBody(DAY);
console.log('\n  THE DRAFTED MESSAGE:\n');
body.trimEnd().split('\n').forEach(l=>console.log('    | '+l));
console.log();

const lines=body.trimEnd().split('\n').filter(Boolean);
console.log('  EVERY ITEM IS THERE, ONE PER LINE:');
t(/Breakfast: Mozzarella Cheese Stick \(80 cal, 7g protein\)/.test(body), 'the breakfast');
t(/Lunch: Tofu with Teriyaki Sauce \(360 cal, 32g protein\)/.test(body), 'the lunch');
t(/Snack: Tofu with Teriyaki Sauce \(360 cal, 32g protein\)/.test(body), 'the snack, not collapsed into the identical lunch');
t(/Dinner: Chicken Strips, Waffle Fries & Sprite \(890 cal, 28g protein\)/.test(body), 'the dinner, the only one the old button sent');
t(/(^|\n)Walk$/m.test(body), 'and the walk — just the title, because the feed carries no duration');
// The richer shape is still handled, for the day the feed learns to carry it.
t(/Walk: 15 min/.test(_citeDayBody([{kind:'wo', data:{title:'Walk', description:'Walk', duration:'15 min', date_str:'Aug 26, 2026'}}])),
  'and a duration string is used when there IS one');
// Her duration is "15 min", a STRING. A numeric test skipped it and the line
// fell through to the description — which for her walk IS the word "Walk".
t(_citeDayBody([{kind:'wo', data:{title:'Walk', description:'Walk', duration:'', date_str:'Aug 26, 2026'}}])
  .indexOf('Walk: Walk')<0, 'and with no "Walk: Walk" when the description just repeats the title');
t(/(^|\n)Walk\n/.test(_citeDayBody([{kind:'wo', data:{title:'Walk', description:'Walk', duration:'', date_str:'Aug 26, 2026'}}])+'\n'),
  'it is just the title then, with no dash left dangling');
t(/Push: 45 min/.test(_citeDayBody([{kind:'wo', data:{title:'Push', duration:45, date_str:'Aug 26, 2026'}}])),
  'and a numeric duration still reads as minutes');
t(lines.length===9, 'opener, five items, the Summary label and its two lines', lines.length+' lines');

// ===== ORDERED BY WHEN SHE ATE IT (Yusuf, from his screenshot, 28 Aug) =
// His draft showed a Snack above a Breakfast. The feed sorts by _feedTs, which
// reads logged_at and never eat_time — right for a stream of things as they
// arrive, wrong for a message that reads as somebody's day.
//
// THE MEALS ARE ASSERTED, NOT THE WALK'S PLACE AMONG THEM. A meal carries its
// own clock as a string, which means the same thing in every zone; a workout is
// placed by the moment it was recorded, read in the device's zone. So her 11:15
// walk sits after her 11:00 lunch here and before it in UTC, and BOTH are
// correct. Pinning that pair would be pinning the reader's timezone.
console.log('\n  IN THE ORDER SHE ATE, MORNING TO NIGHT:');
const at=s=>body.indexOf(s);
t(at('Breakfast')<at('Lunch') && at('Lunch')<at('Snack') && at('Snack')<at('Dinner'),
  'her meals run 8:00, 11:00, 3:00, 6:30 — in that order');
t(at('Walk')>-1, 'and the walk is in the day');
// HIS SCREENSHOT, EXACTLY: a snack eaten at night, logged the NEXT morning,
// handed over first. Two meals, so this holds in every zone.
const SNACKFIRST=[
  {kind:'food', ts:Date.parse('2026-08-28T13:00:00Z'), data:{meal:'Snack', name:'Late Snack', calories:200, protein:5, eat_time:'9:30 PM', date_str:'Aug 27, 2026', logged_at:'2026-08-28T13:00:00+00:00'}},
  {kind:'food', ts:Date.parse('2026-08-27T14:00:00Z'), data:{meal:'Breakfast', name:'Eggs', calories:300, protein:20, eat_time:'8:00 AM', date_str:'Aug 27, 2026', logged_at:'2026-08-27T14:00:00+00:00'}}
];
const sf=_citeDayBody(SNACKFIRST);
t(sf.indexOf('Breakfast')<sf.indexOf('Snack'),
  'a snack logged the next morning still reads AFTER the breakfast it followed');
t(_citeDayMins({kind:'food', data:{eat_time:'9:30 PM'}})===21*60+30, 'a meal is placed by its own clock');
t(_citeDayMins({kind:'wo', ts:Date.parse('2026-08-27T12:00:00Z'), data:{}})>=0, 'and anything else by when it was recorded');

console.log('\n  THE SUMMARY:');
t(/\nSummary:\n/.test(body), 'it has its own label on its own line');
t(/Summary:\n1,690 cal and 99g protein across 4 meals\n/.test(body), 'food totals first, and they add up', '80+360+360+890=1,690');
t(/\n1 walk$/m.test(body), 'then the activity, named the way he would say it');
t(!/1690/.test(body), 'the figure carries its comma');
t(_citeDayBody([DAY[0]]).indexOf('Walk')<0 && _citeDayBody([DAY[0]]).indexOf('\nSummary:\n')>-1,
  'a day with no activity gets no activity line');
t(/2 walks/.test(_citeDayBody([DAY[1],DAY[1]])), 'two of the same session pluralise');
// The Push carries a ts an hour after the walk, or it would fall back to
// midnight and sort ahead of it — the fixture trap, one more time.
t(/\n1 walk\n1 push session/.test(_citeDayBody([DAY[1],
    {kind:'wo', ts:Date.parse('2026-08-26T16:15:00Z'), data:{title:'Push',description:'Push',date_str:'Aug 26, 2026',logged_at:'2026-08-26T16:15:00+00:00'}}])),
  'and two different ones each get their OWN line, never a tally on one');

console.log('\n  SPACING — a blank line between every item (his feng shui):');
// Which item comes first depends on the reader's zone once a workout is in the
// day, so this asserts the blank line under the HEADING, not under a named item.
t(/^[^\n]+:\n\n[^\n]/.test(body), 'after the opening line');
// Not a fixed pair any more: the walk's place among her meals depends on the
// reader's zone (see the ordering note above), so this asserts the SHAPE.
t(/\)\n\nWalk\n/.test(body) || /\n\nWalk\n\n/.test(body), 'and between the items');
t(body.split('\n\n').length>=6, 'every item separated by a blank line', body.split('\n\n').length+' blocks');
t(!/\n\n\n/.test(body), 'never three in a row');

console.log('\n  SAME VOICE AS THE SINGLE CITE:');
// ===== THE DAY IS THE HEADING, HIS WORDS SIGN OFF (ruling, 28 Aug) ===
// It used to announce itself — "On your day yesterday:" — and it used to open
// with a blank paragraph for his comment. Both are gone: the report simply
// quotes the day, and his comment goes at the BOTTOM where the cursor lands.
t(!/^\s/.test(body), 'no blank line at the top — it starts with the report');
t(!/On your day/.test(body), 'and it no longer announces itself');
t(/^[A-Z][^\n:]*:\n\n/.test(body), 'the first line is the day, as a heading', JSON.stringify(body.split('\n')[0]));
t(/^(Yesterday|Today|Wednesday|Tuesday|Monday|Thursday|Friday|Saturday|Sunday)\b/.test(body)
  || /^\w+day, \w+ \d/.test(body),
  'in the natural style, with no "last" left on the front', JSON.stringify(body.split('\n')[0]));
// The sign-off space: one blank line under the summary, then him.
t(/\n\n$/.test(body) && !/\n\n\n$/.test(body), 'it ends with exactly one blank line for his comment');
const signed=body+'Great work Kelly, this is exactly the consistency we want.';
const sLines=signed.split('\n');
t(sLines[sLines.length-1]==='Great work Kelly, this is exactly the consistency we want.'
  && sLines[sLines.length-2]==='',
  'and what he types lands under the summary as its own paragraph');
t(body.endsWith('\n\n'), 'and it ends the same way, ready for him to type under it');

console.log('\n  NO LONG DASHES — this goes out under his name (his standing rule):');
t(body.indexOf('\u2014')<0, 'the drafted day carries no long dash anywhere');
t(/Breakfast: /.test(body), 'the items separate with a colon');
// The same rule, the other three messages this app drafts for him to send.
t(fnAt('_obOpener').indexOf('\u2014')<0, 'nor does the outreach opener');
t(fnAt('_jvOnboardingBody').indexOf('\u2014')<0, 'nor the onboarding message');
t(src.indexOf("'Hey '+first+' \u2014 '+about")<0, 'nor the text-about draft');

console.log('\n  LAW 7 AND 11 — NO GLYPH, THE LINE BREAK IS THE BULLET:');
t(!/(^|\n)\s*[-•*·]\s/.test(body), 'nothing is bulleted with a symbol');
t(!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(body), 'and there is no emoji');

console.log('\n  IT IS WIRED TO THE DAY, NOT TO THE NEWEST THING ON IT:');
t(/onclick="citeFeedDay\(/.test(src), 'the card calls the day citer');
t(!/onclick="citeFeedItem\('\+newest\._idx/.test(src), 'and no longer the single-item citer with the newest index');
t(/evs\.map\(function\(e\)\{ return \(e&&e\._idx!=null\)\?e\._idx:null; \}\)/.test(src),
  'it hands over the whole day, in the order the card holds it');
t(/function citeFeedDay\(code, idxCsv\)/.test(src), 'and resolves it from the same cache the card was built from');

console.log('\n  THE PER-MEAL SHARE IS UNTOUCHED — one meal is its whole job:');
t(/function citeFeedItem\(idx\)\{/.test(src.replace(/\s+/g,' ').replace(/function citeFeedItem\(idx\)\s*\{/,'function citeFeedItem(idx){')),
  'citeFeedItem still exists');
const single=fnAt('_citeBody');
t(/On your '\+_citeClip\(nm\)\+when/.test(single), 'and the single-meal cite still reads exactly as it did');

console.log('\n  AN EMPTY DAY STILL OPENS A PLAIN TEXT, never a refusal:');
t(_citeDayBody([])==='', 'nothing to quote gives an empty body');
t(/try\{ textClient\(code, body\); \}catch\(e\)\{\}/.test(src), 'and the thread opens anyway');

// ===== KELLY G'S REAL DAY, THE ONE HE TEXTED (Yusuf, spec, 28 Aug) =====
// Read out of the database: Aug 27 2026, three meals, a Glutes session and a
// Bike. His three upgrades were written from the text he actually sent her.
//
// IN THE FEED'S SHAPE, WHICH IS THE TRAP THIS SUITE ALREADY CARRIES ONCE.
// The feed selects title, description, exercises — and NO DURATION. Her bike
// carries duration "20 min" in the database and the button never sees it, so a
// fixture built from the database would prove a line production cannot print.
// Her glutes row has exercises:null too: the list lives in the description.
console.log('\n  KELLY G, Aug 27 — THE DAY HE TEXTED HER:');
const KDAY='Aug 27, 2026';
const KELLY=[
  {kind:'food', ts:Date.parse('2026-08-27T15:11:17.937Z'), data:{meal:'Breakfast', name:'Coffee with Cream & Honey, Pumpkin Cinnamon Roll', calories:520, protein:12, eat_time:'10:11 AM', date_str:KDAY, logged_at:'2026-08-27T15:11:17.937+00:00'}},
  {kind:'food', ts:Date.parse('2026-08-27T20:23:47.979Z'), data:{meal:'Lunch', name:'Turkey Sandwich, Chips & Tea', calories:520, protein:38, eat_time:'3:23 PM', date_str:KDAY, logged_at:'2026-08-27T20:23:47.979+00:00'}},
  {kind:'wo',   ts:Date.parse('2026-08-27T16:10:00Z'), data:{title:'Glutes', exercises:null, date_str:KDAY, logged_at:'2026-08-27T16:10:00+00:00',
    description:'Barbell Hip Thrust: 125 lb \u00d7 8, 125 lb \u00d7 8, 125 lb \u00d7 8, 125 lb \u00d7 8\nLeg Press: 330 lb \u00d7 6, 330 lb \u00d7 8, 330 lb \u00d7 8, 330 lb \u00d7 8\nRomanian Deadlift: 30 lb \u00d7 10, 30 lb \u00d7 10, 30 lb \u00d7 10\nHip Abduction: 90 lb \u00d7 15, 90 lb \u00d7 15, 90 lb \u00d7 15\nHamstring Curl: 100 lb \u00d7 12, 100 lb \u00d7 12, 100 lb \u00d7 12\nAb Workout: 16 reps, 18 reps, 15 reps'}},
  {kind:'wo',   ts:Date.parse('2026-08-27T22:07:54.156Z'), data:{title:'Bike', exercises:null, date_str:KDAY, logged_at:'2026-08-27T22:07:54.156+00:00', description:'20 minute intense cardio'}},
  {kind:'food', ts:Date.parse('2026-08-28T01:16:44.112Z'), data:{meal:'Snack', name:'Honeydew Melon & Pita Chips with Chocolate Hummus', calories:280, protein:8, eat_time:'8:16 PM', date_str:KDAY, logged_at:'2026-08-28T01:16:44.112+00:00'}}
];
const kb=_citeDayBody(KELLY);
kb.trimEnd().split('\n').forEach(l=>console.log('    | '+l));

console.log('\n  1. EVERY EXERCISE ON ITS OWN LINE, ALL SIX, NEVER A SENTENCE:');
t(/\nGlutes:\nBarbell Hip Thrust\nLeg Press\nRomanian Deadlift\nHip Abduction\nHamstring Curl\nAb Workout\n/.test(kb),
  'her whole glutes session, in her order, one per line');
t(kb.indexOf('\u2026')<0, 'nothing is cut off with an ellipsis');
t(!/Barbell Hip Thrust, Leg Press/.test(kb), 'and they are not joined back into a sentence');
t(!/125 lb/.test(kb) && !/16 reps/.test(kb), 'names only for now — no sets, no reps, no weights');
// A description that is PROSE is not an exercise list. Her bike would otherwise
// list one "exercise" called "20 minute intense cardio".
t(!/\nBike:\n/.test(kb), 'her bike is not turned into a one-exercise list');
// And a sign-off after the list is not an exercise either. Her Aug 14 glutes
// really ends "Killed it".
const kSign=_citeDayBody([{kind:'wo', data:{title:'Glutes', exercises:null, date_str:KDAY,
  description:'Barbell Hip Thrust: 125 lb \u00d7 8\nHamstring Curl: 100 lb \u00d7 12\n\nKilled it '}}]);
t(/Glutes:\nBarbell Hip Thrust\nHamstring Curl/.test(kSign) && kSign.indexOf('Killed it')<0,
  'and a sign-off under the list is not listed as an exercise');

console.log('\n  3. THE SUMMARY SPEAKS:');
t(/Summary:\n1,320 cal and 58g protein across 3 meals\n1 glute training session\n1 bike ride \(20 minute intense cardio\)/.test(kb),
  'exactly the three lines he asked for');
t(!/1 Glutes/.test(kb) && !/1 Bike/.test(kb), 'and never the old tally of titles');
// THEIR WORDS ONLY. The parenthetical is her description, not a phrase built here.
t(/\(20 minute intense cardio\)/.test(kb), 'the note in brackets is her own sentence');
t(_citeDayBody([KELLY[3],KELLY[3]]).indexOf('(20 minute intense cardio)')<0,
  'and it is held back when a title appears twice, because it belongs to one of them');
// The namer, on the shapes this roster actually holds.
[['Glutes','glute training session'],['Bike','bike ride'],['Walk','walk'],['Run','run'],
 ['Push Day','push day'],['Pilates','pilates session'],['Legs','leg training session'],
 ['Upper','upper body training session'],['Stairmaster','stairmaster session']
].forEach(([a,b])=>t(_citeSessionNoun(a)===b, '"'+a+'" reads as "'+b+'"', _citeSessionNoun(a)));

console.log('\n  AND HIS STANDING RULES STILL HOLD ON HER DAY:');
t(kb.indexOf('\u2014')<0, 'no long dash in a message going out under his name');
t(!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(kb), 'no emoji');
t(!/(^|\n)\s*[-\u2022*\u00b7]\s/.test(kb), 'no bullet glyph — the line break is the bullet');

// ===== SHARE DAY ON THE PHONE (Yusuf, order, 28 Aug) ===================
// It existed only on the desktop wall, where a card IS one client's day and the
// button sits at its foot. The phone renders one tile per LOG inside a day band
// mixed across clients, so there was no "day" to share and nowhere to put it.
//
// The phone's band now groups by client, in the order the ranking already put
// them, and each client's run ends with their own Share day.
console.log('\n  SHARE DAY REACHES THE PHONE:');
const MOB=src.slice(src.indexOf("// ===== SHARE DAY ON THE PHONE"), src.indexOf("if(_dtk) html+='</div>';                 // close the day's grid"));
t(MOB.length>600, 'the phone branch is findable');
t(/if\(!_dtk\)\{/.test(MOB), 'it is the PHONE path — _dtk is the desktop wall');
t(/_mBy\[c\]\.push\(it\)/.test(MOB), 'the day is grouped by client');
t(/_mOrder\.push\(c\)/.test(MOB), 'in the order the ranking already put them, not re-sorted');
t(/citeFeedDay\(/.test(MOB), 'and each group ends in Share day');
t(/_mBy\[c\]\.map\(function\(e\)\{ return \(e&&e\._idx!=null\)\?e\._idx:null; \}\)/.test(MOB),
  "carrying that client's OWN item indexes, so it shares their day and nobody else's");
t(/if\(c && _mIdx\)/.test(MOB), 'and nothing without a client gets one — a Moment is nobody’s day');

console.log('\n  ONE WRITER, TWO SCREENS — never two versions:');
// Both surfaces call the SAME function with the same argument shape. That is
// the guarantee: there is no second draft builder to drift.
t((src.match(/citeFeedDay\(/g)||[]).length>=3, 'citeFeedDay is called from both surfaces and defined once');
t((src.match(/function citeFeedDay\(/g)||[]).length===1, 'and there is exactly ONE citeFeedDay');
t((src.match(/function _citeDayBody\(/g)||[]).length===1, 'and exactly ONE day-message writer');
t(/function citeFeedDay\(code, idxCsv\)\{[\s\S]{0,600}_citeDayBody\(items\)/.test(src),
  'which is what the phone button reaches, through the same call the desktop card makes');

console.log('\n  AND IT COUNTS FOR THE OUTREACH TRACKER, BY THE SAME MARK:');
// citeFeedDay ends in textClient, and textClient is what records the contact.
// So the phone marks the tracker with the feed lane's own mark and this build
// wrote no second one.
t(/try\{ textClient\(code, body\); \}catch\(e\)\{\}/.test(src), 'citeFeedDay hands off to textClient');
// LIFTED BY NAME, NEVER BY PARAMETER LIST. This pinned the exact text
// `function textClient(code, body){`. textClient grew a third parameter on
// 2 Sep (opts, so the CRM board can say "the caller is keeping the record") and
// indexOf then returned -1 — which slice does not treat as an error, it counts
// from the END of the file. TC became the last three characters of index.html,
// the assertion failed, and the failure said "textClient no longer records the
// contact" about code that records it on the line it always did. A lift that
// cannot find its target must say SO, so it does now.
const TCAT=src.indexOf('function textClient(');
t(TCAT>=0, 'textClient is findable at all', TCAT<0?'NOT FOUND — this suite can prove nothing below':'');
// TO THE END OF THE FUNCTION, not to a magic character count. The old 3,000 was
// already short of the jvLogContact line by the time the comments explaining
// WHY it logs were written; a window measured in characters goes stale every
// time somebody documents the code underneath it.
const TCEND=src.indexOf('\nfunction ', TCAT+1);
const TC=TCAT<0?'':src.slice(TCAT, TCEND<0?src.length:TCEND);
t(/jvLogContact\(code, 'text', '', true\)/.test(TC), "and textClient records the contact — the feed lane's own mark");
// The point is not how many places record a contact — there are two, and both
// predate this build (the Text button, and the "text about" flow). The point is
// that the phone's Share day writes NO mark of its own: it reaches the tracker
// only by going through textClient, exactly as the desktop card does.
t(!/jvLogContact/.test(MOB), 'the phone branch records nothing itself — it goes through textClient');
t(!/_ccLast|jvActRecord/.test(MOB), 'and touches none of the feed lane’s contact bookkeeping');

console.log('\n  AND NOTHING ELSE WAS ADDED TO THE PHONE:');
t(!/id="mShareDayTab"/.test(src) && !/switchTab\('ShareDay'/.test(src), 'no new screen');
t(/\.fdShareBtn\{[^}]*border:1px solid var\(--border\)/.test(src.replace(/\n/g,'')),
  'and the button is the bordered kind this feed already draws, not a floating one');
t(!/\.fdShareBtn\{[^}]*position:fixed/.test(src.replace(/\n/g,'')), 'nothing floats');
// A button that renders and cannot be seen is the one thing reading the source
// cannot catch on its own, so the two ways of hiding it are named here. The
// real proof is the screen at 375, and it was taken.
t(!/class="fdShareRow"[^>]*hidden/.test(src), 'the row is not rendered hidden');
t(!/\.fdShareRow\{[^}]*display:none/.test(src.replace(/\n/g,'')) && !/\.fdShareBtn\{[^}]*display:none/.test(src.replace(/\n/g,'')),
  'and nothing hides it in CSS');
t(/\.fdShareRow\{display:flex/.test(src.replace(/\n/g,'')), 'it is laid out as a visible row');
// The desktop card is untouched.
t(/acts\+='<span class="pfAct" onclick="citeFeedDay/.test(src), "the desktop card's own Share day is unchanged");

console.log('\n'+(bad?(bad+' FAILED'):'all pass'));
process.exit(bad?1:0);
