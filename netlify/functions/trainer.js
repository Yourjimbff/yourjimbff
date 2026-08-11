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
  // The roster, with every field a trainer surface reads about a client — the full
  // set loadRosterFromDB used to pull with the public key, now behind the door
  // instead so those columns can go dark to anon. limit matches what the anon
  // call used (2000), not the old banked 500 — nothing that used to fit should
  // now silently truncate.
  roster: () => 'clients?select=code,name,initials,phone,email,active,coach_code,is_trainer,is_primary,hidden,tier,term_months,paid,started_at,term_ends,created_at,calls_enabled,call_credits&order=code.asc&limit=2000',

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

  // Consult booking mailbox off the offer page. Strangers INSERT with the public
  // key (write-only — no anon SELECT exists on this table); every row lands
  // already 'accepted' — there's no review step, only Yusuf's cancel lever.
  // status.asc puts 'accepted' before 'cancelled' for free (alphabetical), then
  // requested_at.asc sorts by the proposed slot itself so the soonest upcoming
  // call leads, not whichever was submitted most recently.
  consultList: () => 'consult_requests?select=id,name,phone,age,height,weight,goal,main_problem,why_reaching_out,willing_to_invest,serious,excited_or_nervous,requested_at,status,created_at&order=status.asc,requested_at.asc&limit=500',

  // ---- vip_calls (recurring trainer-set call blocks) -----------------------------
  // For Admin's calendar view. Trainer-only read, same as every other OPS entry —
  // a client's own read goes through myVipCalls below instead, never this.
  vipCallList: () => 'vip_calls?select=id,client_code,weekdays,time_local,tz,duration_minutes,start_date,end_date,notes,active,created_at&order=start_date.desc&limit=500',
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
// Every request lands already 'accepted' at insert — there's no review step.
// This op is Yusuf's cancel lever and nothing else, so 'cancelled' is the only
// value it will ever write.
function consultStatus(v) {
  const s = String(v || '');
  if (s !== 'cancelled') throw new Error('bad_arg');
  return s;
}
function clientTier(v) {
  const s = String(v || '');
  if (s !== 'vip' && s !== '1on1') throw new Error('bad_arg');
  return s;
}
// A cleared money/contact field is a real state (no fee set, no phone on file),
// not the same as never sending the key at all -- that's why this returns null
// instead of throwing on empty, where num()/str() would refuse it outright.
function nullableNum(v) {
  if (v == null || v === '') return null;
  return num(v);
}
function nullableStr(v, max) {
  if (v == null || v === '') return null;
  return str(v, max);
}
// ---- vip_calls validators ---------------------------------------------------
function weekdaysArr(v) {
  if (!Array.isArray(v) || !v.length) throw new Error('bad_arg');
  const out = v.map((x) => {
    const n = Number(x);
    if (!Number.isInteger(n) || n < 1 || n > 7) throw new Error('bad_arg');
    return n;
  });
  return Array.from(new Set(out)).sort((a, b) => a - b);
}
function timeLocal(v) {
  const s = String(v || '');
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(s)) throw new Error('bad_arg');
  return s;
}
function tzName(v) {
  const s = String(v || '');
  if (!/^[A-Za-z_]+(\/[A-Za-z_]+)+$/.test(s)) throw new Error('bad_arg');
  return s;
}
function posInt(v, max) {
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0 || n > max) throw new Error('bad_arg');
  return n;
}
function dateRange(startV, endV) {
  const start = isoDate(startV), end = isoDate(endV);
  if (end < start) throw new Error('bad_arg');
  return { start, end };
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
  // The standing delete guard (jvRemoveClient) used to reach every client-keyed table
  // with the public key directly. Locking this table to the door took that road away
  // and left nothing to replace it — every future client deletion would silently
  // orphan rows here. One named op, scoped only to a client_code value, same
  // discipline as everything else: never a raw table+filter from outside.
  contactDeleteAll: (a) => ({ method: 'DELETE', path: `client_contacts?client_code=eq.${enc(a.client_code)}` }),

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
  // Same delete-guard gap as client_contacts above.
  handledDeleteAll: (a) => ({ method: 'DELETE', path: `jv_handled?client_code=eq.${enc(a.client_code)}` }),

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
  // Same delete-guard gap as client_contacts above.
  engineDeleteAll: (a) => ({ method: 'DELETE', path: `engine_moments?client_code=eq.${enc(a.client_code)}` }),

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
  // Once the lock is on, this door is the only road left to this table — a table
  // with no reverse gear on the only road in is permanent-mistake territory.
  repostDelete: (a) => ({ method: 'DELETE', path: `coach_reposts?id=eq.${encId(a.id)}` }),
  // Same delete-guard gap as client_contacts above.
  repostDeleteAll: (a) => ({ method: 'DELETE', path: `coach_reposts?client_code=eq.${enc(a.client_code)}` }),

  // ---- coach_notes (private, TODAY'S banner + roster notes) ----------------------
  noteSend: (a) => ({
    method: 'POST', path: 'coach_notes',
    body: { client_code: enc_raw(a.client_code), note: str(a.note, 4000), date_str: str(a.date_str, 40), time_str: str(a.time_str, 20) },
  }),
  noteDelete: (a) => ({ method: 'DELETE', path: `coach_notes?id=eq.${encNoteId(a.id)}` }),
  // Same delete-guard gap as client_contacts above.
  noteDeleteAll: (a) => ({ method: 'DELETE', path: `coach_notes?client_code=eq.${enc(a.client_code)}` }),

  // ---- consult_requests (offer-page booking mailbox) ----------------------------
  // No consultInsert here on purpose: strangers write this table with the public
  // key directly (it's INSERT-only for anon, nothing else), before any session
  // exists to sign them into. Booking is auto-accept, no review step — this op
  // is Yusuf's cancel lever and the only write this door makes to the table.
  consultSetStatus: (a) => ({
    method: 'PATCH', path: `consult_requests?id=eq.${encId(a.id)}`,
    body: { status: consultStatus(a.status) },
  }),

  // ---- clients (trainer-only fields) ---------------------------------------------
  // One flexible op, not nine narrow ones — every trainer-authored field on a
  // client's own row (money, contact info, term dates, tier, call access) lands
  // through here, each key still individually whitelisted and typed, never a
  // raw passthrough of whatever the caller names. Replaces the roster's "paid"
  // box, the phone edit on a client's card, the contract strip, and all three
  // Call access controls (toggle, grant a credit, change tier) — those last
  // three used to write with the public key via a shared client-side helper;
  // this is that helper's new floor.
  clientPatch: (a) => {
    const body = {};
    if (a.paid !== undefined) body.paid = nullableNum(a.paid);
    if (a.active !== undefined) body.active = !!a.active;
    if (a.phone !== undefined) body.phone = nullableStr(a.phone, 40);
    if (a.email !== undefined) body.email = nullableStr(a.email, 200);
    if (a.tier !== undefined) body.tier = clientTier(a.tier);
    if (a.term_months !== undefined) body.term_months = num(a.term_months);
    if (a.started_at !== undefined) body.started_at = isoDate(a.started_at);
    if (a.term_ends !== undefined) body.term_ends = isoDate(a.term_ends);
    if (a.calls_enabled !== undefined) body.calls_enabled = !!a.calls_enabled;
    if (a.call_credits !== undefined) body.call_credits = num(a.call_credits);
    if (!Object.keys(body).length) throw new Error('bad_arg');
    return { method: 'PATCH', path: `clients?code=eq.${enc(a.code)}`, body: body };
  },
  // Kept separate from clientPatch on purpose — this is the ONE SWITCH, the only
  // place clients.hidden is ever written from the app, same as it's always been.
  clientUnhide: (a) => ({ method: 'PATCH', path: `clients?code=eq.${enc(a.code)}`, body: { hidden: false } }),
  // New client creation. coach_code is the session's own claim, same as every
  // other insert behind this door — never trusted from args.
  clientInsert: (a, coach) => ({
    method: 'POST', path: 'clients',
    body: {
      code: enc_raw(a.code), name: str(a.name, 200), initials: str(a.initials, 4),
      coach_code: coach, is_trainer: false, active: true,
      tier: clientTier(a.tier), term_months: num(a.term_months),
      paid: a.paid != null ? nullableNum(a.paid) : undefined,
      started_at: isoDate(a.started_at),
      calls_enabled: a.calls_enabled != null ? !!a.calls_enabled : undefined,
      call_credits: a.call_credits != null ? num(a.call_credits) : undefined,
    },
  }),
  // The account row itself — the standing delete guard's last step, same as it's
  // always been, just no longer with the public key.
  clientDelete: (a) => ({ method: 'DELETE', path: `clients?code=eq.${enc(a.code)}` }),

  // ---- vip_calls (recurring trainer-set call blocks) -----------------------------
  vipCallCreate: (a) => {
    const dr = dateRange(a.start_date, a.end_date);
    return {
      method: 'POST', path: 'vip_calls',
      body: {
        client_code: enc_raw(a.client_code),
        weekdays: weekdaysArr(a.weekdays),
        time_local: timeLocal(a.time_local),
        tz: tzName(a.tz || 'America/New_York'),
        duration_minutes: posInt(a.duration_minutes, 240),
        start_date: dr.start,
        end_date: dr.end,
        notes: a.notes != null ? nullableStr(a.notes, 1000) : null,
      },
    };
  },
  // Soft on/off, not delete — pausing a block never loses its history, same
  // shape as clients.active/hidden elsewhere in this door.
  vipCallSetActive: (a) => ({
    method: 'PATCH', path: `vip_calls?id=eq.${encId(a.id)}`,
    body: { active: !!a.active },
  }),
  // Same delete-guard gap every other client-keyed table behind this door has —
  // vip_calls joins JV_CLIENT_TABLES precisely so this gets called.
  vipCallDeleteAll: (a) => ({ method: 'DELETE', path: `vip_calls?client_code=eq.${enc(a.client_code)}` }),
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
// coach_notes rows key on a UUID, not the integer id every other write-target here
// uses — encId's digit-only check rejected every real row, so noteDelete could
// never actually delete anything. Same shape check, widened to accept either.
function encNoteId(v) {
  const s = String(v == null ? '' : v);
  if (/^\d+$/.test(s)) return s;
  if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(s)) return s;
  throw new Error('bad_arg');
}

