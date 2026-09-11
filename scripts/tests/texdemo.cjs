// NO PICTURES IN THE EXERCISE LIBRARY, AND NONE ANYWHERE ELSE.
//
// Yusuf, 11 Sep, after seeing the imported set on his own Pull day and then two
// attempts of mine at drawing a replacement: "I would just remove all the images
// in general at this point."
//
// The imported set was never one set. Eighteen were 3D anatomy renders and nine
// were flat cartoons or a line drawing, and a library where nine of twenty-seven
// are a different style reads worse than a library with none. I could not draw
// an anatomy chart either - what came out looked like a mannequin, twice.
//
// This file used to assert the demos were present and correct. It now asserts
// the opposite, which is the only assertion worth keeping: that nothing brought
// them back. A picture that creeps back one call site at a time is exactly how
// this ends up half-shipped again.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let bad=0; const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x&&!p?('   ['+x+']'):'')); };

const banned = [
  ['EX_DEMO',        'the demo map is gone, not emptied and not commented out'],
  ['EX_DEMO_ALIAS',  'and so is the alias table that fed it'],
  ['_exDemo(',       'the lookup is gone'],
  ['_exDemoCanon',   'and the name resolver'],
  ['_exDemoThumb',   'the list thumbnail builder is gone'],
  ['_exDemoTap',     'the tappable one is gone'],
  ['_exDemoOpen',    'and the sheet it opened'],
  ['exThumb',        'no thumbnail class survives in the stylesheet'],
  ['bfThumb',        'nor the one the day cards used'],
  ['woThumb',        'nor the one a finished session used'],
  ['hasDemo',        'nor the library row variant that carried a picture'],
  ['exDemoPic',      'nor anything the demo sheet was built from'],
  ['exDemoCr',       'including the credit line'],
];
banned.forEach(function(pair){
  const n=(src.split(pair[0]).length-1);
  t(n===0, pair[1], pair[0]+' x'+n);
});

// The storage folder the pictures were uploaded into must not be addressed from
// anywhere in the app. The files themselves still sit in the bucket - the anon
// key cannot delete them - but nothing reaches for them.
t(src.indexOf('/_exercise/')<0, 'nothing in the app points at the folder the pictures were uploaded to');
t(!/wger/i.test(src), 'and no credit to the database they came from is left on a client screen');

// What must STILL be true: the library itself is untouched. Removing the
// pictures must not have taken a movement with it.
const a=src.indexOf('var EX_LIB = {'), b=src.indexOf('var DAY_TEMPLATES = {');
t(a>0 && b>a, 'the library and the day templates are both still there');
const names=(src.slice(a,b).match(/\{n:'/g)||[]).length;
t(names===49, 'all 49 movements survive', String(names));
t(/'Pull':\s*\[/.test(src.slice(b)) && /'Push':\s*\[/.test(src.slice(b)), 'and the splits still name their movements');

// And the library row still draws - without a picture, it is the row it was
// before any of this started.
t(/class="pgLibRow">/.test(src), 'a library row is a plain row again');
t(!/pgLibTx/.test(src), 'the wrapper that only existed to sit beside a picture is gone too');

console.log(bad?('\n  '+bad+' FAILED'):'\n  no demo images anywhere, and the library is whole');
process.exit(bad?1:0);
