// SOMEBODY MADE THEMSELVES A TRAINER (Yusuf, 15 Sep).
//
//   "make it so it cant change the user type to trainer. someone was able to
//    change user type to trainer."
//
// HOW IT WAS DONE, and it needed no skill at all. Three places trusted
// localStorage - a text box the person holding the browser can type into - to
// say whether they were a trainer:
//   1. a bootstrap that read yjb_custom_trainer_codes on load and pushed every
//      key marked isTrainer into TRAINER_CODES;
//   2. a sign-in fallback that let that same map STAND IN for the client record,
//      so an invented code signed in as a trainer with the server never asked;
//   3. yjb_self_client, the cached record auto-login seeds from, which carried
//      isTrainer straight back in.
// Any one of them is a single line in a browser console.
//
// THE WRITER of that map was deleted on 29 Aug and the two readers were LEFT ON
// PURPOSE, so a device with an old entry would not "lose its way in". That trade
// kept a credential store the attacker controls. It is the whole bug.
//
// WHAT ANSWERS NOW: the signed session. session.js looks the code up in
// `clients` with the service key - a table the public key can neither read nor
// write - and signs the answer. The page cannot check that signature, so this is
// a lock on the DOOR, not on the safe; the safe is row-level security, and this
// file does not pretend otherwise.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+JSON.stringify(x)+']'):'')); };

console.log('\n  THE THREE DOORS ARE SHUT:');
t(!/Object\.keys\(_customMap\)\.forEach/.test(src), 'the load-time bootstrap is gone');
t(!/if\(customMap\[entered\]\)\{/.test(src), 'the sign-in fallback is gone');
t(!/TRAINER_CODES\.push\(k\)/.test(src), 'nothing pushes a localStorage key into the trainer list');
t(/localStorage\.removeItem\('yjb_custom_trainer_codes'\)/.test(src),
  'and a device still carrying that map has it wiped on load');
/* The only two pushes left must both come from the server. */
const pushes=(src.match(/TRAINER_CODES\.push\([^)]*\)/g)||[]);
t(pushes.length===2, 'exactly two writers remain', pushes);
t(/if\(r\.is_trainer && typeof TRAINER_CODES !== 'undefined' && TRAINER_CODES\.indexOf\(r\.code\) === -1\)\{ TRAINER_CODES\.push\(r\.code\); \}/.test(src),
  '  one is the roster loader, off the clients table');
t(/if\(c\.isTrainer && TRAINER_CODES\.indexOf\(code\) === -1\)\{\n    TRAINER_CODES\.push\(code\);/.test(src),
  '  the other is sign-in, off the identity read');

console.log('\n  AND THE CACHE CANNOT CARRY THE FLAG:');
t(/try\{ delete _self\.isTrainer; \}catch\(e\)\{\}/.test(src),
  'auto-login drops isTrainer out of the cached record before using it');
t(/delete _selfSafe\.isTrainer; delete _selfSafe\.is_trainer;/.test(src),
  'and it is never written into that record in the first place');
t(!/localStorage\.setItem\('yjb_self_client', JSON\.stringify\(cl\)\)/.test(src),
  'the old write, which stored the whole object flag and all, is gone');

console.log('\n  THE SIGNED SESSION IS THE AUTHORITY:');
t(/function _sessClaims\(\)/.test(src), 'the page can read its own session claims');
t(/if\(j && String\(j\.client_code\|\|''\)===c\) return j\.is_trainer===true;/.test(src),
  'for the person holding the browser, the claim decides - nothing else is consulted');
/* FAILS CLOSED. No session, no trainer. That is the correct direction for this
   one, and it is why the session exchange in doLogin is raced rather than
   skipped. */
const fn=src.slice(src.indexOf('function isTrainer(code){'), src.indexOf('function isTrainer(code){')+900);
t(/if\(!c\) return false;/.test(fn), 'an empty code is not a trainer');
t(fn.indexOf('j.is_trainer===true')<fn.indexOf('TRAINER_CODES.indexOf'),
  'the claim is asked BEFORE the list, so the list cannot overrule it');
/* session.js has to actually be signing that claim off the clients table. */
const sess=fs.readFileSync('netlify/functions/session.js','utf8');
t(/is_trainer: row\.is_trainer === true/.test(sess), 'session.js signs is_trainer off the clients row');
t(/SUPABASE_SERVICE_KEY|SERVICE_KEY/.test(sess), '  read with the service key, not the public one');
t(/client_code: row\.code/.test(sess), '  and names who the token is for');

console.log('\n  WHAT THIS IS NOT:');
/* Said out loud in the source so nobody reads this as "the app is secured". The
   page cannot verify a signature, so a forged token still paints trainer
   chrome. It paints over data the server refuses to hand out - once RLS is on.
   Until then this narrows the path; it does not close the safe. */
t(/lock on the DOOR, not on the safe/.test(src) || /a lock on the DOOR and not\s*\n?\s*the lock on the safe/.test(src),
  'the file says plainly that this is the door, not the safe');

console.log(bad?('\n  '+bad+' FAILED'):'\n  all good (trainer comes from the server or not at all)');
process.exit(bad?1:0);
