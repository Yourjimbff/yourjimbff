// EMAIL AND PASSWORD, WITHOUT MOVING EIGHTY PEOPLE.
//
// Yusuf, 13 Sep, with a launch post going out the same day: "I need to be able
// to send a link that allows them to sign up with their email and create a
// password for themselves. That means the front page moving forward will have
// an email and password sign in option. And all current clients, all they have
// to do is enter their access code into the email slot and it should be able to
// grant them."
//
// THE BLOCKER THAT WOULD HAVE KILLED THE POST: free-app access was
// `var FREE_APP_CODES={freeuser:1}` -- a hard-coded map in this file. Every
// person who signed up would have needed a code deploy before they could see
// the app they had just joined. It reads the client's own row now, the way
// calls_enabled already does.
//
// THE RULE THIS SUITE EXISTS TO HOLD: the browser never creates a client. The
// anon key ships in this file and always will, so a page that could write to
// `clients` could mint accounts, take a code, or name itself a trainer. The
// page signs the person up with Supabase Auth and brings a TOKEN to
// netlify/functions/signup.js, which checks it and writes the row with the
// service key.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const fn=fs.readFileSync('netlify/functions/signup.js','utf8');
const mig=fs.readFileSync('migrations/auth_signup.sql','utf8');
let bad=0;
const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };
function slice(a,b){ const i=src.indexOf(a); return i<0?'':src.slice(i, src.indexOf(b,i)); }

