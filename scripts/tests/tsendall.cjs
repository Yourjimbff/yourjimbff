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
const cmd=src.slice(src.indexOf('async function _jvSendOrder('), src.indexOf('async function _jvBookCommand('));  /* the order writer plus the spoken command (7 Sep: one writer, shared with the picker) */
t(/isTrainer\(cl\.code\)/.test(cmd) && /if\(!isTr\) return null;/.test(cmd), 'trainer only - a client saying it gets nothing');
t(/_jvSendOrder\(q\.items, 'Yusuf, in Jarvis: "'\+t\+'"'\)/.test(cmd) && /authorised_by:String\(authorisedBy\|\|''\)/.test(cmd), 'his exact words ride on the order');
t(/sbInsertReturning\('journal_entries'/.test(cmd) && /entry_type:'sendall'/.test(cmd) && /shared:false/.test(cmd), 'the order is a journal_entries row on his own code, shared false - the Mac can read it, no feed shows it');
t(/phone:i\.phone/.test(cmd), 'the number rides in the order - the send watch never looks one up');
t(/status:'opened'/.test(cmd) && /via:'sendall', order:orderId/.test(cmd), 'each draft moves to opened, like a tap on Send, stamped with the order');
t(/return 'Sending messages to '\+q\.items\.length\+' client'/.test(cmd), 'and Jarvis answers with the count');
t(/return 'Nothing in the queue to send\.'/.test(cmd), 'an empty queue says so');
t(/if\(!w\.ok\) return 'I could not write the send order\. Nothing went\.';/.test(cmd), 'a refused order write says nothing went - never a count that did not happen');
t(/try\{ var _sa=await _jvSendAllCommand\(t\); if\(_sa\) return _sa; \}/.test(src), 'routed first in _jvBookCommand, so every Jarvis box gets it');

// A MACHINE ROW IS NOT A JOURNAL ENTRY (Yusuf, 7 Sep, screenshot)
console.log('\n  THE ORDER STAYS OFF HIS DAY:');
const je=src.slice(src.indexOf('function _jeMachine('), src.indexOf('function _jeMachine(')+400);
t(/entry_type==='sendall'/.test(je) && /\\\[SENDALL\\b/.test(je), 'a send-all row is known by its type or its [SENDALL...] body');
t((src.match(/_jeMachine\(/g)||[]).length>=7, 'and every journal surface skips it - day card, timeline, journal list, entry cache, today entry, check-in', String((src.match(/_jeMachine\(/g)||[]).length));
t(/rowDs\(j\)===ds && !_jeMachine\(j\)/.test(src), 'the Day page journal card specifically');
/* AND THE MAC'S ANSWER TO THE ORDER (Yusuf, 11 Sep, off his own Day: two cards
   headed "Journal" reading [SENDALL-RESULT] {"orderId":"lailee-time-edit-11sep"
   ...}). The old test proved the exact regex in the file rather than what it
   catches, so a marker one character longer than [SENDALL] walked straight past
   it and onto his day. Run the real function over the real bodies instead. */
const _jm=(function(){ var f={}; eval(src.slice(src.indexOf('function _jeMachine('), src.indexOf('function _jeMachine(')+520).replace(/\n\/\*[\s\S]*$/,'')); return _jeMachine; })();
t(_jm({body:'[SENDALL] {"orderId":"sa-1"}'})===true, 'the order itself is machine traffic');
t(_jm({body:'[SENDALL-RESULT] {"orderId":"lailee-time-edit-11sep","items":[]}'})===true,
  'and so is the Mac\'s answer to it - the shape that reached his day on 11 Sep');
t(_jm({entry_type:'sendall'})===true, 'the column still says it on its own');
t(_jm({body:'Felt strong today. Sendall the energy.'})===false, 'a real entry that happens to say the word is untouched');
t(_jm({body:''})===false && _jm(null)===false, 'and nothing throws on an empty row');

// THE PICKER (Yusuf, 7 Sep: "select all that apply... hit send... refresh and be clear")
console.log('\n  THE PICKER:');
t(/function _crmPickable\(p\)/.test(src) && /function crmPickAll\(\)/.test(src) && /async function crmSendPicked\(\)/.test(src), 'a box per row, select all, and one send for the ticked');
const pk=src.slice(src.indexOf('function _crmPickable(p){'), src.indexOf('function _crmPickableShown('));
t(/d\.status!=='pending'/.test(pk) && /_crmOvertaken\(p\.code, d\)/.test(pk) && /_dfHardTells\(d\.text\)\.length/.test(pk) && /26\*3600\*1000/.test(pk) && /\.phone\)\)/.test(pk), 'sendable means exactly what the spoken send-all means');
const sp=src.slice(src.indexOf('async function crmSendPicked(){'), src.indexOf('function crmSend(id){'));
t(/_jvSendAllList\(\)/.test(sp) && /picked\[i\.draftId\]/.test(sp) && /_jvSendOrder\(items, 'Yusuf, on the board: ticked '/.test(sp), 'the ticked ones go as ONE order through the Mac, with his action as the authority');
t(/async function _jvSendOrder\(items, authorisedBy\)/.test(src) && /var w=await _jvSendOrder\(q\.items, 'Yusuf, in Jarvis: "'\+t\+'"'\);/.test(src), 'the spoken command and the picker share the one order writer');
t(/class="crmPick'/.test(src) && /onclick="crmPick\(/.test(src) && /crmPickBar/.test(src) && /Send '\+n\+' selected/.test(src), 'the box is on the row and the bar says how many');
console.log('\n  THE MAC ANSWERS BACK:');
const rc=src.slice(src.indexOf('async function _jvSendAllReconcile(){'), src.indexOf('async function _jvSendAllCommand('));
t(/entry_type=eq\.sendall-result/.test(rc) && /d\.status==='opened' && d\.via==='sendall'/.test(rc), 'reads the result rows and only touches drafts this order opened');
t(/if\(it\.ok\)\{ await dfSetStatus\(d\.code, d, 'sent'/.test(rc) && /dfSetStatus\(d\.code, d, 'pending', d\.text, \{openedAt:null, re:/.test(rc), 'ok becomes sent, a failure comes back pending with the reason on the card');
t(/String\(d\.order\|\|''\)!==String\(res\.orderId\|\|''\)/.test(rc), 'and never across orders');
t((src.match(/await _jvSendAllReconcile\(\)/g)||[]).length>=2, 'runs on the board read and on the 45 second poll');
let sw=''; try{ sw=fs.readFileSync(require('path').join(require('os').homedir(),'mnt/Client Files/send_watch.py'),'utf8'); }catch(e){ try{ sw=fs.readFileSync('/Users/yusuf/Documents/Client Files/send_watch.py','utf8'); }catch(e2){ sw=''; } }
if(sw)
t(/def post_results\(\)/.test(sw) && /\[SENDALL-RESULT\]/.test(sw) && /entry_type": "sendall-result"/.test(sw) && /RESULTS\.append\(\{"order": str\(item\.get\("order"\)\)/.test(sw), 'send_watch.py writes the result row for every item it handled');

t(/via:\(d\.via\|\|undefined\), order:\(d\.order\|\|undefined\)/.test(src.slice(src.indexOf('function _dfRowNote('), src.indexOf('function _dfFromNote('))) && /via:\(o\.via\?String\(o\.via\):''\), order:\(o\.order\?String\(o\.order\):''\)/.test(src), 'via and order survive the row - written and read back (they were dropped until 7 Sep)');
t(/via:\(d\.via\|\|undefined\), order:\(d\.order\|\|undefined\),[\s\S]{0,120}?openedAt:\(d\.openedAt\|\|null\)\};/.test(src.slice(src.indexOf('async function dfSetStatus('))), 'and ride through a status change');

console.log();
if(bad){ console.log('  '+bad+' FAILED'); process.exit(1); }
console.log('  all send-all assertions pass');
process.exit(0);
