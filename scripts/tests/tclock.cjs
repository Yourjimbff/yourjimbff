// HIS OWN WORDS DECIDE AM OR PM — permanent (Yusuf, live, 24 Aug).
//
// "did my workout at 6 this morning" SAVED AT 6:00 PM, and the reply on screen
// said 6 AM. A bare hour of seven or less was simply declared the evening, and
// the word "morning" — sitting in the same sentence — was never consulted. Nor
// was afternoon, evening, tonight or at night.
//
// The other clock reader in this file has always read those words, so the two
// disagreed: the same drifted-pair disease as the three session-word lists.
//
// He films with the first sentence below.
const fs=require('fs');
const L=fs.readFileSync('index.html','utf8').split('\n');
function grab(p){ const a=L.findIndex(p); let b=a; while(L[b]!=='}') b++; return L.slice(a,b+1).join('\n'); }
eval([grab(l=>l.startsWith('function _jimParse('))].join('\n'));
require('./_guard.cjs')(['_jimParse'], function(n){ return eval(n); });
let bad=0;
function clock(m){ if(m==null) return null; var h=Math.floor(m/60),x=m%60,ap=h<12?'AM':'PM',d=h%12||12; return d+':'+String(x).padStart(2,'0')+' '+ap; }
const t=(said,want)=>{ let got=null; try{ got=clock((_jimParse(said)||{}).mins); }catch(e){ got='THREW'; }
  const ok=(got===want); if(!ok) bad++;
  console.log((ok?'  ok    ':'  FAIL  ')+String(got).padStart(8)+'   '+JSON.stringify(said)+(ok?'':'   (wanted '+want+')')); };

console.log('  a morning he actually said is the morning:');
t('did my workout at 6 this morning', '6:00 AM');   // HIS FILMING SENTENCE — was 6:00 PM
t('trained at 6 in the morning',      '6:00 AM');   // was 6:00 PM
t('at 5 this morning',                '5:00 AM');   // was 5:00 PM
t('at 7 this morning',                '7:00 AM');   // was 7:00 PM
t('at 6:30 this morning',             '6:30 AM');   // was 6:30 PM
t('at 12 this morning',              '12:00 AM');   // midnight, was noon
t('at 11 this morning',              '11:00 AM');   // was already right

console.log('\n  and an evening he said stays the evening:');
t('at 6 in the evening',              '6:00 PM');
t('at 6 tonight',                     '6:00 PM');
t('trained at 6 this afternoon',      '6:00 PM');
t('at 8 at night',                    '8:00 PM');   // was 8:00 AM — not reported, found by testing

console.log('\n  a stated meridiem still wins outright:');
t('at 6am this morning',              '6:00 AM');
t('ate at 7pm',                       '7:00 PM');
t('at 8am',                           '8:00 AM');

console.log('\n  and where he named no part of the day, nothing changed:');
t('I had dinner at 6',                '6:00 PM');   // the bare-hour evening default
t('I had a snack at 3',               '3:00 PM');
t('at 11:30',                        '11:30 AM');

// The default may never again overrule a word he said. Asserted structurally so
// a later tidy-up cannot quietly put the old line back.
const src=fs.readFileSync('index.html','utf8');
console.log('\n  the bare-hour default is reachable only when he named nothing:');
if(!/\}\s*else if \(hh <= 7\) \{/.test(src)){ bad++; console.log('  FAIL  the default is no longer the last branch'); }
else console.log('  ok    it is the last branch, after morning and after evening');
if(/if \(!ap && hh <= 7\) hh \+= 12;/.test(src)){ bad++; console.log('  FAIL  the old unconditional line is back'); }
else console.log('  ok    the old unconditional line is gone');

console.log(bad? '\n'+bad+' FAILED' : '\nall pass');
process.exit(bad?1:0);
