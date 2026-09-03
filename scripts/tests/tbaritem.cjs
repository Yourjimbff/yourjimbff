// THE DAY BAR SHOWS A LINE PER FOOD (Yusuf, 3 Sep: "this should also be a
// little bit more clear and organized", with a screenshot of the bar giving
// three foods back as one sentence and one number).
const fs=require('fs');
const L=fs.readFileSync('index.html','utf8').split('\n');
function grab(p){ const a=L.findIndex(p); let b=a; while(L[b]!=='}') b++; return L.slice(a,b+1).join('\n'); }
function one(sw){ return L[L.findIndex(l=>l.startsWith(sw))]; }
function multi(sw){ const a=L.findIndex(l=>l.trim().startsWith(sw)); let b=a; while(!/;\s*$/.test(L[b])) b++; return L.slice(a,b+1).join('\n'); }
const REAL=Date;
class FakeDate extends REAL{ constructor(...a){ if(!a.length) super(2026,7,24,9,0,0); else super(...a);} static now(){return new REAL(2026,7,24,9,0,0).getTime();} }
global.Date=FakeDate;
global._jimQuickFoodMatch=function(){ return null; };
global._jimIsAdminOnly=function(t){ var w=String(t||'').toLowerCase().split(/[^a-z]+/).filter(Boolean); if(!w.length) return false; return w.every(function(x){ return /^(yes|ok|okay|sure|log|logged|it|that|please|thanks|do|make|set|change|the|a|an|my|me|i)$/.test(x); }); };          // no saved foods: no numbers
eval([ one('var _JIM_DAY_BACK_RE='), one('var _JIM_DAY_NAGO_RE='), one('var _JIM_DOW='),
  one('var _JIM_WORDNUM='), one('var _JIM_DAY_MAX='), one('var _JIM_WEEKS_AGO_RE='),
  one('var _JIM_MONTHS='), multi('var _JIM_BODY_PART ='), multi('var _JIM_SESSION_DAY ='), multi('var _JIM_WO_RE=new RegExp('), multi('var _JIM_CARDIO_RE=new RegExp('), multi('var _JIM_ECHO_ACTIVITY_RE=new RegExp('), one('var _JIM_MERIDIEM_RE='),
  multi('var _JIM_ANCHOR_SLOTS='), multi('var _JT_PAST_MEAL_RE=new RegExp('),
  multi('var _JV_SOLO_EVENT_RE=new RegExp('),
  one('var _JIM_FOOD_CMP_RE='), grab(l=>l.startsWith('function _jimStripFoodCompare(')), 
  grab(l=>l.startsWith('function _jimDateSaid(')), grab(l=>l.startsWith('function _jimAnchorDay(')),
  grab(l=>l.startsWith('function _jimAnchorSlot(')), grab(l=>l.startsWith('function _jimHarvestWeight(')),
  grab(l=>l.startsWith('function _jimHarvestSteps(')), grab(l=>l.startsWith('function _apCap(')),
  grab(l=>l.startsWith('function _jimEchoDate(')), grab(l=>l.startsWith('function _jimEchoWords(')),
  multi('var _JIM_SELFTALK_RE=new RegExp('), multi('var _JIM_FOODNOTE_RE=new RegExp('),
  multi('var _JIM_FOODREMARK_RE=new RegExp('), multi('var _JIM_MEALREL_RE=new RegExp('),
  grab(l=>l.startsWith('function _titleCap(')), grab(l=>l.startsWith('function _jimDropAsides(')),
  grab(l=>l.startsWith('function _jimMealRelTitle(')),
  multi('var _JIM_SLOT_WORDS_RE=new RegExp('), multi('var _JIM_NUM_CLAUSES='),
  grab(l=>l.startsWith('function _jimWithoutNumbers(')),
  grab(l=>l.startsWith('function _jimLooksLikeMeal(')),
  grab(l=>l.startsWith('function _jimFoodParts(')),
  // THE TABLE AND THE PRICER, which techo.cjs deliberately does not lift -- it
  // proves the reader's WORDS. This suite proves its NUMBERS, so the real chain
  // has to be here or the per-item breakdown is never executed at all.
  one('var MB_PALM_OZ = 3.5;'), one('var MT_G_PER_OZ = 28.3495;'),
  multi('var MT_WEIGHT_G ='), multi('var MT_UNIT_ALIAS ='),
  (function(){ const a=L.findIndex(l=>l.startsWith('var MT_ROWS=[')); let b=a; while(L[b].trim()!=='];') b++; return L.slice(a,b+1).join('\n'); })(),
  'var _MT_BY=null;',
  grab(l=>l.startsWith('function _mtIndex(')), grab(l=>l.startsWith('function _mtRow(')),
  grab(l=>l.startsWith('function _mtRound(')), grab(l=>l.startsWith('function _mtCal(')),
  grab(l=>l.startsWith('function _mtQty(')),   grab(l=>l.startsWith('function _mtItem(')),
  'var _NL_UW_CACHE=null;',
  grab(l=>l.startsWith('function _nlUnitWords(')),
  multi('var _NL_WORD_QTY ='),
  grab(l=>l.startsWith('function _nlEchoSplit(')), grab(l=>l.startsWith('function _nlEchoParse(')),
  multi('var _NL_HARMLESS ='),
  grab(l=>l.startsWith('function _nlSameFood(')), grab(l=>l.startsWith('function _nlEcho(')),
  grab(l=>l.startsWith('function _jimEchoRead(')),
  'function _jimLooksLikeWorkout(t){ return _JIM_WO_RE.test(String(t||"")); }',
  'function _jimStatedMins(){ return null; }',
  'function _jimClock(m){ var h=Math.floor(m/60),x=m%60,ap=h<12?"AM":"PM",d=h%12||12; return d+":"+String(x).padStart(2,"0")+" "+ap; }'
].join('\n'));

