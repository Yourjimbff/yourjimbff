// ONE NUMBER, NOT TWO.
//
// Lailee: she logs a meal, sees a number, it saves, a different number appears.
// Yusuf, plainly: "it should just give 1 number. not 2. it says 1 number first,
// then you log it, then it submits it, and another number pops up afterwards."
//
// The first number was the "so far" line under the box. It printed the moment
// two items were priced, whether or not the rest of the plate was - so a plate
// with one item the macro table could not price showed a confident total and
// then landed somewhere else once the model priced the missing item.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let bad=0; const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };
function slice(a,b){ const i=src.indexOf(a); return src.slice(i, src.indexOf(b,i)); }

const echo = slice('function _nlEchoHtml(st){', 'function nlRender(){');
t(/var _priced=e\.lines\.filter\(function\(L\)\{ return L\.known && !L\.est; \}\)\.length;/.test(echo),
  'the total counts only items the TABLE priced - an estimate does not count');
t(/_priced===e\.lines\.length/.test(echo), 'every item on the plate has to be one of them');
t(/!e\.unpriced/.test(echo), 'and nothing may be left unpriced');
t(/if\(_whole\)\{/.test(echo), 'only then does a total print at all');
t(!/'so far'/.test(echo) && !/>so far</.test(echo),
  'and it no longer says "so far", which was the app admitting the number was not final');
t(/worked out when you log it/.test(echo),
  'an item the table cannot price still says so instead of guessing');

/* The per-item lines are the thing he actually asked for on 3 Sep and they stay. */
t(/nlEchoRow/.test(echo) && /_mealMacLine\(L\.stated/.test(echo), 'the line per item is untouched');

// ---- the third number: the Edit sheet ----
const edit = slice('function tlEditFood(id){', 'function _edPaintDay');
t(/sbSelect\('food_logs','id=eq\.'/.test(edit),
  'the Edit sheet asks the record rather than trusting the copy the page is holding');
t(/if\(document\.activeElement===el\) return;/.test(edit),
  'and never yanks a field out from under her thumb');
t(/if\(String\(window\._tlEditId\)!==String\(id\)\) return;/.test(edit),
  'nor paints into a sheet that has since moved on to another meal');

const patch = slice('function _nlCachePatch(id, fields){', 'async function _nlEnrich');
t(/allFood/.test(patch) && /todayFood/.test(patch) && /_tlCache/.test(patch),
  'when the estimate lands it reaches all three copies the page holds, not just the day\'s');

console.log(bad?('\n  '+bad+' FAILED'):'\n  one number, and it is the real one');
process.exit(bad?1:0);
