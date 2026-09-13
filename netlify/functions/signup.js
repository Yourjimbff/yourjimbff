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
// HOW THE TOKEN IS CHECKED: BY ASKING SUPABASE.
//
// The first version of this verified the JWT locally with session.js's HMAC
// verifier, on the assumption that a Supabase access token is HS256 signed with
// the project's JWT secret. IT IS NOT, on this project: tokens come back
//   { "alg": "ES256", "kid": "5ac635f4-...", "typ": "JWT" }
// -- asymmetric signing keys. Every real signup was refused as 'bad_token',
// found by running an actual signup against the live project rather than by
// reading the code, which could not have shown it.
//
// So the token goes to GET /auth/v1/user and Supabase answers. Supabase is the
// authority on its own tokens: it checks the signature against whichever key
// signed it, and a token that is expired, revoked, or for another project gets
// a 401. That is stronger than any verifier kept in this repo, and it cannot
// drift when Supabase rotates a key or changes an algorithm.
//
// REQUIRED ENVIRONMENT (both already exist for session.js):
//   SUPABASE_URL
//   SUPABASE_SERVICE_KEY
// Missing either returns 503 and writes nothing. It never half-creates a client.

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
  if (!URL || !SERVICE) {
    console.error('signup: missing env', { URL: !!URL, SERVICE: !!SERVICE });
    return json(503, { error: 'not_configured' });
  }

  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch (e) { return json(400, { error: 'bad_request' }); }

  const token = String(body.access_token || '');
  // Shape only, to keep junk off the network. The real check is the next call.
  if (!token || token.length > 4096 || token.split('.').length !== 3) {
    return json(401, { error: 'bad_token' });
  }
  // A session.js token is HS256 and names a CLIENT CODE in sub. Supabase would
  // refuse it anyway, but refusing it here says WHY: a signed-in client must
  // never be able to mint a second account for themselves.
  try {
    const mid = JSON.parse(Buffer.from(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64'));
    if (mid && mid.client_code) return json(401, { error: 'wrong_token' });
  } catch (e) { return json(401, { error: 'bad_token' }); }

  // SUPABASE IS THE AUTHORITY ON ITS OWN TOKENS.
  let user = null;
  try {
    const r = await fetch(`${URL}/auth/v1/user`, {
      headers: { apikey: SERVICE, Authorization: 'Bearer ' + token },
    });
    if (r.status === 401 || r.status === 403) return json(401, { error: 'bad_token' });
    if (!r.ok) { console.error('signup: /auth/v1/user said', r.status); return json(502, { error: 'verify_failed' }); }
    user = await r.json();
  } catch (e) {
    console.error('signup: verify threw', e && e.message);
    return json(502, { error: 'verify_failed' });
  }
  if (!user || !user.id) return json(401, { error: 'bad_token' });

  const uid = String(user.id);
  const email = String(user.email || '').trim().toLowerCase().slice(0, 160);
  const metaName = (user.user_metadata && user.user_metadata.name) || '';
  const name = cleanName(body.name) || cleanName(metaName) || (email ? email.split('@')[0] : 'Member');

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
