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

// ---- WRITES ---------------------------------------------------------------
// Same discipline as OPS: named operations only, args reach a VALUE never a column
// name or table name. Two things writes need that reads didn't:
//
// 1. coach_code is never taken from args. It comes from the verified session's own
//    client_code claim, passed in as `trainerCode` below — a session already proved
//    who is asking, so asking again in the request body would just be trusting the
//    client to tell the truth about its own identity.
// 2. Every write carries `Prefer: return=representation`, so the response body IS the
//    row PostgREST actually landed — a genuine read-back, not a trusted status code.
//    This codebase's own standing rule: "a 2xx is not evidence the row is there."
//
// Each build function returns {method, path, body}. `body` is a plain object — never
// a client-supplied string — assembled here field by field, with real validation
// (types, lengths, ranges) on every value, not just URL-safety.
function str(v, max) { const s = String(v == null ? '' : v).trim(); return s.slice(0, max || 500); }
function num(v) { const n = Number(v); if (!isFinite(n)) throw new Error('bad_arg'); return n; }
function isoDate(v) {
  const s = String(v || '');
  if (!/^\d{4}-\d{2}-\d{2}/.test(s)) throw new Error('bad_arg');
  return s.slice(0, 10);
}
function isoTs(v) {
  const s = String(v || '');
  const d = new Date(s);
  if (isNaN(d.getTime())) throw new Error('bad_arg');
  return d.toISOString();
}

const WRITE_OPS = {
  // ---- sales (money) --------------------------------------------------------
  salesInsert: (a, coach) => ({
    method: 'POST', path: 'sales',
    body: {
      client_code: a.client_code != null ? enc_raw(a.client_code) : undefined,
      client_name: str(a.client_name, 200),
      program: str(a.program, 200),
      total_amount: num(a.total_amount),
      paid_amount: num(a.paid_amount),
      sale_date: isoDate(a.sale_date),
      due_date: a.due_date ? isoDate(a.due_date) : undefined,
      created_at: isoTs(a.created_at || new Date().toISOString()),
    },
  }),
  salesUpdate: (a) => ({
    method: 'PATCH', path: `sales?id=eq.${encId(a.id)}`,
    body: {
      client_name: str(a.client_name, 200),
      program: str(a.program, 200),
      total_amount: num(a.total_amount),
      paid_amount: num(a.paid_amount),
      sale_date: isoDate(a.sale_date),
      due_date: a.due_date ? isoDate(a.due_date) : undefined,
      client_code: a.client_code != null ? enc_raw(a.client_code) : undefined,
    },
  }),
  salesDelete: (a) => ({ method: 'DELETE', path: `sales?id=eq.${encId(a.id)}` }),

  // ---- client_contacts --------------------------------------------------------
  contactInsert: (a, coach) => ({
    method: 'POST', path: 'client_contacts',
    body: { coach_code: coach, client_code: enc_raw(a.client_code), kind: str(a.kind, 40),
      about: str(a.about, 300), replied: !!a.replied, contacted_at: isoTs(a.contacted_at) },
  }),
  contactUpdate: (a, coach) => ({
    method: 'PATCH',
    path: `client_contacts?coach_code=eq.${enc(coach)}&client_code=eq.${enc(a.client_code)}&contacted_at=eq.${encodeURIComponent(isoTs(a.contacted_at))}`,
    body: { about: str(a.about, 300) },
  }),
  contactDelete: (a, coach) => ({
    method: 'DELETE',
    path: `client_contacts?coach_code=eq.${enc(coach)}&client_code=eq.${enc(a.client_code)}&contacted_at=eq.${encodeURIComponent(isoTs(a.contacted_at))}`,
  }),

  // ---- jv_handled (board state) ------------------------------------------------
  handledMark: (a, coach) => ({
    method: 'POST', path: 'jv_handled?on_conflict=coach_code,client_code,date_str',
    body: { coach_code: coach, client_code: enc_raw(a.client_code), date_str: str(a.date_str, 40) },
    upsert: true,
  }),
  handledUnmark: (a, coach) => ({
    method: 'DELETE',
    path: `jv_handled?coach_code=eq.${enc(coach)}&client_code=eq.${enc(a.client_code)}&date_str=eq.${encodeURIComponent(str(a.date_str, 40))}`,
  }),

  // ---- engine_moments (board state) --------------------------------------------
  engineSave: (a, coach) => ({
    method: 'POST', path: 'engine_moments',
    body: { coach_code: coach, client_code: enc_raw(a.client_code), date_str: str(a.date_str, 40),
      state: str(a.state, 40), note: a.note ? str(a.note, 500) : null, logged_at: isoTs(a.logged_at) },
    upsert: true,
  }),
  engineClear: (a, coach) => ({
    method: 'DELETE',
    path: `engine_moments?coach_code=eq.${enc(coach)}&client_code=eq.${enc(a.client_code)}&date_str=eq.${encodeURIComponent(str(a.date_str, 40))}`,
  }),

  // ---- coach_moments (feed) -----------------------------------------------------
  momentPost: (a, coach) => ({ method: 'POST', path: 'coach_moments', body: { coach_code: coach, text: str(a.text, 2000) } }),
  momentDelete: (a) => ({ method: 'DELETE', path: `coach_moments?id=eq.${encId(a.id)}` }),

  // ---- coach_reposts (feed) ------------------------------------------------------
  // A wide, mostly-denormalized snapshot row. Every field is still typed and capped —
  // "the client supplies values, never keys" holds here exactly as everywhere else.
  repostInsert: (a, coach) => ({
    method: 'POST', path: 'coach_reposts',
    body: {
      food_id: str(a.food_id, 100), client_code: enc_raw(a.client_code), client_first: str(a.client_first, 100),
      coach_code: coach, reposted_at: isoTs(a.reposted_at || new Date().toISOString()),
      client_logged_at: a.client_logged_at ? isoTs(a.client_logged_at) : undefined,
      client_eat_time: a.client_eat_time ? str(a.client_eat_time, 40) : undefined,
      name: str(a.name, 200) || 'Meal', emoji: str(a.emoji, 20) || '🍽️',
      photo: a.photo ? str(a.photo, 2000) : null,
      calories: a.calories != null ? Math.round(num(a.calories)) : null,
      protein: a.protein != null ? Math.round(num(a.protein)) : null,
      carbs: a.carbs != null ? Math.round(num(a.carbs)) : null,
      fat: a.fat != null ? Math.round(num(a.fat)) : null,
      rating: a.rating ? str(a.rating, 40) : null,
    },
  }),

  // ---- coach_notes (private, TODAY'S banner + roster notes) ----------------------
  noteSend: (a) => ({
    method: 'POST', path: 'coach_notes',
    body: { client_code: enc_raw(a.client_code), note: str(a.note, 4000), date_str: str(a.date_str, 40), time_str: str(a.time_str, 20) },
  }),
  noteDelete: (a) => ({ method: 'DELETE', path: `coach_notes?id=eq.${encId(a.id)}` }),
};

