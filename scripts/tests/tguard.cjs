// THE GUARDED ROW OPS — mealEdit and mealDelete (ship 7).
//
// WHAT IS BEING GUARDED AND WHY. Measured against the live project on 29 Aug
// with the anon key that ships in the page source: food_logs accepts PATCH and
// DELETE filtered on id ALONE. Proven end to end on a scratch code — one row
// rewritten to "OWNED"/99999 calories, then destroyed, using nothing but the key
// any reader of the page already has. These two ops are the AUTHORISED route
// that has to exist before that grant can be revoked.
//
// A row id on its own NAMES SOMEBODY. The caller supplies it, so the filter must
// carry the client_code too and both must land on the same row. A mismatched
// pair matches zero rows, and zero rows is a REFUSAL — never a silent success,
// and never an act on whichever client the id really belonged to.
//
// THIS SUITE DRIVES THE REAL HANDLER. It require()s trainer.js, mints a real
// signed session, and stands a fake PostgREST behind global.fetch, so every
// assertion below is about what the door DOES. A suite that greps trainer.js for
// the string "client_code" would pass over a door that never sent the filter —
// this codebase has shipped exactly that mistake before, twice in one day.
const path = require('path');
const crypto = require('crypto');

const SECRET = 'test-secret-not-a-real-one';
process.env.SUPABASE_URL = 'https://example.test';
process.env.SUPABASE_SERVICE_KEY = 'service-key-stub';
process.env.SUPABASE_JWT_SECRET = SECRET;

const door = require(path.join(process.cwd(), 'netlify/functions/trainer.js'));

let bad = 0;
const t = (pass, label, extra) => {
  if (!pass) bad++;
  console.log((pass ? '  ok    ' : '  FAIL  ') + label + (extra !== undefined ? ('  ' + extra) : ''));
};

// ---- a real signed session, the same shape session.js issues ---------------
const b64url = (buf) =>
  Buffer.from(buf).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
function sign(payload) {
  const body = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' })) + '.' + b64url(JSON.stringify(payload));
  return body + '.' + b64url(crypto.createHmac('sha256', SECRET).update(body).digest());
}
const exp = Math.floor(Date.now() / 1000) + 3600;
const TRAINER = sign({ client_code: 'thegoat', is_trainer: true, exp: exp });
const CLIENT  = sign({ client_code: 'kellyg1', is_trainer: false, exp: exp });

// ---- the fake PostgREST ----------------------------------------------------
// Holds ONE row and answers a request only when the request's filters actually
// select it — which is the entire point. It parses the real query string rather
// than trusting the door to have built it correctly.
const ROW_ID = '1be9a2a2-18b0-42a7-8cb5-55b2aa328c89';
const OTHER_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
let table, sent, deleteLeavesRowBehind, failNext;

function reset() {
  table = [{ id: ROW_ID, client_code: 'chrism1', name: 'Chicken and rice', calories: 640,
    protein: 52, carbs: 60, fat: 18, rating: 'clean', meal: 'Lunch', eat_time: '1 pm',
    date_str: 'Aug 29, 2026', logged_at: '2026-08-29T17:00:00+00:00' }];
  sent = [];
  deleteLeavesRowBehind = false;
  failNext = null;
}

function parseFilters(url) {
  const qs = url.split('?')[1] || '';
  const f = {};
  qs.split('&').forEach((kv) => {
    const i = kv.indexOf('=');
    if (i < 0) return;
    const k = decodeURIComponent(kv.slice(0, i));
    const v = kv.slice(i + 1);
    if (v.startsWith('eq.')) f[k] = decodeURIComponent(v.slice(3));
  });
  return f;
}

