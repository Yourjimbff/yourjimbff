// "So today I'm at 8,929 steps so far after a fasted morning walk/run"
// (Alex Suarez, 16 Sep. Yusuf: "This should log a workout and keep the steps
// up. Make sure his steps appear as that amount he wrote so far.")
//
// It logged a Cardio workout carrying that exact sentence as its description,
// and wrote NO STEPS. Checked against the live tables: he has never had a step
// row, while step_logs itself is healthy - 525 rows across 56 clients, one
// written the same morning. So the table works and his number vanished.
//
// TWO HOLES, BOTH SILENT, EITHER ONE ENOUGH.
//
// 1. The backstop that exists for exactly this only fired when the model
//    emitted NO marker. A [STEPS_LOG] that parsed but carried nothing usable
//    counted as an answer, shut the backstop off, and then failed its own
//    isNaN check a screen later. Silence at both ends.
//
// 2. The handler read the marker with a bare parseInt. A model writing the
//    number the way a person writes it - "8,929" - logged EIGHT. The screenshot
//    reader has stripped non-digits since it was written; this path never did.
const fs=require('fs');
const guard=require('./_guard.cjs');
const {defOf}=require('./_lift.cjs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };

const MINE=['_jimStepVal','_jimHarvestSteps','_ppShotSteps'];
eval(MINE.map(defOf).join('\n'));
guard(MINE, n=>eval(n));

console.log('\n  HIS SENTENCE, WORD FOR WORD:');
const HIS="So today I'm at 8,929 steps so far after a fasted morning walk/run";
t(_jimHarvestSteps(HIS)===8929, 'the backstop reads 8,929 out of it', String(_jimHarvestSteps(HIS)));

console.log('\n  A NUMBER WRITTEN THE WAY PEOPLE WRITE IT:');
t(_jimStepVal({steps:'8,929'})===8929, '"8,929" is 8,929, not 8', String(_jimStepVal({steps:'8,929'})));
t(_jimStepVal({steps:8929})===8929,    'and a plain number is itself');
t(_jimStepVal({steps:'8929 steps'})===8929, 'and a unit stuck on the end is ignored');
t(_jimStepVal({steps:' 12,000 '})===12000, 'and so is whitespace');
/* The same rule the screenshot reader has always used, so a count read off a
   photo and one typed into chat can never disagree about what it says. */
t(_jimStepVal({steps:'8,929'})===_ppShotSteps({steps:'8,929'}),
  'chat and a screenshot read the same string the same way');

console.log('\n  AND WHAT IS NOT A STEP COUNT:');
[[{},'an empty marker'],
 [{steps:null},'a null'],
 [{steps:''},'an empty string'],
 [{steps:'lots'},'a word'],
 [{steps:0},'zero'],
 [{steps:-500},'a negative'],
 [{steps:900000},'a number nobody walked'],
 [null,'nothing at all']].forEach(([o,why])=>{
  t(_jimStepVal(o)===null, why+' is not a count');
});

console.log('\n  SO AN EMPTY MARKER NO LONGER SILENCES THE BACKSTOP:');
t(/if\(!stepsLogs\.items\.length \|\| _jimStepVal\(stepsLogs\.items\[stepsLogs\.items\.length-1\]\)==null\)/.test(src),
  'the backstop fires on "no NUMBER", not only on "no marker"');
t(/var stepVal = _jimStepVal\(_stepItem\);/.test(src), 'and the handler reads through the same function');
t(!/var stepVal = parseInt\(_stepItem\.steps, 10\);/.test(src), '  the bare parseInt is gone');

console.log('\n  THE BACKSTOP STILL REFUSES WHAT IT ALWAYS REFUSED:');
/* The whitelist between the word and the figure is what keeps this honest -
   anything not on it stops the match dead. */
t(_jimHarvestSteps('steps were fine, I ate 300 calories')===null,
  '"steps were fine, I ate 300 calories" is still not 300 steps');
t(_jimHarvestSteps('I walked a lot today')===null, 'and no number is still no number');
t(_jimHarvestSteps('hit 12k steps')===null, '  including a shorthand it was never taught');
t(_jimHarvestSteps('got 8,432 steps')===8432, 'while a plain statement still lands');
t(_jimHarvestSteps('my steps every day this week were 9,000')===9000, 'and so does a number sitting further away');

console.log(bad?('\n  '+bad+' FAILED'):'\n  all good (a number he said out loud reaches the table)');
process.exit(bad?1:0);
