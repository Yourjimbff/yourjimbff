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

console.log('\n  IT SPEAKS THE ONLY PROTOCOL APPLE ACCEPTS:');
/* The first real send answered "502 threw" and the cause was the transport,
   not the key: Node's built-in fetch is undici, HTTP/1.1 only, and Apple's
   provider API has never accepted HTTP/1.1. No key or host setting rescues
   that. Asserted here because the failure looks exactly like a bad key. */
t(/require\('http2'\)/.test(apns), 'the send goes over HTTP/2, from core');
t(!/await fetch\('https:\/\/' \+ host/.test(apns),
  '  and not over fetch, which cannot do HTTP/2', 'undici is HTTP/1.1 only');
t(/client\.close\(\)/.test(apns),
  'the session is closed per send, not kept across invocations',
  'a frozen function thaws holding a socket Apple shut hours ago');
t(/reason: 'timeout'/.test(apns),
  'and a handshake that never lands times out rather than being killed mid-flight');

console.log('\n  NOTHING FAILS QUIETLY, AND NO TWO FAILURES READ THE SAME:');
t(/console\.error\('apns: send refused'/.test(apns), 'a refusal is logged with Apple\u2019s reason');
t(/console\.error\('apns: signing threw'/.test(apns), 'an unusable key is logged as a key problem');
t(/reason: 'key ' \+ String\(\(e && e\.message\)/.test(apns),
  '  and the reason carries the message, so the app can print it',
  'one word for every failure is what cost a redeploy to take apart');
t(/reason: 'session '/.test(apns) && /reason: 'stream '/.test(apns),
  'a dead connection says which half died');
t(/reason: 'not_configured'/.test(apns), 'and a missing setting is not dressed up as a failure to send');
t(!/reason: 'threw' \}/.test(apns),
  'nothing answers with the bare word "threw" any more',
  'it covered a broken key and a wrong protocol equally well');

console.log('\n  AND NOBODY CAN PUSH TO A STRANGER\u2019S PHONE:');
t(/claims\.is_trainer !== true\) return json\(403/.test(send), 'trainer only, checked on the claim');
t(!/body\.token/.test(send), 'the caller cannot name a token');
t(/select=push_token/.test(send), '  it is read from the database by client code');
t(/apikey: SERVICE/.test(send), '  on the service key, server side');
t(/error: 'no_token'/.test(send), 'and a client with no phone registered says so plainly');

console.log(bad? '\n  '+bad+' FAILED\n' : '\n  all good (the sending half is ready for the key)\n');
process.exit(bad?1:0);
