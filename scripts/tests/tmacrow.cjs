// A MEAL ROW SHOWS ALL FOUR MACROS (Yusuf, order, 27 Aug).
//
// From his screen: a collapsed meal row showed calories and protein, and carbs
// and fat were only reachable by opening the meal — a tap to read a number that
// was already there. And the plate total came out of his copy as
// "520 cal52g protein", with the two numbers run together.
//
// FOUR renderers drew a meal row, each with its own idea of the line: the Day
// row showed two macros, the feed card showed four with a 0 standing in for
// anything never recorded, and two client-card rows showed two and the time.
// They share one builder now.
const fs=require('fs');
const guard=require('./_guard.cjs');
const src=fs.readFileSync('index.html','utf8');
const L=src.split('\n');
function fnAt(n){ const a=L.findIndex(l=>l.indexOf('function '+n+'(')===0); if(a<0) return '';
  let b=a; while(b<L.length && L[b]!=='}') b++; return L.slice(a,b+1).join('\n'); }
let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };
// _jvNum is the grouping formatter _mealMacLine routes every figure through since
// the 2 Sep "one line, one format" ruling. Unlifted, this suite threw inside its
// first call and measured NOTHING while the summary line stayed quiet.
eval([fnAt('_jvNum'), fnAt('_mealMacLine')].join('\n'));
guard(['_jvNum','_mealMacLine'], n=>eval(n));

const FULL={calories:520, protein:52, carbs:3, fat:30, eat_time:'7:30 AM'};

console.log('\n  ALL FOUR, AT A GLANCE, NO EXPANDING:');
const line=_mealMacLine(FULL,'long',{time:false});
console.log('    ' + line);
t(line==='520 cal · 52g protein · 3g carbs · 30g fat', 'exactly his shape', JSON.stringify(line));

console.log('\n  THE SEPARATOR IS A REAL CHARACTER, so a copy carries it:');
t(line.indexOf('520 cal52g')<0, 'the numbers never run together');
t((line.match(/·/g)||[]).length===3, 'three separators for four values');
t(!/\s\s/.test(line), 'and no double spaces');

console.log('\n  OLDER ROWS SHOW WHAT THEY HAVE AND SKIP WHAT THEY LACK:');
t(_mealMacLine({calories:520, protein:52},'long',{time:false})==='520 cal · 52g protein',
  'a meal logged before carbs and fat were captured shows two');
t(_mealMacLine({calories:520, protein:52},'long',{time:false}).indexOf('0g carbs')<0,
  'and never a 0 nobody recorded');
t(!/·\s*$/.test(_mealMacLine({calories:520, protein:52},'long',{time:false})),
  'with no separator left dangling');
t(_mealMacLine({calories:520},'long',{time:false})==='520 cal', 'calories alone is just calories');
t(_mealMacLine({},'long',{time:false})==='', 'and a row with nothing recorded says nothing');
t(_mealMacLine(null,'long')==='', 'a missing row does not throw');

console.log('\n  THE TIME RIDES WHERE THE SURFACE WANTS IT:');
t(_mealMacLine(FULL,'long').endsWith('· 7:30 AM'), 'the feed and client cards keep it');
t(_mealMacLine(FULL,'long',{time:false}).indexOf('7:30')<0, 'the Day row, whose header already shows a clock, does not');
t(_mealMacLine({calories:100, eatTime:'9:00 AM'},'long')==='100 cal · 9:00 AM', 'and it reads eatTime too');

console.log('\n  SHORT UNITS WHERE THE APP ALREADY USED THEM:');
t(_mealMacLine(FULL,'short',{time:false})==='520 cal · 52g P · 3g C · 30g F',
  'the feed card keeps its own compact look');

console.log('\n  EVERY MEAL ROW USES IT — the house disease, checked:');
const calls=(src.match(/_mealMacLine\(/g)||[]).length;
t(calls>=5, 'the builder plus four call sites', calls+' references');
t(/<div class="femta">'\+_mealMacLine\(e,'short'\)/.test(src), 'the feed card');
t((src.match(/cc-meal-mac">\\?'\+_mealMacLine\(f,\\?'long\\?'\)/g)||[]).length===2, 'both client-card rows');
t(/_mealMacLine\(r,'short',\{time:false\}\)/.test(src), 'and the Day row, in short units');
// Measured, not guessed: with long units at 375px the name collapses to 7px.
t(_mealMacLine({calories:890,protein:28,carbs:98,fat:38},'short',{time:false})==='890 cal · 28g P · 98g C · 38g F',
  'which keeps the row one line and leaves the food name room to be a name');
t(!/\(e\.calories\|\|0\)\+' cal · '/.test(src), 'no renderer still prints its own zeros');

// ===== THE MISS THAT MADE THIS SUITE NECESSARY (27 Aug) =================
// I changed four renderers, called one of them "the feed card", and reported
// the feed as done. It was rendTodayFood — the client's own Today list. The
// actual feed row, _pfDayRow, still built its own two-value line, so he opened
// the feed and there was no fat, exactly as he said.
//
// So this no longer trusts a list of names I happened to think of. It SWEEPS
// the file for any surviving hand-built meal macro line and fails on a new one.
const OWNERS=[];
{ let owner=null;
  src.split('\n').forEach(function(l,i){
    if(/^(async )?function /.test(l)) owner=l.split('(')[0].replace(/^async function /,'').replace(/^function /,'');
    if(/cal\b.{0,12}·/.test(l) && /protein|\bP\b/.test(l) && l.indexOf('_mealMacLine')<0 && !/^\s*\/\//.test(l)) OWNERS.push(owner);
  });
}
// Everything left must be something OTHER than a logged meal row: a spoken
// confirmation, a prompt example, a MENU item (a meal proposed, never logged),
// or a function whose own name says it is unused.
const ALLOWED=['_jvCommitPending','buildDayContext','buildCoachVoice','rendCoachMenu','rendMenuItems','openMenuShare','_openShareCardDayLegacy_UNUSED'];
const stray=OWNERS.filter(function(o){ return ALLOWED.indexOf(o)<0; });
t(stray.length===0, 'no meal-row renderer builds its own macro line any more', stray.length?('still hand-built in: '+stray.join(', ')):'');
t((src.match(/_mealMacLine\(/g)||[]).length>=11, 'and every one of them calls the shared builder',
  (src.match(/_mealMacLine\(/g)||[]).length+' references');

console.log('\n  THE FEED ROW SPECIFICALLY — the one he caught:');
// The call is wrapped in _feedNumBind since 30 Aug (numbers are never cut), so
// this asks that the BUILDER is still the source of the row's macros rather than
// that the call stands bare — a literal match here would forbid the row ever
// passing that string through anything, which is not what he ruled.
t(/meta = (?:_feedNumBind\()?_mealMacLine\(d,'short',\{time:false\}\)/.test(src), '_pfDayRow draws its macros from the builder');
t(!/meta = cal\+' cal · '\+pro\+'P'/.test(src), 'and no longer hand-builds calories and protein alone');

console.log('\n  AND THE PLATE TOTAL SEPARATES TOO:');
t(/Math\.round\(tot\.cal\)\+' cal<\/b>'\s*\n\s*\+'<span>\\u00b7<\/span>'/.test(src),
  'a character between the plate calories and its protein, not just a flex gap');

console.log('\n'+(bad?(bad+' FAILED'):'all pass'));
process.exit(bad?1:0);