// CLIENT-SESSION-GATED — the one exception to "trainer only" anywhere in this
// door. A real client spending their OWN call credit when they book a call
// with one. Any valid session qualifies, is_trainer is never checked here —
// but the account acted on is ALWAYS the session's own client_code, passed in
// as `code` below, never anything a caller could supply. That's what keeps a
// session able to spend only its own credit, never anyone else's.
//
// This can't be a plain WRITE_OPS entry: those are one fixed literal PATCH,
// built purely from args, no read involved. Spending a credit correctly needs
// the CURRENT value first — read it, then write the decrement back guarded on
// that same value (call_credits=eq.<what was just read>), so two taps landing
// at once can't both succeed off a stale read and hand out a credit for free.
// A guard mismatch means someone else's request already landed; the caller
// gets told to retry, not a false success.
async function handleSpendCallCredit(URL, SERVICE, code) {
  try {
    const readRes = await fetch(
      `${URL}/rest/v1/clients?code=eq.${encodeURIComponent(code)}&select=calls_enabled,call_credits`,
      { headers: { apikey: SERVICE, Authorization: 'Bearer ' + SERVICE } }
    );
    if (!readRes.ok) return json(502, { error: 'query_failed', op: 'spendCallCredit' });
    const rows = await readRes.json();
    const row = rows && rows[0];
    if (!row) return json(404, { error: 'no_such_account' });
    if (row.calls_enabled === true) {
      // Standing access — nothing to spend, and that's success, not an error.
      return json(200, [{ code: code, calls_enabled: true, call_credits: row.call_credits, spent: false }]);
    }
    const current = Number(row.call_credits) || 0;
    if (current <= 0) return json(409, { error: 'no_credit' });
    const writeRes = await fetch(
      `${URL}/rest/v1/clients?code=eq.${encodeURIComponent(code)}&call_credits=eq.${current}`,
      {
        method: 'PATCH',
        headers: { apikey: SERVICE, Authorization: 'Bearer ' + SERVICE, 'Content-Type': 'application/json', Prefer: 'return=representation' },
        body: JSON.stringify({ call_credits: current - 1 }),
      }
    );
    const text = await writeRes.text();
    if (!writeRes.ok) {
      console.error('trainer: spendCallCredit write failed', writeRes.status, text.slice(0, 300));
      return json(502, { error: 'write_failed', op: 'spendCallCredit' });
    }
    let rowsBack = [];
    try { rowsBack = JSON.parse(text); } catch (e) {}
    if (!rowsBack.length) {
      return json(409, { error: 'conflict_retry' });
    }
    return json(200, rowsBack.map((r) => Object.assign({}, r, { spent: true })));
  } catch (e) {
    console.error('trainer: spendCallCredit threw', e && e.message);
    return json(502, { error: 'write_failed', op: 'spendCallCredit' });
  }
}

