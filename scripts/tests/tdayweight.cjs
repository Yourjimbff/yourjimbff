// THE WEIGHT CARD MOVED FROM PROGRESS TO THE DAY (Yusuf, order, 6 Sep).
//
// "we have a weight graph of progress ... I feel like that would be really
// cool to have on the front page, the weigh in history along with potentially
// more stats." Then: "Adding weight progress to this should eliminate
// elsewhere ... put it right there on the main page."
//
// Two things this file guards. ONE PLACE: the card is on the day and gone from
// Progress, and nobody lost the way to weigh in. SAME NUMBERS: the number a
// client reads on the day is the number that was on Progress, derived the same
// way - same start weight, same unit, same delta wording.
const fs=require('fs');
const guard=require('./_guard.cjs');
const {closure}=require('./_lift.cjs');
let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };

global.window={}; global.document={getElementById:()=>null};
global._escHtml=x=>String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
global.profile=null;
global.wUnit=()=>'lbs';
global.wToDisp=(v)=>Math.round(parseFloat(v)*10)/10;
global._pgStartWeight=(p,first)=>({ok:false,val:first,source:'first'});
global._tlDateStr=(d)=>'2026-09-06';
global._stepsFor=()=>null;
const MINE=['_dayWeightHtml','_dayWeightRepaint','_tlStatsBlock'];
const CL=closure(MINE);
eval(CL.code||'');
guard(MINE, n=>eval(n));
const src=fs.readFileSync('index.html','utf8');
const ds='2026-09-06';

console.log('\n  THREE STATES, NEVER A CLAIM BEFORE THE READ:');
window._wtAll=undefined;
let h=_dayWeightHtml(ds);
t(/pgK">Weight</.test(h) && !/No weigh-ins yet/.test(h),
  'before the weigh-ins have loaded it says nothing about them - a statement made before the read is a lie half the time');
t(!/data-tl="weighview"/.test(h), 'and the door is not in the card any more - it is a Body row above it (10 Sep)');
window._wtAll=[];
h=_dayWeightHtml(ds);
t(/No weigh-ins yet/.test(h), 'read and empty says so');
t(/pgEmpty/.test(h), 'in the empty style Progress used');

