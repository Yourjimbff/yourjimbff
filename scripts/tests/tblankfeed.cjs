// "FEED VIEW OF ALL LOGS DROPPED AGAIN" (Yusuf, 16 Sep).
//
// THE MECHANISM, measured on the served build rather than guessed at. sbSelect
// answers [] for a REFUSED read and for a genuinely empty table alike. That was
// survivable for as long as the public key could still see everything: a session
// that had quietly lapsed changed nothing, because the read came back full
// anyway. The moment the tables were locked, the same lapse started answering
// 401 - and the page drew "nothing logged today" over a database that was
// perfectly fine.
//
// Proved by breaking a session token on the live v447 and reading profiles: an
// empty array, identical to an empty table, with nothing on screen to say
// otherwise.
//
// TWO FIXES, because there are two different failures underneath one symptom.
// The recoverable one: trade the refusal for a fresh session and ask again -
// which is what every WRITE in this app has done since the cutover, and what no
// read did. The unrecoverable one: say so. An unread feed and an empty one are
// different sentences and only one of them is reassuring.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+JSON.stringify(x)+']'):'')); };
const between=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b); return (i<0||j<0||j<i)?'':src.slice(i,j); };

console.log('\n  A REFUSED READ TRADES FOR A FRESH SESSION:');
const sel=between('async function sbSelect(table, filter, _retried){','// THE SIGNAL THIS FILE NEVER HAD.');
t(sel.length>0, 'sbSelect takes a retry flag');
t(/if\(res\.status===401 && !_retried\)\{/.test(sel),
  'it recognises a refusal, not just a bad column');
t(/await sessOnDenied\(\)/.test(sel), '  and asks for a new session');
t(/return await sbSelect\(table, filter, true\);/.test(sel), '  then asks the question again');
t(sel.indexOf('_retried') > 0 && /if\(_ok\) return await sbSelect/.test(sel),
  'ONCE. A second refusal is not the session and falls through');
/* 401 IS "I DON'T KNOW YOU", 403 IS "I KNOW YOU AND THE ANSWER IS NO". A new
   session cannot change the second one, and treating it as a session problem
   tore down a working one every time a client's page touched a column it is
   correctly not allowed to read. */
t(!/res\.status===403/.test(sel), 'a 403 is a permission answer and never costs the session');
t(sel.indexOf('sessOnDenied') < sel.indexOf("treating as empty"),
  'the retry comes BEFORE it gives up and reports empty');
t(/_sbNoteFail\(table\)/.test(sel), 'and a read that is still refused is still counted');
/* sessOnDenied has to be the guarded one, or twenty reads on one screen mint
   twenty tokens. */
t(/if\(_sessRecoverP\) return _sessRecoverP;/.test(src), 'and one screen full of refusals mints one token, not twenty');

console.log('\n  AND THE RECOVERY NEVER COSTS WHAT IT IS TRYING TO SAVE:');
/* THE BUG THIS SECTION EXISTS FOR (16 Sep): "After every refresh like the auto
   refresh the app stop showing I have to force a fresh copy sign in."
   sessOnDenied cleared the stored session BEFORE minting a new one. Fine while
   only trainerWrite called it. v448 wired it to sbSelect - 220 call sites, ~25
   reads in the first second of a launch - and the app reloads itself exactly
   when a new version deploys, which is exactly when the session function is
   cold. Race lost, first read 401s, session wiped, re-mint hits the same cold
   function and fails. No session at all: not "retry later", SIGN IN AGAIN. */
const den2=between('async function sessOnDenied(){','function _sessHost');
const denAll=src.slice(src.indexOf('async function sessOnDenied(){'), src.indexOf('async function sessOnDenied(){')+1000);
t(!/_sessClear\(\)/.test(denAll), 'it never clears the session it is trying to replace');
t(/var t=await sessEnsure\(code, true\);/.test(denAll), '  it mints, and sessEnsure overwrites only on success');
t(/if\(!code\) return false;/.test(denAll), 'and it will not fire at all without knowing who it is');
t(/if\(_sessRecoverP\) return _sessRecoverP;/.test(denAll),
  'a screenful of refusals shares ONE recovery and every one of them waits for it');
t(/_sessRecoverP=null;/.test(denAll), '  and the handle is released either way');
/* The only _sessClear calls left are the deliberate goodbyes. */
const clears=(src.match(/_sessClear\(\)/g)||[]).length;
t(clears<=6, 'the remaining session clears are sign-outs, not recoveries', clears);

console.log('\n  AND A HEAL CAN HAPPEN MORE THAN ONCE A TAB:');
const heal2=between('async function _sessHeal(){','function _sessHost');
const healAll=src.slice(src.indexOf('async function _sessHeal(){'), src.indexOf('async function _sessHeal(){')+3000);
t(/Date\.now\(\)-last > 90000/.test(healAll), 'the reload guard is a cooldown, not a one-shot');
t(!/sessionStorage\.setItem\('yjb_sess_healed','1'\)/.test(src), '  the permanent flag is gone');
t(/if\(got\)\{/.test(healAll), 'and nothing reloads without a token in hand to reload into');

console.log('\n  AND THE FEED SAYS WHICH OF THE TWO IT IS:');
const feed=between('var _sinceQ=','// THE FEED IS PEOPLE, ACROSS SEVEN DAYS.');
t(/var _feedFailMark=null; try\{ _feedFailMark=_sbFailMark\(\); \}catch\(e\)\{\}/.test(feed),
  'the batch is bracketed by the failure counter');
t(/_sbFailedSince\(_feedFailMark\)/.test(feed), '  and read again once it has landed');
t(/that is the connection, not an empty day/.test(feed),
  'an unread feed says so in words');
t(/Nothing logged in the last seven days/.test(feed), 'and a genuinely empty one still says that');
t(feed.indexOf('_readFailed ?') < feed.indexOf('_anyOlder ?'),
  'the refusal is checked FIRST — an unread day is not a quiet day');
t(/function _sbFailMark\(\)/.test(src) && /function _sbFailedSince\(mark\)/.test(src),
  'both halves of the witness still exist');

console.log('\n  AND NOTHING WENT BACK TO THE PUBLIC KEY TO FIX IT:');
t(!/headers:\{'apikey':SB_KEY,'Authorization':'Bearer '\+SB_KEY\}/.test(between('async function sbSelect(table, filter, _retried){','// THE SIGNAL THIS FILE NEVER HAD.')),
  'sbSelect never falls back to a key that can see everything');
t(/quietly falling back to a key that can still see everything/.test(src),
  'and the file still states that rule out loud');

console.log(bad?('\n  '+bad+' FAILED'):'\n  all good (a blank screen is a fixable state, and it says which kind)');
process.exit(bad?1:0);
