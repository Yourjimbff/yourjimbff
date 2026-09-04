// "NO NUMBER SAVED" WAS A LIE THE TAB TOLD ITSELF (Yusuf, 4 Sep).
//
// He clicked gabriele1, hit Share day, and got "No number saved for Gabriel
// yet". The number was on the row the whole time: +1 435-559-4124, written when
// he signed at 9:32am, and a live read of the trainer door hands it straight
// back.
//
// The cause is one line. loadRosterFromDB opens with
//     if(_rosterLoadPromise) return _rosterLoadPromise;
// and nothing ever clears _rosterLoadPromise. The roster is read ONCE, at boot,
// for the life of the page. He leaves the app open all morning, so every client
// added after he opened it - and every number written to a row after he opened
// it - is invisible to that tab until it is fully reloaded. The toast was never
// reporting the table. It was reporting a snapshot taken hours earlier.
//
// _jvHydratePhones has the same shape one level down: a one-shot latch, so a
// number that lives only in localStorage is dropped by any roster refill and
// never put back. That is the failure the note above _phoneReapply describes,
// which was patched one client at a time instead of at the latch.
//
// So: the roster can be asked again, both latches clear together, a miss goes
// and looks instead of ending the road, and coming back to the tab re-reads.
//
// WHAT THIS FILE CANNOT PROVE: any of it on his iPhone. sms:, the toast, and
// the second tap are his to look at.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(ok,label,extra)=>{ if(!ok) bad++;
  console.log((ok?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };

const rr = src.slice(src.indexOf('function rosterRefresh('),
                     src.indexOf('function _phoneChase('));

console.log('  the roster can be asked a second time:');
t(src.indexOf('function rosterRefresh(')>0,   'rosterRefresh exists');
t(/_rosterLoadPromise\s*=\s*null/.test(rr),   'it clears the promise that caches the boot read');
t(/_jvPhonesHydrated\s*=\s*false/.test(rr),   'and the phone-overlay latch, in the same breath');
t(/_rosterRefreshAt/.test(rr),                'repeat calls are throttled');
t(/force/.test(rr),                           'and force skips the throttle');
t(/return loadRosterFromDB\(\)/.test(rr),     'it returns the new read, so a caller can await it');

const pc = src.slice(src.indexOf('function _phoneChase('),
                     src.indexOf('async function loadRosterFromDB(){'));

console.log('\n  a missing number goes and looks:');
t(src.indexOf('function _phoneChase(')>0,     '_phoneChase exists');
t(/rosterRefresh\(true\)/.test(pc),           'it forces the read past the throttle');
t(/_phChasing/.test(pc),                      'and cannot stack two reads for one client');
t(/_jvHydratePhones\(\)/.test(pc),            'it re-overlays the local cache before deciding');
t(/tap again/.test(pc),                       'when the number lands it says tap again');
t(/no number for/.test(pc),                   'and only claims an empty table when the table is empty');
t(!/location\.href/.test(pc),                 'it never opens sms: itself - iOS blocks that outside a tap');

console.log('\n  and the dead end is gone from both buttons:');
const tc = src.slice(src.indexOf('function textClient(code, body, opts){'),
                     src.indexOf('function textClient(code, body, opts){')+2200);
t(/_phoneChase\(code\)/.test(tc),             'Share day / Text chases instead of toasting');
t(/reason:'nophone'/.test(tc),                "and still returns nophone, so the CRM will not stamp a row it did not send");
const cc = src.slice(src.indexOf('function callClient(code){'),
                     src.indexOf('function callClient(code){')+400);
t(/_phoneChase\(code\)/.test(cc),             'Call chases too');
t(!/No number saved for/.test(cc),            'and no longer writes the toast it cannot justify');

console.log('\n  a tab left open all day re-reads, and ONLY on his own screen:');
const vh = src.slice(src.indexOf("document.addEventListener('visibilitychange'"),
                     src.indexOf("document.addEventListener('visibilitychange'")+520);
t(vh.length>50,                               'the visibility hook exists');
t(/visibilityState!=='visible'/.test(vh),     'it acts on becoming visible, not on leaving');
t(/isTrainer/.test(vh) && /return/.test(vh),  'and a client session returns before it refreshes anything');
t(/rosterRefresh\(false\)/.test(vh),          'the trainer gets the throttled refresh');

console.log('\n  and the chase is his job too, never a client phone:');
t(/isTrainer/.test(pc),                       '_phoneChase returns early on a client session');

console.log(bad? ('\n'+bad+' FAILED') : '\n  all '+'pass');
process.exit(bad?1:0);
