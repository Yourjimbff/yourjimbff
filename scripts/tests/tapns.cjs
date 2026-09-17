// THE SENDING HALF OF PUSH. Built 17 Sep, the same afternoon the receiving half
// was proved on his own handset — a token sitting on a row is worth nothing
// until something can reach it.
//
// It cannot be run end to end here: it needs an Auth Key only Yusuf can
// generate, and Apple's own servers. So this asserts the things that are wrong
// in ways that are silent or dangerous rather than loud.
const fs=require('fs');
let bad=0; const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };
const apns=fs.readFileSync('netlify/functions/_apns.js','utf8');
const send=fs.readFileSync('netlify/functions/push-send.js','utf8');

console.log('\n  IT SIGNS THE WAY APPLE ASKS:');
t(/alg: 'ES256', kid: KID/.test(apns), 'ES256 with the key id in the header');
t(/dsaEncoding: 'ieee-p1363'/.test(apns),
  'and the raw r||s signature, not the DER envelope OpenSSL returns by default',
  'a DER signature is refused by Apple and reads as a bad key');
t(/iss: TEAM, iat: now/.test(apns), 'issued by the team, stamped now');
t(/replace\(\/\\\\n\/g, '\\n'\)/.test(apns),
  'and a key pasted with escaped newlines still works', 'this is how it arrives from a form field');

console.log('\n  IT DOES NOT MINT A TOKEN PER SEND:');
/* Apple rejects providers that sign a fresh token on every request. */
t(/if \(_tok && \(now - _tokAt\) < 2400\) return _tok;/.test(apns),
  'the provider token is cached under Apple\u2019s one-hour ceiling');

console.log('\n  THE SANDBOX TRAP IS WRITTEN DOWN:');
/* The commonest APNs failure. A development build can ONLY be reached on the
   sandbox host, and the production host answers BadDeviceToken - which reads
   like a bad token and is not one. */
t(/api\.sandbox\.push\.apple\.com/.test(apns) && /api\.push\.apple\.com/.test(apns),
  'both hosts exist');
t(/APNS_ENV/.test(apns), 'and one setting chooses between them');
t(/BadDeviceToken/.test(apns), 'and the trap is named in the file');

console.log('\n  A DEAD TOKEN IS CLEARED, A MISCONFIGURED ONE IS NOT:');
t(/r\.status === 410 && r\.reason === 'Unregistered'/.test(apns),
  'only 410 Unregistered counts as dead');
t(/BadDeviceToken usually means APNS_ENV is wrong/.test(apns),
  '  and the reason it is that narrow is written down',
  'clearing a good token over a config mistake silences a client forever');
t(/isDeadToken\(sent\)/.test(send), 'and the sender acts on that test');
t(/push_token: null, push_token_at: null/.test(send), '  by clearing both fields');

console.log('\n  NOTHING FAILS QUIETLY:');
t(/console\.error\('apns: send refused'/.test(apns), 'a refusal is logged with Apple\u2019s reason');
t(/console\.error\('apns: send threw'/.test(apns), 'and so is a throw');
t(/return \{ ok: false, status: 0, reason: 'threw' \}/.test(apns),
  'and it never throws at the thing that triggered it');

console.log('\n  AND NOBODY CAN PUSH TO A STRANGER\u2019S PHONE:');
t(/claims\.is_trainer !== true\) return json\(403/.test(send), 'trainer only, checked on the claim');
t(!/body\.token/.test(send), 'the caller cannot name a token');
t(/select=push_token/.test(send), '  it is read from the database by client code');
t(/apikey: SERVICE/.test(send), '  on the service key, server side');
t(/error: 'no_token'/.test(send), 'and a client with no phone registered says so plainly');

console.log(bad? '\n  '+bad+' FAILED\n' : '\n  all good (the sending half is ready for the key)\n');
process.exit(bad?1:0);
