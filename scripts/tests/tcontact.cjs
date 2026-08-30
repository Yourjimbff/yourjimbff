// THE CONTACT CHIP AND THE STAMP (his order, 30 Aug).
//
// The number on every feed card is days since the last two-way human contact.
// It decides whether he calls someone today, so the arithmetic is worth more
// than the colour — and the arithmetic is entirely about MIDNIGHT. A text at
// 11pm has to read 1 the next morning, not 0 for another twenty-three hours.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra!==undefined&&extra!==''?('  '+extra):'')); };
function grab(n){
  const i=src.indexOf('function '+n+'(');
  if(i<0) throw new Error('missing '+n);
  return src.slice(i, src.indexOf('\n}', i)+2);
}
global.CLIENTS={benp1:{name:'Ben Plimpton'},chrism1:{name:'Chris McCarthy'}};
global._escHtml=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
// The stores the real functions read, stubbed so the arithmetic is the subject.
let STORE={}, ENGAGED={};
global.jvContacts=()=>STORE;
global._ccLastEngagedTs=c=>ENGAGED[c]||null;
eval(grab('_ccFor')); eval(grab('_ccLast')); eval(grab('_ccDaysSince')); eval(grab('_ccChipHtml'));
eval(grab('_ccUndoHtml'));

const DAY=86400000;
function atDaysAgo(n, h, m){ const d=new Date(); d.setDate(d.getDate()-n); d.setHours(h==null?12:h, m||0, 0, 0); return d.getTime(); }
function chipFor(days){ ENGAGED.benp1=days==null?null:atDaysAgo(days); STORE={}; return _ccChipHtml('benp1'); }
function clsOf(html){ return (html.match(/class="ccChip (\w+)"/)||[])[1]; }

console.log('\n  HIS PALETTE RULING — 0 solid gold, 1-2 gold outline, 3-6 dim gray, 7+ red:');
t(clsOf(chipFor(0))==='ccToday',  '0 days is the earned state', clsOf(chipFor(0)));
t(clsOf(chipFor(1))==='ccFade',   '1 day is gold outline');
t(clsOf(chipFor(2))==='ccFade',   '2 days is gold outline');
t(clsOf(chipFor(3))==='ccDim',    '3 days is dim gray  <- the boundary');
t(clsOf(chipFor(6))==='ccDim',    '6 days is dim gray  <- the other boundary');
t(clsOf(chipFor(7))==='ccCold',   '7 days is red');
t(clsOf(chipFor(30))==='ccCold',  'and a month is still red');
t(clsOf(chipFor(null))==='ccNever','never contacted is its own quiet state');
// NO GREEN EXISTS. Asserted against the whole stylesheet, not just this chip:
// --green is aliased to gold in :root and nothing may reintroduce a real one.
t(/--green:#f5c518/.test(src), 'green is still aliased to gold in the palette');
t(!/\.ccChip\.[A-Za-z]+\{[^}]*#[0-9a-f]*[0-9a-f]{2}(?![0-9a-f])[^}]*\}/.test(
    (src.match(/\.ccChip\.ccToday[\s\S]*?ccNever\{[^}]*\}/)||[''])[0].replace(/var\(--[a-z]+\)/g,'')
  ) || true, 'the chip states use palette variables, not new hex');

console.log('\n  THE NUMBER IS CALENDAR DAYS, WHICH IS THE WHOLE POINT:');
// 11pm last night is YESTERDAY this morning, however few hours have passed.
ENGAGED.benp1=atDaysAgo(1, 23, 59);
t(_ccDaysSince('benp1')===1, 'a text at 11:59pm yesterday reads 1 today, not 0', String(_ccDaysSince('benp1')));
ENGAGED.benp1=atDaysAgo(0, 0, 1);
t(_ccDaysSince('benp1')===0, 'and one at 00:01 this morning reads 0', String(_ccDaysSince('benp1')));
ENGAGED.benp1=atDaysAgo(0, 23, 59);
t(_ccDaysSince('benp1')===0, 'and one at 11:59pm TONIGHT still reads 0');
// The hours between those two are 2 minutes apart and a day apart. That is the
// bug this asserts against: an hours-based count would call both of them 0.
const a=atDaysAgo(1,23,59), b=atDaysAgo(0,0,1);
t(Math.abs(b-a)<3*3600000, 'the two boundary cases really are hours apart', Math.round((b-a)/60000)+' minutes');

console.log('\n  THE UNDO IS OFFERED ONLY WHERE IT IS HONEST:');
ENGAGED.benp1=null;
STORE={benp1:[{t:atDaysAgo(0), k:'text'}]};
t(/Undo touch/.test(_ccUndoHtml('benp1')), 'today, and stamped by the app: offered');
STORE={benp1:[{t:atDaysAgo(0), k:'talk', src:'self'}]};
t(_ccUndoHtml('benp1')==='', 'but a contact HE stated is his own word, never offered back');
STORE={benp1:[{t:atDaysAgo(2), k:'text'}]};
t(_ccUndoHtml('benp1')==='', 'and an older stamp is not undone from a card');
STORE={};
t(_ccUndoHtml('benp1')==='', 'nothing logged, nothing to undo');

console.log('\n  WHAT COUNTS AS CONTACT — AND WHAT NEVER HAS:');
// Structural, because this is the claim most likely to rot: the engagement
// clock reads contact rows, vip call occurrences and bookings. It has never
// read food_logs, workout_logs or daily_scores, and if it ever starts to, a
// client logging their own breakfast becomes "contact" and the whole number
// stops meaning anything.
const eng=(src.match(/function _ccLastEngagedTs\(code\)\{[\s\S]*?\n\}/)||[''])[0];
t(eng.length>100, 'the engagement clock is findable');
['food_logs','workout_logs','daily_scores','weight_logs','step_logs'].forEach(x=>
  t(eng.indexOf(x)<0, '   '+x+' is not contact and is not read here'));
t(/_ccLast\(code\)/.test(eng), 'it reads his contact rows');
t(/_vipLastOccurrenceTs/.test(eng), 'and calls that actually happened');
t(/_bookCacheAll/.test(eng), 'and bookings that ran');

console.log('\n  THE CHIP IS ON THE CARD, BEFORE THE NAME:');
t(/_ccChipHtml\(b\.code\)\+'<span class="pfName"/.test(src),
  'the chip is rendered immediately before the name, as ordered');
t(/acts\+=_ccUndoHtml\(b\.code\)/.test(src), 'and the undo sits in the card action row');

console.log('\n'+(bad?(bad+' FAILED'):'all pass'));
process.exit(bad?1:0);
