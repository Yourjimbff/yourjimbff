// SEND A NOTIFICATION TO ONE CLIENT'S PHONE. Trainer only.
//
// The other half of the push door. index.html registers the phone and writes
// push_token onto the client's profile row; this reads that token and sends.
//
// WHY IT IS TRAINER ONLY AND NOT OPEN: a client who could call this could push
// a notification to any other client's lock screen. The session token is
// checked the same way media.js and trainer.js check it, and the claim that
// matters is is_trainer — not a client_code, which every signed-in person has.
//
// REQUIRED ENVIRONMENT: everything in _apns.js, plus SUPABASE_URL,
// SUPABASE_SERVICE_KEY and SUPABASE_JWT_SECRET, which are already set.
const { verify } = require('./session.js');
const { pushOne, isDeadToken } = require('./_apns.js');

const json = (code, obj) => ({
  statusCode: code,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  body: JSON.stringify(obj),
});

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'POST only' });

  const URL = process.env.SUPABASE_URL;
  const SERVICE = process.env.SUPABASE_SERVICE_KEY;
  const SECRET = process.env.SUPABASE_JWT_SECRET;
  if (!URL || !SERVICE || !SECRET) return json(503, { error: 'not_configured' });

  const auth = (event.headers && (event.headers.authorization || event.headers.Authorization)) || '';
  const claims = verify(auth.replace(/^Bearer\s+/i, ''), SECRET);
  if (!claims) return json(401, { error: 'no_session' });
  if (claims.is_trainer !== true) return json(403, { error: 'trainer_only' });

  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch (e) { body = {}; }
  const code = String(body.code || '').trim();
  const title = String(body.title || '').slice(0, 120);
  const text = String(body.body || '').slice(0, 400);
  const tab = String(body.tab || '').slice(0, 24);
  if (!code) return json(400, { error: 'no_code' });
  if (!text) return json(400, { error: 'no_body' });

  // The token comes from the database on the service key, never from the
  // caller. A caller who could name a token could push to a stranger's phone.
  let token = '';
  try {
    const r = await fetch(
      URL + '/rest/v1/profiles?client_code=eq.' + encodeURIComponent(code) + '&select=push_token&limit=1',
      { headers: { apikey: SERVICE, authorization: 'Bearer ' + SERVICE } }
    );
    if (!r.ok) return json(502, { error: 'profile_read_failed', status: r.status });
    const rows = await r.json();
    token = (rows && rows[0] && rows[0].push_token) || '';
  } catch (e) {
    return json(502, { error: 'profile_read_threw' });
  }
  if (!token) return json(404, { error: 'no_token', hint: 'that client has not opened the store app and allowed notifications' });

  const sent = await pushOne(token, title || 'YOURJIMBFF', text, tab ? { tab: tab } : null);

  // A token Apple says is dead is cleared, so the next send does not waste a
  // round trip and the trainer surface can tell "declined" from "never asked".
  // Only on 410 Unregistered - see the note in _apns.js about BadDeviceToken.
  if (isDeadToken(sent)) {
    try {
      await fetch(URL + '/rest/v1/profiles?client_code=eq.' + encodeURIComponent(code), {
        method: 'PATCH',
        headers: {
          apikey: SERVICE, authorization: 'Bearer ' + SERVICE,
          'Content-Type': 'application/json', Prefer: 'return=minimal',
        },
        body: JSON.stringify({ push_token: null, push_token_at: null }),
      });
    } catch (e) { /* best effort; the send result is what the caller asked for */ }
  }

  if (sent.ok) return json(200, { ok: true });
  return json(502, { ok: false, status: sent.status, reason: sent.reason });
};
