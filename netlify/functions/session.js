// The access code, exchanged for a real session.
//
// Today the code is checked in JavaScript on the device and the database is handed the
// same public key for everyone — so Postgres cannot tell one client from another, and
// "your own data only" is impossible to enforce. This is the fix: the code comes here,
// the server checks it against the clients table with a key the page never sees, and
// hands back a signed session that names the client. Row-level security can then key on
// that name.
//
// NOTHING VISIBLE CHANGES FOR A CLIENT. They type the same code into the same box.
//
// No npm — the repo has no package.json, so the token is signed with node's own crypto
// exactly as stripe-hook.js verifies Stripe signatures.
//
// REQUIRED ENVIRONMENT (Netlify → Site settings → Environment variables):
//   SUPABASE_URL           https://frxptalfyutukmnsvysg.supabase.co
//   SUPABASE_SERVICE_KEY   the service_role key — already set for stripe-hook
//   SUPABASE_JWT_SECRET    Supabase → Settings → API → JWT Secret. NEW — must be added.
//                          This is what makes Supabase trust the session we mint.
//                          It is not the service key and not the anon key.
//
// Without all three this returns 503 and mints nothing. It never issues a half-session.

const crypto = require('crypto');

const DAYS = 86400;
const TTL = 30 * DAYS;          // long-lived on purpose: clients stay signed in as today
const RENEW_WITHIN = 7 * DAYS;  // the app refreshes quietly once inside this window

const b64url = (buf) =>
  Buffer.from(buf).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

function sign(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const body = b64url(JSON.stringify(header)) + '.' + b64url(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', secret).update(body).digest();
  return body + '.' + b64url(sig);
}

// Exported so trainer.js can verify without duplicating the logic.
function verify(token, secret) {
  try {
    const parts = String(token || '').split('.');
    if (parts.length !== 3) return null;
    const body = parts[0] + '.' + parts[1];
    const expected = b64url(crypto.createHmac('sha256', secret).update(body).digest());
    // Constant-time compare — a length mismatch would throw, so guard it first.
    const a = Buffer.from(parts[2]), b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const claims = JSON.parse(Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64'));
    if (!claims.exp || claims.exp < Math.floor(Date.now() / 1000)) return null;
    return claims;
  } catch (e) { return null; }
}

const json = (code, obj) => ({
  statusCode: code,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  body: JSON.stringify(obj),
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'POST only' });

  const URL = process.env.SUPABASE_URL;
  const SERVICE = process.env.SUPABASE_SERVICE_KEY;
  const SECRET = process.env.SUPABASE_JWT_SECRET;
  if (!URL || !SERVICE || !SECRET) {
    // Explicit and loud. A missing secret must never silently downgrade to "no session",
    // because the app would then fall back to the public key and look fine while being
    // exactly as open as before.
    console.error('session: missing env', { URL: !!URL, SERVICE: !!SERVICE, SECRET: !!SECRET });
    return json(503, { error: 'not_configured' });
  }

  let code = '';
  try { code = String((JSON.parse(event.body || '{}').code) || '').trim().toLowerCase(); }
  catch (e) { return json(400, { error: 'bad_request' }); }
  // Codes are a known shape. Anything else is not worth a database round trip.
  if (!code || code.length > 64 || !/^[a-z0-9_-]+$/.test(code)) {
    return json(401, { error: 'unknown_code' });
  }

  let row = null;
  try {
    // A column this select names but the table doesn't have yet (weekly_calls,
    // weekly_call_spent_at, if the migration hasn't landed) would 400 this
    // whole lookup — which is login itself, for every account. Looped, not
    // just one retry, since this migration alone adds two columns and a
    // single retry would still 400 on the second one if neither has landed.
    let cols = 'code,name,initials,is_trainer,active,calls_enabled,call_credits,weekly_calls,weekly_call_spent_at,started_at';
    let r, text;
    for (let attempt = 0; attempt < 4; attempt++) {
      r = await fetch(
        `${URL}/rest/v1/clients?code=eq.${encodeURIComponent(code)}&select=${cols}&limit=1`,
        { headers: { apikey: SERVICE, Authorization: 'Bearer ' + SERVICE } });
      text = await r.text();
      if (r.ok) break;
      const m = /column\s+\\?"?(?:[a-z_][a-z0-9_]*\.)?\\?"?([a-z_][a-z0-9_]*)\\?"?[\s\S]{0,40}?does not exist/i.exec(text)
        || /could not find the '([a-z_]+)' column/i.exec(text);
      if (!m || !cols.split(',').includes(m[1])) break;
      console.warn('session: clients has no column "' + m[1] + '" — retrying without it');
      cols = cols.split(',').filter((c) => c !== m[1]).join(',');
    }
    if (!r.ok) { console.error('session: lookup failed', r.status); return json(502, { error: 'lookup_failed' }); }
    const rows = JSON.parse(text);
    row = rows && rows[0];
  } catch (e) {
    console.error('session: lookup threw', e && e.message);
    return json(502, { error: 'lookup_failed' });
  }

  // Deliberately the SAME acceptance rule the app uses today: present in the clients
  // table is enough. Adding a stricter rule here would bounce real clients at cutover,
  // which is the one thing this rollout must never do.
  if (!row) return json(401, { error: 'unknown_code' });

  const now = Math.floor(Date.now() / 1000);
  const claims = {
    // Supabase reads `role` to decide which Postgres role runs the query, and `aud`
    // must be 'authenticated' or PostgREST rejects the token outright.
    role: 'authenticated',
    aud: 'authenticated',
    sub: row.code,
    client_code: row.code,          // what every row-level policy keys on
    is_trainer: row.is_trainer === true,
    iat: now,
    exp: now + TTL,
  };

  return json(200, {
    token: sign(claims, SECRET),
    expires_at: claims.exp,
    renew_within: RENEW_WITHIN,
    // calls_enabled/call_credits/weekly_calls/weekly_call_spent_at ride here, not
    // in the signed claims — this is data for the page to show, not an identity
    // fact PostgREST or trainer.js needs to trust. Carrying them here lets the
    // login flow stop asking the public key about a client's own call-booking
    // permission once that column goes dark to anon — the exact thing that read
    // used to depend on. weekly_call_spent_at rides as-is (or undefined, if the
    // migration hasn't landed and the retry above dropped it) — the page's own
    // hasWeeklyCreditNow() treats a missing/falsy value as "never spent."
    //
    // started_at rides for exactly the same reason: a fact about THIS client,
    // needed by their own screen, on a column that is dark to the anon key and
    // staying that way. The Day page anchors how far back a client can scroll to
    // the day they actually started; without this it can only guess from their
    // first logged row. Display data, not identity — nothing signs it and
    // nothing trusts it for access.
    client: { code: row.code, name: row.name || row.code, initials: row.initials || null,
              is_trainer: row.is_trainer === true, active: row.active !== false,
              calls_enabled: row.calls_enabled === true, call_credits: +row.call_credits || 0,
              weekly_calls: row.weekly_calls === true, weekly_call_spent_at: row.weekly_call_spent_at || null,
              started_at: row.started_at ? String(row.started_at).slice(0, 10) : null },
  });
};

exports.verify = verify;
