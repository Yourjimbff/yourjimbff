// The trainer's door.
//
// The cockpit reads things no client may ever read — private notes, payments, the whole
// roster. Today it asks for them with the same public key that ships in the page, which
// is why the database cannot be locked without blinding Yusuf at the same moment. This
// is the legitimate path: the private key lives here, the page never holds it, and every
// answer is checked against a session that says is_trainer.
//
// NAMED OPERATIONS ONLY. There is deliberately no "give me table X where Y" operation.
// A passthrough would be the same hole with extra steps — anyone who got a trainer
// session could read anything, and the ops list is the whole point of the door.
//
// REQUIRED ENVIRONMENT (Netlify → Site settings → Environment variables):
//   SUPABASE_URL           https://frxptalfyutukmnsvysg.supabase.co
//   SUPABASE_SERVICE_KEY   the service_role key — already set for stripe-hook
//   SUPABASE_JWT_SECRET    same secret session.js signs with

const { verify } = require('./session.js');

const json = (code, obj) => ({
  statusCode: code,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  body: JSON.stringify(obj),
});

// Every operation is a fixed query. `args` may only ever reach a value, never a table
// name, never a column list, never a filter expression.
//
// Each shape below is matched to a LIVE caller in index.html — not invented. Where the
// original call filtered narrower (by coach_code, or by today's date_str) than what's
// practical to name as a fresh server-side operation, the op returns the same broad set
// the original effectively covered for a single-trainer app, and the caller filters
// client-side exactly as it already did against its in-memory cache. Nothing here
// widens what a caller could already see; it only moves the same read behind a checked
// session instead of the bare public key.
const OPS = {
  // The roster, with the fields the cockpit lists people by. Not yet called from
  // anywhere — banked for the roster-read pass this door was also built for.
  roster: () => 'clients?select=code,name,initials,active,coach_code,is_trainer,tier,term_months,paid,started_at,term_ends&order=code.asc&limit=500',

  // One client, deeply. The only place `code` is interpolated, and it is encoded.
  // Not yet called from anywhere — banked, same as roster.
  clientProfile: (a) => `profiles?client_code=eq.${enc(a.code)}&limit=1`,
  clientNotes:   (a) => `client_notes?client_code=eq.${enc(a.code)}&select=id,note,logged_at,shared_at,shared_note&order=logged_at.desc&limit=300`,
  clientPlan:    (a) => `training_plans?client_code=eq.${enc(a.code)}&limit=1`,
  // Kept distinct from `contacts` below: this is "one client's contact timeline",
  // reached from a client deep-dive. `contacts` is "sync the whole log", reached from
  // the triage board. Different UI, different caller, both real.
  clientContacts:(a) => `client_contacts?client_code=eq.${enc(a.code)}&order=logged_at.desc&limit=200`,

  // Money. NO LIMIT, on purpose. loadSales()'s own comment: "The old query capped at
  // 200, so past that the headline quietly under-reported." Capping this at any number
  // reintroduces exactly that failure mode the moment sales passes it, with nothing
  // to say so — sbInsert/sbSelect-style silence is the whole reason that bug shipped
  // once already.
  sales: () => 'sales?select=id,client_code,client_name,program,total_amount,paid_amount,sale_date,due_date,created_at&order=sale_date.desc',

  // jvSyncContacts() (line ~13840): coach_code=eq.<trainer> — with one coach in the
  // whole system that's every row, so this returns everyone and the caller keys its own
  // map off client_code exactly as before.
  contacts: () => 'client_contacts?select=client_code,coach_code,kind,about,replied,contacted_at&order=contacted_at.desc&limit=2000',

  // Board state. Limits match the original call sites exactly so nothing that used to
  // fit now silently truncates.
  handled:       () => 'jv_handled?limit=3000',
  engineMoments: () => 'engine_moments?select=client_code,coach_code,date_str,state,note,logged_at&order=logged_at.desc&limit=500',
  coachMoments:  () => 'coach_moments?order=id.desc&limit=200',
  coachReposts:  () => 'coach_reposts?order=id.desc&limit=1000',
  // With a code: loadCoachNote's trainer-branch read and _cnFetchBoth's private-notes
  // merge, both of which need `id` (deleteCoachNote keys off it) and `date_str` (the
  // banner is TODAY ONLY). Without one: _jvExportGather's roster-wide export, which
  // never needed id and filters the returned rows down to its own code list itself.
  coachNotes: (a) => a && a.code
      ? `coach_notes?client_code=eq.${enc(a.code)}&select=id,client_code,note,sent_at,date_str&order=sent_at.desc&limit=300`
      : 'coach_notes?select=client_code,note,sent_at&order=sent_at.desc&limit=1500',
};

function enc(v) {
  const s = String(v == null ? '' : v);
  // Client codes are a known shape; refuse anything that could carry PostgREST syntax.
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(s)) throw new Error('bad_arg');
  return encodeURIComponent(s);
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'POST only' });

  const URL = process.env.SUPABASE_URL;
  const SERVICE = process.env.SUPABASE_SERVICE_KEY;
  const SECRET = process.env.SUPABASE_JWT_SECRET;
  if (!URL || !SERVICE || !SECRET) {
    console.error('trainer: missing env');
    return json(503, { error: 'not_configured' });
  }

  // The session must be one WE signed. A claim in an unsigned token is just a wish.
  const auth = (event.headers && (event.headers.authorization || event.headers.Authorization)) || '';
  const claims = verify(auth.replace(/^Bearer\s+/i, ''), SECRET);
  if (!claims) return json(401, { error: 'no_session' });
  if (claims.is_trainer !== true) {
    // A real client's session reaching this door is worth knowing about.
    console.warn('trainer: non-trainer session attempted', claims.client_code);
    return json(403, { error: 'not_a_trainer' });
  }

  let op = '', args = {};
  try { const b = JSON.parse(event.body || '{}'); op = String(b.op || ''); args = b.args || {}; }
  catch (e) { return json(400, { error: 'bad_request' }); }

  const build = Object.prototype.hasOwnProperty.call(OPS, op) ? OPS[op] : null;
  if (!build) return json(400, { error: 'unknown_op', op: op });

  let path;
  try { path = build(args); }
  catch (e) { return json(400, { error: 'bad_arg' }); }

  try {
    const r = await fetch(`${URL}/rest/v1/${path}`, {
      headers: { apikey: SERVICE, Authorization: 'Bearer ' + SERVICE },
    });
    const text = await r.text();
    if (!r.ok) {
      // The database's own words stay here. The cockpit gets a status, not a stack.
      console.error('trainer: query failed', op, r.status, text.slice(0, 300));
      return json(502, { error: 'query_failed', op: op });
    }
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: text,
    };
  } catch (e) {
    console.error('trainer: threw', op, e && e.message);
    return json(502, { error: 'query_failed', op: op });
  }
};

exports.OPS = OPS;