global.fetch = async (url, opts) => {
  opts = opts || {};
  const method = opts.method || 'GET';
  const f = parseFilters(String(url));
  const body = opts.body ? JSON.parse(opts.body) : null;
  sent.push({ url: String(url), method: method, filters: f, body: body,
    prefer: (opts.headers && opts.headers.Prefer) || '' });

  if (failNext) { const r = failNext; failNext = null;
    return { ok: false, status: r.status, text: async () => r.text }; }

  // Only rows matching EVERY eq. filter are selected. A door that forgot the
  // client_code filter therefore matches the row it should not have.
  const match = table.filter((r) => Object.keys(f).every((k) => String(r[k]) === String(f[k])));

  if (method === 'PATCH') {
    match.forEach((r) => Object.assign(r, body || {}));
    return { ok: true, status: 200, text: async () => JSON.stringify(match) };
  }
  if (method === 'DELETE') {
    const removed = match.slice();
    if (!deleteLeavesRowBehind) table = table.filter((r) => match.indexOf(r) < 0);
    return { ok: true, status: 200, text: async () => JSON.stringify(removed) };
  }
  return { ok: true, status: 200, text: async () => JSON.stringify(match) };
};

const call = (op, args, token) => door.handler({
  httpMethod: 'POST',
  headers: { authorization: 'Bearer ' + (token === undefined ? TRAINER : token) },
  body: JSON.stringify({ op: op, args: args }),
});
const parse = (res) => ({ status: res.statusCode, body: JSON.parse(res.body) });

