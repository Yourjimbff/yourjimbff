// THE SPENCER WATCH (Yusuf, order, 4 Sep).
//
// "Please put an alarm on my front page upon sign in if Spencer Ricks does not
// log a workout over the next 7 days each day starting tomorrow morning. If he
// skips a workout please call him a giant soft supple bitch. This is an order"
// then: "No it needs to reach his front page as well"
//
// So it draws in exactly two places and nowhere else: the trainer's front desk,
// and Spencer's own day. This file exists to keep it that way, because the one
// failure that matters here is those words appearing on a THIRD screen.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(ok,label,extra)=>{ if(!ok) bad++;
  console.log((ok?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };

const PHRASE='Giant soft supple bitch.';
const code=src.replace(/\/\*[\s\S]*?\*\//g,' ').replace(/\/\/[^\n]*/g,' ');

console.log('  the words live in exactly two places:');
const hits=(code.match(/Giant soft supple bitch\./g)||[]).length;
t(hits===2, 'two renderers carry the line, no more', hits+' occurrence(s) in code');

const his=src.slice(src.indexOf('function _spwHtml(){'), src.indexOf('function _spwHtml(){')+1600);
const theirs=src.slice(src.indexOf('function _spwClientHtml(ds){'), src.indexOf('function _spwClientHtml(ds){')+1600);
t(his.indexOf(PHRASE)>0,    'one is the trainer front desk');
t(theirs.indexOf(PHRASE)>0, 'the other is Spencer’s own day');

console.log('\n  the trainer copy cannot reach a client screen:');
const on=src.slice(src.indexOf('function _spwOn(){'), src.indexOf('function _spwOn(){')+520);
t(/window\.VIEWAS/.test(on),      'not inside a view-as');
t(/_jvShareMode/.test(on),        'not in share mode');
t(/isTrainer\(cl\.code\)/.test(on),'and only for a signed-in trainer');
t(/_spwOn\(\)/.test(his),         '_spwHtml returns early on all of that');

console.log('\n  and Spencer’s copy cannot reach anyone else:');
t(/_spwIsSpencer\(\)/.test(theirs),          'it checks who is signed in');
const isS=src.slice(src.indexOf('function _spwIsSpencer(){'), src.indexOf('function _spwIsSpencer(){')+300);
t(/String\(cl\.code\)===_SPW_CODE/.test(isS),'against cl.code, not an argument any caller could pass');
t(/ds!==td/.test(theirs),                    'today’s section only');
t(/_spwTodayInWindow\(\)/.test(theirs),      'and only inside the seven days');

console.log('\n  nobody is called a name over a day that is not finished, or a read that failed:');
const closed=src.slice(src.indexOf('function _spwClosedDays(){'), src.indexOf('function _spwClosedDays(){')+900);
t(/d\.getTime\(\)>=today\.getTime\(\)/.test(closed) && /break/.test(closed),
                                             'today and everything after it are not "closed"');
t(/_spwFailed \|\| !_spwSet/.test(theirs),   'a failed read draws nothing on his side');
t(/_spwFailed \|\| !_spwSet/.test(his),      'and says so plainly on the trainer side');
t(/missed\.length/.test(his) && /missed\.length/.test(theirs),
                                             'the line only appears when a day was actually skipped');

console.log('\n  it is signed, so it reads as his coach and not as the app:');
t(/Yusuf/.test(theirs),                      'Spencer’s copy carries his name');

console.log(bad? ('\n'+bad+' FAILED') : '\n  all pass');
process.exit(bad?1:0);
