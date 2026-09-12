// A MUSCLE IS NOT A MOVEMENT, AND EVERY MUSCLE IS TITLE CASE.
//
// Yusuf, 12 Sep: "your program calls the move 'Rear Delts' but the exercise
// library calls it 'Rear Delt Flies', so the picker can't match them ...
// Fix this so that the name of the exercise is Rear Delt Flys or Flies (idk
// which one is correct) and then the MUSCLE should be Rear Delts (Make sure
// this title case format is correct across all muscles)"
//
// Two faults in one line. His week carried a MUSCLE where a MOVEMENT goes, so
// the swap picker had nothing to match; and the muscle dictionary is written in
// lower case, so every card read "rear delt" under "Rear Delt Flies" and
// "mid back" under "Machine Rows".
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const {closure}=require('./_lift.cjs');
let bad=0; const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };

const CL=closure(['_bfMuscleOf','_exCanonical','_bfMuscleSay','EX_MUSCLE','EX_ALIAS','_titleCap']);
t(!CL.unparsable || !CL.unparsable.length, 'everything lifted cleanly', JSON.stringify(CL.unparsable||[]));
global.window={};
eval(CL.code||'');
if(typeof _bfGroupOf!=='function') global._bfGroupOf=function(){ return null; };

console.log('\n  HIS WORD FOR IT RESOLVES TO THE LIBRARY’S:');
['Rear Delts','rear delts','REAR DELTS','Rear Delt Flys','rear delt fly','Reverse Flys','Face Pulls']
  .forEach(function(n){ t(_exCanonical(n.toLowerCase())==='Rear Delt Flies',
    '"'+n+'" is the same movement as Rear Delt Flies', _exCanonical(n.toLowerCase())); });
t(!/'Rear Delts'/.test(src.slice(src.indexOf('var EX_MUSCLE'), src.indexOf('var EX_ALIAS'))),
  'and "Rear Delts" is never itself a movement in the dictionary');

console.log('\n  AND IT HITS REAR DELTS, PLURAL:');
t(_bfMuscleOf('Rear Delt Flies')==='Rear Delts', 'Rear Delt Flies → Rear Delts', _bfMuscleOf('Rear Delt Flies'));
t(_bfMuscleOf('Rear Delts')==='Rear Delts', 'and so does his own word for it', _bfMuscleOf('Rear Delts'));
t(_bfMuscleOf('Shoulder Press')==='Front Delts', 'Shoulder Press → Front Delts', _bfMuscleOf('Shoulder Press'));
t(_bfMuscleOf('Lateral Raises')==='Side Delts', 'Lateral Raises → Side Delts', _bfMuscleOf('Lateral Raises'));

console.log('\n  EVERY MUSCLE IN THE DICTIONARY COMES OUT TITLE CASE:');
const names=Object.keys(EX_MUSCLE);
t(names.length>40, 'the dictionary is the size this test expects', String(names.length));
const wrong=[];
names.forEach(function(n){
  const out=_bfMuscleOf(n);
  out.split(/,\s*/).forEach(function(part){
    part.split(' ').forEach(function(w,i){
      if(!w) return;
      const small={and:1,or:1,of:1,with:1,the:1,a:1,an:1,in:1,to:1,on:1};
      if(i>0 && small[w.toLowerCase()]===1) return;              // "and" stays small
      if(w[0]!==w[0].toUpperCase()) wrong.push(n+' → '+out);
    });
  });
});
t(wrong.length===0, 'not one lower-case muscle left', wrong.slice(0,6).join(' | '));

console.log('\n  INCLUDING THE ONES THE DICTIONARY HAS NEVER HEARD OF:');
t(/return g \? _bfMuscleSay\(g\) : n;/.test(src),
  'a movement with no entry falls back to its GROUP, said the same way');
t(!/String\(g\)\.toLowerCase\(\)/.test(src.slice(src.indexOf('function _bfMuscleOf'), src.indexOf('function _bfMuscleOf')+700)),
  'and the fallback no longer forces it lower, which is what printed "chest" under a chest press');

console.log('\n  ONE PLACE SAYS IT, NOT THIRTY:');
t(/function _bfMuscleSay\(s\)\{/.test(src), 'there is a single function that says a muscle');
t((src.match(/_bfMuscleSay\(/g)||[]).length===4,
  'and all THREE returns in the lookup go through it, plus its own definition',
  String((src.match(/_bfMuscleSay\(/g)||[]).length));

console.log(bad? '\n  '+bad+' FAILED\n' : '\n  all good\n');
process.exit(bad?1:0);
