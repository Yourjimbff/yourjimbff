// THE RIGHT TO BE FORGOTTEN, done properly.
//
// Yusuf, 15 Sep: "notify them that they have the ability to delete all their
// user data and information (for them only, obviously)."
//
// WHY THIS IS A SERVER FUNCTION AND NOT A LOOP IN THE BROWSER. Erasing somebody
// means reaching thirty tables, and the page's key is now correctly unable to
// touch most of them - which is the whole point of tonight's work. The service
// key lives here and nowhere else, exactly as it does in trainer.js.
//
// IT CAN ONLY EVER ERASE THE PERSON ASKING. The code is taken from the SIGNED
// session and never from the request body, so there is no argument to tamper
// with: whoever holds the session is the only person this can delete. A trainer
// gets no special power here either - "for them only" applies to everybody, and
// a coach wanting to remove a client has the roster for that.
//
// REQUIRED ENVIRONMENT (already set for trainer.js and stripe-hook):
//   SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_JWT_SECRET

const { verify } = require('./session.js');

const json = (code, obj) => ({
  statusCode: code,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  body: JSON.stringify(obj),
});

// Everything that is keyed to a person. Ordered so the rows that reference
// other rows go first; nothing here cascades, so each is named on purpose.
// A table that does not exist, or has no such column, is REPORTED and skipped
// rather than aborting the erase — a half-finished deletion that stopped at the
// first missing table would be the worst possible outcome.
const BY_CLIENT_CODE = [
  'food_logs', 'workout_logs', 'weight_logs', 'progress_photos', 'journal_entries',
  'chat_messages', 'mi_checkins', 'mi_attempts', 'mi_assignments', 'step_logs',
  'set_logs', 'sleep_logs', 'energy_checkins', 'daily_scores', 'saved_foods',
  'exercise_notes', 'session_notes', 'grocery_items', 'grocery_checkoff',
  'kitchen_stock', 'meal_plans', 'menu_items', 'meals', 'reviews', 'client_status',
  'client_notes', 'client_dossiers', 'client_contacts', 'training_plans', 'programs',
  'bookings', 'consult_requests', 'call_notes', 'coach_notes', 'profiles',
];
const BY_OWNER_CODE = ['meal_components', 'calendar_blocks'];

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'POST only' });

  const URL = process.env.SUPABASE_URL;
  const SERVICE = process.env.SUPABASE_SERVICE_KEY;
  const SECRET = process.env.SUPABASE_JWT_SECRET;
  if (!URL || !SERVICE || !SECRET) {
    console.error('erase: missing env', { URL: !!URL, SERVICE: !!SERVICE, SECRET: !!SECRET });
    return json(503, { error: 'not_configured' });
  }

  const auth = (event.headers && (event.headers.authorization || event.headers.Authorization)) || '';
  const claims = verify(auth.replace(/^Bearer\s+/i, ''), SECRET);
  if (!claims) return json(401, { error: 'no_session' });

  // THE CODE COMES FROM THE TOKEN. Not the body, not a parameter, not a header.
  const code = String(claims.client_code || '').trim();
  if (!code) return json(401, { error: 'no_session' });

  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch (e) { body = {}; }
  // A deliberate second action, so this can never be one stray request. The page
  // asks them to type it; nothing here is destroyed without it.
  if (String(body.confirm || '').trim().toUpperCase() !== 'DELETE') {
    return json(400, { error: 'confirm_required' });
  }

  const H = {
    apikey: SERVICE,
    Authorization: 'Bearer ' + SERVICE,
    'Content-Type': 'application/json',
    Prefer: 'return=minimal',
  };
  const enc = encodeURIComponent;

  const wiped = [];
  const skipped = [];

  async function purge(table, column) {
    try {
      const r = await fetch(`${URL}/rest/v1/${table}?${column}=eq.${enc(code)}`, {
        method: 'DELETE', headers: H,
      });
      if (r.ok) { wiped.push(table); return; }
      const t = await r.text().catch(() => '');
      skipped.push(`${table}:${r.status}`);
      console.warn('erase: ' + table + ' -> ' + r.status + ' ' + t.slice(0, 120));
    } catch (e) {
      skipped.push(`${table}:threw`);
      console.warn('erase: ' + table + ' threw ' + (e && e.message));
    }
  }

  for (const t of BY_CLIENT_CODE) await purge(t, 'client_code');
  for (const t of BY_OWNER_CODE) await purge(t, 'owner_code');

  // THE ACCOUNT ITSELF LAST, so a failure part-way through leaves them able to
  // sign in and ask again rather than stranded with an account and no data.
  let accountGone = false;
  try {
    const r = await fetch(`${URL}/rest/v1/clients?code=eq.${enc(code)}`, { method: 'DELETE', headers: H });
    accountGone = r.ok;
    if (!r.ok) console.warn('erase: clients -> ' + r.status);
  } catch (e) { console.warn('erase: clients threw ' + (e && e.message)); }

  // Storage, both buckets. Listed then removed, because there is no delete-by-prefix.
  for (const bucket of ['progress-photos', 'meal-photos']) {
    try {
      const l = await fetch(`${URL}/storage/v1/object/list/${bucket}`, {
        method: 'POST',
        headers: { apikey: SERVICE, Authorization: 'Bearer ' + SERVICE, 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefix: code + '/', limit: 500 }),
      });
      const files = await l.json().catch(() => []);
      const names = (Array.isArray(files) ? files : []).filter((f) => f && f.name).map((f) => code + '/' + f.name);
      if (names.length) {
        await fetch(`${URL}/storage/v1/object/${bucket}`, {
          method: 'DELETE',
          headers: { apikey: SERVICE, Authorization: 'Bearer ' + SERVICE, 'Content-Type': 'application/json' },
          body: JSON.stringify({ prefixes: names }),
        });
        wiped.push(bucket + ' (' + names.length + ')');
      }
    } catch (e) { skipped.push(bucket + ':threw'); }
  }

  console.log('erase: ' + code + ' wiped ' + wiped.length + ' tables, skipped ' + skipped.length);
  return json(200, { ok: true, code: code, accountGone, wiped, skipped });
};
