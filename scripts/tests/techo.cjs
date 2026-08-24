// The echo reader, on a fixed today = Monday 24 Aug 2026.
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
  one('var _JIM_MONTHS='), multi('var _JIM_WO_RE=new RegExp('), multi('var _JIM_CARDIO_RE=new RegExp('), multi('var _JIM_ECHO_ACTIVITY_RE=new RegExp('), one('var _JIM_MERIDIEM_RE='),
  multi('var _JIM_ANCHOR_SLOTS='), multi('var _JT_PAST_MEAL_RE=new RegExp('),
  multi('var _JV_SOLO_EVENT_RE=new RegExp('),
  grab(l=>l.startsWith('function _jimDateSaid(')), grab(l=>l.startsWith('function _jimAnchorDay(')),
  grab(l=>l.startsWith('function _jimAnchorSlot(')), grab(l=>l.startsWith('function _jimHarvestWeight(')),
  grab(l=>l.startsWith('function _jimHarvestSteps(')), grab(l=>l.startsWith('function _apCap(')),
  grab(l=>l.startsWith('function _jimEchoDate(')), grab(l=>l.startsWith('function _jimEchoWords(')),
  multi('var _JIM_SELFTALK_RE=new RegExp('), multi('var _JIM_FOODNOTE_RE=new RegExp('),
  multi('var _JIM_FOODREMARK_RE=new RegExp('), multi('var _JIM_MEALREL_RE=new RegExp('),
  grab(l=>l.startsWith('function _titleCap(')), grab(l=>l.startsWith('function _jimDropAsides(')),
  grab(l=>l.startsWith('function _jimMealRelTitle(')),
  grab(l=>l.startsWith('function _jimLooksLikeMeal(')),
  grab(l=>l.startsWith('function _jimEchoRead(')),
  'function _jimLooksLikeWorkout(t){ return _JIM_WO_RE.test(String(t||"")); }',
  'function _jimStatedMins(){ return null; }',
  'function _jimClock(m){ var h=Math.floor(m/60),x=m%60,ap=h<12?"AM":"PM",d=h%12||12; return d+":"+String(x).padStart(2,"0")+" "+ap; }'
].join('\n'));
const show=(t)=>_jimEchoRead(t).map(l=>l.line);
const C=[
  // ---- HIS FINGER, 24 Aug: typed into the Day field, plain, no verb ----
  ['Philly cheesesteak omelette',             ['Logging: Philly cheesesteak omelette']],
  ['2 McDonalds hamburgers',                  ['Logging: 2 McDonalds hamburgers']],
  ['chicken and rice',                        ['Logging: chicken and rice']],
  ['oatmeal',                                 ['Logging: oatmeal']],
  ['Philly cheesesteak omelette for breakfast',['Logging: breakfast — Philly cheesesteak omelette']],
  // ---- must stay silent ----
  ['yes',                                     []],
  ['ok log it',                               []],
  ['how many calories in a bagel?',           []],
  ['what should I eat',                       []],
  // ---- activity is not food ----
  // The shared detectors know 'walk' and 'walking', not 'walked'. Silent
  // rather than wrong: it will NOT preview a walk as a meal.
  ['walked the dog twenty minutes',           []],
  ['30 minutes on the treadmill',             ['Logging: 30 minutes on the treadmill']],
  ['2 McDonalds hamburgers I had',            ['Logging: 2 McDonalds hamburgers']],
  ["last week's leg day and I weighed 195",   ['Logging: Leg day — Mon, Aug 17','Logging weight: 195 — Mon, Aug 17']],
  // _JIM_WO_RE - the SHARED workout detector - does not know bare "legs"
  // (it knows "leg day", and "squats"). The echo therefore says nothing about
  // a workout here, which is the never-lie rule working: it previews only what
  // the deterministic layer can actually see. Named as a gap, not papered over.
  ['I did legs and walked 9,000 steps',       ['Logging steps: 9,000']],
  ['did legs today squats 315 for 5 5 3',     ['Logging: Did legs squats 315 for 5 5 3']],
  ['I had a Philly cheesesteak omelet for breakfast', ['Logging: breakfast — a Philly cheesesteak omelet']],
  ['yesterday I ate a Philly cheesesteak omelet',     ['Logging: Sun, Aug 23 — a Philly cheesesteak omelet']],
  ["last week's leg day",                     ['Logging: Leg day — Mon, Aug 17']],
  ['I weighed 195',                           ['Logging weight: 195']],
  ['scale said 197 this morning',             ['Logging weight: 197']],
  ['I walked 9,000 steps',                    ['Logging steps: 9,000']],
  ['js',                                      []],
  // KNOWN AND NAMED: word-shaped gibberish echoes. Telling it from a
  // first-time food name needs a food dictionary this app does not have
  // locally. "js" - his own standard - stays silent.
  ['asdkjh mumbo jumbo',                      ['Logging: asdkjh mumbo jumbo']],
  ['',                                        []],
  ['what should I eat tomorrow',              []]
];
let bad=0;
C.forEach(function(c){
  const g=show(c[0]); const ok=JSON.stringify(g)===JSON.stringify(c[1]); if(!ok) bad++;
  console.log((ok?'  ok    ':'  FAIL  ')+JSON.stringify(c[0]));
  console.log('           '+(g.length?g.join('  |  '):'(silent)'));
  if(!ok) console.log('           wanted: '+(c[1].length?c[1].join('  |  '):'(silent)'));
});
console.log(bad? '\n'+bad+' differ':'\nall '+C.length+' pass');