(async function () {
  let r;

  console.log('\n  THE REFUSAL — a row id that is not this client\'s:');
  reset();
  r = parse(await call('mealEdit', { client_code: 'kellyg1', id: ROW_ID, calories: 1 }));
  t(r.status === 404, 'a mismatched pair is refused, not obeyed', r.status);
  t(r.body.error === 'not_yours_or_missing', 'and says which refusal it is', r.body.error);
  t(table[0].calories === 640, 'the real owner\'s row is untouched', table[0].calories);
  t(table[0].name === 'Chicken and rice', 'including the fields it did not name', table[0].name);

  reset();
  r = parse(await call('mealDelete', { client_code: 'kellyg1', id: ROW_ID }));
  t(r.status === 404, 'the same for a delete', r.status);
  t(table.length === 1, 'and the row still exists', table.length);

  console.log('\n  THE FILTER CARRIES BOTH FIELDS, on the wire:');
  reset();
  await call('mealEdit', { client_code: 'chrism1', id: ROW_ID, calories: 700 });
  t(sent.length > 0 && sent[0].filters.id === ROW_ID, 'the id reaches the query');
  t(sent.length > 0 && sent[0].filters.client_code === 'chrism1',
    'and so does the client_code — this is the guard itself');
  reset();
  await call('mealDelete', { client_code: 'chrism1', id: ROW_ID });
  t(sent[0].filters.id === ROW_ID && sent[0].filters.client_code === 'chrism1',
    'both on the delete too');
  t(/return=representation/.test(sent[0].prefer), 'and it asks for the row back');

  console.log('\n  THE MATCHING PAIR WORKS, and is read back:');
  reset();
  r = parse(await call('mealEdit', { client_code: 'chrism1', id: ROW_ID, calories: 700, name: 'Chicken and rice, bigger' }));
  t(r.status === 200, 'the right pair is allowed', r.status);
  t(table[0].calories === 700, 'the row actually changed', table[0].calories);
  t(r.body[0].confirmed_by_read_back === true, 'and the answer says it was read back');
  t(String(r.body[0].changed.sort()) === 'calories,name', 'naming exactly what it changed', r.body[0].changed);
  t(table[0].protein === 52, 'fields not named are left alone', table[0].protein);

  reset();
  r = parse(await call('mealDelete', { client_code: 'chrism1', id: ROW_ID }));
  t(r.status === 200, 'the delete is allowed', r.status);
  t(table.length === 0, 'and the row is gone', table.length);
  t(r.body[0].name === 'Chicken and rice', 'the answer NAMES the meal it destroyed', r.body[0].name);
  t(sent.filter((s) => s.method === 'GET').length === 1,
    'a second independent read confirms the absence', sent.filter((s) => s.method === 'GET').length);

  console.log('\n  A DELETE THAT DID NOT DELETE IS NOT REPORTED AS ONE:');
  reset();
  deleteLeavesRowBehind = true;   // PostgREST hands back a representation, row survives
  r = parse(await call('mealDelete', { client_code: 'chrism1', id: ROW_ID }));
  t(r.status === 502, 'a surviving row makes it unconfirmed, not a success', r.status);
  t(r.body.error === 'unconfirmed' && r.body.still_there === true, 'and says so plainly', r.body.error);

  console.log('\n  AN EMPTY EDIT IS NOT A WRITE:');
  reset();
  r = parse(await call('mealEdit', { client_code: 'chrism1', id: ROW_ID }));
  t(r.status === 400 && r.body.error === 'nothing_to_change',
    'naming no field is refused', r.status + ' ' + r.body.error);
  t(sent.length === 0, 'and nothing reached the database at all', sent.length);

  console.log('\n  client_code AND id ARE NOT EDITABLE FIELDS:');
  reset();
  r = parse(await call('mealEdit', { client_code: 'chrism1', id: ROW_ID, calories: 700,
    /* the re-owning attempt: */ }));
  t(sent[0].body.client_code === undefined, 'an edit never writes client_code');
  t(sent[0].body.id === undefined, 'nor id');
  reset();
  // Even when the caller explicitly asks for it under the same key the filter uses.
  await door.handler({ httpMethod: 'POST', headers: { authorization: 'Bearer ' + TRAINER },
    body: JSON.stringify({ op: 'mealEdit', args: { client_code: 'chrism1', id: ROW_ID, calories: 700 } }) });
  t(Object.keys(sent[0].body).join(',') === 'calories',
    'the body carries only the named meal fields', Object.keys(sent[0].body).join(','));
  t(table[0].client_code === 'chrism1', 'so a row cannot be re-owned through an edit');

  console.log('\n  THE READ-BACK IS COMPARED, not assumed:');
  reset();
  // A database that accepts the write and stores something else.
  const realFetch = global.fetch;
  global.fetch = async (url, opts) => {
    const res = await realFetch(url, opts);
    if ((opts && opts.method) === 'PATCH') {
      return { ok: true, status: 200, text: async () => JSON.stringify([Object.assign({}, table[0], { calories: 3 })]) };
    }
    return res;
  };
  r = parse(await call('mealEdit', { client_code: 'chrism1', id: ROW_ID, calories: 700 }));
  t(r.status === 502 && r.body.error === 'unconfirmed',
    'a value that came back different is unconfirmed', r.status + ' ' + r.body.error);
  t(String(r.body.fields) === 'calories', 'and it names the field that did not land', r.body.fields);
  global.fetch = realFetch;

  console.log('\n  THE GATES ABOVE IT:');
  reset();
  r = parse(await call('mealDelete', { client_code: 'chrism1', id: ROW_ID }, CLIENT));
  t(r.status === 403 && r.body.error === 'not_a_trainer', 'a client session cannot reach it', r.status);
  t(table.length === 1, 'and nothing happened', table.length);
  reset();
  r = parse(await call('mealDelete', { client_code: 'chrism1', id: ROW_ID }, 'not-a-token'));
  t(r.status === 401, 'an unsigned token cannot reach it', r.status);
  t(table.length === 1, 'and nothing happened', table.length);

  console.log('\n  ARGUMENT VALIDATION:');
  reset();
  r = parse(await call('mealDelete', { client_code: 'chrism1', id: '123' }));
  t(r.status === 400 && r.body.error === 'bad_arg', 'an integer id is refused — this table keys on a uuid', r.status);
  t(sent.length === 0, 'before anything is sent', sent.length);
  reset();
  r = parse(await call('mealDelete', { client_code: 'chrism1', id: ROW_ID + "&or=(id.not.is.null)" }));
  t(r.status === 400, 'an id carrying PostgREST syntax is refused', r.status);
  reset();
  r = parse(await call('mealEdit', { client_code: 'not a code!', id: ROW_ID, calories: 1 }));
  t(r.status === 400, 'a malformed client_code is refused', r.status);
  reset();
  r = parse(await call('mealEdit', { client_code: 'chrism1', id: ROW_ID, calories: 'lots' }));
  t(r.status === 400 && r.body.error === 'bad_arg', 'a non-numeric calorie count is refused', r.status);
  t(sent.length === 0, 'before anything is sent', sent.length);

  console.log('\n  A ROW THAT IS SIMPLY GONE:');
  reset();
  r = parse(await call('mealEdit', { client_code: 'chrism1', id: OTHER_ID, calories: 1 }));
  t(r.status === 404 && r.body.error === 'not_yours_or_missing',
    'reads the same as a wrong pair — nothing was changed either way', r.status);

  console.log('\n  A SICK DATABASE IS NOT A SUCCESS:');
  reset();
  failNext = { status: 500, text: 'boom' };
  r = parse(await call('mealDelete', { client_code: 'chrism1', id: ROW_ID }));
  t(r.status === 502 && r.body.error === 'write_failed', 'a failing write says write_failed', r.status);
  t(table.length === 1, 'and the row is still there', table.length);

  console.log('\n  EVERY ROUTE TO A CLIENT\'S MEAL GOES THROUGH THE DOOR:');
  const fs = require('fs');
  const app = fs.readFileSync('index.html', 'utf8');
  // The point of the guard is that nothing goes round it. There are exactly
  // three routes by which this app touches a meal belonging to somebody other
  // than the signed-in person, and all three are here:
  //   1. _jvClientMealMove  - "move Chris's breakfast to yesterday" (ship 8)
  //   2. applyFoodEdit      - Jim's [FOOD_EDIT] while running for a named client
  //   3. applyFoodDelete    - Jim's [FOOD_DELETE], and the undo that takes it back
  const edits = (app.match(/trainerWrite\('mealEdit'/g) || []).length;
  const dels  = (app.match(/trainerWrite\('mealDelete'/g) || []).length;
  t(edits === 2, 'two callers of mealEdit: the meal move and applyFoodEdit', String(edits));
  t(dels === 1, 'one caller of mealDelete: applyFoodDelete', String(dels));
  t(!/['"]mealEdit['"]/.test(app.replace(/trainerWrite\('mealEdit'/g, '')),
    'and the ops are named nowhere else in the app');
  t(!/['"]mealDelete['"]/.test(app.replace(/trainerWrite\('mealDelete'/g, '')), 'neither of them');

  // THE DOOR BRANCH MUST COME FIRST. If the public-key fetch ran before the
  // forCode check, the guard would be decoration - the row would already be
  // written by the time anybody asked whose it was.
  const edFn = app.slice(app.indexOf('async function applyFoodEdit(id, fields, forCode){'),
                         app.indexOf('async function applyFoodDelete('));
  t(edFn.length > 500, 'applyFoodEdit is findable and takes forCode', String(edFn.length));
  t(edFn.indexOf("trainerWrite('mealEdit'") < edFn.indexOf("method:'PATCH'"),
    'its door branch runs BEFORE the public-key patch');
  t(/return true;/.test(edFn.slice(edFn.indexOf("trainerWrite('mealEdit'"), edFn.indexOf("method:'PATCH'"))),
    'and returns without ever reaching it');
  const delFn = app.slice(app.indexOf('async function applyFoodDelete(id, forCode){'),
                          app.indexOf('async function applyFoodDelete(id, forCode){') + 1600);
  t(delFn.indexOf("trainerWrite('mealDelete'") < delFn.indexOf("method:'DELETE'"),
    'and the delete door branch runs before its public-key delete');

  // WHOSE ROW IT WAS has to survive as far as the undo, or the undo reaches
  // across accounts with the public key exactly as it used to.
  t(/_jimWrote\.push\(\{table:'food_logs', id:_ins\.id, label:r\.name, code:_code\}\)/.test(app),
    'a logged row records WHOSE it was, not just which');

  console.log('');
  if (bad) { console.log('  ' + bad + ' FAILED'); process.exit(1); }
  console.log('  all pass');
})();
