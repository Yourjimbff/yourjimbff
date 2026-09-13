// A SUPABASE AUTH USER, EXCHANGED FOR A CLIENT ROW.
//
// Yusuf, 13 Sep: "I need to be able to send a link that allows them to sign up
// with their email and create a password for themselves."
//
// THE BROWSER NEVER CREATES A CLIENT. The page signs the person up with
// Supabase Auth using the public key -- that part is safe, it is what the anon
// key is for, and the password never touches this app's code. It then brings
// the access token here, and THIS is where a row in `clients` is written, with
// the service key, after the token has been checked.
//
// If the page created the row itself, anyone with devtools could mint clients,
// name themselves a trainer, or take a code that is not theirs. That is not a
// theoretical: the anon key ships in the HTML and always will.
//
// HOW THE TOKEN IS CHECKED: a Supabase access token is an HS256 JWT signed with
// the project's JWT secret -- the same secret session.js already needs and that
// is already set in Netlify. So verification is local, offline, and reuses the
// verifier session.js already exports rather than a second copy of it.
//
// REQUIRED ENVIRONMENT (all three already exist for session.js):
//   SUPABASE_URL
//   SUPABASE_SERVICE_KEY
//   SUPABASE_JWT_SECRET
// Missing any one returns 503 and writes nothing. It never half-creates a client.

const { verify } = require('./session.js');

const json = (code, obj) => ({
  statusCode: code,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  body: JSON.stringify(obj),
});

// A code is this person's identity in every other table, so it has to be
// unique, unguessable enough that nobody stumbles into someone else's account
// by typing, and still the shape session.js already accepts: /^[a-z0-9_-]+$/.
// No vowels, so it cannot accidentally spell anything.
const ALPHABET = 'bcdfghjkmnpqrstvwxz23456789';
function makeCode() {
  const crypto = require('crypto');
  const bytes = crypto.randomBytes(10);
  let out = 'u';
  for (let i = 0; i < 10; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

function cleanName(s) {
  return String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, 80);
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'POST only' });

  const URL = process.env.SUPABASE_URL;
  const SERVICE = process.env.SUPABASE_SERVICE_KEY;
  const SECRET = process.env.SUPABASE_JWT_SECRET;
  if (!URL || !SERVICE || !SECRET) {
    console.error('signup: missing env', { URL: !!URL, SERVICE: !!SERVICE, SECRET: !!SECRET });
    return json(503, { error: 'not_configured' });
  }

  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch (e) { return json(400, { error: 'bad_request' }); }

  const claims = verify(String(body.access_token || ''), SECRET);
  if (!claims || !claims.sub) return json(401, { error: 'bad_token' });
  // A Supabase user token names the user in `sub` and carries `authenticated`.
  // A session.js token names a CLIENT CODE in sub and must never be accepted
  // here: it would let a signed-in client mint a second account for themselves.
  if (claims.client_code) return json(401, { error: 'wrong_token' });
  if (claims.exp && claims.exp * 1000 < Date.now()) return json(401, { error: 'expired' });

  const uid = String(claims.sub);
  const email = String(claims.email || body.email || '').trim().toLowerCase().slice(0, 160);
  const name = cleanName(body.name) || (email ? email.split('@')[0] : 'Member');

  const H = { apikey: SERVICE, Authorization: 'Bearer ' + SERVICE, 'Content-Type': 'application/json' };

  // ALREADY HAVE ONE? Signing up twice, or signing in on a second device before
  // the first row landed, must return the SAME code and never a second account.
  try {
    const r = await fetch(
      `${URL}/rest/v1/clients?auth_uid=eq.${encodeURIComponent(uid)}&select=code,name,active&limit=1`,
      { headers: H });
    if (r.ok) {
      const rows = await r.json();
      if (rows && rows[0]) {
        return json(200, { code: rows[0].code, name: rows[0].name || name, existing: true });
      }
    } else if (r.status === 400) {
      // The migration has not landed: the column does not exist yet. Say so
      // rather than creating a row that nothing can ever find again.
      const t = await r.text();
      if (/auth_uid/.test(t)) { console.error('signup: clients.auth_uid missing — run migrations/auth_signup.sql'); return json(503, { error: 'not_migrated' }); }
    }
  } catch (e) {
    console.error('signup: lookup threw', e && e.message);
    return json(502, { error: 'lookup_failed' });
  }

  // A generated code can collide, which is a 409 on the unique index rather
  // than a silent overwrite. Try a few, then give up honestly.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = makeCode();
    const row = {
      code, name, email, auth_uid: uid,
      is_free_app: true,
      active: true,
      is_trainer: false,
    };
    try {
      const r = await fetch(`${URL}/rest/v1/clients`, {
        method: 'POST',
        headers: Object.assign({ Prefer: 'return=representation' }, H),
        body: JSON.stringify(row),
      });
      if (r.ok) {
        const rows = await r.json();
        const made = (rows && rows[0]) || row;
        return json(200, { code: made.code, name: made.name || name, existing: false });
      }
      const t = await r.text();
      // 23505 is a unique violation. On `code` we retry; on `auth_uid` somebody
      // else won the race for THIS user, so read theirs back rather than fight.
      if (/23505/.test(t) && /auth_uid/.test(t)) {
        const back = await fetch(
          `${URL}/rest/v1/clients?auth_uid=eq.${encodeURIComponent(uid)}&select=code,name&limit=1`,
          { headers: H });
        if (back.ok) {
          const rows = await back.json();
          if (rows && rows[0]) return json(200, { code: rows[0].code, name: rows[0].name || name, existing: true });
        }
      }
      if (/23505/.test(t)) continue;            // code collision — draw another
      console.error('signup: insert failed', r.status, t.slice(0, 300));
      return json(502, { error: 'create_failed' });
    } catch (e) {
      console.error('signup: insert threw', e && e.message);
      return json(502, { error: 'create_failed' });
    }
  }
  return json(502, { error: 'create_failed' });
};
