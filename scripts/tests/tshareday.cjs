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
global._bfItemsFor=()=>({items:[]});
// The real helpers, lifted — the voice and the commas are theirs, not a copy.
eval([varAt('CITE_MAX'), fnAt('_jvNum'), fnAt('_citeClip'), fnAt('_jvSpokenDay'), fnAt('_citeWhen'), fnAt('_citeDayBody')].join('\n'));
guard(['CITE_MAX','_jvNum','_citeClip','_citeWhen','_citeDayBody'], n=>eval(n));

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
const DAY=[
  {kind:'food', data:{id:1, client_code:'carlyl1', meal:'Breakfast', name:'Mozzarella Cheese Stick',            emoji:'', calories:80,  protein:7,  carbs:1,  fat:6,  rating:'good', date_str:'Aug 26, 2026', eat_time:'11:00 AM', meal_text:null}},
  {kind:'wo',   data:{id:2, client_code:'carlyl1', title:'Walk', intensity:null, description:'Walk', exercises:null, notes:null, date_str:'Aug 26, 2026', photo:null, performed_at:null}},
  {kind:'food', data:{id:3, client_code:'carlyl1', meal:'Lunch',  name:'Tofu with Teriyaki Sauce',              emoji:'', calories:360, protein:32, carbs:20, fat:16, rating:'good', date_str:'Aug 26, 2026', eat_time:'2:00 PM',  meal_text:null}},
  {kind:'food', data:{id:4, client_code:'carlyl1', meal:'Snack',  name:'Tofu with Teriyaki Sauce',              emoji:'', calories:360, protein:32, carbs:20, fat:16, rating:'good', date_str:'Aug 26, 2026', eat_time:'6:00 PM',  meal_text:null}},
  {kind:'food', data:{id:5, client_code:'carlyl1', meal:'Dinner', name:'Chicken Strips, Waffle Fries & Sprite', emoji:'', calories:890, protein:28, carbs:98, fat:38, rating:'okay', date_str:'Aug 26, 2026', eat_time:'9:30 PM',  meal_text:null}}
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

console.log('\n  IN THE ORDER THE CARD IS IN:');
const at=s=>body.indexOf(s);
t(at('Breakfast')<at('Walk') && at('Walk')<at('Lunch') && at('Lunch')<at('Snack') && at('Snack')<at('Dinner'),
  'oldest first, the walk sitting where she logged it');

console.log('\n  THE SUMMARY:');
t(/\nSummary:\n/.test(body), 'it has its own label on its own line');
t(/Summary:\n1,690 cal and 99g protein across 4 meals\n/.test(body), 'food totals first, and they add up', '80+360+360+890=1,690');
t(/\n1 Walk$/m.test(body), 'then the activity, counted');
t(!/1690/.test(body), 'the figure carries its comma');
t(_citeDayBody([DAY[0]]).indexOf('Walk')<0 && _citeDayBody([DAY[0]]).indexOf('\nSummary:\n')>-1,
  'a day with no activity gets no activity line');
t(/2 Walks/.test(_citeDayBody([DAY[1],DAY[1]])), 'two of the same session pluralise');
t(/1 Walk, 1 Push/.test(_citeDayBody([DAY[1],{kind:'wo',data:{title:'Push',description:'Push',date_str:'Aug 26, 2026'}}])),
  'and two different ones are both named');

console.log('\n  SPACING — a blank line between every item (his feng shui):');
t(/:\n\nBreakfast:/.test(body), 'after the opening line');
t(/protein\)\n\nWalk\n\nLunch:/.test(body), 'and between the items');
t(!/\n\n\n/.test(body), 'never three in a row');

console.log('\n  SAME VOICE AS THE SINGLE CITE:');
t(/^On your day/.test(body), 'it opens "On your day", the way one meal opens "On your ..."');
t(/^On your day on (Wed|Aug|\w)/.test(body) || /^On your day (yesterday|today)/.test(body),
  'with the natural date the single cite uses', JSON.stringify(lines[0]));
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

console.log('\n'+(bad?(bad+' FAILED'):'all pass'));
process.exit(bad?1:0);
