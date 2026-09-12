// FOUR DEFECTS FOUND AUDITING THE LAUNCH CHECKLIST (11 Sep).
//
// Each one is an item on the checklist he was about to walk through himself,
// and each was invisible from the screen - the button did something, the toast
// was cheerful, the number looked like a number.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let bad=0; const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&x!==''?('  '+x):'')); };
/* THE COMMENT IS NOT THE CODE. Every note in this file names the thing it
   fixed, so "logged_at is gone" and "no raw fetch" both matched the prose
   explaining their removal and failed on a correct build. Assertions about what
   is ABSENT read the code with the comments stripped; assertions about the note
   itself read the raw slice. */
const decomment=(x)=>String(x).replace(/\/\*[\s\S]*?\*\//g,'').replace(/^[ \t]*\/\/.*$/gm,'');

// ---- b1: "Log steps - type today's steps, they save" ---------------------
console.log('  b1  THE STEPS BOX SAID IT SAVED WHEN IT HAD NOT:');
const _ti=src.indexOf('async function tpLogSteps(v){');
const tls=src.slice(src.lastIndexOf('/*', _ti), src.indexOf('async function loadTpSteps()'));
t(/sbUpsert\('step_logs'/.test(tls) && /'client_code,date_str'/.test(tls),
  'it goes through the same door as the other seven step writers, with the merge target');
t(!/logged_at/.test(decomment(tls)),
  'and no longer sends logged_at - step_logs has no such column, which is what 400d the write');
t(/fetch\(/.test(decomment(tls))===false,
  'no raw fetch left: fetch only rejects on a NETWORK failure, so a 400 resolved and the empty catch never fired');
t(/if\(ok\) showToast/.test(tls) && /else\s+showToast\('Steps did not save/.test(tls),
  'and the toast branches on the answer instead of firing regardless');
t(/THE APP NEVER ASSERTS WHAT IT HAS NOT ESTABLISHED/.test(tls),
  'with the law it broke named at the top of it');

// ---- b6: "Weight change - the direction and the number are correct" ------
console.log('\n  b6  TWO SCREENS, TWO ANSWERS TO "SINCE YOU STARTED":');
const wp=src.slice(src.indexOf('function _renderWpChart(weights){'), src.indexOf('function _renderWpChart(weights){')+6000);
t(/_pgStartWeight\(/.test(wp),
  'the chart asks the one function every other surface asks');
t(!/var first=parseFloat\(W\[0\]\.weight\), now=/.test(decomment(wp)),
  'and no longer measures from the oldest weigh-in behind its back');
t(/_sw && _sw\.ok && _sw\.val!=null/.test(wp) && /parseFloat\(W\[0\]\.weight\)/.test(wp),
  'falling back to the first weigh-in only when no start weight was ever recorded');
t(/var _since=\(_sw && _sw\.note\) \? _sw\.note : 'since you started';/.test(wp),
  'and saying "since first weigh-in" when that is what it measured - it stops claiming a start it does not have');

// ---- w8: "Swap an exercise for today" ------------------------------------
console.log('\n  w8  THE SWAP PICKER OFFERED WHAT IT WOULD THEN REFUSE:');
const sw=src.slice(src.indexOf('function bfDaySwapOpen(ds, day, i){'), src.indexOf('function bfDayAddOpen(ds, day){'));
t(/var _taken=list\.map\(function\(x\)\{ return x\.n; \}\);/.test(sw),
  'the names are built once');
t(/_tpOpenPickerFor\(e, _taken, day\)/.test(sw),
  'and THOSE are what the picker filters on - it was handed the array of exercise objects');
t(!/_tpOpenPickerFor\(e, list, day\)/.test(decomment(sw)),
  'the objects array is gone: indexOf of a name in an array of objects is always -1, so the filter did nothing');
const pk=src.slice(src.indexOf('function _tpOpenPickerFor(e, taken, day){'), src.indexOf('function _tpOpenPickerFor(e, taken, day){')+1400);
t(/_taken\.indexOf\(x\.n\)<0/.test(pk),
  'and the picker still filters by name, which is why it needed names');

// ---- w10: "Add an exercise for today" ------------------------------------
console.log('\n  w10 AND SO DID THE ADD SEARCH:');
const _ai=src.indexOf('function tpAddSearch(){');
const ad=src.slice(_ai, src.indexOf('if(!hits.length)', _ai));
t(/window\._bfDayPick && Array\.isArray\(window\._bfDayPick\.taken\)/.test(ad),
  'the add search hides what is already on today\'s sheet');
t(/if\(_bt && _bt\.length\) all=all\.filter/.test(ad),
  'before offering it, not after refusing it');
t(/_bfDayPick is null for the\s+program editor/.test(ad),
  'and only when a DAY is being edited - the program editor still lists the whole library');

console.log(bad? '\n  '+bad+' FAILED' : '\n  four checklist items that looked fine from the screen');
process.exit(bad?1:0);
