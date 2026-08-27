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

// HER REAL WEDNESDAY.
const DAY=[
  {kind:'food', data:{meal:'Breakfast', name:'Mozzarella Cheese Stick',            calories:80,  protein:7,  date_str:'Aug 26, 2026'}},
  {kind:'wo',   data:{title:'Walk', description:'Walk', duration:'15 min',          date_str:'Aug 26, 2026'}},
  {kind:'food', data:{meal:'Lunch',  name:'Tofu with Teriyaki Sauce',              calories:360, protein:32, date_str:'Aug 26, 2026'}},
  {kind:'food', data:{meal:'Snack',  name:'Tofu with Teriyaki Sauce',              calories:360, protein:32, date_str:'Aug 26, 2026'}},
  {kind:'food', data:{meal:'Dinner', name:'Chicken Strips, Waffle Fries & Sprite', calories:890, protein:28, date_str:'Aug 26, 2026'}}
];
const body=_citeDayBody(DAY);
console.log('\n  THE DRAFTED MESSAGE:\n');
body.trimEnd().split('\n').forEach(l=>console.log('    | '+l));
console.log();

const lines=body.trimEnd().split('\n').filter(Boolean);
console.log('  EVERY ITEM IS THERE, ONE PER LINE:');
t(/Breakfast — Mozzarella Cheese Stick \(80 cal, 7g protein\)/.test(body), 'the breakfast');
t(/Lunch — Tofu with Teriyaki Sauce \(360 cal, 32g protein\)/.test(body), 'the lunch');
t(/Snack — Tofu with Teriyaki Sauce \(360 cal, 32g protein\)/.test(body), 'the snack, not collapsed into the identical lunch');
t(/Dinner — Chicken Strips, Waffle Fries & Sprite \(890 cal, 28g protein\)/.test(body), 'the dinner — the only one the old button sent');
t(/(^|\n)Walk — 15 min$/m.test(body), 'and the walk, carrying its real duration string');
// Her duration is "15 min", a STRING. A numeric test skipped it and the line
// fell through to the description — which for her walk IS the word "Walk".
t(_citeDayBody([{kind:'wo', data:{title:'Walk', description:'Walk', duration:'', date_str:'Aug 26, 2026'}}])
  .indexOf('Walk — Walk')<0, 'and with no "Walk — Walk" when the description just repeats the title');
t(/(^|\n)Walk\n/.test(_citeDayBody([{kind:'wo', data:{title:'Walk', description:'Walk', duration:'', date_str:'Aug 26, 2026'}}])+'\n'),
  'it is just the title then, with no dash left dangling');
t(/Push — 45 min/.test(_citeDayBody([{kind:'wo', data:{title:'Push', duration:45, date_str:'Aug 26, 2026'}}])),
  'and a numeric duration still reads as minutes');
t(lines.length===7, 'opener, five items, one total', lines.length+' lines');

console.log('\n  IN THE ORDER THE CARD IS IN:');
const at=s=>body.indexOf(s);
t(at('Breakfast')<at('Walk') && at('Walk')<at('Lunch') && at('Lunch')<at('Snack') && at('Snack')<at('Dinner'),
  'oldest first, the walk sitting where she logged it');

console.log('\n  THE TOTALS LINE:');
t(/That is 1,690 cal and 99g protein across 4 meals\./.test(body), 'food only, and it adds up', '80+360+360+890=1,690');
t(!/1690/.test(body), 'the figure carries its comma');

console.log('\n  SAME VOICE AS THE SINGLE CITE:');
t(/^On your day/.test(body), 'it opens "On your day", the way one meal opens "On your ..."');
t(/^On your day on (Wed|Aug|\w)/.test(body) || /^On your day (yesterday|today)/.test(body),
  'with the natural date the single cite uses', JSON.stringify(lines[0]));
t(body.endsWith('\n\n'), 'and it ends the same way, ready for him to type under it');

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
