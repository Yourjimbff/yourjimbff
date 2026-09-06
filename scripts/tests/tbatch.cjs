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
t(/_dfEdHtml\(d\.id, d\.text\)/.test(paint), 'the bubbles carry the draft id crmSend reads, so his edits go');
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

console.log('\n  and the matcher it narrows with is the board\'s own, not a copy:');
// MEASURED, not assumed: _crmMatch lived inside crmPaint as a closure over a
// local q, so calling it from _crmBatchQueue threw into that function's own catch
// and the queue came back EMPTY - the button never drew, over 56 sendable drafts.
// A second copy of the search rule was the other option and it is worse: two
// matchers drift, and the day they disagree he sends a run that is not the list
// he was looking at.
t(/^function _crmMatch\(pp\)\{/m.test(src),   '_crmMatch is a top-level function');
t((src.match(/function _crmMatch\(/g)||[]).length===1, 'and there is exactly ONE of it',
  (src.match(/function _crmMatch\(/g)||[]).length+' definition(s)');
const mt=src.slice(src.indexOf('function _crmMatch(pp){'), src.indexOf('function _crmMatch(pp){')+400);
t(/_crm\.q/.test(mt),                          'it reads the search box off _crm.q itself');
t((src.match(/\.filter\(_crmMatch\)/g)||[]).length===2,
  'the board and the batch queue both narrow through it',
  (src.match(/\.filter\(_crmMatch\)/g)||[]).length+' call site(s)');

console.log('\n  the run never hangs on one event:');
// visibilitychange fires when the PAGE is hidden. On a desktop, handing off to
// Messages only moves the window FOCUS - the page can stay visible the whole
// time, so the event may never arrive. If the advance depended on it alone the
// run would sit on one client forever, which is exactly the failure a batch mode
// exists to remove.
const sendFn=src.slice(src.indexOf('function crmBatchSend(){'), src.indexOf('function crmBatchNext(){'));
t(/b\.awaiting=true;/.test(sendFn),        'a send marks the run as handed off');
t(/_crmBatchPaint\(\);/.test(sendFn),       'and repaints, so he sees the handoff screen');
t(/function crmBatchNext\(\)/.test(src),    'there is an explicit Next');
t(/onclick="crmBatchNext\(\)"/.test(src),   'on a button he can actually press');
const listen=src.slice(src.indexOf("if(!b || !b.awaiting) return;")-320,
                       src.indexOf("if(!b || !b.awaiting) return;")+200);
t(/crmBatchNext\(\)/.test(listen),          'and the event advances through that SAME function');
t(!/b\.i\+\+/.test(listen),                'the listener does not step the index itself, so the two cannot double-advance');

console.log('\n  and it never claims a text was sent:');
const hand=src.slice(src.indexOf('if(b.awaiting){'), src.indexOf('if(b.awaiting){')+900);
t(/Opened in Messages/.test(hand),          'the handoff screen says opened, not sent');
t(!/\bSent\b/.test(hand),                   'the word Sent is not on it');
t(/function crmBatchBack\(\)/.test(src),    'and there is a way back if he thought better of it');
const back=src.slice(src.indexOf('function crmBatchBack(){'), src.indexOf('function crmBatchBack(){')+420);
t(!/dfSetStatus/.test(back),                'Back rewrites no row - the sweep already handles an opened row he never sent');

console.log(bad? ('\n'+bad+' FAILED') : '\n  all pass');
process.exit(bad?1:0);
