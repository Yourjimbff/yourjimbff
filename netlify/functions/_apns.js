// APPLE PUSH, THE SENDING HALF. Not a Netlify function itself — no
// exports.handler — required by push-send.js the way notify-consult requires
// _notify.
//
// WHY A KEY AND NOT A CERTIFICATE (17 Sep). Apple offers two ways to prove you
// are allowed to push: a per-app SSL certificate that expires every year and
// has to be regenerated from a Keychain request, or one Auth Key (.p8) that
// never expires and covers every app on the team. Yusuf was looking at the
// certificate screen; this file is written for the key, because a thing that
// expires in a year is a thing that breaks in a year while he is asleep.
//
// REQUIRED ENVIRONMENT (Netlify → Site settings → Environment variables):
//   APNS_KEY_P8    the whole contents of the AuthKey_XXXXXXXXXX.p8 file,
//                  including the BEGIN and END lines. Newlines may be real
//                  newlines or the two characters \n — both are handled.
//   APNS_KEY_ID    the ten characters in the key's filename
//   APNS_TEAM_ID   UGXVB2SSRZ
//   APNS_BUNDLE_ID com.yourjimbff.app
//   APNS_ENV       "development" while the app is installed from Xcode,
//                  "production" once it comes from TestFlight or the store.
//                  GETTING THIS WRONG IS THE COMMONEST APNS FAILURE and it
//                  answers 400 BadDeviceToken, which reads like a bad token
//                  and is not one. A build signed with the development
//                  entitlement can ONLY be reached on the sandbox host.
const crypto = require('crypto');

const HOST_PROD = 'api.push.apple.com';
const HOST_DEV = 'api.sandbox.push.apple.com';

function b64url(buf) {
  return Buffer.from(buf).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// The provider token is a JWT Apple wants re-signed at most once an hour and at
// least once every 24. Cached here so a burst of sends is one signature, not
// one per phone — Apple rejects providers that mint a fresh token per request.
let _tok = null, _tokAt = 0;
function providerToken() {
  const KEY = process.env.APNS_KEY_P8;
  const KID = process.env.APNS_KEY_ID;
  const TEAM = process.env.APNS_TEAM_ID;
  if (!KEY || !KID || !TEAM) return null;
  const now = Math.floor(Date.now() / 1000);
  if (_tok && (now - _tokAt) < 2400) return _tok;
  const pem = String(KEY).replace(/\\n/g, '\n').trim();
  const header = b64url(JSON.stringify({ alg: 'ES256', kid: KID }));
  const payload = b64url(JSON.stringify({ iss: TEAM, iat: now }));
  const signer = crypto.createSign('SHA256');
  signer.update(header + '.' + payload);
  signer.end();
  // ES256 for JWT is the raw r||s pair, not the DER envelope OpenSSL returns.
  const sig = signer.sign({ key: pem, dsaEncoding: 'ieee-p1363' });
  _tok = header + '.' + payload + '.' + b64url(sig);
  _tokAt = now;
  return _tok;
}

// One phone. Returns {ok, status, reason}. Never throws: a notification that
// cannot be sent must never break the thing that triggered it.
async function pushOne(token, title, body, data) {
  try {
    const jwt = providerToken();
    const BUNDLE = process.env.APNS_BUNDLE_ID;
    if (!jwt || !BUNDLE) return { ok: false, status: 0, reason: 'not_configured' };
    const host = (String(process.env.APNS_ENV || 'development') === 'production') ? HOST_PROD : HOST_DEV;
    const payload = {
      aps: {
        alert: { title: String(title || ''), body: String(body || '') },
        sound: 'default',
        badge: 1,
      },
    };
    if (data && typeof data === 'object') Object.assign(payload, data);
    const res = await fetch('https://' + host + '/3/device/' + encodeURIComponent(token), {
      method: 'POST',
      headers: {
        'authorization': 'bearer ' + jwt,
        'apns-topic': BUNDLE,
        'apns-push-type': 'alert',
        'apns-priority': '10',
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (res.status === 200) return { ok: true, status: 200, reason: '' };
    let reason = '';
    try { const j = await res.json(); reason = String(j && j.reason || ''); } catch (e) {}
    // Said out loud in the function log. A push that fails quietly is a phone
    // that looks like it simply never gets notifications.
    console.error('apns: send refused', res.status, reason || '(no reason)');
    return { ok: false, status: res.status, reason: reason };
  } catch (e) {
    console.error('apns: send threw', e && e.message);
    return { ok: false, status: 0, reason: 'threw' };
  }
}

// A token Apple has told us is dead. 410 Unregistered means the app was deleted
// or the token rotated; BadDeviceToken usually means APNS_ENV is wrong, so it
// is deliberately NOT treated as dead — clearing a good token because of a
// config mistake is how a client silently stops getting notifications forever.
function isDeadToken(r) {
  return !!(r && r.status === 410 && r.reason === 'Unregistered');
}

module.exports = { pushOne, isDeadToken, providerToken };