const read = (t) => _jimEchoRead(t);
const show = (t) => read(t).map(l => l.k + ' | ' + l.line);
let bad = 0, n = 0;
const t = (ok, label, got) => { n++; if (!ok) bad++; console.log((ok ? '  ok    ' : '  FAIL  ') + label + (got != null ? ('  ' + got) : '')); };

// HIS OWN SCREEN, 3 Sep. He typed this into the Day bar and got back one
// run-on line -- "Logging: 12oz new york steak, 1 handful of broccoli, 1
// handful of rice - 1154 cal / 101P" -- and said it "should also be a little
// bit more clear and organized". The whole point of a breakdown is showing
// WHICH food is carrying the calories, and one combined number hides exactly
// that.
console.log('\nHIS SCREENSHOT LINE COMES BACK AS A LIST, NOT A SENTENCE:');
const HIS = '12oz new york steak, 1 handful of broccoli, 1 handful of rice';
const out = read(HIS);
out.forEach(l => console.log('        [' + l.k + '] ' + l.line));
const items = out.filter(l => l.k === 'fooditem');
const tot = out.filter(l => l.k === 'foodtot');
t(out.length > 1, 'it is more than one line now', '(' + out.length + ' lines)');
t(items.length === 3, 'one line per food he named', '(' + items.length + ')');
t(tot.length === 1, 'and exactly one total under them');
t(/steak/i.test(items[0] ? items[0].line : ''), 'the steak is its own line');
t(/broccoli/i.test(items[1] ? items[1].line : ''), 'the broccoli is its own line');
t(/rice/i.test(items[2] ? items[2].line : ''), 'the rice is its own line');
t(items.every(l => /\d+ cal/.test(l.line)), 'every item carries its own calories');
t(/^Total/.test(tot[0] ? tot[0].line : ''), 'the total says it is the total');

console.log('\nAND THE TOTAL IS THE SUM OF THE LINES, which is the table\'s own law:');
const num = (s, re) => { const m = re.exec(s); return m ? +m[1] : 0; };
const sumCal = items.reduce((a, l) => a + num(l.line, /(\d+) cal/), 0);
const sumP = items.reduce((a, l) => a + num(l.line, /(\d+)P/), 0);
t(sumCal === num(tot[0].line, /(\d+) cal/), 'calories add up', '(' + sumCal + ')');
t(sumP === num(tot[0].line, /(\d+)P/), 'protein adds up', '(' + sumP + 'P)');

console.log('\nA SINGLE FOOD STAYS A SINGLE LINE -- a list of one is not a list:');
const solo = read('12oz new york steak');
t(solo.filter(l => l.k === 'fooditem').length === 0, 'no item rows');
t(solo.filter(l => l.k === 'foodtot').length === 0, 'and no "Total" under one thing');
t(/cal/.test(solo.map(l => l.line).join(' ')), 'but it still shows its numbers', solo[0] && solo[0].line);

console.log('\nAND A PLATE THE TABLE CANNOT FULLY PRICE SHOWS NO BREAKDOWN AT ALL:');
// A PARTIAL BREAKDOWN IS WORSE THAN NONE. It invites him to add the visible
// rows up and get a number that is not the total, which is the same class of
// bug as a wrong number -- it just hides behind arithmetic he does himself.
const part = read('12oz new york steak and my grandmother\'s casserole');
t(part.filter(l => l.k === 'fooditem').length === 0, 'no item rows when one food is unknown');
t(part.filter(l => l.k === 'foodtot').length === 0, 'and no total');
t(!/\d+ cal/.test(part.map(l => l.line).join(' ')), 'and no number anywhere, as before');

console.log('\n' + (n - bad) + '/' + n + ' passed');
console.log('tbaritem: ' + (bad ? 'FAIL' : 'ok'));
process.exit(bad ? 1 : 0);