// A client_code carried in a WRITE BODY (not a URL filter) still gets the same shape
// check as enc() — refusing it here is cheaper than discovering a malformed row later.
function enc_raw(v) {
  const s = String(v == null ? '' : v);
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(s)) throw new Error('bad_arg');
  return s;
}
function encId(v) {
  const s = String(v == null ? '' : v);
  if (!/^\d+$/.test(s)) throw new Error('bad_arg');
  return s;
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

  // READ. Unchanged from before writes existed.
  if (Object.prototype.hasOwnProperty.call(OPS, op)) {
    let path;
    try { path = OPS[op](args); }
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
      return { statusCode: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: text };
    } catch (e) {
      console.error('trainer: threw', op, e && e.message);
      return json(502, { error: 'query_failed', op: op });
    }
  }

  // WRITE. coach_code is the session's OWN verified claim, never anything from args —
  // a session already proved who's asking. return=representation makes the response
  // body the row PostgREST actually landed (or, on a DELETE, the row(s) actually
  // removed — an empty array there means nothing matched, not an error).
  if (Object.prototype.hasOwnProperty.call(WRITE_OPS, op)) {
    let req;
    try { req = WRITE_OPS[op](args, claims.client_code); }
    catch (e) { return json(400, { error: 'bad_arg' }); }
    try {
      const headers = { apikey: SERVICE, Authorization: 'Bearer ' + SERVICE, 'Content-Type': 'application/json',
        Prefer: 'return=representation' + (req.upsert ? ',resolution=merge-duplicates' : '') };
      const fetchOpts = { method: req.method, headers };
      if (req.body) {
        // undefined-valued keys are dropped by JSON.stringify — the column is simply
        // absent from the write, exactly like the client-side sales fallback this
        // mirrors (drop a not-yet-migrated column and retry with what's left).
        fetchOpts.body = JSON.stringify(req.body);
      }
      const r = await fetch(`${URL}/rest/v1/${req.path}`, fetchOpts);
      const text = await r.text();
      if (!r.ok) {
        console.error('trainer: write failed', op, r.status, text.slice(0, 300));
        return json(502, { error: 'write_failed', op: op, detail: text.slice(0, 200) });
      }
      return { statusCode: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: text || '[]' };
    } catch (e) {
      console.error('trainer: write threw', op, e && e.message);
      return json(502, { error: 'write_failed', op: op });
    }
  }

  return json(400, { error: 'unknown_op', op: op });
};

exports.OPS = OPS;
exports.WRITE_OPS = WRITE_OPS;
