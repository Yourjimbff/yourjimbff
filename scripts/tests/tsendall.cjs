// SEND ALL MESSAGES (Yusuf, order, 7 Sep): "to basically say send all messages
// and then Jarvis says send messages to X amount of clients in the queue."
const fs=require('fs');
const {closure}=require('./_lift.cjs');
let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };
const src=fs.readFileSync('index.html','utf8');
global.window={};
const CL=closure(['_JV_SENDALL_RE']); eval(CL.code||'');

console.log('\n  THE SENTENCE:');
[['send all messages',true],['Send all messages.',true],['send the queue',true],['send all',true],['send everything in the queue',true],['send all texts now',true],['fire off all drafts',true],
 ['send leandra a message',false],['send all my love',false],['send chris the program',false],['what is in the queue',false]].forEach(([s,want])=>{
  t(_JV_SENDALL_RE.test(s)===want, (want?'matches':'ignores')+' "'+s+'"');
});

console.log('\n  THE GATE IS THE BOARD\'S OWN:');
const fn=src.slice(src.indexOf('function _jvSendAllList('), src.indexOf('async function _jvSendAllCommand('));
t(/d\.status!=='pending'/.test(fn) && /_crmOvertaken\(p\.code, d\)/.test(fn) && /_dfHardTells\(d\.text\)\.length/.test(fn) && /\.phone\)\)\{ held\.phone\+\+/.test(fn),
  'pending, not overtaken by his own thumb, no banned construction, has a number - same four rules as the Send-all button');
t(/held\.tell\+\+/.test(fn), 'what is held back for a banned line is counted, not hidden');
t(/_age>26\*3600\*1000\)\{ held\.stale\+\+; return; \}/.test(fn), 'a draft older than a day is held - a spoken send-all cannot see the text, and 34 three-day-old rows were on the board the night this shipped');
t(/isNaN\(_age\)/.test(fn) && /!\(d\.at\)/.test(fn), 'a draft with no date is held too - never assumed fresh');
const cmd=src.slice(src.indexOf('async function _jvSendAllCommand('), src.indexOf('async function _jvBookCommand('));
t(/isTrainer\(cl\.code\)/.test(cmd) && /if\(!isTr\) return null;/.test(cmd), 'trainer only - a client saying it gets nothing');
t(/authorised_by:'Yusuf, in Jarvis: "'\+t\+'"'/.test(cmd), 'his exact words ride on the order');
t(/sbInsertReturning\('journal_entries'/.test(cmd) && /entry_type:'sendall'/.test(cmd) && /shared:false/.test(cmd), 'the order is a journal_entries row on his own code, shared false - the Mac can read it, no feed shows it');
t(/phone:i\.phone/.test(cmd), 'the number rides in the order - the send watch never looks one up');
t(/status:'opened'/.test(cmd) && /via:'sendall', order:orderId/.test(cmd), 'each draft moves to opened, like a tap on Send, stamped with the order');
t(/return 'Sending messages to '\+q\.items\.length\+' client'/.test(cmd), 'and Jarvis answers with the count');
t(/return 'Nothing in the queue to send\.'/.test(cmd), 'an empty queue says so');
t(/if\(!w\) return 'I could not write the send order\. Nothing went\.';/.test(cmd), 'a refused order write says nothing went - never a count that did not happen');
t(/try\{ var _sa=await _jvSendAllCommand\(t\); if\(_sa\) return _sa; \}/.test(src), 'routed first in _jvBookCommand, so every Jarvis box gets it');

// A MACHINE ROW IS NOT A JOURNAL ENTRY (Yusuf, 7 Sep, screenshot)
console.log('\n  THE ORDER STAYS OFF HIS DAY:');
const je=src.slice(src.indexOf('function _jeMachine('), src.indexOf('function _jeMachine(')+400);
t(/entry_type==='sendall'/.test(je) && /\^\\\[SENDALL\\\]/.test(je), 'a send-all row is known by its type or its [SENDALL] body');
t((src.match(/_jeMachine\(/g)||[]).length>=7, 'and every journal surface skips it - day card, timeline, journal list, entry cache, today entry, check-in', String((src.match(/_jeMachine\(/g)||[]).length));
t(/rowDs\(j\)===ds && !_jeMachine\(j\)/.test(src), 'the Day page journal card specifically');

console.log();
if(bad){ console.log('  '+bad+' FAILED'); process.exit(1); }
console.log('  all send-all assertions pass');
process.exit(0);
