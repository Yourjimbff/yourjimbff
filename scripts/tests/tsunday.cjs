// SUNDAY — permanent (24 Aug, handover from ADMIN, verified there before it
// was re-delivered; his ruling: convert in code, never in the prompt).
//
// The marker rules tell the model 1=Mon..7=Sun and it says exactly that. The
// table stores 0=Sun..6=Sat — and 7 on that column already MEANS "no day at
// all", the sentinel an unassigned row carries. Monday through Saturday happen
// to line up under both readings, which is why only SUNDAY broke: it wrote 7,
// and every reader that matters turned 7 back into undated. Nothing errored,
// and the spoken confirmation still said "Sun" because it reads the marker
// object, never the stored row.
//
// Second fault, hidden by the first: the patch loop treated 0 as absent, so a
// genuine Sunday row could never be targeted by a follow-up instruction.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const L=src.split('\n');
function grab(p){ const a=L.findIndex(p); let b=a; while(L[b]!=='}') b++; return L.slice(a,b+1).join('\n'); }
eval([grab(l=>l.startsWith('function _pwDow(')), grab(l=>l.startsWith('function _pwDowOf('))].join('\n'));
let bad=0;
const t=(got,want,label)=>{ const ok=JSON.stringify(got)===JSON.stringify(want); if(!ok) bad++;
  console.log((ok?'  ok    ':'  FAIL  ')+label+'  -> '+JSON.stringify(got)+(ok?'':'   (wanted '+JSON.stringify(want)+')')); };

console.log('  the model says 1=Mon..7=Sun; the table stores 0=Sun..6=Sat:');
t(_pwDow(7), 0, 'Sunday, the one that was lost');
t(_pwDow(1), 1, 'Monday');
t(_pwDow(2), 2, 'Tuesday');
t(_pwDow(3), 3, 'Wednesday');
t(_pwDow(4), 4, 'Thursday');
t(_pwDow(5), 5, 'Friday');
t(_pwDow(6), 6, 'Saturday');
console.log('\n  nothing may ever be written as 7 again — that means "no day":');
[0,1,2,3,4,5,6,7].forEach(n=>t(_pwDow(n)===7, false, 'day '+n+' does not store as 7'));

console.log('\n  and a day it cannot read is no day, never a guess:');
t(_pwDow(null), null, 'missing');
t(_pwDow(''), null, 'empty');
t(_pwDow('banana'), null, 'not a number');
t(_pwDow(8), null, 'out of range high');
t(_pwDow(-1), null, 'out of range low');
t(_pwDow(undefined), null, 'undefined');

console.log('\n  read either way round off the marker:');
t(_pwDowOf({day:7}), 0, 'day:7 is Sunday');
t(_pwDowOf({day_of_week:7}), 0, 'day_of_week:7 is Sunday');
t(_pwDowOf({day:'7'}), 0, 'a string still converts');
t(_pwDowOf({}), null, 'no day named at all');
t(_pwDowOf(null), null, 'nothing at all');
// 0 arriving from the model would be an out-of-contract number, but it is a
// real stored day, so it is kept rather than treated as missing.
t(_pwDowOf({day:0}), 0, 'zero is Sunday, not absent');

console.log('\n  all three writers convert, and none takes the raw number:');
t(/day_of_week:_d, title:\(w\.title\|\|.Workout.\)/.test(src), true, 'the PROGRAM writer');
t(/var dp=dayPatches\[j\]; var d=_pwDowOf\(dp\); if\(d==null\) continue;/.test(src), true, 'the PATCH loop');
t(/var day=_pwDowOf\(ch\); if\(day==null\) continue;/.test(src), true, 'the EDIT loop');
t(/Number\(w\.day\|\|w\.day_of_week\|\|1\)/.test(src), false, 'no raw number left in the PROGRAM writer');
t(/Number\(dp\.day\|\|dp\.day_of_week\|\|0\)/.test(src), false, 'no raw number left in the PATCH loop');
t(/var day=Number\(ch\.day\|\|ch\.day_of_week\|\|1\)/.test(src), false, 'no raw number left in the EDIT loop');

console.log('\n  the prompt is deliberately NOT changed — the model still says 7:');
t(/day: 1=Mon, 2=Tue \.\.\. 7=Sun/.test(src), true, 'the PROGRAM rule still reads 1=Mon..7=Sun');
t(/ONE weekday \(1=Mon \.\.\. 7=Sun\)/.test(src), true, 'the EDIT rule still reads 1=Mon..7=Sun');

console.log(bad? '\n'+bad+' FAILED' : '\nall pass');
process.exit(bad?1:0);
