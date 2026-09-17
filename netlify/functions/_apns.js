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
// APNs SPEAKS HTTP/2 AND NOTHING ELSE (17 Sep, found on the first real send).
// The first version of this file used fetch(), and the first real send came
// back "502 threw" with nothing else to go on. Node's built-in fetch is undici,
// which is HTTP/1.1 only; Apple's provider API has never accepted HTTP/1.1, so
// the connection dies before a single byte of the notification is written. No
// key, bundle id or host setting can rescue that - it is the wrong protocol.
// node:http2 is in core and costs nothing, so it is what this uses.
const http2 = require('http2');

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

// ONE REQUEST OVER ONE SESSION. Opened and closed per send: a Netlify function
// is frozen between invocations, and a kept-alive HTTP/2 session woken up in a
// thawed container is a socket Apple closed hours ago. Never rejects - every
// path resolves with a {ok, status, reason} the caller can print.
function sendViaH2(host, path, headers, body) {
  return new Promise(function (resolve) {
    var done = false;
    var client = null;
    function finish(r) {
      if (done) return;
      done = true;
      try { if (client) client.close(); } catch (e) {}
      resolve(r);
    }
    try {
      client = http2.connect('https://' + host, { settings: { enablePush: false } });
    } catch (e) {
      return finish({ ok: false, status: 0, reason: 'connect ' + String((e && e.message) || 'failed').slice(0, 120) });
    }
    client.on('error', function (e) {
      finish({ ok: false, status: 0, reason: 'session ' + String((e && e.message) || 'error').slice(0, 120) });
    });
    // Belt and braces: a session that never finishes its handshake would
    // otherwise hold the whole function until Netlify kills it, and a function
    // killed mid-flight reports nothing at all.
    var guard = setTimeout(function () {
      finish({ ok: false, status: 0, reason: 'timeout' });
    }, 8000);
    var req;
    try {
      req = client.request(Object.assign({ ':method': 'POST', ':path': path }, headers));
    } catch (e) {
      clearTimeout(guard);
      return finish({ ok: false, status: 0, reason: 'request ' + String((e && e.message) || 'failed').slice(0, 120) });
    }
    var status = 0, buf = '';
    req.setEncoding('utf8');
    req.on('response', function (h) { status = Number(h[':status']) || 0; });
    req.on('data', function (c) { buf += c; });
    req.on('error', function (e) {
      clearTimeout(guard);
      finish({ ok: false, status: 0, reason: 'stream ' + String((e && e.message) || 'error').slice(0, 120) });
    });
    req.on('end', function () {
      clearTimeout(guard);
      if (status === 200) return finish({ ok: true, status: 200, reason: '' });
      var reason = '';
      try { reason = String((JSON.parse(buf || '{}') || {}).reason || ''); } catch (e) { reason = String(buf || '').slice(0, 100); }
      finish({ ok: false, status: status, reason: reason });
    });
    req.end(body);
  });
}

// One phone. Returns {ok, status, reason}. Never throws: a notification that
// cannot be sent must never break the thing that triggered it.
//
// WHAT A REASON IS FOR. The first real send answered "threw" and that single
// word cost a redeploy to take apart, because it covered a broken key and a
// wrong protocol equally well. Every failure now carries the sentence that
// names it, all the way to the panel in the app - "key error:1E08010C" and
// "session ERR_HTTP2" are different problems and must never read the same.
async function pushOne(token, title, body, data) {
  var jwt = null;
  try {
    jwt = providerToken();
  } catch (e) {
    // The key itself is unusable - a truncated paste, a lost BEGIN line, the
    // wrong file. Nothing downstream can recover from it, and saying "threw"
    // here would hide the one fact that matters.
    console.error('apns: signing threw', e && e.message);
    return { ok: false, status: 0, reason: 'key ' + String((e && e.message) || 'unusable').slice(0, 140) };
  }
  var BUNDLE = process.env.APNS_BUNDLE_ID;
  if (!jwt || !BUNDLE) return { ok: false, status: 0, reason: 'not_configured' };
  var host = (String(process.env.APNS_ENV || 'development') === 'production') ? HOST_PROD : HOST_DEV;
  var payload = {
    aps: {
      alert: { title: String(title || ''), body: String(body || '') },
      sound: 'default',
      badge: 1,
    },
  };
  if (data && typeof data === 'object') Object.assign(payload, data);
  var res;
  try {
    res = await sendViaH2(host, '/3/device/' + encodeURIComponent(token), {
      'authorization': 'bearer ' + jwt,
      'apns-topic': BUNDLE,
      'apns-push-type': 'alert',
      'apns-priority': '10',
      'content-type': 'application/json',
    }, JSON.stringify(payload));
  } catch (e) {
    console.error('apns: send threw', e && e.message);
    return { ok: false, status: 0, reason: 'threw ' + String((e && e.message) || '').slice(0, 140) };
  }
  // Said out loud in the function log too. A push that fails quietly is a phone
  // that looks like it simply never gets notifications.
  if (!res.ok) console.error('apns: send refused', res.status, res.reason || '(no reason)');
  return res;
}

// A token Apple has told us is dead. 410 Unregistered means the app was deleted
// or the token rotated; BadDeviceToken usually means APNS_ENV is wrong, so it
// is deliberately NOT treated as dead — clearing a good token because of a
// config mistake is how a client silently stops getting notifications forever.
function isDeadToken(r) {
  return !!(r && r.status === 410 && r.reason === 'Unregistered');
}

module.exports = { pushOne, isDeadToken, providerToken };
