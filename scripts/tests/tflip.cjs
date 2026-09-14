// THE FLIP BANNER STOPS COVERING THE PAGE (Yusuf, 4 Sep).
//
// "remove the bottom alarm / banner" ... "i know im signed in as him im saying
// remove the banner when im signed in as a client because it obstructs my view.
// im signed in as a client because im viewing it from their pov"
//
// It is position:fixed above the nav, so on his phone it sat across the Log here
// box with no way past it. A warning that covers the thing it is warning you
// about has stopped being a warning.
//
// WHAT IT WAS FOR IS NOT REMOVED. The guard underneath is untouched - writes are
// still refused, still counted, still reported - so nothing he does while looking
// through a client's eyes lands on that client's record. And the account he is on
// is already named in 24px at the top of every screen; it was sitting there in
// his own screenshot, above the banner saying the same thing.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(ok,label,extra)=>{ if(!ok) bad++;
  console.log((ok?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };

const fn=src.slice(src.indexOf('function _flipToKnownClient(){'),
                   src.indexOf('function _flipRestore(){'));

console.log('  it only stands down for a client he actually has:');
t(fn.length>200,                          '_flipToKnownClient exists');
t(/yjb_owner_code/.test(fn),              'a device with no owner code still gets the banner');
t(/isTrainer\(owner\)/.test(fn),          'and a device whose owner is not the trainer still gets it');
t(/CLIENTS\[now\]/.test(fn),              'the account has to be a real row on his roster');
t(/now===owner/.test(fn),                 'his own account is not a flip at all');

console.log('\n  and the painter checks it before drawing anything:');
const mark=src.slice(src.indexOf('function _flipPaint(f){'), src.indexOf('function _flipToKnownClient(){'));
t(/if\(_flipToKnownClient\(\)\) return;/.test(mark),
                                          'the banner returns before it is built');

console.log('\n  THE GUARD ITSELF IS UNTOUCHED — this is the half that matters:');
t(/_flipRefuse\('POST '\+table\)/.test(src),        'writes are still refused at the door');
t(/window\._flipRefused/.test(src),                 'and still counted');
t(/status:423/.test(src) || /_fe\.status=423/.test(src),
                                                    'a refused write still answers 423, never a quiet ok');
t(/function _flipRestore\(\)/.test(src),            'the way back to his own account still exists');
t(/jvSignOut\(\)/.test(src),                        'and Sign out is still on the menu, so nothing strands him');


function slice(a,b){ const i=src.indexOf(a); if(i<0) return ''; const j=src.indexOf(b,i); if(j<0) throw new Error('stale end anchor, this suite was reading the rest of the file: '+b); return src.slice(i,j); }
console.log('\n  AND A PASSWORD IS PROOF, SO IT CLAIMS THE DEVICE:');
/* Yusuf, 13 Sep, testing his own launch link on his own Mac: "That did not
   save. You are signed in as YUSUF RICHARDSON on somebody else's device." He
   had just created a brand new account, on his own machine, with a password he
   chose, and the guard refused every write because the device was still
   stamped from months ago.

   THE DISTINCTION IT WAS MISSING: typing a code is a CLAIM. Signing up, or
   signing in with an email and a password, is PROOF. The case this guard
   exists for is a trainer typing a client's code to look at their day and then
   writing to it by accident - there is no password anywhere in that story, and
   there cannot be, because the trainer does not have theirs. */
const claim=slice('function _flipClaimDevice(code){','/* ON PURPOSE IS NOT AN ACCIDENT');
t(/localStorage\.setItem\('yjb_owner_code', c\);/.test(claim), 'an authenticated arrival re-stamps the device');
t(/sessionStorage\.removeItem\('yjb_flip_ok'\);/.test(claim),
  'and drops the one-off pass, so the guard re-arms cleanly behind them');
t(/removeChild\(el\)/.test(claim), 'taking the banner down with it');
t(/if\(!c\) return;/.test(claim), 'an empty code claims nothing');

const up=slice('async function doSignup(){','// FORGOT PASSWORD');
t(/try\{ _flipClaimDevice\(got\.body\.code\); \}catch\(e\)\{\}/.test(up),
  'a brand new account made on this device makes the device theirs');
const inn=slice('async function _emailSignIn(email, password){','function openSignup');
t(/try\{ _flipClaimDevice\(got\.body\.code\); \}catch\(e\)\{\}/.test(inn),
  'and so does signing in with a password');

/* THE ONE THAT MUST NOT. A bare code is exactly the story the guard is for. */
const inner=slice('async function _doLoginInner(code){','function _mbAllowed');
t(!/_flipClaimDevice/.test(inner), 'typing a code claims nothing - that is the case the guard exists for');
t((src.match(/_flipClaimDevice\(/g)||[]).length===3,
  'three mentions in the whole file: the function, sign-up, sign-in',
  (src.match(/_flipClaimDevice\(/g)||[]).length);

console.log(bad? ('\n'+bad+' FAILED') : '\n  all pass');
process.exit(bad?1:0);