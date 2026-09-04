// BATCH SEND (Yusuf, order, 4 Sep: "we should have a batch send mode. asap").
//
// 57 drafts were written and 56 were unsent, because sending one meant finding
// the row, opening it, sending, coming back, and finding the next. Fifty-six
// times. The writing was never the jam.
//
// WHAT THIS SUITE IS MOSTLY FOR is the honesty of the word "sent". Nothing in
// this system can send a text - crmSend hands off to the phone's Messages app
// and his thumb sends it - so a screen with a big Send button on it is exactly
// where a row could start claiming something nobody proved. Every send here goes
// through crmSend, lands in 'opened', and is settled by the sweep against his
// real Messages. This screen has no opinion and must never grow one.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(ok,label,extra)=>{ if(!bad&&!ok){} if(!ok) bad++;
  console.log((ok?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };

const send=src.slice(src.indexOf('function crmBatchSend(){'), src.indexOf('function crmBatchSkip(){'));
console.log('  the send path is the one that already tells the truth:');
t(/crmSend\(it\.id\)/.test(send),        'it goes through crmSend and nowhere else');
t(!/dfSetStatus/.test(send),             'it never writes a status itself');
// CODE ONLY. The ruling on crmBatchSend names 'sent' in prose, and counting that
// is measuring the comment rather than the function.
const sendCode=send.replace(/\/\*[\s\S]*?\*\//g,' ').replace(/\/\/[^\n]*/g,' ');
t(!/'sent'/.test(sendCode),              "and the word 'sent' never appears in the code");
t(/_crmSettleOpened/.test(src),          'the sweep still settles opened rows against his real Messages');

const q=src.slice(src.indexOf('function _crmBatchQueue(){'), src.indexOf('function crmBatchOpen(){'));
console.log('\n  the queue is the board he was just looking at:');
t(/_crmFilterDef\(_crm\.filter\)/.test(q), 'his filter');
t(/_crmSortPeople\(searched\.filter\(fdef\.test\), _crm\.sort\)/.test(q), 'and his sort, in that order');
t(/status!=='pending'/.test(q),          'opened and skipped rows are already answered and stay out');
t(/CLIENTS\[p\.code\]\s*\|\|\s*\{\}\)\.phone/.test(q), 'and somebody with no number is not queued');
t(/_jvHydratePhones/.test(q),            'with the phone cache hydrated before that is decided');
t(/String\(p\.draft\.text\|\|''\)\.trim\(\)/.test(q), 'an empty draft is not a step in the run');

const paint=src.slice(src.indexOf('function _crmBatchPaint(){'), src.indexOf('function crmBatchSend(){'));
console.log('\n  one at a time, and it says where he is:');
t(/of '\+b\.q\.length/.test(paint),      'the count is out of the real queue length');
t(/crmTa_'\+d\.id/.test(paint),          'the textarea keeps the id crmSend reads, so his edits go');
t(/_crmWhy\(it\.code, d\.re\)/.test(paint), 'the reason for the message rides along');
t(/if\(!d\)\{ b\.i\+\+; _crmBatchPaint\(\); return; \}/.test(paint),
                                         'a row that moved under him is stepped over, never crashed on');
t(/handed to Messages/.test(paint),      'the end says handed to Messages, not sent');

console.log('\n  and it advances only when he actually comes back:');
const adv=src.slice(src.indexOf("var b=_crmBatch; if(!b || !b.awaiting) return;")-260,
                    src.indexOf("var b=_crmBatch; if(!b || !b.awaiting) return;")+220);
t(/visibilitychange/.test(adv),          'on visibilitychange');
t(/visibilityState!=='visible'/.test(adv),'going away is not coming back');
t(/b\.awaiting/.test(adv),               'and only when a send is actually in flight');
t(/b\.awaiting=true;/.test(send),        'which crmBatchSend is what sets');

console.log('\n  the way in does not lie about the size of the run:');
t(/Send all '\+qn/.test(src),            'the button carries the real count');
t(/if\(qn\)/.test(src),                  'and is not drawn at all when there is nothing to send');
t(/your thumb still sends/.test(src),    'and it says so on the button row');

console.log(bad? ('\n'+bad+' FAILED') : '\n  all pass');
process.exit(bad?1:0);