console.log('\n  SAME NUMBERS AS PROGRESS:');
window._wtAll=[
  {weight:185.0, logged_at:'2026-08-01T12:00:00Z'},
  {weight:183.2, logged_at:'2026-08-20T12:00:00Z'},
  {weight:182.1, logged_at:'2026-09-03T12:00:00Z'},
  {weight:181.4, logged_at:'2026-09-06T12:00:00Z'},
];
h=_dayWeightHtml(ds);
t(/pgN">181\.4<u> lbs<\/u>/.test(h), 'the headline is the latest weigh-in in the display unit');
t(/down 3\.6 since first weigh-in/.test(h), 'the delta is against the start weight, worded as Progress worded it');
t(/185 at your first weigh-in → 181\.4 today/.test(h), 'start to today is still computed, same words as Progress');
t(/<polyline points=/.test(h) && /<circle /.test(h), 'the gold line with the dot on the last reading');
t(/class="pgCard dwCard dwCompact"/.test(h), 'and it IS the Progress card - same class, same look, half the size');
// the lift pulled in `var cl=null, profile=null;`, so profile is the eval scope's, not global's
profile={goal_weight:175};
h=_dayWeightHtml(ds);
t(/· target 175/.test(h), 'a target on the profile shows, as it did on Progress');
profile=null;

console.log('\n  HALF THE CARD, ONE BLOCK (Yusuf, 6 Sep: "1/2 or 1/4 block size ... 1 cohesive tab"):');
t(/dwCompact/.test(h), 'the day draws the compact form');
t(!/pgSub/.test(h) && !/dwHist/.test(h), 'no sub line and no list under it - the line is the history');
t(/title="185 at your first weigh-in/.test(h), 'the long form survives as the card title, for a long press');
t(/height="30"/.test(h), 'the line is 30px tall, not 52');

console.log('\n  THREE LINES, ONE SIZE (Yusuf, 7 Sep, 9:35pm: "You fucked this up"):');
h=_dayWeightHtml(ds);
t(!/dwPhotos|dwPh\b|dwPhAdd/.test(h), 'no tile, no strip');
const L=(h.match(/class="(dwLine|dwLine dwMid|dwTap)"/g)||[]).length;
t(L===0, 'no lines in the card - it is the stat and nothing else (10 Sep)', String(L));
const stats=src.slice(src.indexOf('function _tlStatsBlock'), src.indexOf('/* ===== THE CHECK IN'));
t(/tlMealsEy">Body</.test(stats), 'a Body section sits above Stats');
t(stats.indexOf("_tlAskRow('weighview', ds, 'Weigh in', 'weigh')")>0 && stats.indexOf("_tlAskRow('steps', ds, 'Steps')")>0 && stats.indexOf("_tlAskRow('progphoto', ds, 'Progress photo')")>0, 'with Weigh in, Steps and Progress photo as the same gold plus rows as Breakfast');
t(/Weigh in \\u00b7 '\+_escHtml\(_pgW\(\+w0\.weight\)/.test(stats), 'done, the weigh-in row says the number');
t(/\.dwMid\{justify-content:flex-start;\}/.test(src), 'left aligned, same height as its neighbours (Yusuf: "Left align")');
t(/\.dwLines \.dwTap\{color:var\(--text\);\}/.test(src) && /\.dwLines \.dwLineV\{color:rgba\(240,236,228,0\.62\);\}/.test(src), 'the three doors read in text, not gold - "Watch overuse of gold"');
window._wtAll=[];
h=_dayWeightHtml(ds);
t(/No weigh-ins yet/.test(h) && !/data-tl="progphoto"/.test(h) && !/data-tl="steps"/.test(h), 'even with no weigh-ins the card stays a stat; the rows live above it');
window._wtAll=[{weight:185.0, logged_at:'2026-08-01T12:00:00Z'},{weight:181.4, logged_at:'2026-09-06T12:00:00Z'}];

console.log('\n  ONE PLACE:');
t(!/<div id="pgWeightCard"><\/div>/.test(src), 'the card is GONE from Progress - "eliminate elsewhere"');
t(/#tileWeight\{display:none;\}|,#tileWeight\{/.test(src), 'the old weight tile is hidden by CSS now that nothing hides it at runtime');
t(/window\._wtAll = weights;\s*\n\s*try\{ _dayWeightRepaint\(\); \}catch\(e\)\{\}/.test(src),
  'when the weigh-ins load, the card repaints in place');
const save=src.slice(src.indexOf('async function tlSaveWeigh(){'), src.indexOf('async function tlSaveWeigh(){')+2500);
t(/window\._wtAll\.push\(row\)/.test(save), 'a weigh-in from the day sheet lands on the card at once');
t(/renderWeightJourney\(\)/.test(save), 'and the history refetches behind it');
t(/return \(isToday && !window\._tlRO\) \? '' : _tlWeighCard\(r\.it, ds\);/.test(src),
  'today draws no second weigh-in hero - the same number twice a screen apart was the duplicate Progress cut on 23 Aug');
t(/return \(isToday && !window\._tlRO\)/.test(src), 'but the trainer copy keeps it, because he gets no Stats block');

console.log('\n  IT IS A STRING, NOT A NODE:');
const fn=src.slice(src.indexOf('function _dayWeightHtml('), src.indexOf('function _dayWeightRepaint('));
t(!/bodyWeight|gpWeightDrawer|appendChild/.test(fn),
  'never re-homes #bodyWeight into the timeline - innerHTML rebuilds would destroy it and a client would lose the way to weigh in');
t(/data-tl="weighview"/.test(fn), 'the door is the day page sheet (tlWeighIn), which already exists');

global.window._tlRO=true;
t(_dayWeightHtml(ds)==='' && _tlStatsBlock(ds, true, false, {})==='', 'the trainer read-only copy draws none of it');
global.window._tlRO=false;

const holes=CL.unresolved.filter(function(n){
  const stripped=src.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/[^\n]*/g,'').split('window.'+n).join('window.__WINPROP__');
  return new RegExp('(^|[^.A-Za-z0-9_$])'+n+'(?![A-Za-z0-9_$])').test(stripped);
});
t(holes.length===0, 'the lifted closure has no holes', holes.join(','));

console.log();
if(bad){ console.log('  '+bad+' FAILED'); process.exit(1); }
console.log('  all day-weight assertions pass');
process.exit(0);
