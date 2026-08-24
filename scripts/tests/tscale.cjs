// The two harvest patterns, lifted verbatim out of index.html by their text.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8').split('\n');
// Now the SHARED reader jimTurn itself calls.
const a=src.findIndex(l=>l.startsWith('function _jimHarvestWeight('));
let b=a; while(src[b]!=='}') b++;
eval(src.slice(a,b+1).join('\n'));
const pick=(t)=>_jimHarvestWeight(t);
const CASES=[
  ['scale said 197', 197],
  ['scale said 195', 195],
  ['scale said 196', 196],
  ['the scale had me at 197', 197],
  ['scale read 197', 197],
  ['scale showed 197', 197],
  ['the scale showed 197.4 this morning', 197.4],
  ['weighed 196', 196],
  ['scale said 198 this morning', 198],            // HIS SENTENCE, the corpus line
  ['the scale said 198', 198],
  ['scale says 197.4', 197.4],
  ['the scale read 197.4 today', 197.4],
  ['stepped on the scale, 180', 180],
  ['I weighed 198', 198],                          // must not regress
  ['weighed in at 165.4 today', 165.4],
  ['weight 172 this morning', 172],
  ['squats 315 lb for 5', null],                   // a LIFT, caught before shipping once
  ['weight 225 for 8', null],                      // a lift said the other way round
  ['on a scale of 1 to 10 my energy was a 7', null],
  ['on a scale of 1 to 10 I felt like a 6 today', null],
  ['I scaled 315 for 5', null],                    // scaled is not scale
  ['did 3 sets of 10 on the leg press', null],
  ['I had 198 calories', null],
  ['scale of 1 to 10', null]
];
let bad=0;
CASES.forEach(function(c){
  const got=pick(c[0]);
  const ok=(got===c[1]);
  if(!ok) bad++;
  console.log((ok?'  ok    ':'  FAIL  ')+JSON.stringify(c[0])+'  -> '+got+(ok?'':'   (wanted '+c[1]+')'));
});
console.log(bad? '\n'+bad+' FAILED' : '\nall '+CASES.length+' pass');
process.exit(bad?1:0);