console.log('\n  ONE BOX, AND AN @ IS THE WHOLE TEST:');
t(/placeholder="Email or access code"/.test(src), 'the box says it takes either');
t(!/placeholder="Access code"/.test(src), 'and no longer says code only');
t(/function _looksEmail\(v\)\{ return \/@\/\.test/.test(src), 'an @ is the test, and nothing more clever than that');
const dl=slice('async function doLogin(code){','async function _doLoginInner');
t(/if\(code==null\)\{/.test(dl), 'it is asked only when a human typed it');
t(/if\(_looksEmail\(_v\)\)\{/.test(dl), 'an email goes the password way');
t(/return _emailSignIn\(_v\.toLowerCase\(\), _pw\);/.test(dl), 'and only with a password');
t(/return await _doLoginInner\(code\);/.test(dl), 'anything else is the code path, untouched');

console.log('\n  EIGHTY PEOPLE TYPE THE SAME THING INTO THE SAME BOX:');
const inner=slice('async function _doLoginInner(code){','function _mbAllowed');
t(/var c = CLIENTS\[entered\];/.test(inner), 'the code lookup is exactly as it was');
t(/style="display:none;"/.test(slice('<input class="li" id="lpass"','<button class="lbtn"')),
  'and the password row starts hidden, so a client never sees it');
const sense=slice('function lAuthSense(){','function _lErr(msg){');
t(/pw\.style\.display = email\?'block':'none'/.test(sense), 'it appears only for an email');
t(/fg\.style\.display = email\?'inline':'none'/.test(sense), 'and so does Forgot password');

console.log('\n  THE PASSWORD NEVER TOUCHES THIS APP:');
t(!/bcrypt|scrypt|pbkdf2|sha256\(pass|hashPassword/i.test(src), 'nothing here hashes a password');
t(!/localStorage\.setItem\([^)]*pass/i.test(src), 'and nothing here stores one');
const auth=slice('async function _sbAuth(path, body){','var AUTH_KEY=');
t(/SB_URL\+'\/auth\/v1\/'\+path/.test(auth), 'it goes to Supabase Auth, which owns it');
t(/'apikey':SB_KEY/.test(auth), 'with the public key, which is what the public key is for');
const save=slice('function _authSave(o){','async function _authToCode');
t(!/password/i.test(save), 'and what is kept afterwards is a token, never the password');

console.log('\n  THE BROWSER NEVER CREATES A CLIENT:');
t(!/rest\/v1\/clients[^']*'\s*,\s*\{\s*method:'POST'/.test(src), 'the page never POSTs to clients');
const toCode=slice('async function _authToCode(access_token, name){','function _authMsg');
t(/fetch\('\/\.netlify\/functions\/signup'/.test(toCode), 'it asks the server instead');
t(/access_token:access_token/.test(toCode), 'handing over the token and nothing else that matters');

console.log('\n  AND THE SERVER CHECKS THE TOKEN BEFORE IT WRITES ANYTHING:');
/* IT IS ES256, NOT HS256 (found by running a real signup against the live
   project, 13 Sep). The first version verified the JWT locally with
   session.js's HMAC verifier, on the assumption that a Supabase access token is
   signed with the project's JWT secret. This project's tokens carry
   { "alg": "ES256", "kid": ... } -- asymmetric signing keys -- so every genuine
   signup was refused as bad_token. Reading the code could not have shown it.
   Supabase is the authority on its own tokens now: it checks the signature
   against whichever key signed it, and that cannot drift when a key rotates. */
t(!/require\('\.\/session\.js'\)/.test(fn), 'it no longer verifies the signature itself');
t(/fetch\(`\$\{URL\}\/auth\/v1\/user`/.test(fn), 'it asks Supabase whose token this is');
t(/Authorization: 'Bearer ' \+ token/.test(fn), 'handing over the token as the bearer');
t(/if \(r\.status === 401 \|\| r\.status === 403\) return json\(401, \{ error: 'bad_token' \}\)/.test(fn),
  'a forged, expired or revoked token gets nothing');
t(/if \(!user \|\| !user\.id\) return json\(401, \{ error: 'bad_token' \}\);/.test(fn),
  'and an answer without a user is not an answer');
t(/if \(!r\.ok\) \{ console\.error\('signup: \/auth\/v1\/user said', r\.status\); return json\(502/.test(fn),
  'a server that could not answer is a 502, never a quiet yes');
t(/if \(mid && mid\.client_code\) return json\(401, \{ error: 'wrong_token' \}\);/.test(fn),
  'AND A SESSION TOKEN IS NOT AN AUTH TOKEN -- a signed-in client cannot mint a second account');
t(/const uid = String\(user\.id\);/.test(fn), 'the identity comes from Supabase, never from the request body');
t(/const email = String\(user\.email \|\| ''\)/.test(fn), 'and so does the email');
t(!/body\.email/.test(fn), 'nothing the browser sent decides who this is');
t(/if \(!URL \|\| !SERVICE\)/.test(fn) && /return json\(503, \{ error: 'not_configured' \}\)/.test(fn),
  'and a half-configured function writes nothing at all');
t(/Authorization: 'Bearer ' \+ SERVICE/.test(fn), 'the row is written with the service key, never the public one');
t(!/SUPABASE_ANON/.test(fn), 'and it needs no environment variable that is not already set');

console.log('\n  ONE PERSON, ONE ACCOUNT, HOWEVER MANY TIMES THEY TRY:');
t(/auth_uid=eq\.\$\{encodeURIComponent\(uid\)\}/.test(fn), 'it looks for a row this user already has');
t(/existing: true/.test(fn), 'and hands the same code back rather than a second one');
t(/create unique index if not exists clients_auth_uid_key/.test(mig), 'the database refuses a second one too');
t(/if \(\/23505\/\.test\(t\) && \/auth_uid\/\.test\(t\)\)/.test(fn),
  'and two devices racing the first sign-in read the winner back instead of fighting');
t(/if \(\/23505\/\.test\(t\)\) continue;/.test(fn), 'a code collision draws another code');

console.log('\n  A GENERATED CODE IS THE SHAPE session.js ALREADY ACCEPTS:');
/* session.js: if (!code || code.length > 64 || !/^[a-z0-9_-]+$/.test(code)) */
const ALPH=(/const ALPHABET = '([^']+)'/.exec(fn)||[])[1]||'';
t(!!ALPH, 'there is an alphabet');
t(/^[a-z0-9]+$/.test(ALPH), 'every character of it passes session.js’s own code rule', ALPH);
t(!/[aeiou]/.test(ALPH), 'and no vowels, so a code can never spell anything', ALPH);
t(/crypto\.randomBytes\(10\)/.test(fn), 'the code is random, not a counter');

console.log('\n  FREE ACCESS CAME OFF THE LIST AND ONTO THE ROW:');
const free=slice('function isFreeApp(code){','function _meFreeApp');
t(/if\(rec && rec\.is_free_app===true\) return true;/.test(free), 'it reads the client’s own row');
t(/return !!FREE_APP_CODES\[c\];/.test(free), 'and the old map survives as the fallback for the tester who predates it');
t(/alter table clients add column if not exists is_free_app boolean not null default false;/.test(mig),
  'the column exists');
t(/update clients set is_free_app = true where code = 'freeuser';/.test(mig),
  'and the one name that was on the list keeps what it had');

console.log('\n  A BUILD THAT MEETS AN UNMIGRATED DATABASE STILL SIGNS PEOPLE IN:');
/* Sign-in is the one read that must never 400. A column asked for before the
   migration lands would take down the door for everyone, not just new members. */
t(/var _cols='code,name,initials,coach_code,is_trainer,active,is_free_app';/.test(inner), 'it asks for the column');
/* IT WAS A 401, NOT A 400 (found on the live database, 13 Sep, before this
   shipped). `clients` carries column-level grants from the August lockdown, so
   a newly added column is not selectable by the public key until it is granted
   — and the refusal is FORBIDDEN, not "no such column". A retry that only
   caught 400 would have left every uncached code unable to sign in. The grant
   is the fix; the widened retry is the seatbelt. */
t(/if\(!_rq\.ok\)\{/.test(inner), 'and drops it on ANY refusal, not only a 400');
t(!/_rq\.status===400/.test(inner), 'the 400-only retry is gone');
t(/grant select \(is_free_app\) on public\.clients to anon;/.test(mig), 'the migration grants the column');
t(!/grant select \(auth_uid\)/.test(mig), 'and deliberately does not grant auth_uid, which is nobody\u2019s business on the public key');
t(/if\(r\.is_free_app===true\) c\.is_free_app=true;/.test(inner), 'carrying it onto the record when it is there');
t(/return json\(503, \{ error: 'not_migrated' \}\)/.test(fn),
  'and sign-UP refuses rather than writing a row nothing could ever find again');

console.log('\n  THE LINK HE POSTS:');
t(/<div class="screen" id="sSignup">/.test(src), 'there is a sign-up screen');
t(/String\(location\.hash\|\|''\)\.toLowerCase\(\)==='#signup'/.test(src), 'and #signup opens it');
t(/window\.addEventListener\('hashchange'/.test(src), 'following the link with the app already open works too');
t(/history\.replaceState\(null,'',location\.pathname\+\(location\.hash\|\|''\)\);/.test(src),
  'and the cache-bust tidy no longer eats the hash on a forced-fresh load');
const boot=slice('    if(savedCode && CLIENTS[savedCode]){','  }, 200);');
t(/return;\n    \}/.test(boot) || /      return;/.test(boot),
  'somebody already signed in who taps the link lands in their app, not on a join form');

console.log('\n  SIGNING OUT TAKES THE SESSION WITH IT:');
t((src.match(/_authClear\(\);/g)||[]).length>=2,
  'both ways out clear it, or the next person to pick up this phone gets the last one’s account',
  (src.match(/_authClear\(\);/g)||[]).length);

console.log('\n  AND NOTHING TELLS A STRANGER WHO HAS AN ACCOUNT:');
const forgot=slice('async function lForgot(){','async function doLogin(code){');
t(/If that email has an account, a reset link is on its way\./.test(forgot),
  'forgot-password says the same thing either way');
t(!/no account|not found|unknown email/i.test(forgot), 'and never that the address is unknown');

console.log('\n  A WRONG PASSWORD IS ONLY CALLED WRONG WHEN THE SERVER SAID SO:');
/* The same law the code path already keeps: "A CORRECT CODE IS NEVER TOLD IT
   IS WRONG." */
const msg=slice('function _authMsg(res){','async function _emailSignIn');
t(/if\(!res\) return 'Can\\u2019t reach the server right now/.test(msg) || /if\(!res\) return 'Can.t reach the server/.test(msg),
  'no answer means no answer, not a rejection');
t(/res\.status===400 && \/invalid login\/i\.test\(m\)/.test(msg), 'only a 400 that says so is a wrong password');
t(/res\.status===429/.test(msg), 'and being rate-limited says that, rather than blaming them');

console.log(bad? ('\n  '+bad+' FAILED\n') : '\n  all good\n');
process.exit(bad?1:0);
