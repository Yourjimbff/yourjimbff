// THE APP SAYS WHO IS ASKING (Yusuf, 15 Sep).
//
// Every read and write in this file went out as the anon key — the same key that
// ships in the page, the same one for all eighty clients. The database could not
// tell one person from another, which is exactly why every row-level policy on
// the project reads USING (true): there was nothing to key one on. That is the
// whole reason a stranger could read 4,231 food logs, 93 progress photos and
// 1,909 Jim conversations, and delete every one of them.
//
// This suite guards the cutover: the request carries the signed session when
// there is one, the public key when there cannot be one, and the three call
// sites that must stay on the public key are left alone.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+JSON.stringify(x)+']'):'')); };

const H=src.slice(src.indexOf('function sbHeaders(){'), src.indexOf('function sbHeaders(){')+420);

console.log('\n  THE REQUEST CARRIES AN IDENTITY:');
t(/var bearer=SB_KEY;/.test(H), 'the public key is the starting point');
t(/try\{ var t=_sessToken\(\); if\(t\) bearer=t; \}catch\(e\)\{\}/.test(H),
  'and the signed session replaces it whenever there is one');
t(/'Authorization':'Bearer '\+bearer/.test(H), 'that is what goes on the request');
t(!/'Authorization':'Bearer '\+SB_KEY,\n    'Prefer'/.test(src),
  'the old unconditional public-key bearer is gone');
t(/'apikey':SB_KEY/.test(H),
  'apikey stays the public key, which is what identifies the PROJECT - it is not the identity');

console.log('\n  AND IT FALLS BACK, BECAUSE SIGNING IN CANNOT REQUIRE BEING SIGNED IN:');
/* The identity read inside doLogin runs before a session can exist. If this
   threw or refused without a token, nobody could ever sign in again — which is
   the one failure this whole migration must not produce. */
t(/try\{ var t=_sessToken\(\); if\(t\) bearer=t; \}catch\(e\)\{\}/.test(H),
  'a missing or expired session leaves the public key in place, silently');
const tok=src.slice(src.indexOf('function _sessToken(){'), src.indexOf('function _sessToken(){')+340);
t(/if\(s\.exp <= Math\.floor\(Date\.now\(\)\/1000\)\) return null;/.test(tok),
  'an expired token is not offered');
t(/if\(cl && cl\.code && s\.code && s\.code!==cl\.code\) return null;/.test(tok),
  'and a session belonging to somebody else is never used for this person');

console.log('\n  THE THREE THAT STAY ON THE PUBLIC KEY ARE CORRECT:');
const hand=(src.match(/'apikey':\s*SB_KEY/g)||[]).length;
t(hand===4, 'four places name the key by hand - sbHeaders and three others', hand);
t(/headers:\{'Content-Type':'application\/json','apikey':SB_KEY,'Authorization':'Bearer '\+SB_KEY\}/.test(src),
  '  _sbAuth talks to Supabase Auth, which has to be presented the anon key');
t((src.match(/'Content-Type':'image\/jpeg', 'x-upsert':'true'/g)||[]).length===2,
  '  and two Storage uploads, which answer to bucket policies, not these');

console.log('\n  THE RECOVERY PATH EXISTS FOR WHEN THE LOCK GOES ON:');
/* Built before this cutover and not yet wired to a refusal — recorded here so
   the next step has somewhere to land rather than being invented under
   pressure. */
t(/async function sessOnDenied\(\)/.test(src), 'a refused request can trade for a fresh session');
t(/function sessForceSignIn\(\)/.test(src), 'and an unrecoverable refusal lands on sign-in, not on blanks');
t(/if\(_sessSigningOut\) return;/.test(src), '  guarded, so a storm of refusals cannot reload in a loop');
t(/quietly falling back to a key that can still see everything/.test(src),
  'and the file states the rule: never fall back to a key that can see everything');

console.log('\n  SIGNED IN BUT SPEAKING AS NOBODY, HEALED:');
/* From tonight a request made without a session is answered with SILENCE - zero
   rows, status 200 - which looks exactly like an empty app rather than an error.
   sessEnsure is raced against 2.5s at sign-in, so a slow phone can leave someone
   signed in with no session and no complaint, and every screen blank. */
t(/async function _sessHeal\(\)/.test(src), 'there is a heal for a session that never arrived');
t(/if\(!code\) return;                       \/\/ not signed in: nothing to heal/.test(src),
  'it does nothing for somebody who is not signed in');
t(/if\(_sessToken\(\)\) return;                \/\/ already carrying one/.test(src),
  'and nothing for somebody who already has one - it is not a heartbeat');
t(/try\{ await sessEnsure\(code, true\); \}catch\(e\)\{\}/.test(src), 'otherwise it goes and gets one');
t(/setTimeout\(function\(\)\{ _sessHeal\(\); \}, 6000\)/.test(src),
  'checked once shortly after boot, after the sign-in race has settled');
t(/if\(document\.visibilityState==='visible'\) setTimeout\(_sessHeal, 400\);/.test(src),
  'and whenever the app comes back to the foreground, which is when a token would have lapsed');
t(/var _fixing=false;/.test(src), 'guarded, so it cannot pile up on itself');

console.log('\n  WHAT IS STILL TRUE AND MUST NOT BE FORGOTTEN:');
/* This step gives the database an identity to reason about. It does not itself
   restrict anything — the policies are still permissive and anon still holds
   SELECT/INSERT/UPDATE/DELETE on ~45 tables. Said out loud so nobody reads a
   green suite here as "the data is private now". */
t(/NOTHING CHANGES TODAY, and that is deliberate/.test(src),
  'the source says plainly that this step restricts nothing by itself');

console.log(bad?('\n  '+bad+' FAILED'):'\n  all good (the database can finally tell who is asking)');
process.exit(bad?1:0);
