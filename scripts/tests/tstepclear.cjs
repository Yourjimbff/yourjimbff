// CLEARING A DAY ASKS FIRST (Yusuf, 10 Sep, after nearly losing a day of his
// own steps: "I clicked on it and I opened it and I tried to clear it. I think
// it just wiped it to zero" - and then "you are right, I will turn it on").
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let bad=0; const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };
function slice(a,b){ const i=src.indexOf(a); return src.slice(i, src.indexOf(b,i)); }

const tap = slice('function stClearTap(ds){', 'async function stUndoClear');
t(/_stClearArm!==1/.test(tap), 'the first tap only arms it');
t(/Tap again to clear/.test(tap), 'and says so, in the line he already tapped');
t(/setTimeout\(_stClearReset, 4000\)/.test(tap), 'it disarms itself after four seconds, so a stray tap cannot sit armed');
t(/saveSteps\(ds, true\)/.test(tap), 'only the second tap clears');
t(tap.indexOf('_stClearArm=1') < tap.indexOf('saveSteps(ds, true)'), 'in that order');
t(!/confirm\(/.test(tap), 'NO BROWSER CONFIRM BOX - on a phone that is a system dialog over his own sheet and it reads as the app breaking');
t(/was=\(window\._stepMap\|\|\{\}\)\[ds\]\|\|0/.test(tap), 'the number that is about to go is remembered first');

const undo = slice('async function stUndoClear(){', 'async function saveSteps(ds, clear){');
t(/sbUpsert\('step_logs'/.test(undo), 'Undo writes the old number straight back');
t(/window\._stepMap\[u\.ds\]=u\.steps/.test(undo), 'and puts it back on the screen');
t(/_sbFailToast\('put that back'\)/.test(undo), 'and says so plainly when the write is refused, rather than looking like it worked');

const save = slice('async function saveSteps(ds, clear){', 'function _stImpPaint');
t(/if\(clear\)\{/.test(save) && /_doneFlash/.test(save), 'a SAVE still closes the sheet with its check');
t(save.indexOf('if(clear){') < save.indexOf('_doneFlash'), 'and a CLEAR does not close it - the way back has to still be on screen');

t(/\(_stUndo && _stUndo\.ds===ds\)/.test(src) && /">Undo<\/div>'/.test(src),
  'with no steps on the day, the same line reads Undo');
t(/\.stClear\.armed\{color:#ff6f5e;\}/.test(src), 'armed is red');
t(/\.stClear\.undo\{color:var\(--gold\);\}/.test(src), 'and the way back is gold');

console.log(bad?('\n  '+bad+' FAILED'):'\n  clearing a day asks first, and can be taken back');
process.exit(bad?1:0);
