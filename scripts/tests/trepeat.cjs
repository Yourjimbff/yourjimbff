// "USUAL" DESCRIBES THE PERSON. "REPEAT" DESCRIBES THE BUTTON.
//
// Yusuf, 13 Sep, looking at a meal card in My Meals: "instead of usual, have
// it repeat."
//
// The word was on a button, a line under the meal name, a sheet title, four
// rows inside that sheet and a toast. Renaming only the button would have left
// a control that says Repeat opening a sheet that says usual, which is worse
// than either word on its own -- so the whole idea is renamed and this suite
// holds the word out of every surface a client reads.
//
// WHAT IS DELIBERATELY NOT RENAMED:
//   the meal_usuals TABLE and every mp*Usual function. The schema is not the
//   client's business, and a migration for a word is a migration that can fail.
//   Jim's understanding of somebody TYPING "my usual chicken and rice". People
//   say that; he has to keep knowing what it means. The label changed, not the
//   language.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };
function slice(a,b){ const i=src.indexOf(a); if(i<0) return ''; const j=src.indexOf(b,i); if(j<0) throw new Error('stale end anchor, this suite was reading the rest of the file: '+b); return src.slice(i,j); }

console.log('\n  THE BUTTON ON THE MEAL CARD:');
const card=slice('function _flibFoodRow(f){','function _flibFoodRow(f){');
const row=slice("  var tapFn=(chip==='Save')","function _flibFoodRow(f){");
t(/class="flUsualBtn">Repeat<\/div>/.test(row), 'it says Repeat');
t(!/>Usual<\/div>/.test(src), 'and nothing anywhere says Usual on a button');
t(/class="flUsual">Repeats · /.test(row), 'the line under the name says Repeats · breakfast');
t(/mpOpenSheet/.test(row), 'and it still opens the sheet it always did');

console.log('\n  THE SHEET IT OPENS:');
const sheet=slice('function mpOpenSheet(id){','function _mpCloseSheet(){');
t(/>Repeat this meal</.test(sheet), 'the title agrees with the button');
t(!/Make this a usual/.test(src), '"Make this a usual" is gone');
t(/row\('Breakfast','Every breakfast'\)/.test(sheet), 'Every breakfast');
t(/row\('Lunch','Every lunch'\)/.test(sheet), 'Every lunch');
t(/row\('Dinner','Every dinner'\)/.test(sheet), 'Every dinner');
t(/row\(null,'Don\\u2019t repeat it','Take it off my day'\)/.test(sheet), 'and a way to stop it');
t(!/Not a usual/.test(src), '"Not a usual" is gone with it');

console.log('\n  AND WHAT IT SAYS AFTERWARDS:');
const set=slice('async function mpSetUsual','function mpOpenSheet(id){');
t(/Repeats every '\+slot\.toLowerCase\(\)/.test(set), 'it confirms in the same word');
t(/'No longer repeating'/.test(set), 'and so does turning it off');
t(!/Your usual '\+slot/.test(src), 'the old toast is gone');

console.log('\n  NOT A SINGLE CLIENT-FACING "USUAL" IS LEFT:');
/* A FIRST PASS SCANNED EVERY QUOTED STRING IN THE FILE AND CRIED WOLF FOUR
   TIMES: a Jarvis prompt line reading "with the usual confirm", the plumbing
   throw `new Error('usual '+res.status)`, and two REGEXES whose job is to
   recognise a person typing "my usual". None of those is a label, and a check
   that fails on them is a check nobody will keep.
   So this looks at DISPLAY CONTEXTS only: the word sitting where HTML, a
   title, a row label or a toast would put it. That is where a leak would
   actually be seen. */
const shown = [
  />\s*Usuals?\b/,                       // between tags
  /\bUsuals?\s*\u00b7/,                       // "Usual · breakfast"
  /\bUsuals?\s*<\//,                     // closing straight after it
  /row\('[^']*',\s*'[^']*[Uu]sual/,        // a row label in the sheet
  /showToast\([^)]*[Uu]sual/,             // a toast
  /_escHtml\('[^']*[Uu]sual/              // escaped into the page
];
const hits = shown.map(re => (re.exec(src)||[null])[0]).filter(Boolean);
t(hits.length===0, 'the word is in no label, title, row or toast', hits.join(' | '));
t(!/Usual breakfast|Usual lunch|Usual dinner/.test(src), 'and none of the three slot rows still says it');

console.log('\n  AND THE THINGS THAT MUST NOT HAVE MOVED:');
t(/meal_usuals/.test(src), 'the table is still meal_usuals -- a migration for a word is a migration that can fail');
t(/function mpSetUsual/.test(src) && /function mpSlotOf/.test(src), 'the functions keep their names');
t(/function mpUsualFor/.test(src), 'including the one the Day page asks');
t(/usual eggs/i.test(src) || /my usual/i.test(src),
  'and Jim still understands somebody TYPING "my usual" -- people say that, the label changed, not the language');

console.log(bad? ('\n  '+bad+' FAILED\n') : '\n  all good\n');
process.exit(bad?1:0);