// CLIENT-SESSION-GATED, same exception as spendCallCredit above — a client
// reading their OWN upcoming VIP call schedule for Day & Jim's quiet row.
// client_code is ALWAYS the session's own claim, never anything a caller
// could supply, same reasoning as spendCallCredit: this is the first
// client-facing READ through that pattern, not just a write, but the law is
// identical — a narrow, named, session-scoped door, never a shared table read.
// notes is deliberately never selected: it's the trainer's own text about the
// booking, not the client's to read.
async function handleMyVipCalls(URL, SERVICE, code) {
  try {
    const r = await fetch(
      `${URL}/rest/v1/vip_calls?client_code=eq.${encodeURIComponent(code)}&active=eq.true`
        + '&select=id,weekdays,time_local,tz,duration_minutes,start_date,end_date&order=start_date.asc',
      { headers: { apikey: SERVICE, Authorization: 'Bearer ' + SERVICE } }
    );
    const text = await r.text();
    if (!r.ok) {
      console.error('trainer: myVipCalls query failed', r.status, text.slice(0, 300));
      return json(502, { error: 'query_failed', op: 'myVipCalls' });
    }
    return { statusCode: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: text };
  } catch (e) {
    console.error('trainer: myVipCalls threw', e && e.message);
    return json(502, { error: 'query_failed', op: 'myVipCalls' });
  }
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

  let op = '', args = {};
  try { const b = JSON.parse(event.body || '{}'); op = String(b.op || ''); args = b.args || {}; }
  catch (e) { return json(400, { error: 'bad_request' }); }

  // The one op any signed-in session may call, trainer or not — see the function
  // above for why. Everything else past this point requires is_trainer===true.
  if (op === 'spendCallCredit') {
    return handleSpendCallCredit(URL, SERVICE, claims.client_code);
  }
  if (op === 'myVipCalls') {
    return handleMyVipCalls(URL, SERVICE, claims.client_code);
  }

  if (claims.is_trainer !== true) {
    // A real client's session reaching the trainer-only door is worth knowing about.
    console.warn('trainer: non-trainer session attempted', claims.client_code, op);
    return json(403, { error: 'not_a_trainer' });
  }

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
