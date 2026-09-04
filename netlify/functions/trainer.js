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
  roster: () => 'clients?select=code,name,initials,phone,email,active,coach_code,is_trainer,is_primary,hidden,tier,term_months,paid,started_at,term_ends,created_at,last_seen,calls_enabled,call_credits,weekly_calls,weekly_call_spent_at,review_date&order=code.asc&limit=2000',

  // One client, deeply. The only place `code` is interpolated, and it is encoded.
  // Not yet called from anywhere — banked, same as roster.
  clientProfile: (a) => `profiles?client_code=eq.${enc(a.code)}&limit=1`,
  clientNotes:   (a) => `client_notes?client_code=eq.${enc(a.code)}&select=id,note,logged_at,shared_at,shared_note&order=logged_at.desc&limit=300`,
  // EVERY client's notes, for the board and the export. This exists because the
  // private `note` column stopped being readable with the public key on 20 Aug —
  // the trainer surfaces that used to read it directly now come through here, on
  // the service role, where reading it is the whole point.
  clientNotesAll: () => `client_notes?select=id,client_code,note,logged_at&order=logged_at.desc&limit=1500`,
  clientPlan:    (a) => `training_plans?client_code=eq.${enc(a.code)}&limit=1`,

  // ---- calendar block display labels (1d/1e, 20 Aug) -------------------------
  // block_display_names is DARK from birth: RLS on with no policies and all
  // privileges revoked from anon and authenticated, so the page cannot read one
  // row of it with the public key. That is the point — these are the trainer's
  // private labels for his own week and no client surface has a path to them.
  // Every read and write therefore comes through here, on the service role.
  // Scoped to ONE owner. There is no all-owners variant and none should be
  // added: a label is presentation, and nothing needs to see everyone's at once.
  blockLabels: (a) => `block_display_names?owner_code=eq.${enc(a.owner_code)}`
    + '&select=target_kind,target_key,display_name,fit_mode&limit=2000',
  // Kept distinct from `contacts` below: this is "one client's contact timeline",
  // reached from a client deep-dive. `contacts` is "sync the whole log", reached from
  // the triage board. Different UI, different caller, both real.
  // contacted_at, NOT logged_at. This table's timestamp has always been
  // contacted_at — the sibling `contacts` op right below orders by it correctly.
  // An order column the table does not have 400s the WHOLE query, and this
  // function is a raw passthrough whose recovery only rewrites a bad SELECT, not
  // a bad ORDER, so it came back empty. Empty from here reads as "you have never
  // contacted this person", on the one screen that exists to tell Yusuf who he
  // has not spoken to. Nothing calls this op yet; it would have been wrong the
  // first time anything did. Same shape as the coach_notes created_at/sent_at bug
  // this file already carries a warning about.
  clientContacts:(a) => `client_contacts?client_code=eq.${enc(a.code)}&select=client_code,coach_code,kind,about,replied,contacted_at&order=contacted_at.desc&limit=200`,

  // Money. NO LIMIT, on purpose. loadSales()'s own comment: "The old query capped at
  // 200, so past that the headline quietly under-reported." Capping this at any number
  // reintroduces exactly that failure mode the moment sales passes it, with nothing
  // to say so — sbInsert/sbSelect-style silence is the whole reason that bug shipped
  // once already.
  sales: () => 'sales?select=id,client_code,client_name,program,total_amount,paid_amount,sale_date,due_date,created_at&order=sale_date.desc',

  // jvSyncContacts() (line ~13840): coach_code=eq.<trainer> — with one coach in the
  // whole system that's every row, so this returns everyone and the caller keys its own
  // map off client_code exactly as before.
  contacts: () => 'client_contacts?select=client_code,coach_code,kind,about,replied,source,responded_at,contacted_at&order=contacted_at.desc&limit=2000',

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

  // Per-occurrence exceptions to those rules — one row per (vip_call_id,
  // occurrence_date), 'skip' or 'move'. The SERIES itself is never written by
  // any of this; that's the whole point. Listed in TOLERATE_MISSING below so
  // the cockpit reads [] rather than a 502 while the migration is unpasted.
  vipCallExceptions: (a) => (a && a.vip_call_id
    ? `vip_call_exceptions?vip_call_id=eq.${encId(a.vip_call_id)}&select=id,vip_call_id,occurrence_date,kind,new_date,new_time_local,created_at&order=occurrence_date.asc&limit=500`
    : 'vip_call_exceptions?select=id,vip_call_id,occurrence_date,kind,new_date,new_time_local,created_at&order=occurrence_date.asc&limit=1000'),

  // One named client's own call bookings — what the trainer's cancel/undo
  // surface lists. Deliberately not the whole table: `bookings` is broad and
  // this is a per-client question.
  // The roster-wide booking list loadBookings used to pull with the public key.
  // Trainer only — a CLIENT asking this would be asking for every other
  // client's name, date and time, which is precisely the leak being closed.
  // A client's own equivalents are myBookings (theirs, in full) and
  // bookingsBusy (everyone's slots, nobody's identity).
  bookingsAll: () => 'bookings?select=id,client_code,trainer_code,starts_at,duration_min,status,client_tz,note,spent,created_at&order=starts_at.asc&limit=400',

  clientBookings: (a) => `bookings?client_code=eq.${enc(a.code)}&select=id,client_code,trainer_code,starts_at,duration_min,status,client_tz,note,spent,created_at&order=starts_at.desc&limit=200`,
};

// Ops whose table may legitimately not exist yet — a missing table answers []
// rather than 502, so a cockpit opened before the SQL is pasted reads "no
// exceptions" (which is true) instead of "something is broken". Scoped to an
// explicit list: masking PGRST205 for every op would hide real breakage.
const TOLERATE_MISSING = { vipCallExceptions: 1 };
function missingTable(body) {
  const s = String(body || '');
  return /PGRST205/.test(s) || /Could not find the table/i.test(s);
}

function enc(v) {
  const s = String(v == null ? '' : v);
  // Client codes are a known shape; refuse anything that could carry PostgREST syntax.
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(s)) throw new Error('bad_arg');
  return encodeURIComponent(s);
}

// UNKNOWN-COLUMN RECOVERY — same reasoning and the same regex as index.html's
// own _sbBadColumn: a select= naming a column the table doesn't have 400s the
// WHOLE query, and this function is a raw passthrough with no self-heal of
// its own, unlike the client-side sbSelect/sbUpsert helpers. Added because a
// schema change (weekly_calls, weekly_call_spent_at) now ships in the SAME
// pass as this file — if the migration hasn't landed yet when this deploys,
// this is what keeps the roster query answering instead of 400ing the whole
// cockpit until someone notices and pastes the SQL.
function badColumn(body) {
  if (!body) return null;
  const s = String(body);
  const m = /column\s+\\?"?(?:[a-z_][a-z0-9_]*\.)?\\?"?([a-z_][a-z0-9_]*)\\?"?[\s\S]{0,40}?does not exist/i.exec(s)
    || /could not find the '([a-z_]+)' column/i.exec(s)
    || /'([a-z_]+)' column of '[a-z_]+'/i.exec(s);
  return m ? m[1] : null;
}
// Drops one column out of a `table?select=a,b,c&...` path's select list.
// Returns the same path unchanged if the column isn't actually in it, so a
// caller can safely check `stripped !== path` to know whether a retry is
// actually different from what just failed.
function stripSelectColumn(path, col) {
  const m = /^([^?]*\?)(.*)$/.exec(path);
  if (!m) return path;
  const [, base, qs] = m;
  const params = qs.split('&').map((kv) => {
    if (!kv.startsWith('select=')) return kv;
    const cols = kv.slice(7).split(',').filter((c) => c !== col);
    return 'select=' + cols.join(',');
  });
  return base + params.join('&');
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

  // ---- calendar block display labels ----------------------------------------
  // UPSERT on (owner_code, target_key), which the migration backs with a real
  // unique index — so a second rename of the same block OVERWRITES rather than
  // accumulating a second row a read would then have to choose between.
  // PRESENTATION ONLY, enforced here as well as in the table's own CHECKs: the
  // only fields that can ever be written are the display name and the fit mode.
  // Nothing about the underlying record can reach this table through this door.
  // A null/empty display_name is a CLEARING, not a rename — it is passed
  // through as null so the block falls back to its true name.
  blockLabelSet: (a) => ({
    method: 'POST', path: 'block_display_names?on_conflict=owner_code,target_key',
    // upsert:true is the flag the dispatcher actually reads — it is what adds
    // resolution=merge-duplicates to the Prefer header. A `prefer` field would
    // be silently ignored here and the write would 409 against the unique
    // index the migration created, which is exactly the shape of a bug that
    // looks like "rename does not save" with nothing in the console.
    upsert: true,
    body: {
      owner_code:   enc_raw(a.owner_code),
      target_kind:  str(a.target_kind, 8),
      target_key:   str(a.target_key, 200),
      display_name: (a.display_name == null || String(a.display_name).trim() === '')
                      ? null : str(a.display_name, 120),
      fit_mode:     (a.fit_mode === 'fit' || a.fit_mode === 'time') ? a.fit_mode : null,
      updated_at:   new Date().toISOString(),
    },
  }),

  // ---- a trainer logging ON BEHALF OF a client ---------------------------------
  // These three tables are not dark to the anon key and never will be: a client's
  // own app writes their own weight, food and steps with it all day. What was
  // going through the public key was something else entirely — the ASSISTANT
  // writing a number onto whichever client it decided a sentence was about. That
  // is a privileged, cross-client act and it had no more authority behind it than
  // any page on the internet has.
  //
  // Through here it needs a real trainer session. Deliberately narrow: one row,
  // one client, named fields only, no bulk shape, and no delete or update — an
  // assistant that misfires can add a row somebody can see and remove, never
  // rewrite or erase a history.
  logWeight: (a) => ({
    method: 'POST', path: 'weight_logs',
    body: { client_code: enc_raw(a.client_code), weight: num(a.weight),
      notes: str(a.notes, 300), logged_at: isoTs(a.logged_at || new Date().toISOString()) },
  }),
  logFood: (a) => ({
    method: 'POST', path: 'food_logs',
    body: { client_code: enc_raw(a.client_code), name: str(a.name, 200),
      calories: num(a.calories), protein: num(a.protein), carbs: num(a.carbs), fat: num(a.fat),
      rating: str(a.rating || 'unknown', 40),
      date_str: str(a.date_str, 40) || undefined,
      // The door never took these, so every row it wrote had both columns null:
      // the day view then fell back to logged_at and a stated time was invisible.
      meal: a.meal != null ? str(a.meal, 40) : undefined,
      eat_time: a.eat_time != null ? str(a.eat_time, 20) : undefined,
      logged_at: isoTs(a.logged_at || new Date().toISOString()) },
  }),
  // Steps are one row per client per day, so this is the only one that merges
  // rather than appends — the same on_conflict the client's own writer uses.
  logSteps: (a) => ({
    method: 'POST', path: 'step_logs?on_conflict=client_code,date_str',
    upsert: true,
    body: { client_code: enc_raw(a.client_code), steps: num(a.steps),
      date_str: str(a.date_str, 40), updated_at: isoTs(a.updated_at || new Date().toISOString()) },
  }),

  // ---- client_contacts --------------------------------------------------------
  contactInsert: (a, coach) => ({
    method: 'POST', path: 'client_contacts',
    // source is the never-assert column: 'self' means HE marked it, the app did
    // not witness it, and every surface that reports it must say so. Anything
    // that is not literally 'self' is 'observed' — an unknown never becomes a
    // claim that the app saw something happen.
    body: { coach_code: coach, client_code: enc_raw(a.client_code), kind: str(a.kind, 40),
      about: str(a.about, 300), replied: !!a.replied, contacted_at: isoTs(a.contacted_at),
      source: (a.source === 'self' ? 'self' : 'observed'),
      responded_at: a.responded_at ? isoTs(a.responded_at) : undefined },
  }),
  contactUpdate: (a, coach) => ({
    method: 'PATCH',
    path: `client_contacts?coach_code=eq.${enc(coach)}&client_code=eq.${enc(a.client_code)}&contacted_at=eq.${encodeURIComponent(isoTs(a.contacted_at))}`,
    body: { about: str(a.about, 300) },
  }),
  // A RESPONSE CLEARS THE RESPONSE CLOCK. A reply, a log, or a call taken — any
  // of the three. Stamps the most recent contact for that client; a read
  // receipt is never a response and never reaches this.
  contactRespond: (a, coach) => ({
    method: 'PATCH',
    path: `client_contacts?coach_code=eq.${enc(coach)}&client_code=eq.${enc(a.client_code)}&contacted_at=eq.${encodeURIComponent(isoTs(a.contacted_at))}`,
    body: { replied: true, responded_at: isoTs(a.responded_at || new Date().toISOString()) },
  }),
  // The scheduled review, one value per client. Null clears it.
  reviewDateSet: (a) => ({
    method: 'PATCH', path: `clients?code=eq.${enc(a.client_code)}`,
    body: { review_date: a.review_date ? isoDate(a.review_date) : null },
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
  // Strangers still write this table with the public key directly (INSERT-only
  // for anon, nothing else), before any session exists to sign them into, and
  // that carve-out is untouched — the offer page depends on it.
  // consultInsert (a handler, not an entry here, because it reads the calendar
  // before it writes) is a SECOND door beside that one for the trainer's own
  // bookings, never a widening of anon's.
  // Booking is auto-accept, no review step — this op is Yusuf's cancel lever.
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
    // THE DISPLAY NAME. Added 23 Aug: the assistant had no hand to rename a
    // client with, so it refused and sent him to a screen that does not exist.
    // Trimmed and capped like every other string here; an empty one is refused
    // outright rather than written, because a client with no name is worse than
    // a client with the wrong one.
    if (a.name !== undefined) {
      const nm = str(a.name, 80);
      if (!nm) throw new Error('bad_arg');
      body.name = nm;
    }
    // The avatar letters are derived from the name and stored beside it. Left
    // behind on a rename, the dot keeps spelling the old one.
    if (a.initials !== undefined) body.initials = str(a.initials, 4);
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
    // weekly_calls only, never weekly_call_spent_at here — the spend timestamp
    // is written exactly once, by the guarded spendWeeklyCall op below, never
    // by a flexible patch a trainer session could otherwise set to anything.
    if (a.weekly_calls !== undefined) body.weekly_calls = !!a.weekly_calls;
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

  // call_notes is client_code-keyed, so it joins JV_CLIENT_TABLES and needs
  // this, written in the same breath the table is created rather than after an
  // audit finds it missing. Its two foreign keys cascade from bookings and
  // vip_calls, which would cover most deletions on their own — this is the
  // belt to that pair of braces, because "most" is not the standard the delete
  // guard is held to.
  // The standing delete-guard companion. bookings joins JV_CLIENT_TABLES's
  // door-op maps precisely so this gets called: once the lock is on, the anon
  // DELETE that jvRemoveClient's fallback used is gone, and without an op here
  // every future client deletion would silently orphan their bookings forever.
  // That is the faithparker1 failure mode exactly, caused by the door this time
  // rather than by a missing table.
  bookingsDeleteAll: (a) => ({ method: 'DELETE', path: `bookings?client_code=eq.${enc(a.client_code)}` }),

  callNoteDeleteAll: (a) => ({ method: 'DELETE', path: `call_notes?client_code=eq.${enc(a.client_code)}` }),
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

// Same zone-conversion pair as consult-availability.js (duplicated there too,
// for the identical reason: a Netlify function can't import from another).
function tzOffsetMinutes(utcDate, tz) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const parts = {};
  dtf.formatToParts(utcDate).forEach((p) => { if (p.type !== 'literal') parts[p.type] = p.value; });
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return (asUtc - utcDate.getTime()) / 60000;
}
function zonedTimeToUtc(dateStr, timeStr, tz) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = timeStr.split(':').map(Number);
  const guess = new Date(Date.UTC(y, m - 1, d, hh, mm, 0));
  const offsetMin = tzOffsetMinutes(guess, tz);
  return new Date(guess.getTime() - offsetMin * 60000);
}

// ---- weekly check-in credit: entitlement computed at read time -------------
// No server-side scheduler exists anywhere in this stack, so nothing ever
// writes a credit back on a timer. Instead, "does this client have their
// weekly call right now" is a pure function of the current time and when
// they last spent it — recomputed fresh on every check, here and in
// index.html's own copy (duplicated for the same reason as vipCallOccurrences
// above: a Netlify function can't import from the page). The boundary is
// Sunday 00:00 America/New_York, the same for every client, so it never
// needs a per-client anything and stays explainable in one sentence.
function weeklyBoundaryYMD(now) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short',
  });
  const parts = {};
  dtf.formatToParts(now).forEach((p) => { if (p.type !== 'literal') parts[p.type] = p.value; });
  const wdMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const dow = wdMap[parts.weekday];
  const d = new Date(Date.UTC(+parts.year, +parts.month - 1, +parts.day));
  d.setUTCDate(d.getUTCDate() - dow);
  return { y: d.getUTCFullYear(), mo: d.getUTCMonth(), d: d.getUTCDate() };
}
function weeklyBoundaryOnOrBefore(now) {
  const ymd = weeklyBoundaryYMD(now);
  return zonedTimeToUtc(`${ymd.y}-${String(ymd.mo + 1).padStart(2, '0')}-${String(ymd.d).padStart(2, '0')}`, '00:00', 'America/New_York');
}
function nextWeeklyBoundaryAfter(now) {
  const ymd = weeklyBoundaryYMD(now);
  const d = new Date(Date.UTC(ymd.y, ymd.mo, ymd.d));
  d.setUTCDate(d.getUTCDate() + 7);
  return zonedTimeToUtc(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`, '00:00', 'America/New_York');
}
function hasWeeklyCreditNow(spentAtISO, now) {
  if (!spentAtISO) return true;
  const spent = new Date(spentAtISO);
  if (isNaN(spent.getTime())) return true;
  return spent.getTime() < weeklyBoundaryOnOrBefore(now).getTime();
}

// CLIENT-SESSION-GATED, same exception and same reasoning as spendCallCredit
// above — a client spending their OWN weekly check-in call. Same read-then-
// guarded-write shape: read the current weekly_call_spent_at, confirm a
// credit is actually available right now, then write conditioned on that
// exact prior value (via `or=` since the guard has to match either NULL or
// the timestamp just read) so two taps landing at once can't both succeed.
// On the no-credit path, the response carries `next` — the UTC instant the
// next credit becomes available — so the caller can show the honest date
// without a second round trip.
async function handleSpendWeeklyCall(URL, SERVICE, code) {
  try {
    const readRes = await fetch(
      `${URL}/rest/v1/clients?code=eq.${encodeURIComponent(code)}&select=weekly_calls,weekly_call_spent_at`,
      { headers: { apikey: SERVICE, Authorization: 'Bearer ' + SERVICE } }
    );
    if (!readRes.ok) return json(502, { error: 'query_failed', op: 'spendWeeklyCall' });
    const rows = await readRes.json();
    const row = rows && rows[0];
    if (!row) return json(404, { error: 'no_such_account' });
    if (row.weekly_calls !== true) return json(409, { error: 'not_weekly_tier' });
    const now = new Date();
    if (!hasWeeklyCreditNow(row.weekly_call_spent_at, now)) {
      return json(409, { error: 'no_credit', next: nextWeeklyBoundaryAfter(now).toISOString() });
    }
    const guard = row.weekly_call_spent_at
      ? `weekly_call_spent_at.eq.${encodeURIComponent(row.weekly_call_spent_at)}`
      : 'weekly_call_spent_at.is.null';
    const writeRes = await fetch(
      `${URL}/rest/v1/clients?code=eq.${encodeURIComponent(code)}&or=(${guard})`,
      {
        method: 'PATCH',
        headers: { apikey: SERVICE, Authorization: 'Bearer ' + SERVICE, 'Content-Type': 'application/json', Prefer: 'return=representation' },
        body: JSON.stringify({ weekly_call_spent_at: now.toISOString() }),
      }
    );
    const text = await writeRes.text();
    if (!writeRes.ok) {
      console.error('trainer: spendWeeklyCall write failed', writeRes.status, text.slice(0, 300));
      return json(502, { error: 'write_failed', op: 'spendWeeklyCall' });
    }
    let rowsBack = [];
    try { rowsBack = JSON.parse(text); } catch (e) {}
    if (!rowsBack.length) return json(409, { error: 'conflict_retry' });
    return json(200, rowsBack.map((r) => Object.assign({}, r, { spent: true })));
  } catch (e) {
    console.error('trainer: spendWeeklyCall threw', e && e.message);
    return json(502, { error: 'write_failed', op: 'spendWeeklyCall' });
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
    // Each rule carries its OWN exceptions, so the client's card applies the
    // identical skip/move check the public grid does. Attached to the rows
    // rather than returned beside them because trainerOp() hands callers an
    // array — a second top-level key would have needed every caller changed,
    // and a rule and its exceptions belong together anyway.
    let rows = [];
    try { rows = JSON.parse(text) || []; } catch (e) { rows = []; }
    const exc = await fetchVipExceptions(URL, SERVICE, rows.map((x) => x.id));
    rows.forEach((x) => {
      const m = (exc.by && exc.by[String(x.id)]) || {};
      x.exceptions = Object.keys(m).map((k) => ({
        occurrence_date: k, kind: m[k].kind,
        new_date: m[k].new_date || null, new_time_local: m[k].new_time_local || null,
      }));
      // A card that could not read the exceptions must not quietly show the
      // rule's own time as if nothing had been moved.
      x.exceptions_ok = exc.ok !== false;
    });
    return json(200, rows);
  } catch (e) {
    console.error('trainer: myVipCalls threw', e && e.message);
    return json(502, { error: 'query_failed', op: 'myVipCalls' });
  }
}

// ===== TRAINER-AUTHORED CALLS ==============================================
// Three ops, all is_trainer-gated, all read-then-write, all reading the row
// back off the table before they answer.
//
// They are NOT a loosening of spendCallCredit/spendWeeklyCall. Those stay
// exactly as they are: session-scoped, acting only on claims.client_code,
// never on args. These act on a NAMED client because a trainer session has
// already proved it is the trainer — a different authority, so a different op,
// checked after the is_trainer gate rather than before it.
//
// Off-grid on purpose. The client picker's 30-minute slot grid exists so a
// client is offered a tidy choice; Yusuf negotiating "9:45" with someone over
// text is real, and there is no reason the grid should constrain him. These
// take a clock time and honour it.

const BOOK_DEFAULT_MIN = 30;
const CONSULT_MIN = 30;        // the offer page's own slot length
const NEAR_STEP_MIN = 15;      // nearest-open walks in quarter hours
const NEAR_SPAN_MIN = 240;     // ...up to four hours either side, no further
const NEAR_DAY_START = 7;      // ...and never proposes the middle of the night
const NEAR_DAY_END = 21;
const TRAINER_TZ = 'America/New_York';

function overlapsWindow(aS, aE, bS, bE) { return aS < bE && aE > bS; }
function localHourIn(date, tz) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', hour: '2-digit' }).formatToParts(date);
    const h = parts.find((p) => p.type === 'hour');
    return h ? +h.value : 12;
  } catch (e) { return 12; }
}
function isoDayStr(d) { return d.toISOString().slice(0, 10); }
function svc(SERVICE) { return { apikey: SERVICE, Authorization: 'Bearer ' + SERVICE }; }

// Exceptions for a set of vip_calls ids, as {vip_call_id: {occurrence_date: row}}.
// FAIL-SOFT AND SAY SO: the table not existing yet (the migration unpasted) or
// erroring returns {} plus a flag, so callers that must not silently ignore a
// move — bookCallForClient's collision check — can refuse instead of booking
// on top of an occurrence they couldn't see.
async function fetchVipExceptions(URL, SERVICE, ids) {
  if (!ids || !ids.length) return { ok: true, by: {} };
  try {
    const path = 'vip_call_exceptions?select=vip_call_id,occurrence_date,kind,new_date,new_time_local'
      + `&vip_call_id=in.(${ids.map((i) => encodeURIComponent(i)).join(',')})&limit=2000`;
    const r = await fetch(`${URL}/rest/v1/${path}`, { headers: svc(SERVICE) });
    const text = await r.text();
    if (!r.ok) {
      // A table that isn't there yet is a known, expected state during rollout
      // and is NOT a failure — there are genuinely no exceptions.
      if (missingTable(text)) return { ok: true, by: {}, absent: true };
      console.error('trainer: vip_call_exceptions read failed', r.status, text.slice(0, 200));
      return { ok: false, by: {} };
    }
    const rows = JSON.parse(text);
    const by = {};
    (rows || []).forEach((x) => {
      const k = String(x.vip_call_id);
      by[k] = by[k] || {};
      by[k][String(x.occurrence_date).slice(0, 10)] = x;
    });
    return { ok: true, by: by };
  } catch (e) {
    console.error('trainer: vip_call_exceptions threw', e && e.message);
    return { ok: false, by: {} };
  }
}

// Expand vip_calls RULES into real occurrences across a date range, applying
// per-occurrence exceptions. The rule row is never modified — an exception is
// consulted at expansion time, exactly like the DST offset is, which is why
// next week still reads the rule's own time after tomorrow has been moved.
//
// SCANS WIDER THAN IT IS ASKED. A move can carry an occurrence onto a date the
// rule does not fire, so a scan bounded by the requested range would lose an
// occurrence moved INTO it from just outside. Seven days of padding either
// side covers every move this op will accept; occurrences that land outside
// the range are returned too, which is harmless — every caller tests overlap
// against a specific window rather than trusting the list to be pre-trimmed.
// keepSkipped: a busy list must never contain a skipped occurrence (that is
// the whole point of skipping one), but a list a HUMAN is choosing from must
// show it, or a day that has been taken off simply vanishes with no way to put
// it back. Same expansion, one flag, rather than a second copy that drifts.
function expandVipOccurrences(rows, excBy, fromYmd, toYmd, keepSkipped) {
  const out = [];
  const PAD = 7 * 86400000;
  const scanStart = new Date(fromYmd + 'T00:00:00.000Z').getTime() - PAD;
  const scanEnd = new Date(toYmd + 'T00:00:00.000Z').getTime() + PAD;
  (rows || []).forEach((row) => {
    const rowStart = new Date(row.start_date + 'T00:00:00.000Z').getTime();
    const rowEnd = new Date(row.end_date + 'T00:00:00.000Z').getTime();
    const spanStart = Math.max(rowStart, scanStart);
    const spanEnd = Math.min(rowEnd, scanEnd);
    const exc = (excBy && excBy[String(row.id)]) || {};
    for (let t = spanStart; t <= spanEnd; t += 86400000) {
      const d = new Date(t);
      const dow = ((d.getUTCDay() + 6) % 7) + 1;   // 1=Mon..7=Sun
      if (!Array.isArray(row.weekdays) || !row.weekdays.includes(dow)) continue;
      const ds = isoDayStr(d);
      const e = exc[ds];
      const skipped = !!(e && e.kind === 'skip');
      if (skipped && !keepSkipped) continue;
      const useDate = (e && e.new_date) ? String(e.new_date).slice(0, 10) : ds;
      const useTime = (e && e.new_time_local) ? String(e.new_time_local).slice(0, 5) : row.time_local;
      out.push({
        vip_call_id: row.id,
        client_code: row.client_code,
        rule_date: ds,
        date: useDate,
        time_local: useTime,
        tz: row.tz,
        duration_minutes: +row.duration_minutes || BOOK_DEFAULT_MIN,
        moved: !!(e && e.kind === 'move'),
        skipped: skipped,
        series_time_local: row.time_local,
        at: zonedTimeToUtc(useDate, useTime, row.tz),
      });
    }
  });
  return out;
}

// Everything that already occupies the trainer's time across a window, from
// every table that can hold a claim on it.
//
// FAILS CLOSED. Every other read in this file degrades to "empty" on error
// because an empty list there costs a screen, not a mistake. Here an empty
// list IS the mistake — it is exactly what double-books a real client — so a
// source that cannot be read stops the booking and says which one.
async function collectBusy(URL, SERVICE, fromMs, toMs) {
  const fromISO = new Date(fromMs).toISOString();
  const toISO = new Date(toMs).toISOString();
  const fromYmd = fromISO.slice(0, 10);
  const toYmd = toISO.slice(0, 10);
  const busy = [];

  // 1. Every call already booked, for ANY client — someone else's call is as
  //    much of a clash as this client's own.
  const bRes = await fetch(`${URL}/rest/v1/bookings?select=id,client_code,starts_at,duration_min,status`
    + `&starts_at=gte.${encodeURIComponent(fromISO)}&starts_at=lte.${encodeURIComponent(toISO)}&limit=500`,
    { headers: svc(SERVICE) });
  if (!bRes.ok) return { ok: false, source: 'bookings' };
  (await bRes.json() || []).forEach((b) => {
    if (String(b.status || 'booked') === 'cancelled') return;
    const s = new Date(b.starts_at).getTime();
    if (!isFinite(s)) return;
    busy.push({ kind: 'booking', id: b.id, client_code: b.client_code,
      starts: s, ends: s + (+b.duration_min || BOOK_DEFAULT_MIN) * 60000 });
  });

  // 2. Accepted consults off the offer page. A cancelled one is not busy.
  const cRes = await fetch(`${URL}/rest/v1/consult_requests?select=id,requested_at&status=eq.accepted`
    + `&requested_at=gte.${encodeURIComponent(fromISO)}&requested_at=lte.${encodeURIComponent(toISO)}&limit=500`,
    { headers: svc(SERVICE) });
  if (!cRes.ok) return { ok: false, source: 'consults' };
  (await cRes.json() || []).forEach((c) => {
    const s = new Date(c.requested_at).getTime();
    if (!isFinite(s)) return;
    busy.push({ kind: 'consult', id: c.id, starts: s, ends: s + CONSULT_MIN * 60000 });
  });

  // 3. Standing VIP blocks, expanded exception-aware.
  const vRes = await fetch(`${URL}/rest/v1/vip_calls?select=id,client_code,weekdays,time_local,tz,duration_minutes,start_date,end_date`
    + `&active=eq.true&start_date=lte.${encodeURIComponent(toYmd)}&end_date=gte.${encodeURIComponent(fromYmd)}&limit=500`,
    { headers: svc(SERVICE) });
  if (!vRes.ok) return { ok: false, source: 'vip_calls' };
  const vRows = await vRes.json() || [];
  const exc = await fetchVipExceptions(URL, SERVICE, vRows.map((r) => r.id));
  if (!exc.ok) return { ok: false, source: 'vip_call_exceptions' };
  expandVipOccurrences(vRows, exc.by, fromYmd, toYmd).forEach((o) => {
    const s = o.at.getTime();
    if (!isFinite(s)) return;
    busy.push({ kind: 'vip_call', id: o.vip_call_id, client_code: o.client_code,
      starts: s, ends: s + o.duration_minutes * 60000, moved: o.moved });
  });

  // 4. The trainer's own time off. A walk is deliberately not a block — the
  //    client picker has always taken calls on walks and this matches it.
  const tRes = await fetch(`${URL}/rest/v1/trainer_blocks?select=id,starts_at,ends_at,kind,label`
    + `&ends_at=gte.${encodeURIComponent(fromISO)}&starts_at=lte.${encodeURIComponent(toISO)}&limit=500`,
    { headers: svc(SERVICE) });
  if (!tRes.ok) return { ok: false, source: 'trainer_blocks' };
  (await tRes.json() || []).forEach((b) => {
    if (String(b.kind || '') === 'walk') return;
    const s = new Date(b.starts_at).getTime(), e = new Date(b.ends_at).getTime();
    if (!isFinite(s) || !isFinite(e)) return;
    busy.push({ kind: 'block', id: b.id, label: b.label || b.kind, starts: s, ends: e });
  });

  return { ok: true, busy: busy };
}

function firstClash(startMs, durMin, busy) {
  const endMs = startMs + durMin * 60000;
  const hits = busy.filter((b) => overlapsWindow(startMs, endMs, b.starts, b.ends))
    .sort((a, b) => a.starts - b.starts);
  return hits.length ? hits[0] : null;
}

// The nearest times that genuinely are open, walking outward in quarter hours.
// Not slots — this op is not grid-bound and neither is its suggestion. Later
// is offered before earlier at the same distance, because a call that slipped
// is more often pushed back than pulled forward.
function nearestOpen(wantMs, durMin, busy, limit) {
  const out = [];
  const floor = Date.now() + 5 * 60000;
  for (let k = 1; k * NEAR_STEP_MIN <= NEAR_SPAN_MIN && out.length < limit; k++) {
    const cands = [wantMs + k * NEAR_STEP_MIN * 60000, wantMs - k * NEAR_STEP_MIN * 60000];
    for (let i = 0; i < cands.length && out.length < limit; i++) {
      const ms = cands[i];
      if (ms < floor) continue;
      const h = localHourIn(new Date(ms), TRAINER_TZ);
      if (h < NEAR_DAY_START || h >= NEAR_DAY_END) continue;
      if (firstClash(ms, durMin, busy)) continue;
      out.push(new Date(ms).toISOString());
    }
  }
  return out;
}

// Which tier a client is on, from their own row. Exactly one, always — the
// Call access panel keeps weekly_calls and calls_enabled mutually exclusive,
// and this reads them in the same order the page's own weeklyCallsFor /
// callsEnabled / callsAreCreditOnly trio does.
function callTierOf(row) {
  if (row.weekly_calls === true) return 'weekly';
  if (row.calls_enabled === true) return 'unlimited';
  if ((+row.call_credits || 0) > 0) return 'credit';
  return 'none';
}

async function readClientRow(URL, SERVICE, code) {
  const r = await fetch(`${URL}/rest/v1/clients?code=eq.${encodeURIComponent(code)}`
    + '&select=code,name,calls_enabled,call_credits,weekly_calls,weekly_call_spent_at&limit=1',
    { headers: svc(SERVICE) });
  if (!r.ok) return null;
  const rows = await r.json();
  return (rows && rows[0]) || null;
}

// ---- bookCallForClient ------------------------------------------------------
// args: { client_code, starts_at (ISO instant), duration_minutes?, note?,
//         dry_run?, force? }
//
// dry_run answers the whole picture with 200 and writes nothing — that is what
// a confirmation card is built from, and what lets Jarvis state the exact time
// back before anything lands. The real call answers 409 for the same clash,
// so a caller that skipped the preview still cannot book over someone.
async function handleBookCallForClient(URL, SERVICE, args, trainerCode) {
  let code, startMs, durMin, note;
  try {
    code = enc_raw(args.client_code);
    const d = new Date(isoTs(args.starts_at));
    startMs = d.getTime();
    durMin = args.duration_minutes == null ? BOOK_DEFAULT_MIN : posInt(args.duration_minutes, 240);
    note = args.note != null ? nullableStr(args.note, 300) : null;
  } catch (e) { return json(400, { error: 'bad_arg' }); }
  if (startMs < Date.now() - 60 * 60000) return json(400, { error: 'in_the_past' });

  try {
    const row = await readClientRow(URL, SERVICE, code);
    if (!row) return json(404, { error: 'no_such_client' });

    const pad = (NEAR_SPAN_MIN + 24 * 60) * 60000;
    const b = await collectBusy(URL, SERVICE, startMs - pad, startMs + pad);
    if (!b.ok) return json(502, { error: 'availability_unknown', source: b.source });

    const clash = firstClash(startMs, durMin, b.busy);
    const near = clash ? nearestOpen(startMs, durMin, b.busy, 3) : [];

    // What booking this costs. A trainer booking is an act of authority, not a
    // purchase: when there is nothing to spend it still books and says so
    // rather than refusing, so a caller is never told "no" for a client Yusuf
    // has already decided to see. The preview states it either way, so the
    // free call is a choice on screen and never a silent one.
    const tier = callTierOf(row);
    const now = new Date();
    let willSpend = 'none', creditNote = null;
    if (tier === 'weekly') {
      if (hasWeeklyCreditNow(row.weekly_call_spent_at, now)) willSpend = 'weekly';
      else creditNote = 'weekly credit already used — this books without one, and theirs still opens '
        + nextWeeklyBoundaryAfter(now).toISOString();
    } else if (tier === 'credit') {
      willSpend = 'credit';
    } else if (tier === 'none') {
      creditNote = 'scheduled calls are not part of this plan — this books anyway';
    }

    const shape = {
      client_code: row.code, client_name: row.name || row.code,
      starts_at: new Date(startMs).toISOString(),
      ends_at: new Date(startMs + durMin * 60000).toISOString(),
      duration_minutes: durMin, tier: tier, will_spend: willSpend, credit_note: creditNote,
      conflict: clash ? { kind: clash.kind, client_code: clash.client_code || null,
        label: clash.label || null, starts_at: new Date(clash.starts).toISOString(),
        ends_at: new Date(clash.ends).toISOString() } : null,
      nearest_open: near,
    };

    if (args.dry_run === true) return json(200, [Object.assign({ preview: true }, shape)]);
    // force is a deliberate override, not a bypass: the conflict is still
    // computed and still returned on the booked row, so nothing pretends the
    // clash wasn't there.
    if (clash && args.force !== true) {
      return json(409, { error: 'slot_taken', conflict: shape.conflict, nearest_open: near });
    }

    const body = {
      client_code: row.code, trainer_code: trainerCode,
      starts_at: shape.starts_at, duration_min: durMin,
      status: 'booked', client_tz: TRAINER_TZ, note: note, spent: willSpend,
    };
    let wRes = await fetch(`${URL}/rest/v1/bookings`, {
      method: 'POST',
      headers: Object.assign({}, svc(SERVICE), { 'Content-Type': 'application/json', Prefer: 'return=representation' }),
      body: JSON.stringify(body),
    });
    let wText = await wRes.text();
    // Same schema self-heal the reads carry: `spent` ships in the same pass as
    // this code and the SQL does not land at the same instant the deploy does.
    if (!wRes.ok && badColumn(wText) === 'spent') {
      console.warn('trainer: bookings has no column "spent" — writing without it');
      delete body.spent;
      wRes = await fetch(`${URL}/rest/v1/bookings`, {
        method: 'POST',
        headers: Object.assign({}, svc(SERVICE), { 'Content-Type': 'application/json', Prefer: 'return=representation' }),
        body: JSON.stringify(body),
      });
      wText = await wRes.text();
    }
    if (!wRes.ok) {
      console.error('trainer: bookCallForClient write failed', wRes.status, wText.slice(0, 300));
      return json(502, { error: 'write_failed', op: 'bookCallForClient', detail: wText.slice(0, 200) });
    }
    let landed = [];
    try { landed = JSON.parse(wText); } catch (e) {}
    const bookingId = landed[0] && landed[0].id;

    // Spend AFTER the booking exists, and never undo the booking if the spend
    // races: the call is real and Yusuf made it. A spend that didn't land is
    // reported as spent:'none' with the reason, which is the truth, rather
    // than deleting a booking because a credit meter moved underneath it.
    let spent = 'none', spendError = null;
    if (willSpend === 'weekly') {
      const guard = row.weekly_call_spent_at
        ? `weekly_call_spent_at.eq.${encodeURIComponent(row.weekly_call_spent_at)}`
        : 'weekly_call_spent_at.is.null';
      const sRes = await fetch(`${URL}/rest/v1/clients?code=eq.${encodeURIComponent(code)}&or=(${guard})`, {
        method: 'PATCH',
        headers: Object.assign({}, svc(SERVICE), { 'Content-Type': 'application/json', Prefer: 'return=representation' }),
        body: JSON.stringify({ weekly_call_spent_at: now.toISOString() }),
      });
      const sText = await sRes.text();
      let sRows = []; try { sRows = JSON.parse(sText); } catch (e) {}
      if (sRes.ok && sRows.length) spent = 'weekly';
      else spendError = 'weekly credit was not spent (it moved under this request)';
    } else if (willSpend === 'credit') {
      const cur = +row.call_credits || 0;
      const sRes = await fetch(`${URL}/rest/v1/clients?code=eq.${encodeURIComponent(code)}&call_credits=eq.${cur}`, {
        method: 'PATCH',
        headers: Object.assign({}, svc(SERVICE), { 'Content-Type': 'application/json', Prefer: 'return=representation' }),
        body: JSON.stringify({ call_credits: cur - 1 }),
      });
      const sText = await sRes.text();
      let sRows = []; try { sRows = JSON.parse(sText); } catch (e) {}
      if (sRes.ok && sRows.length) spent = 'credit';
      else spendError = 'call credit was not spent (it moved under this request)';
    }

    // If the spend landed but `spent` couldn't be stored on the row (column not
    // migrated yet), cancelCallForClient's recorded-spend path won't see it —
    // it falls back to the timing test, which is why that fallback exists.
    // READ IT BACK. return=representation is PostgREST echoing what it wrote;
    // this is the table answering a fresh question.
    let confirmed = null;
    if (bookingId != null) {
      const rb = await fetch(`${URL}/rest/v1/bookings?id=eq.${encodeURIComponent(bookingId)}`
        + '&select=id,client_code,trainer_code,starts_at,duration_min,status,note,created_at&limit=1',
        { headers: svc(SERVICE) });
      if (rb.ok) { const rows = await rb.json(); confirmed = (rows && rows[0]) || null; }
    }
    if (!confirmed) return json(502, { error: 'unconfirmed', op: 'bookCallForClient', booking_id: bookingId || null });

    return json(200, [Object.assign({}, confirmed, {
      client_name: row.name || row.code, tier: tier, spent: spent,
      spend_error: spendError, credit_note: creditNote,
      conflict: shape.conflict, forced: !!(clash && args.force === true),
    })]);
  } catch (e) {
    console.error('trainer: bookCallForClient threw', e && e.message);
    return json(502, { error: 'write_failed', op: 'bookCallForClient' });
  }
}

// ---- consultDelete ----------------------------------------------------------
// A HARD delete, trainer-gated, one row by id. consultSetStatus is the soft
// path and stays the normal one: a real lead who cancels is history worth
// keeping, and nothing in this door deletes them.
//
// This exists for rows that were never a person — diagnostics, test inserts,
// spam through the offer page's open INSERT. Before it, consult_requests was
// the one table behind this door with no reverse gear at all: anon can insert
// but cannot delete, and the door had no delete either, so anything junk that
// landed was permanent. Same reasoning already written above repostDelete —
// a table with no reverse gear on the only road in is permanent-mistake
// territory.
//
// Loud on purpose: this is the one op here that destroys a row rather than
// changing its state, and the log line is what makes that reviewable later.
async function handleConsultDelete(URL, SERVICE, args) {
  let id;
  try { id = encId(args.id); }
  catch (e) { return json(400, { error: 'bad_arg' }); }
  try {
    const sel = `${URL}/rest/v1/consult_requests?id=eq.${encodeURIComponent(id)}`;
    // Read it first so the answer can say WHAT was destroyed, not just that
    // something was.
    const pre = await fetch(sel + '&select=id,name,phone,requested_at,status,source&limit=1', { headers: svc(SERVICE) });
    if (!pre.ok) return json(502, { error: 'query_failed', op: 'consultDelete' });
    const was = (await pre.json() || [])[0];
    if (!was) return json(404, { error: 'no_such_consult', id: id });

    const d = await fetch(sel, {
      method: 'DELETE',
      headers: Object.assign({}, svc(SERVICE), { Prefer: 'return=representation' }),
    });
    const text = await d.text();
    if (!d.ok) {
      console.error('trainer: consultDelete failed', d.status, text.slice(0, 300));
      return json(502, { error: 'delete_failed', op: 'consultDelete', detail: text.slice(0, 200) });
    }
    // Confirm it is GONE by asking again, rather than trusting the
    // representation of what was removed.
    const post = await fetch(sel + '&select=id&limit=1', { headers: svc(SERVICE) });
    if (!post.ok) return json(502, { error: 'unconfirmed', op: 'consultDelete', id: id });
    const still = (await post.json() || [])[0];
    if (still) return json(502, { error: 'unconfirmed', op: 'consultDelete', id: id });

    console.warn('trainer: consultDelete removed row', id, JSON.stringify(was).slice(0, 200));
    return json(200, [{ id: id, deleted: true, confirmed_gone: true, was: was }]);
  } catch (e) {
    console.error('trainer: consultDelete threw', e && e.message);
    return json(502, { error: 'delete_failed', op: 'consultDelete' });
  }
}

// Which code trainer-owned shared rows hang off. Resolved from the table the
// same way the page's own _trainerCode() resolves it (clients.is_primary),
// never a literal — the page has been bitten by a hardcoded trainer code
// before. Falls back to the first trainer row, then to a null the caller can
// still write, because a booking with no trainer_code is a booking that still
// exists and can be repaired, while a refused booking is a call that never
// happened.
let _primaryCache = null;
async function primaryTrainerCode(URL, SERVICE) {
  if (_primaryCache) return _primaryCache;
  try {
    const r = await fetch(`${URL}/rest/v1/clients?is_trainer=eq.true&select=code,is_primary&limit=20`,
      { headers: svc(SERVICE) });
    if (!r.ok) return null;
    const rows = await r.json() || [];
    const hit = rows.find((x) => x.is_primary === true) || rows[0];
    _primaryCache = hit ? hit.code : null;
    return _primaryCache;
  } catch (e) { return null; }
}

// ---- bookingsBusy / myBookingCreate / myBookingCancel -----------------------
// The three client-side halves of the bookings table, so nothing on a client's
// screen needs the public key for it any more.
//
// WHY bookingsBusy EXISTS AT ALL. The picker has to know which slots are gone,
// and it used to learn that by reading EVERY booking in the table — every other
// client's name, date and time, handed to anyone signed in, and to anyone at
// all with the key from the page source. But a picker never needed the names.
// It needed the instants. This returns instants and durations and nothing else:
// no client_code, no note, no id. A client learns that 2pm is taken and cannot
// learn whose it is.
async function handleBookingsBusy(URL, SERVICE) {
  try {
    const from = new Date(Date.now() - 14 * 86400000).toISOString();
    const r = await fetch(`${URL}/rest/v1/bookings?starts_at=gte.${encodeURIComponent(from)}`
      + '&select=starts_at,duration_min,status&order=starts_at.asc&limit=400', { headers: svc(SERVICE) });
    if (!r.ok) return json(502, { error: 'query_failed', op: 'bookingsBusy' });
    const rows = await r.json() || [];
    return json(200, rows
      .filter((b) => String(b.status || 'booked') !== 'cancelled')
      .map((b) => ({ starts_at: b.starts_at, duration_min: b.duration_min })));
  } catch (e) {
    console.error('trainer: bookingsBusy threw', e && e.message);
    return json(502, { error: 'query_failed', op: 'bookingsBusy' });
  }
}

// A client booking their OWN call. client_code is the session's claim, never an
// argument — the same law as every other my* op here. Collision-checked
// server-side, because the old anon path checked nothing and leaned entirely on
// the picker having offered a free slot, which is a check living on the wrong
// side of the wall.
//
// Entitlement is deliberately NOT spent here. confirmBooking still calls
// spendWeeklyCall or spendCallCredit exactly as it does today; moving that
// inside this op would change the credit flow in the same pass as closing a
// hole, and those are two different risks. This op is the anon write's
// replacement and nothing more.
async function handleMyBookingCreate(URL, SERVICE, args, code) {
  let startMs, tz, dur;
  try {
    startMs = new Date(isoTs(args.starts_at)).getTime();
    tz = args.client_tz ? tzName(args.client_tz) : 'America/New_York';
    dur = args.duration_min != null ? posInt(args.duration_min, 240) : 30;
  } catch (e) { return json(400, { error: 'bad_arg' }); }
  if (startMs < Date.now() - 60000) return json(400, { error: 'in_the_past' });
  try {
    const pad = 24 * 60 * 60000;
    const b = await collectBusy(URL, SERVICE, startMs - pad, startMs + pad);
    if (!b.ok) return json(502, { error: 'availability_unknown', source: b.source });
    const clash = firstClash(startMs, dur, b.busy);
    if (clash) return json(409, { error: 'slot_taken' });

    const row = { client_code: code, trainer_code: await primaryTrainerCode(URL, SERVICE),
      starts_at: new Date(startMs).toISOString(), duration_min: dur,
      status: 'booked', client_tz: tz };
    const w = await fetch(`${URL}/rest/v1/bookings`, {
      method: 'POST',
      headers: Object.assign({}, svc(SERVICE), { 'Content-Type': 'application/json', Prefer: 'return=representation' }),
      body: JSON.stringify(row),
    });
    const text = await w.text();
    if (!w.ok) {
      console.error('trainer: myBookingCreate failed', w.status, text.slice(0, 300));
      return json(502, { error: 'write_failed', op: 'myBookingCreate' });
    }
    let landed = []; try { landed = JSON.parse(text); } catch (e) {}
    const got = landed[0];
    if (!got || !got.id) return json(502, { error: 'unconfirmed', op: 'myBookingCreate' });
    return json(200, [{ id: got.id, starts_at: got.starts_at, duration_min: got.duration_min,
      status: got.status, client_tz: got.client_tz }]);
  } catch (e) {
    console.error('trainer: myBookingCreate threw', e && e.message);
    return json(502, { error: 'write_failed', op: 'myBookingCreate' });
  }
}

// A client cancelling their OWN booking. The id comes from the caller, so the
// filter carries client_code as well — a session naming somebody else's booking
// id matches zero rows and is told so, rather than cancelling it.
async function handleMyBookingCancel(URL, SERVICE, args, code) {
  let id;
  try { id = encId(args.id); }
  catch (e) { return json(400, { error: 'bad_arg' }); }
  try {
    const filter = `bookings?id=eq.${encodeURIComponent(id)}&client_code=eq.${encodeURIComponent(code)}`;
    const w = await fetch(`${URL}/rest/v1/${filter}`, {
      method: 'PATCH',
      headers: Object.assign({}, svc(SERVICE), { 'Content-Type': 'application/json', Prefer: 'return=representation' }),
      body: JSON.stringify({ status: 'cancelled' }),
    });
    const text = await w.text();
    if (!w.ok) {
      console.error('trainer: myBookingCancel failed', w.status, text.slice(0, 300));
      return json(502, { error: 'write_failed', op: 'myBookingCancel' });
    }
    let rows = []; try { rows = JSON.parse(text); } catch (e) {}
    if (!rows.length) return json(404, { error: 'not_yours_or_missing', id: id });
    if (rows[0].status !== 'cancelled') return json(502, { error: 'unconfirmed', op: 'myBookingCancel' });
    return json(200, [{ id: rows[0].id, status: 'cancelled' }]);
  } catch (e) {
    console.error('trainer: myBookingCancel threw', e && e.message);
    return json(502, { error: 'write_failed', op: 'myBookingCancel' });
  }
}

// ---- logPhoto ---------------------------------------------------------------
// A trainer putting a progress photo onto a NAMED client's record. Same
// species as logWeight/logFood/logSteps above — the assistant acting on
// somebody else's data, which is a privileged act and had no authority behind
// it while both existing photo writes used the public key.
//
// args: { client_code, photo_url, date_str, angle, weight?, logged_at? }
//
// THE date_str TRAP IS CLOSED BY CONSTRUCTION, NOT BY A COMMENT.
// progress_photos.date_str is a DISPLAY string — "Aug 14, 2026", produced by
// toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) —
// and every surface groups a day's photos by matching it exactly. An ISO date
// lands a photo that silently forms its own group of one, next to the client's
// own photos from the same morning, and looks like it worked.
// So this op does not merely document the format and hope: it ACCEPTS either
// form and normalises to the display string itself. A caller that sends
// "2026-08-17" and a caller that sends "Aug 17, 2026" produce the identical
// row. The trap cannot be sprung through this door, by Jarvis or anyone else.
// Built from an explicit month table rather than toLocaleDateString so it
// cannot drift with a runtime's locale data.
const PP_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function photoDateStr(v) {
  const s = String(v == null ? '' : v).trim();
  if (!s) throw new Error('bad_arg');
  // Already the display form: "Aug 14, 2026". Normalised through the same
  // table anyway, so "aug 4, 2026" or a stray double space cannot make a
  // second group for one day.
  let m = /^([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{4})$/.exec(s);
  if (m) {
    const idx = PP_MONTHS.findIndex((x) => x.toLowerCase() === m[1].slice(0, 3).toLowerCase());
    if (idx < 0) throw new Error('bad_arg');
    const d = Number(m[2]);
    if (!(d >= 1 && d <= 31)) throw new Error('bad_arg');
    return PP_MONTHS[idx] + ' ' + d + ', ' + m[3];
  }
  // ISO, which is what a voice layer will reach for every time.
  m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) {
    const mo = Number(m[2]);
    const d = Number(m[3]);
    if (!(mo >= 1 && mo <= 12) || !(d >= 1 && d <= 31)) throw new Error('bad_arg');
    return PP_MONTHS[mo - 1] + ' ' + d + ', ' + m[1];
  }
  throw new Error('bad_arg');
}
function photoAngle(v) {
  const s = String(v == null ? '' : v).trim();
  const hit = ['Front', 'Side', 'Back'].find((a) => a.toLowerCase() === s.toLowerCase());
  if (!hit) throw new Error('bad_arg');
  return hit;
}
// These render as <img src> inside a client's own app. An unconstrained
// string here would let a trainer session point a client's progress record at
// any host on the internet — a beacon on someone's private screen, and not
// something this op has any reason to allow. Two shapes only: this project's
// own public storage, or the inline data URI the client's own uploader
// already falls back to when the bucket is unreachable.
function photoUrl(v, projectUrl) {
  const s = String(v == null ? '' : v).trim();
  if (!s) throw new Error('bad_arg');
  if (/^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(s)) {
    if (s.length > 3000000) throw new Error('bad_arg');
    return s;
  }
  const prefix = String(projectUrl || '').replace(/\/+$/, '') + '/storage/v1/object/public/';
  if (s.length <= 2000 && s.indexOf(prefix) === 0 && s.indexOf('..') === -1) return s;
  throw new Error('bad_arg');
}

async function handleLogPhoto(URL, SERVICE, args) {
  let code, url, dateStr, angle, weight, loggedAt;
  try {
    code = enc_raw(args.client_code);
    url = photoUrl(args.photo_url, URL);
    dateStr = photoDateStr(args.date_str);
    angle = photoAngle(args.angle);
    weight = args.weight != null && args.weight !== '' ? num(args.weight) : null;
    loggedAt = isoTs(args.logged_at || new Date().toISOString());
  } catch (e) { return json(400, { error: 'bad_arg' }); }

  try {
    // The client must be real. Writing a photo onto a code that has no row is
    // an orphan nothing will ever render and nothing will ever clean up.
    const who = await readClientRow(URL, SERVICE, code);
    if (!who) return json(404, { error: 'no_such_client' });

    // Exactly the shape the client's own uploader produces on its first
    // attempt — same columns, same order of meaning — so every surface renders
    // a trainer-added photo identically to one the client added.
    const row = { client_code: code, photo: url, date_str: dateStr,
      weight: weight, angle: angle, logged_at: loggedAt };
    const w = await fetch(`${URL}/rest/v1/progress_photos`, {
      method: 'POST',
      headers: Object.assign({}, svc(SERVICE), { 'Content-Type': 'application/json', Prefer: 'return=representation' }),
      body: JSON.stringify(row),
    });
    const text = await w.text();
    if (!w.ok) {
      console.error('trainer: logPhoto write failed', w.status, text.slice(0, 300));
      return json(502, { error: 'write_failed', op: 'logPhoto', detail: text.slice(0, 200) });
    }
    let landed = []; try { landed = JSON.parse(text); } catch (e) {}
    const id = landed[0] && landed[0].id;
    if (id == null) return json(502, { error: 'unconfirmed', op: 'logPhoto' });

    // READ BACK THE WHOLE DAY, not just the row. Grouping is the thing that
    // silently fails here, so the answer proves it rather than asserting it:
    // if this photo did not land in the same group as the client's own photos
    // from that day, it is visible right here in `day_group`.
    const rb = await fetch(`${URL}/rest/v1/progress_photos?client_code=eq.${encodeURIComponent(code)}`
      + `&date_str=eq.${encodeURIComponent(dateStr)}`
      + '&select=id,client_code,date_str,angle,weight,logged_at&order=logged_at.asc&limit=50',
      { headers: svc(SERVICE) });
    if (!rb.ok) return json(502, { error: 'unconfirmed', op: 'logPhoto', id: id });
    const group = await rb.json() || [];
    if (!group.some((p) => String(p.id) === String(id))) {
      return json(502, { error: 'unconfirmed', op: 'logPhoto', id: id });
    }
    return json(200, [{
      id: id, client_code: code, client_name: who.name || code,
      date_str: dateStr, date_str_normalised: String(args.date_str) !== dateStr,
      angle: angle, weight: weight, logged_at: loggedAt,
      day_group: group.map((p) => ({ id: p.id, angle: p.angle, logged_at: p.logged_at })),
      day_group_size: group.length,
      confirmed_by_read_back: true,
    }]);
  } catch (e) {
    console.error('trainer: logPhoto threw', e && e.message);
    return json(502, { error: 'write_failed', op: 'logPhoto' });
  }
}

// ---- mealEdit / mealDelete — THE GUARDED ROW OPS ----------------------------
// logWeight/logFood/logSteps above are append-only on purpose, and say so in
// their own comment: "an assistant that misfires can add a row somebody can see
// and remove, never rewrite or erase a history." These two take that back. They
// are the first ops in this door that can change or destroy something a client
// already logged, so they carry a guard the append-only ops never needed.
//
// THE GUARD. A row id on its own NAMES SOMEBODY. The caller supplies it, so the
// filter carries the client_code as well and both must match the same row —
// exactly the shape handleMyBookingCancel uses for a client cancelling their own
// booking. A mismatched pair matches zero rows, and zero rows is a REFUSAL
// (404 not_yours_or_missing), never a silent success and never an act on
// whichever client the id really belonged to.
//
// WHY THIS EXISTS. Measured against the live project on 29 Aug with the anon key
// that ships in the page source: food_logs accepts PATCH and DELETE filtered on
// id ALONE. Proven end to end on a scratch code — one row rewritten, then
// destroyed, using nothing but the key any reader of the page already has.
// THIS DOOR DOES NOT CLOSE THAT HOLE. Only revoking anon's UPDATE and DELETE
// grant closes it. This is the authorised route that has to exist first, so
// there is somewhere for the app's own edits and deletes to go when it does.
//
// NOTHING CALLS THESE YET. Banked, by the same convention as clientProfile and
// roster before their cutover.

// food_logs.id is a UUID. encId() is digit-only and would reject every real row
// — the precise bug this file already carries a warning about above, where
// noteDelete could never delete anything because its ids were not integers.
// Measured off the live table, not assumed from the column name.
function mealRowId(v) {
  const s = String(v == null ? '' : v);
  if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(s)) return s;
  throw new Error('bad_arg');
}

// The fields an edit may touch, each with the same validator the insert side
// uses for it. client_code IS DELIBERATELY ABSENT and must stay absent: moving a
// row to another client through an "edit" would be precisely the cross-client
// act this guard exists to stop, wearing an innocent name. id is absent for the
// same reason.
const MEAL_EDIT_FIELDS = {
  name:     (v) => str(v, 200),
  emoji:    (v) => str(v, 16),
  calories: (v) => num(v),
  protein:  (v) => num(v),
  carbs:    (v) => num(v),
  fat:      (v) => num(v),
  sugar:    (v) => num(v),
  rating:   (v) => str(v, 40),
  insight:  (v) => str(v, 2000),
  felt:     (v) => str(v, 300),
  meal:     (v) => str(v, 40),
  eat_time: (v) => str(v, 20),
  date_str: (v) => str(v, 40),
  // BOTH DATE FIELDS OR NEITHER. A food row carries its day TWICE — date_str,
  // which the Day page filters on, and logged_at, which the feed and every
  // ordering read. Moving one and not the other is the "half-move" the app's
  // own applyFoodEdit carries a warning about: the meal lands on the new day in
  // one place and stays on the old day everywhere else. So this door accepts
  // logged_at, and a caller moving a meal sends both.
  logged_at: (v) => isoTs(v),
};

// args: { client_code, id, and at least one of MEAL_EDIT_FIELDS }
async function handleMealEdit(URL, SERVICE, args) {
  let id, code, patch;
  try {
    id = mealRowId(args.id);
    code = enc(args.client_code);
    patch = {};
    Object.keys(MEAL_EDIT_FIELDS).forEach((k) => {
      if (args[k] !== undefined) patch[k] = MEAL_EDIT_FIELDS[k](args[k]);
    });
  } catch (e) { return json(400, { error: 'bad_arg' }); }

  // AN EMPTY PATCH IS NOT A WRITE. PostgREST answers an empty body with 204 and
  // touches nothing, so sending {} would hand back a confident success over a
  // row that never changed — the cardinal lie with a 2xx on it. Measured while
  // proving the hole above: an empty PATCH answered 204 even against a filter
  // naming a column that does not exist. Refused here instead.
  if (!Object.keys(patch).length) return json(400, { error: 'nothing_to_change' });

  try {
    const filter = `food_logs?id=eq.${encodeURIComponent(id)}&client_code=eq.${code}`;
    const w = await fetch(`${URL}/rest/v1/${filter}`, {
      method: 'PATCH',
      headers: Object.assign({}, svc(SERVICE), { 'Content-Type': 'application/json', Prefer: 'return=representation' }),
      body: JSON.stringify(patch),
    });
    const text = await w.text();
    if (!w.ok) {
      console.error('trainer: mealEdit failed', w.status, text.slice(0, 300));
      return json(502, { error: 'write_failed', op: 'mealEdit', detail: text.slice(0, 200) });
    }
    let rows = []; try { rows = JSON.parse(text); } catch (e) {}
    if (!rows.length) return json(404, { error: 'not_yours_or_missing', op: 'mealEdit', id: id });

    // THE READ-BACK IS THE PROOF, field by field against what was sent — not the
    // 2xx, and not the fact that a row came back at all.
    //
    // COMPARED BY TYPE, NOT AS STRINGS. A timestamp does not survive a string
    // comparison: we send "2026-08-28T16:00:00.000Z" and Postgres hands back
    // "2026-08-28T16:00:00+00:00". Those are the same instant and different
    // text, so a string check would call every single day-move unconfirmed and
    // refuse a write that landed perfectly. Numbers get the same treatment for
    // the same reason — 320 and "320" are one value here.
    const landed = rows[0];
    const wrong = Object.keys(patch).filter((k) => {
      const want = patch[k], got = landed[k];
      if (k === 'logged_at') {
        const a = new Date(want), b = new Date(got);
        return isNaN(a) || isNaN(b) || a.getTime() !== b.getTime();
      }
      if (typeof want === 'number') return Math.round(Number(got) || 0) !== Math.round(want);
      return String(got) !== String(want);
    });
    if (wrong.length) {
      return json(502, { error: 'unconfirmed', op: 'mealEdit', id: id, fields: wrong });
    }
    // THE WHOLE ROW GOES BACK, not a projection. The caller does its own
    // field-by-field check against what it sent (the app's _foodEditLanded), and
    // a projection that dropped emoji, sugar, insight or felt would fail that
    // check for fields that landed perfectly well.
    return json(200, [Object.assign({}, landed, {
      changed: Object.keys(patch),
      confirmed_by_read_back: true,
    })]);
  } catch (e) {
    console.error('trainer: mealEdit threw', e && e.message);
    return json(502, { error: 'write_failed', op: 'mealEdit' });
  }
}

// args: { client_code, id }
async function handleMealDelete(URL, SERVICE, args) {
  let id, code;
  try { id = mealRowId(args.id); code = enc(args.client_code); }
  catch (e) { return json(400, { error: 'bad_arg' }); }
  try {
    const filter = `food_logs?id=eq.${encodeURIComponent(id)}&client_code=eq.${code}`;
    const w = await fetch(`${URL}/rest/v1/${filter}`, {
      method: 'DELETE',
      headers: Object.assign({}, svc(SERVICE), { Prefer: 'return=representation' }),
    });
    const text = await w.text();
    if (!w.ok) {
      console.error('trainer: mealDelete failed', w.status, text.slice(0, 300));
      return json(502, { error: 'write_failed', op: 'mealDelete', detail: text.slice(0, 200) });
    }
    let rows = []; try { rows = JSON.parse(text); } catch (e) {}
    if (!rows.length) return json(404, { error: 'not_yours_or_missing', op: 'mealDelete', id: id });
    const gone = rows[0];

    // A SECOND, INDEPENDENT READ. The representation says what PostgREST claims
    // it removed; this asks the table whether the row is actually absent. A
    // delete is the one act that cannot be inspected afterwards by the person it
    // happened to, so "deleted" is made a fact here rather than a return value.
    const chk = await fetch(`${URL}/rest/v1/food_logs?id=eq.${encodeURIComponent(id)}&select=id&limit=1`,
      { headers: svc(SERVICE) });
    if (!chk.ok) return json(502, { error: 'unconfirmed', op: 'mealDelete', id: id });
    let still = []; try { still = JSON.parse(await chk.text()) || []; } catch (e) { still = []; }
    if (still.length) return json(502, { error: 'unconfirmed', op: 'mealDelete', id: id, still_there: true });

    // The row that was destroyed, handed back so the caller can NAME the meal it
    // removed instead of saying a bare "done".
    return json(200, [{
      id: gone.id, client_code: gone.client_code, name: gone.name,
      calories: gone.calories, meal: gone.meal, eat_time: gone.eat_time,
      date_str: gone.date_str, logged_at: gone.logged_at,
      deleted: true, confirmed_by_read_back: true,
    }]);
  } catch (e) {
    console.error('trainer: mealDelete threw', e && e.message);
    return json(502, { error: 'write_failed', op: 'mealDelete' });
  }
}

// ---- consultInsert ----------------------------------------------------------
// Yusuf booking a consult for a lead he is already mid-text with, without
// touching the offer page. Sits beside consultList and consultSetStatus and is
// NOT a widening of anon's carve-out: strangers still INSERT this table with
// the public key exactly as documented, and that stays load-bearing for the
// offer page. This is a second door beside it, trainer-gated.
//
// args: { name, phone?, requested_at (ISO instant), dry_run?, force? }
//
// STATUS IS ALWAYS 'accepted', NEVER 'pending'. consult-availability.js filters
// the public busy list on status=eq.accepted and nothing else, so a row written
// as pending leaves its slot on sale to strangers and double-books the very
// lead it was booked for. There is no review step in this system anyway — every
// row the offer page writes lands accepted too — so 'pending' would be a state
// nothing produces and nothing consumes, and it is not offered as an option
// here at all.
//
// EVERY INTAKE ANSWER IS LEFT NULL. There are no answers: nobody filled in a
// form. Writing a placeholder into goal or main_problem would be inventing a
// prospect's words. The panel handles it — _cqRowHtml guards every intake
// field individually, so a bare row renders as name, time and Cancel with no
// empty labels, and _cqGroups sorts only on requested_at and status.
//
// IT COLLIDES LIKE bookCallForClient, deliberately the same contract. The whole
// reason 'accepted' matters is double-booking; an op that could itself book a
// consult on top of a client's call would recreate the exact failure it exists
// to prevent. Same dry_run preview, same conflict + nearest_open, same force.
async function handleConsultInsert(URL, SERVICE, args) {
  let name, phone, startMs;
  try {
    name = str(args.name, 200);
    if (!name) throw new Error('bad_arg');
    phone = args.phone != null && args.phone !== '' ? nullableStr(args.phone, 40) : null;
    startMs = new Date(isoTs(args.requested_at)).getTime();
  } catch (e) { return json(400, { error: 'bad_arg' }); }
  if (startMs < Date.now() - 60 * 60000) return json(400, { error: 'in_the_past' });

  try {
    const pad = (NEAR_SPAN_MIN + 24 * 60) * 60000;
    const b = await collectBusy(URL, SERVICE, startMs - pad, startMs + pad);
    if (!b.ok) return json(502, { error: 'availability_unknown', source: b.source });

    const clash = firstClash(startMs, CONSULT_MIN, b.busy);
    const near = clash ? nearestOpen(startMs, CONSULT_MIN, b.busy, 3) : [];
    const shape = {
      name: name, phone: phone,
      requested_at: new Date(startMs).toISOString(),
      ends_at: new Date(startMs + CONSULT_MIN * 60000).toISOString(),
      duration_minutes: CONSULT_MIN, status: 'accepted', source: 'trainer',
      conflict: clash ? { kind: clash.kind, client_code: clash.client_code || null,
        label: clash.label || null, starts_at: new Date(clash.starts).toISOString(),
        ends_at: new Date(clash.ends).toISOString() } : null,
      nearest_open: near,
    };

    if (args.dry_run === true) return json(200, [Object.assign({ preview: true }, shape)]);
    if (clash && args.force !== true) {
      return json(409, { error: 'slot_taken', conflict: shape.conflict, nearest_open: near });
    }

    // Exactly the columns the offer page writes, plus source. Every intake
    // answer is simply absent rather than null-valued — the column default
    // does the rest, and an absent key is what keeps this identical to a row
    // the page wrote.
    // phone is NOT NULL on this table with no default, so a null here fails
    // the whole insert with 23502 — which is exactly what happened: every
    // in-app booking failed from the moment this op shipped, because no
    // trainer-side caller supplies a number (booking a lead by name alone
    // never asks for one) while the offer page's own form always does.
    // '' is the honest value: no contact info on file, not a fabricated one.
    // Every consumer already tests phone for truthiness rather than for null
    // — the panel row, its action strip, the cancel prompt and the notify
    // email — so '' and null render identically as "none", and nothing
    // anywhere queries this column for IS NULL. Checked, not assumed.
    const row = {
      name: name, phone: phone || '',
      requested_at: shape.requested_at,
      status: 'accepted',
      source: 'trainer',
    };
    let w = await fetch(`${URL}/rest/v1/consult_requests`, {
      method: 'POST',
      headers: Object.assign({}, svc(SERVICE), { 'Content-Type': 'application/json', Prefer: 'return=representation' }),
      body: JSON.stringify(row),
    });
    let text = await w.text();
    // Same schema self-heal as bookings.spent: `source` ships in this pass and
    // the SQL does not land at the instant the deploy does. Without the column
    // the row still books — it just cannot be told apart from a page booking,
    // which is a smaller problem than not booking at all.
    if (!w.ok && badColumn(text) === 'source') {
      console.warn('trainer: consult_requests has no column "source" — writing without it');
      delete row.source;
      w = await fetch(`${URL}/rest/v1/consult_requests`, {
        method: 'POST',
        headers: Object.assign({}, svc(SERVICE), { 'Content-Type': 'application/json', Prefer: 'return=representation' }),
        body: JSON.stringify(row),
      });
      text = await w.text();
    }
    if (!w.ok) {
      console.error('trainer: consultInsert write failed', w.status, text.slice(0, 300));
      return json(502, { error: 'write_failed', op: 'consultInsert', detail: text.slice(0, 200) });
    }
    let landed = []; try { landed = JSON.parse(text); } catch (e) {}
    const id = landed[0] && landed[0].id;
    if (id == null) return json(502, { error: 'unconfirmed', op: 'consultInsert' });

    // Read it back off the table, selecting exactly what consultList selects
    // so what comes back here is what the panel will show.
    const rb = await fetch(`${URL}/rest/v1/consult_requests?id=eq.${encodeURIComponent(id)}`
      + '&select=id,name,phone,requested_at,status,created_at&limit=1', { headers: svc(SERVICE) });
    if (!rb.ok) return json(502, { error: 'unconfirmed', op: 'consultInsert', id: id });
    const back = (await rb.json() || [])[0];
    if (!back || back.status !== 'accepted') {
      return json(502, { error: 'unconfirmed', op: 'consultInsert', id: id, read_back: back || null });
    }
    return json(200, [Object.assign({}, back, {
      source: landed[0].source != null ? landed[0].source : null,
      source_column_missing: landed[0].source === undefined,
      conflict: shape.conflict, forced: !!(clash && args.force === true),
    })]);
  } catch (e) {
    console.error('trainer: consultInsert threw', e && e.message);
    return json(502, { error: 'write_failed', op: 'consultInsert' });
  }
}

// ---- cancelCallForClient ----------------------------------------------------
// args: { booking_id } or { client_code, starts_at }
//
// Undo for everything above. A voice layer that can book and cannot unbook is
// a layer that turns a misheard sentence into a standing appointment, so this
// ships with the booking op rather than after it.
//
// THE REFUND IS ONLY EVER GIVEN BACK WHEN IT CAN BE PROVED IT WAS TAKEN:
//   - bookings.spent says what this op charged. That's authoritative.
//   - Without it (a client's own booking, or one made before that column
//     existed), a weekly spend is recognised by TIMING: the client is on the
//     weekly tier, their weekly_call_spent_at is inside the current week, and
//     it lands within ten minutes of this booking's created_at. The spend
//     fires immediately after the booking is created, so that window is a real
//     link and not a guess — and a later booking moves the stamp, which
//     correctly makes the earlier booking stop matching.
//   - A one-off credit with no recorded spend is NOT refunded automatically.
//     Nothing in the row proves a credit was taken for it, and inventing one
//     hands out a free call. The answer says refund:'none' with the reason, so
//     Yusuf can give one back with the "+1 call" control he already has.
const SPEND_LINK_MS = 10 * 60000;

async function handleCancelCallForClient(URL, SERVICE, args) {
  // Validated BEFORE the try, not inside it. A validator throwing inside a
  // catch-all comes back as 502 write_failed, which reads as "the database is
  // unwell" for what is only a malformed request — and 502-vs-400 is exactly
  // the signal anything probing this door uses to tell a real op from a typo.
  let path;
  try {
    if (args.booking_id != null) {
      path = `bookings?id=eq.${encId(args.booking_id)}`;
    } else {
      const code = enc(args.client_code);
      const at = isoTs(args.starts_at);
      path = `bookings?client_code=eq.${code}&starts_at=eq.${encodeURIComponent(at)}`;
    }
  } catch (e) { return json(400, { error: 'bad_arg' }); }
  try {
    const rRes = await fetch(`${URL}/rest/v1/${path}`
      + '&select=id,client_code,starts_at,duration_min,status,spent,created_at&limit=2',
      { headers: svc(SERVICE) });
    let rText = await rRes.text();
    let hasSpentCol = true;
    if (!rRes.ok && badColumn(rText) === 'spent') {
      hasSpentCol = false;
      const r2 = await fetch(`${URL}/rest/v1/${path}`
        + '&select=id,client_code,starts_at,duration_min,status,created_at&limit=2', { headers: svc(SERVICE) });
      rText = await r2.text();
      if (!r2.ok) return json(502, { error: 'query_failed', op: 'cancelCallForClient' });
    } else if (!rRes.ok) {
      return json(502, { error: 'query_failed', op: 'cancelCallForClient' });
    }
    let rows = []; try { rows = JSON.parse(rText); } catch (e) {}
    if (!rows.length) return json(404, { error: 'no_such_booking' });
    if (rows.length > 1) return json(409, { error: 'ambiguous', count: rows.length });
    const bk = rows[0];
    if (String(bk.status || 'booked') === 'cancelled') {
      return json(200, [Object.assign({}, bk, { already_cancelled: true, refund: 'none' })]);
    }

    const client = await readClientRow(URL, SERVICE, bk.client_code);
    if (!client) return json(404, { error: 'no_such_client' });

    // Decide the refund BEFORE cancelling, off the booking as it stands.
    let refund = 'none', refundWhy = null;
    const recorded = hasSpentCol ? (bk.spent || null) : null;
    if (recorded === 'weekly' || recorded === 'credit') {
      refund = recorded;
      refundWhy = 'recorded on the booking';
    } else if (client.weekly_calls === true && client.weekly_call_spent_at
        && !hasWeeklyCreditNow(client.weekly_call_spent_at, new Date())) {
      const made = new Date(bk.created_at).getTime();
      const spentAt = new Date(client.weekly_call_spent_at).getTime();
      if (isFinite(made) && isFinite(spentAt) && Math.abs(spentAt - made) <= SPEND_LINK_MS) {
        refund = 'weekly';
        refundWhy = 'this booking is the one holding their weekly credit';
      } else {
        refundWhy = 'their weekly credit is held by a different booking';
      }
    } else if (recorded == null) {
      refundWhy = 'nothing on this booking records a credit being spent for it';
    }

    const cRes = await fetch(`${URL}/rest/v1/bookings?id=eq.${encodeURIComponent(bk.id)}`, {
      method: 'PATCH',
      headers: Object.assign({}, svc(SERVICE), { 'Content-Type': 'application/json', Prefer: 'return=representation' }),
      body: JSON.stringify({ status: 'cancelled' }),
    });
    const cText = await cRes.text();
    if (!cRes.ok) {
      console.error('trainer: cancelCallForClient write failed', cRes.status, cText.slice(0, 300));
      return json(502, { error: 'write_failed', op: 'cancelCallForClient' });
    }

    let refunded = 'none', refundError = null;
    if (refund === 'weekly') {
      // Guarded on the exact stamp just read: if another booking spent it in
      // between, this clears nothing rather than handing back someone else's.
      const gRes = await fetch(`${URL}/rest/v1/clients?code=eq.${encodeURIComponent(bk.client_code)}`
        + `&weekly_call_spent_at=eq.${encodeURIComponent(client.weekly_call_spent_at)}`, {
        method: 'PATCH',
        headers: Object.assign({}, svc(SERVICE), { 'Content-Type': 'application/json', Prefer: 'return=representation' }),
        body: JSON.stringify({ weekly_call_spent_at: null }),
      });
      const gText = await gRes.text();
      let gRows = []; try { gRows = JSON.parse(gText); } catch (e) {}
      if (gRes.ok && gRows.length) refunded = 'weekly';
      else refundError = 'weekly credit not returned (it moved under this request)';
    } else if (refund === 'credit') {
      const cur = +client.call_credits || 0;
      const gRes = await fetch(`${URL}/rest/v1/clients?code=eq.${encodeURIComponent(bk.client_code)}&call_credits=eq.${cur}`, {
        method: 'PATCH',
        headers: Object.assign({}, svc(SERVICE), { 'Content-Type': 'application/json', Prefer: 'return=representation' }),
        body: JSON.stringify({ call_credits: cur + 1 }),
      });
      const gText = await gRes.text();
      let gRows = []; try { gRows = JSON.parse(gText); } catch (e) {}
      if (gRes.ok && gRows.length) refunded = 'credit';
      else refundError = 'call credit not returned (it moved under this request)';
    }

    // Read both sides back — the booking AND the account it was charged to.
    const vb = await fetch(`${URL}/rest/v1/bookings?id=eq.${encodeURIComponent(bk.id)}&select=id,client_code,starts_at,status&limit=1`,
      { headers: svc(SERVICE) });
    let after = null;
    if (vb.ok) { const arr = await vb.json(); after = (arr && arr[0]) || null; }
    if (!after || String(after.status) !== 'cancelled') {
      return json(502, { error: 'unconfirmed', op: 'cancelCallForClient', booking_id: bk.id });
    }
    const clientAfter = await readClientRow(URL, SERVICE, bk.client_code);

    return json(200, [Object.assign({}, after, {
      refund: refunded, refund_reason: refundWhy, refund_error: refundError,
      call_credits: clientAfter ? clientAfter.call_credits : null,
      weekly_call_spent_at: clientAfter ? clientAfter.weekly_call_spent_at : null,
    })]);
  } catch (e) {
    console.error('trainer: cancelCallForClient threw', e && e.message);
    return json(502, { error: 'write_failed', op: 'cancelCallForClient' });
  }
}

// ---- moveVipOccurrence ------------------------------------------------------
// args: { client_code, date (YYYY-MM-DD, the occurrence as the RULE places it),
//         action: 'move' | 'skip' | 'restore',
//         new_time?  (HH:MM, move only), new_date? (move only),
//         vip_call_id? (only needed when a client holds more than one block) }
//
// THE SERIES IS NEVER WRITTEN. Not by this op, not by any op it calls. Blake's
// row still says 09:30 after tomorrow becomes 09:45, because tomorrow's 09:45
// lives in a different table and is consulted at expansion time. That is the
// whole design: an exception is applied where the occurrence is COMPUTED, in
// all three places that compute one, so the public grid frees the old time,
// blocks the new one, and her own card reads the new time, from one fact.
// ---- vipOccurrences ---------------------------------------------------------
// args: { client_code?, days? (default 21, max 90) }
//
// The READ half of moveVipOccurrence, and the reason it exists: anything asked
// to move "tomorrow's call" has to know which real dates a block actually
// falls on before it can name one, and the arithmetic that answers that is
// this file's own expansion — not a fourth hand-rolled copy of it in whatever
// layer happens to ask. Returns rule_date (what moveVipOccurrence takes as its
// `date`) ALONGSIDE the resolved instant, so a caller can restate the
// occurrence in a human sentence and then act on it without re-deriving
// anything.
//
// Skipped occurrences are INCLUDED, flagged skipped:true. A day taken off that
// vanished from this list would be a day nobody could ever put back.
async function handleVipOccurrences(URL, SERVICE, args) {
  let code, days;
  try {
    code = args.client_code != null && args.client_code !== '' ? enc_raw(args.client_code) : null;
    days = args.days == null ? 21 : posInt(args.days, 90);
  } catch (e) { return json(400, { error: 'bad_arg' }); }
  try {
    const today = new Date(); today.setUTCHours(0, 0, 0, 0);
    const fromYmd = isoDayStr(today);
    const toYmd = isoDayStr(new Date(today.getTime() + days * 86400000));
    let path = 'vip_calls?select=id,client_code,weekdays,time_local,tz,duration_minutes,start_date,end_date,notes'
      + `&active=eq.true&start_date=lte.${encodeURIComponent(toYmd)}&end_date=gte.${encodeURIComponent(fromYmd)}&limit=200`;
    if (code) path += `&client_code=eq.${encodeURIComponent(code)}`;
    const r = await fetch(`${URL}/rest/v1/${path}`, { headers: svc(SERVICE) });
    if (!r.ok) return json(502, { error: 'query_failed', op: 'vipOccurrences' });
    const rules = await r.json() || [];
    const exc = await fetchVipExceptions(URL, SERVICE, rules.map((x) => x.id));
    // Unlike the busy list, this one may answer with what it has: a caller
    // choosing a date is looking at the answer, and the flag tells it whether
    // the exception layer was readable.
    const nowMs = Date.now();
    const fromMs = new Date(fromYmd + 'T00:00:00.000Z').getTime();
    const toMs = new Date(toYmd + 'T00:00:00.000Z').getTime() + 86400000;
    const out = expandVipOccurrences(rules, exc.by, fromYmd, toYmd, true)
      .filter((o) => o.at.getTime() >= Math.min(nowMs, toMs) - 0
        && o.at.getTime() >= fromMs && o.at.getTime() < toMs)
      .sort((a, b) => a.at - b.at)
      .map((o) => Object.assign({}, o, { at: o.at.toISOString() }));
    return json(200, out.map((o) => Object.assign({}, o, { exceptions_ok: exc.ok !== false })));
  } catch (e) {
    console.error('trainer: vipOccurrences threw', e && e.message);
    return json(502, { error: 'query_failed', op: 'vipOccurrences' });
  }
}

async function handleMoveVipOccurrence(URL, SERVICE, args) {
  let code, dateStr, action, newTime, newDate, wantId;
  try {
    code = enc_raw(args.client_code);
    dateStr = isoDate(args.date);
    action = String(args.action || 'move');
    if (action !== 'move' && action !== 'skip' && action !== 'restore') throw new Error('bad_arg');
    newTime = args.new_time != null && args.new_time !== '' ? timeLocal(args.new_time) : null;
    newDate = args.new_date != null && args.new_date !== '' ? isoDate(args.new_date) : null;
    if (action === 'move' && !newTime && !newDate) throw new Error('bad_arg');
    wantId = args.vip_call_id != null ? encId(args.vip_call_id) : null;
  } catch (e) { return json(400, { error: 'bad_arg' }); }

  try {
    const vRes = await fetch(`${URL}/rest/v1/vip_calls?client_code=eq.${encodeURIComponent(code)}&active=eq.true`
      + '&select=id,client_code,weekdays,time_local,tz,duration_minutes,start_date,end_date&limit=50',
      { headers: svc(SERVICE) });
    if (!vRes.ok) return json(502, { error: 'query_failed', op: 'moveVipOccurrence' });
    let rules = await vRes.json() || [];
    if (wantId) rules = rules.filter((r) => String(r.id) === String(wantId));
    // Only rules that actually fire on that date — naming a date the block
    // doesn't run is a mistake worth refusing, not a row worth writing.
    const dayMs = new Date(dateStr + 'T00:00:00.000Z').getTime();
    const dow = ((new Date(dayMs).getUTCDay() + 6) % 7) + 1;
    const fits = rules.filter((r) => Array.isArray(r.weekdays) && r.weekdays.includes(dow)
      && r.start_date <= dateStr && r.end_date >= dateStr);
    if (!fits.length) return json(404, { error: 'no_occurrence_on_that_date' });
    if (fits.length > 1) {
      return json(409, { error: 'ambiguous', candidates: fits.map((r) => ({ vip_call_id: r.id, time_local: r.time_local })) });
    }
    const rule = fits[0];

    if (action === 'restore') {
      const dRes = await fetch(`${URL}/rest/v1/vip_call_exceptions?vip_call_id=eq.${encodeURIComponent(rule.id)}`
        + `&occurrence_date=eq.${encodeURIComponent(dateStr)}`, {
        method: 'DELETE',
        headers: Object.assign({}, svc(SERVICE), { Prefer: 'return=representation' }),
      });
      const dText = await dRes.text();
      if (!dRes.ok) {
        if (missingTable(dText)) return json(503, { error: 'exceptions_table_missing' });
        return json(502, { error: 'write_failed', op: 'moveVipOccurrence' });
      }
      return json(200, [{ vip_call_id: rule.id, client_code: rule.client_code, occurrence_date: dateStr,
        action: 'restore', time_local: rule.time_local, tz: rule.tz,
        at: zonedTimeToUtc(dateStr, rule.time_local, rule.tz).toISOString() }]);
    }

    const body = {
      vip_call_id: rule.id,
      occurrence_date: dateStr,
      kind: action === 'skip' ? 'skip' : 'move',
      new_date: action === 'skip' ? null : newDate,
      new_time_local: action === 'skip' ? null : newTime,
    };
    const uRes = await fetch(`${URL}/rest/v1/vip_call_exceptions?on_conflict=vip_call_id,occurrence_date`, {
      method: 'POST',
      headers: Object.assign({}, svc(SERVICE), { 'Content-Type': 'application/json',
        Prefer: 'return=representation,resolution=merge-duplicates' }),
      body: JSON.stringify(body),
    });
    const uText = await uRes.text();
    if (!uRes.ok) {
      if (missingTable(uText)) return json(503, { error: 'exceptions_table_missing' });
      console.error('trainer: moveVipOccurrence write failed', uRes.status, uText.slice(0, 300));
      return json(502, { error: 'write_failed', op: 'moveVipOccurrence', detail: uText.slice(0, 200) });
    }

    // Read it back off the table, then re-expand the rule through the SAME
    // function the grid and the client's card use, so the answer is the
    // occurrence as they will actually see it — not as this op meant it.
    const rb = await fetch(`${URL}/rest/v1/vip_call_exceptions?vip_call_id=eq.${encodeURIComponent(rule.id)}`
      + `&occurrence_date=eq.${encodeURIComponent(dateStr)}&select=vip_call_id,occurrence_date,kind,new_date,new_time_local&limit=1`,
      { headers: svc(SERVICE) });
    if (!rb.ok) return json(502, { error: 'unconfirmed', op: 'moveVipOccurrence' });
    const back = (await rb.json() || [])[0];
    if (!back) return json(502, { error: 'unconfirmed', op: 'moveVipOccurrence' });

    const by = {}; by[String(rule.id)] = {}; by[String(rule.id)][dateStr] = back;
    const occ = expandVipOccurrences([rule], by, dateStr, dateStr).filter((o) => o.rule_date === dateStr);
    return json(200, [{
      vip_call_id: rule.id, client_code: rule.client_code, occurrence_date: dateStr,
      action: back.kind, new_time_local: back.new_time_local, new_date: back.new_date,
      series_time_local: rule.time_local, tz: rule.tz,
      at: occ.length ? occ[0].at.toISOString() : null,
    }]);
  } catch (e) {
    console.error('trainer: moveVipOccurrence threw', e && e.message);
    return json(502, { error: 'write_failed', op: 'moveVipOccurrence' });
  }
}

// ===== SHARED CALL NOTES ====================================================
// A thread hanging off ONE call, that both sides write into before it happens
// and that stays with the call afterwards as its record. Nothing here is
// private: the founding law of this lane is that both halves are visible to
// both people, so there is no "visible to" column and no way to add one
// without changing the table.
//
// WHAT IDENTIFIES A CALL. The brief named three kinds and there are only two.
// A moved or skipped occurrence is NOT a third thing — vip_call_exceptions is
// keyed on (vip_call_id, occurrence_date), the exact pair that already names
// the standing occurrence, and a move changes only what that pair RESOLVES to.
// So notes keyed on the rule date survive a move for free: shift Tuesday to
// 11:45 and Tuesday's notes are still Tuesday's notes. Key them on the moved
// instant instead and every move would orphan the thread it belongs to, which
// is precisely the failure worth designing out.
//
// That leaves two:
//   booking — a one-off row a client picked, identified by bookings.id
//   vip     — a standing occurrence, identified by (vip_call_id, rule date)
// Each carries its OWN key and nothing else, enforced by a check constraint,
// so no column is ever asked to mean two things depending on a sibling. That
// is the "no faking meaning into existing columns" the brief asked for, spent
// on two nullable id columns rather than one overloaded one.
//
// APPEND-ONLY. One row per note, never one row per occurrence with text
// rewritten into it — "a second write appends rather than overwrites" is a
// property of the table's shape here, not of a careful caller.
const CALL_NOTE_MAX = 2000;

function noteSource(v) {
  const s = String(v || '');
  if (s !== 'booking' && s !== 'vip') throw new Error('bad_arg');
  return s;
}
function threadKeyOf(n) {
  return n.source === 'booking' ? ('booking:' + n.booking_id)
    : ('vip:' + n.vip_call_id + ':' + String(n.occurrence_date).slice(0, 10));
}

// Turn args naming an occurrence into a VERIFIED occurrence, or refuse.
//
// forCode is the whole of a client session's authority: pass the session's own
// claim and the occurrence must belong to it, or this answers not_yours. Pass
// null (trainer) and any occurrence resolves. A client naming someone else's
// booking id is the obvious attack on a feature like this and it is answered
// here, once, rather than in each caller.
async function resolveOccurrenceSpec(URL, SERVICE, args, forCode) {
  const source = noteSource(args.source);

  if (source === 'booking') {
    const id = encId(args.booking_id);
    const r = await fetch(`${URL}/rest/v1/bookings?id=eq.${id}&select=id,client_code,starts_at,status&limit=1`,
      { headers: svc(SERVICE) });
    if (!r.ok) return { error: 'query_failed' };
    const row = (await r.json() || [])[0];
    if (!row) return { error: 'no_such_occurrence' };
    if (forCode && String(row.client_code) !== String(forCode)) return { error: 'not_yours' };
    return { occ: { source: 'booking', booking_id: row.id, vip_call_id: null, occurrence_date: null,
      client_code: row.client_code, occurs_at: row.starts_at,
      cancelled: String(row.status || 'booked') === 'cancelled' } };
  }

  const vid = encId(args.vip_call_id);
  const date = isoDate(args.occurrence_date);
  const r = await fetch(`${URL}/rest/v1/vip_calls?id=eq.${vid}`
    + '&select=id,client_code,weekdays,time_local,tz,duration_minutes,start_date,end_date,active&limit=1',
    { headers: svc(SERVICE) });
  if (!r.ok) return { error: 'query_failed' };
  const rule = (await r.json() || [])[0];
  if (!rule) return { error: 'no_such_occurrence' };
  if (forCode && String(rule.client_code) !== String(forCode)) return { error: 'not_yours' };
  // The date must be one the rule actually fires on. A thread against a date
  // the block never runs is a thread nothing will ever surface, and writing it
  // would look like it worked.
  const dow = ((new Date(date + 'T00:00:00.000Z').getUTCDay() + 6) % 7) + 1;
  if (!Array.isArray(rule.weekdays) || !rule.weekdays.includes(dow)
      || rule.start_date > date || rule.end_date < date) {
    return { error: 'no_occurrence_on_that_date' };
  }
  const exc = await fetchVipExceptions(URL, SERVICE, [rule.id]);
  const occ = expandVipOccurrences([rule], exc.by, date, date, true).filter((o) => o.rule_date === date)[0];
  return { occ: { source: 'vip', booking_id: null, vip_call_id: rule.id, occurrence_date: date,
    client_code: rule.client_code,
    occurs_at: (occ && occ.at) ? occ.at.toISOString() : null,
    skipped: !!(occ && occ.skipped), moved: !!(occ && occ.moved) } };
}

// Attach the resolved instant to a page of notes, in TWO batch reads rather
// than one per note. occurs_at is deliberately not stored on the row: a moved
// occurrence would make a stored copy wrong, and this system already has one
// place that computes an occurrence from a rule. Both sides therefore always
// read the same time, because they both read it from the same computation.
async function attachOccurrences(URL, SERVICE, notes) {
  const bookingIds = [...new Set(notes.filter((n) => n.source === 'booking').map((n) => n.booking_id))];
  const vipIds = [...new Set(notes.filter((n) => n.source === 'vip').map((n) => n.vip_call_id))];
  const bookingBy = {}, vipBy = {};

  if (bookingIds.length) {
    const r = await fetch(`${URL}/rest/v1/bookings?id=in.(${bookingIds.map(encodeURIComponent).join(',')})`
      + '&select=id,starts_at,duration_min,status&limit=1000', { headers: svc(SERVICE) });
    if (r.ok) (await r.json() || []).forEach((b) => { bookingBy[String(b.id)] = b; });
  }
  if (vipIds.length) {
    const r = await fetch(`${URL}/rest/v1/vip_calls?id=in.(${vipIds.map(encodeURIComponent).join(',')})`
      + '&select=id,client_code,weekdays,time_local,tz,duration_minutes,start_date,end_date&limit=200',
      { headers: svc(SERVICE) });
    if (r.ok) {
      const rules = await r.json() || [];
      const exc = await fetchVipExceptions(URL, SERVICE, rules.map((x) => x.id));
      const dates = notes.filter((n) => n.source === 'vip').map((n) => String(n.occurrence_date).slice(0, 10)).sort();
      if (dates.length) {
        expandVipOccurrences(rules, exc.by, dates[0], dates[dates.length - 1], true).forEach((o) => {
          vipBy[o.vip_call_id + ':' + o.rule_date] = o;
        });
      }
    }
  }

  return notes.map((n) => {
    const out = Object.assign({}, n, { thread_key: threadKeyOf(n) });
    if (n.source === 'booking') {
      const b = bookingBy[String(n.booking_id)];
      out.occurs_at = b ? b.starts_at : null;
      out.duration_minutes = b ? b.duration_min : null;
      out.cancelled = b ? String(b.status || 'booked') === 'cancelled' : null;
    } else {
      const o = vipBy[n.vip_call_id + ':' + String(n.occurrence_date).slice(0, 10)];
      out.occurs_at = (o && o.at) ? o.at.toISOString() : null;
      out.duration_minutes = o ? o.duration_minutes : null;
      out.skipped = o ? !!o.skipped : null;
      out.moved = o ? !!o.moved : null;
    }
    return out;
  }).sort((a, b) => {
    const ta = a.occurs_at ? new Date(a.occurs_at).getTime() : 0;
    const tb = b.occurs_at ? new Date(b.occurs_at).getTime() : 0;
    if (ta !== tb) return ta - tb;                       // by the call they belong to
    return new Date(a.created_at) - new Date(b.created_at);  // then the order they were said in
  });
}

// READ. code=null is the trainer's roster-wide read; a client session always
// passes its own claim and can never pass anything else.
async function handleCallNotesRead(URL, SERVICE, code) {
  try {
    let path = 'call_notes?select=id,client_code,source,booking_id,vip_call_id,occurrence_date,'
      + 'author,author_code,body,created_at&order=created_at.asc&limit=1000';
    if (code) path += `&client_code=eq.${encodeURIComponent(code)}`;
    const r = await fetch(`${URL}/rest/v1/${path}`, { headers: svc(SERVICE) });
    const text = await r.text();
    if (!r.ok) {
      // The table ships with this code and the SQL lands after it. No notes yet
      // is the truth during that window, and it is not an error.
      if (missingTable(text)) return json(200, []);
      console.error('trainer: call notes read failed', r.status, text.slice(0, 300));
      return json(502, { error: 'query_failed', op: 'callNotes' });
    }
    let rows = []; try { rows = JSON.parse(text) || []; } catch (e) { rows = []; }
    if (!rows.length) return json(200, []);
    return json(200, await attachOccurrences(URL, SERVICE, rows));
  } catch (e) {
    console.error('trainer: call notes read threw', e && e.message);
    return json(502, { error: 'query_failed', op: 'callNotes' });
  }
}

// WRITE. authorCode is ALWAYS the verified session's own claim, never args —
// a session already proved who is asking, so asking again in the body would
// just be trusting the caller about its own name. forCode is null for a
// trainer (any client's call) and the session's own code for a client (only
// their own).
// ---- myPhoneSet -------------------------------------------------------------
// THE REASON A CLIENT'S NUMBER SAVED NOWHERE USEFUL (Yusuf, 4 Sep: "it saves it
// no where useful ... make it actually save where i can text them directly").
//
// There was no client-side path into clients.phone AT ALL. clientPatch is behind
// the is_trainer gate, so anything a client typed could only ever land in
// profiles - and the Text button, the share sheet and the whole roster read
// clients.phone. The number was saved. It was saved somewhere nothing reads.
//
// THE CODE COMES FROM THE SESSION, NEVER FROM args. Same rule as every my* op
// above: a client can write exactly one row, their own, and there is no argument
// that can point this at somebody else.
//
// READ BACK, because a write that is not read back is a claim. The row the
// service key just wrote comes back and the digits are compared; anything else
// is reported as unconfirmed rather than answered with a cheerful ok.
// ---- myPhoneHas -------------------------------------------------------------
// A CLIENT CANNOT SEE ANY PHONE, INCLUDING THEIR OWN. The anon-tier roster read
// selects code, name, initials, coach_code, is_trainer, is_primary, active,
// hidden and blocked, and phone is deliberately not in it. So the card that asks
// for a number had no way to know whether it was already answered, and would
// have asked every client on the roster forever.
//
// This answers the ONE bit it needs and hands back no number at all: whether the
// caller's own row has one. Nothing else leaves the door.
async function handleMyPhoneHas(URL, SERVICE, myCode) {
  if (!myCode) return json(403, { error: 'no_session' });
  try {
    const r = await fetch(`${URL}/rest/v1/clients?select=phone&code=eq.${enc(myCode)}&limit=1`, { headers: svc(SERVICE) });
    const text = await r.text();
    if (!r.ok) {
      console.error('trainer: myPhoneHas read failed', r.status, text.slice(0, 200));
      return json(502, { error: 'query_failed', op: 'myPhoneHas' });
    }
    let rows = []; try { rows = JSON.parse(text); } catch (e) {}
    // NO ROW IS NOT "NO PHONE". Answering false there would put the card in front
    // of somebody whose record simply could not be read, so it says so instead.
    if (!rows.length) return json(200, [{ known: false, has_phone: null }]);
    const p = rows[0] && rows[0].phone;
    return json(200, [{ known: true, has_phone: !!(p && String(p).replace(/\D/g, '').length >= 10) }]);
  } catch (e) {
    console.error('trainer: myPhoneHas threw', e && e.message);
    return json(502, { error: 'query_failed', op: 'myPhoneHas' });
  }
}

async function handleMyPhoneSet(URL, SERVICE, args, myCode) {
  if (!myCode) return json(403, { error: 'no_session' });
  let want;
  try {
    want = nullableStr(args.phone, 40);
    const digits = String(want || '').replace(/\D/g, '');
    // 10 is a bare US number, 11 with the country code. Below that it is a typo,
    // and refusing is kinder than storing something that will never dial.
    if (digits.length < 10 || digits.length > 15) throw new Error('bad_arg');
  } catch (e) { return json(400, { error: 'bad_phone' }); }

  try {
    const w = await fetch(`${URL}/rest/v1/clients?code=eq.${enc(myCode)}`, {
      method: 'PATCH',
      headers: Object.assign({}, svc(SERVICE), { 'Content-Type': 'application/json', Prefer: 'return=representation' }),
      body: JSON.stringify({ phone: want }),
    });
    const text = await w.text();
    if (!w.ok) {
      console.error('trainer: myPhoneSet write failed', w.status, text.slice(0, 300));
      return json(502, { error: 'write_failed', op: 'myPhoneSet' });
    }
    let rows = []; try { rows = JSON.parse(text); } catch (e) {}
    const got = rows[0] ? String(rows[0].phone == null ? '' : rows[0].phone) : '';
    if (got.replace(/\D/g, '') !== String(want).replace(/\D/g, '')) {
      return json(502, { error: 'unconfirmed', op: 'myPhoneSet' });
    }
    return json(200, [{ client_code: myCode, phone: got }]);
  } catch (e) {
    console.error('trainer: myPhoneSet threw', e && e.message);
    return json(502, { error: 'write_failed', op: 'myPhoneSet' });
  }
}

async function handleCallNoteAdd(URL, SERVICE, args, authorCode, asTrainer, forCode) {
  let body;
  try {
    body = str(args.body, CALL_NOTE_MAX);
    if (!body) throw new Error('bad_arg');
  } catch (e) { return json(400, { error: 'bad_arg' }); }

  let spec;
  try { spec = await resolveOccurrenceSpec(URL, SERVICE, args, forCode); }
  catch (e) { return json(400, { error: 'bad_arg' }); }
  if (spec.error) {
    const code = spec.error === 'query_failed' ? 502 : (spec.error === 'not_yours' ? 403 : 404);
    if (spec.error === 'not_yours') console.warn('trainer: session tried to write notes on another client\'s call', forCode);
    return json(code, { error: spec.error });
  }
  const o = spec.occ;

  try {
    const row = {
      client_code: o.client_code, source: o.source,
      booking_id: o.booking_id, vip_call_id: o.vip_call_id, occurrence_date: o.occurrence_date,
      author: asTrainer ? 'trainer' : 'client', author_code: authorCode, body: body,
    };
    const w = await fetch(`${URL}/rest/v1/call_notes`, {
      method: 'POST',
      headers: Object.assign({}, svc(SERVICE), { 'Content-Type': 'application/json', Prefer: 'return=representation' }),
      body: JSON.stringify(row),
    });
    const text = await w.text();
    if (!w.ok) {
      if (missingTable(text)) return json(503, { error: 'notes_table_missing' });
      console.error('trainer: call note write failed', w.status, text.slice(0, 300));
      return json(502, { error: 'write_failed', op: 'callNoteAdd', detail: text.slice(0, 200) });
    }
    let landed = []; try { landed = JSON.parse(text); } catch (e) {}
    const id = landed[0] && landed[0].id;
    if (id == null) return json(502, { error: 'unconfirmed', op: 'callNoteAdd' });

    // READ IT BACK, and read back the WHOLE THREAD while we are here — the
    // caller's next act is to render the conversation, and a write that
    // answers with only its own half invites a second round trip that could
    // disagree with it.
    const key = threadKeyOf(o);
    let tPath = 'call_notes?select=id,client_code,source,booking_id,vip_call_id,occurrence_date,'
      + 'author,author_code,body,created_at&order=created_at.asc&limit=500'
      + `&client_code=eq.${encodeURIComponent(o.client_code)}`;
    tPath += o.source === 'booking'
      ? `&source=eq.booking&booking_id=eq.${encodeURIComponent(o.booking_id)}`
      : `&source=eq.vip&vip_call_id=eq.${encodeURIComponent(o.vip_call_id)}&occurrence_date=eq.${encodeURIComponent(o.occurrence_date)}`;
    const tr = await fetch(`${URL}/rest/v1/${tPath}`, { headers: svc(SERVICE) });
    if (!tr.ok) return json(502, { error: 'unconfirmed', op: 'callNoteAdd', id: id });
    const thread = await tr.json() || [];
    if (!thread.some((n) => String(n.id) === String(id))) {
      return json(502, { error: 'unconfirmed', op: 'callNoteAdd', id: id });
    }
    const resolved = await attachOccurrences(URL, SERVICE, thread);
    return json(200, resolved.map((n) => Object.assign({}, n, {
      thread_key: key, just_added: String(n.id) === String(id),
      occurrence_skipped: o.skipped === true, occurrence_cancelled: o.cancelled === true,
    })));
  } catch (e) {
    console.error('trainer: call note write threw', e && e.message);
    return json(502, { error: 'write_failed', op: 'callNoteAdd' });
  }
}

// DELETE. byCode non-null means "only your own words" — a client may unsay
// what they said and nothing else. The trainer may remove any, because this
// door is the only road into the table and a table with no reverse gear on
// its only road in is permanent-mistake territory. Not privacy: both sides
// still see everything that exists.
async function handleCallNoteDelete(URL, SERVICE, args, byCode) {
  let path;
  try {
    path = `call_notes?id=eq.${encId(args.id)}`;
    if (byCode) path += `&author_code=eq.${enc(byCode)}`;
  } catch (e) { return json(400, { error: 'bad_arg' }); }
  try {
    const r = await fetch(`${URL}/rest/v1/${path}`, {
      method: 'DELETE',
      headers: Object.assign({}, svc(SERVICE), { Prefer: 'return=representation' }),
    });
    const text = await r.text();
    if (!r.ok) {
      if (missingTable(text)) return json(503, { error: 'notes_table_missing' });
      return json(502, { error: 'write_failed', op: 'callNoteDelete' });
    }
    let rows = []; try { rows = JSON.parse(text); } catch (e) {}
    // Empty means nothing matched — a wrong id, or somebody else's words.
    // Said plainly rather than reported as a success that removed nothing.
    if (!rows.length) return json(404, { error: 'no_such_note' });
    return json(200, rows);
  } catch (e) {
    console.error('trainer: call note delete threw', e && e.message);
    return json(502, { error: 'write_failed', op: 'callNoteDelete' });
  }
}

// ---- clientPlanSetDay -------------------------------------------------------
// The first trainer-authored write to ANOTHER client's training_plans. Until
// now every writer in the app wrote cl.code — the signed-in session's own — and
// there was no path that pointed one at somebody else. This is that path, and
// it is deliberately the narrowest one that answers the request that prompted
// it ("keep Mon–Thu, make Friday a Pilates day"): ONE named day, replaced whole.
//
// args: { client_code, day: 'Mon'|..|'Sun', type: string,
//         exercises: [{n, s, r, v?}], clear_week_override?, dry_run? }
//
// NO SPLIT CHANGES, NO DAY-COUNT CHANGES, NO MULTI-DAY EDITS. Those are real
// requests and they are real separate ops; folding them in here would mean one
// op whose blast radius nobody can state in a sentence.
//
// THE TEMPLATE, NOT THE WEEK OVERRIDE. `plan` is Yusuf's architecture and the
// thing a client's own week is derived from; week_overrides is where a
// client's own one-week moves land and is never touched here. When an override
// already sits on the named day, this SAYS SO rather than writing underneath
// it — a change the client cannot see is not a change.
//
// EXERCISES ARE ALWAYS THE CALLER'S. This function holds no template library
// on purpose: DAY_TEMPLATES and EX_LIB live in the page, and a second copy
// here would drift from them the first time either is edited. A caller that
// wants a known day type materialises it from the page's own tables and sends
// the result; a caller with no template that fits — which is every request for
// a Pilates day, because no such template exists — must send an explicit list
// or be told to ask Yusuf what belongs in the day.
const PLAN_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function planDayKey(v) {
  const s = String(v || '').trim();
  const hit = PLAN_DAYS.find((d) => d.toLowerCase() === s.toLowerCase());
  if (!hit) throw new Error('bad_arg');
  return hit;
}
function planExercises(v) {
  if (v == null) return null;
  if (!Array.isArray(v)) throw new Error('bad_arg');
  if (v.length > 20) throw new Error('bad_arg');
  return v.map((x) => {
    const n = str(x && x.n, 120);
    if (!n) throw new Error('bad_arg');
    const out = { n: n, s: posInt(x.s == null ? 3 : x.s, 20), r: str(x.r == null ? '' : x.r, 40) };
    // c and v are the exercise library's own fields (a cardio flag and a
    // variation note). Passed through when given, defaulted when not, never
    // invented from a name this file cannot look up.
    out.c = x.c ? 1 : 0;
    out.v = str(x.v == null ? '' : x.v, 200);
    return out;
  });
}
// Monday of the current week in the trainer's zone, in the same YYYY-MM-DD
// shape the page's _tpWeekKeyFor produces. Reported back on every answer so a
// zone disagreement shows up as a wrong-looking key rather than as a silently
// cleared week.
function currentWeekKey() {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: TRAINER_TZ, year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short',
  });
  const parts = {};
  dtf.formatToParts(new Date()).forEach((p) => { if (p.type !== 'literal') parts[p.type] = p.value; });
  const wdMap = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
  const d = new Date(Date.UTC(+parts.year, +parts.month - 1, +parts.day));
  d.setUTCDate(d.getUTCDate() - (wdMap[parts.weekday] || 0));
  return d.toISOString().slice(0, 10);
}

// ---- clientPlanSetWeek ------------------------------------------------------
// A trainer writing a NAMED client's whole training week in one upsert.
//
// WHY THIS EXISTS AT ALL. Nothing in the app can write another person's plan.
// Every in-page training_plans writer builds its body around cl.code — the
// signed-in account — so pointing any of them at a client would land the edit
// on YUSUF'S OWN ROW, silently, while appearing to work. clientPlanSetDay was
// the only cross-client writer and it refuses outright when the client has no
// saved plan row, which is most of them: a client's week is derived from their
// profile until somebody saves one. That refusal is why it was never usable
// and never called.
//
// So this op does the thing that was actually blocked: seven days, one write,
// and it CREATES the row when there is none instead of refusing.
//
// All seven days are REQUIRED, deliberately. The single-day op's own comment
// explains the trap: a row containing one day and six holes resolves to
// nothing on every other day, which is worse than the derived week it
// replaced. Requiring the full week makes a hole impossible to write.
//
// The client_code is an ARGUMENT here, which the my* ops never allow — so the
// gate is different in kind: this is dispatched after the is_trainer check,
// and a client session cannot reach it at all. The argument names WHO is
// edited; the verified session decides WHETHER anyone may be.
function planWeekDays(v) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error('bad_arg');
  const out = {};
  PLAN_DAYS.forEach((d) => {
    // Accept any casing the caller used, so "mon" and "Mon" both land on Mon.
    const key = Object.keys(v).find((k) => k.trim().toLowerCase() === d.toLowerCase());
    if (key == null) throw new Error('missing_day:' + d);
    const spec = v[key] || {};
    const type = str(spec.type, 60);
    if (!type) throw new Error('bad_arg');
    let ex = planExercises(spec.exercises == null ? [] : spec.exercises);
    if (ex == null) throw new Error('bad_arg');
    if (type.toLowerCase() === 'rest') ex = [];
    out[d] = { type: type, ex: ex };
  });
  return out;
}
// Two stored days are the same day when their values match, never when their
// stringified JSON matches — JSONB hands keys back in whatever order Postgres
// chose, and comparing blobs would report a false mismatch on a correct write.
function planDaySame(landed, want) {
  if (!landed || String(landed.type) !== String(want.type)) return false;
  const a = Array.isArray(landed.ex) ? landed.ex : [];
  if (a.length !== want.ex.length) return false;
  return a.every((e, i) => String(e.n) === String(want.ex[i].n)
    && (+e.s || 0) === (+want.ex[i].s || 0)
    && String(e.r || '') === String(want.ex[i].r || ''));
}

async function handleClientPlanSetWeek(URL, SERVICE, args) {
  let code, days;
  try {
    code = enc_raw(args.client_code);
    days = planWeekDays(args.days);
  } catch (e) {
    const m = String(e && e.message || '');
    if (m.indexOf('missing_day:') === 0) {
      return json(400, { error: 'missing_day', day: m.split(':')[1],
        detail: 'all seven days are required - a partial week would leave holes that resolve to nothing' });
    }
    return json(400, { error: 'bad_arg' });
  }

  try {
    // The target must be a real client. A plan written against a code with no
    // row is an orphan nothing renders and nothing cleans up.
    const who = await readClientRow(URL, SERVICE, code);
    if (!who) return json(404, { error: 'no_such_client', client_code: code });

    const rRes = await fetch(`${URL}/rest/v1/training_plans?client_code=eq.${encodeURIComponent(code)}`
      + '&select=id,client_code,plan,week_overrides,name,weeks&order=id.asc&limit=5', { headers: svc(SERVICE) });
    if (!rRes.ok) return json(502, { error: 'query_failed', op: 'clientPlanSetWeek' });
    const rows = await rRes.json() || [];
    if (rows.length > 1) return json(409, { error: 'ambiguous_plan_rows', count: rows.length });
    const row = rows[0] || null;
    const creating = !row;

    let plan = row ? row.plan : null;
    if (typeof plan === 'string') { try { plan = JSON.parse(plan); } catch (e) { plan = null; } }
    if (row && (!plan || typeof plan !== 'object')) return json(409, { error: 'plan_unreadable' });
    plan = plan || {};

    let ovs = row ? row.week_overrides : null;
    if (typeof ovs === 'string') { try { ovs = JSON.parse(ovs); } catch (e) { ovs = {}; } }
    ovs = ovs && typeof ovs === 'object' ? ovs : {};

    // Anything on the row that is not one of the seven weekday keys is kept
    // untouched — the '@YYYY-MM-DD' one-off day keys above all, which are a
    // specific date's session and have nothing to do with the template week.
    const oneOffs = Object.keys(plan).filter((k) => k.charAt(0) === '@');
    const otherKeys = Object.keys(plan).filter((k) => PLAN_DAYS.indexOf(k) === -1);
    const weekKey = currentWeekKey();
    const shadowedNow = ovs[weekKey] ? Object.keys(ovs[weekKey]).filter((d) => PLAN_DAYS.indexOf(d) > -1) : [];

    const before = {};
    PLAN_DAYS.forEach((d) => { before[d] = plan[d] ? plan[d].type : null; });

    if (args.dry_run === true) {
      return json(200, [{
        preview: true, client_code: code, client_name: who.name || code,
        creating_new_row: creating,
        before: before,
        after: PLAN_DAYS.reduce((o, d) => { o[d] = days[d].type; return o; }, {}),
        preserved_one_off_keys: oneOffs,
        week_key: weekKey, shadowed_now: shadowedNow,
      }]);
    }

    const nextPlan = Object.assign({}, plan);
    PLAN_DAYS.forEach((d) => { nextPlan[d] = days[d]; });

    const body = { client_code: code, plan: nextPlan, updated_at: new Date().toISOString() };
    // Only supplied on CREATE. Overwriting an existing plan's name or length
    // because a caller happened to pass one would be an edit nobody asked for.
    if (creating) {
      body.name = args.name != null ? str(args.name, 200) : '';
      body.weeks = args.weeks != null ? posInt(args.weeks, 52) : 4;
    }
    let clearedOverride = null;
    if (args.clear_week_overrides === true && ovs[weekKey]) {
      const nextOvs = Object.assign({}, ovs);
      delete nextOvs[weekKey];
      body.week_overrides = nextOvs;
      clearedOverride = weekKey;
    }
    // NEVER created_at — the column means "when this plan was first written",
    // and every training_plans writer in the app leaves it out for that reason.
    const wRes = await fetch(`${URL}/rest/v1/training_plans?on_conflict=client_code`, {
      method: 'POST',
      headers: Object.assign({}, svc(SERVICE), { 'Content-Type': 'application/json',
        Prefer: 'return=representation,resolution=merge-duplicates' }),
      body: JSON.stringify(body),
    });
    const wText = await wRes.text();
    if (!wRes.ok) {
      console.error('trainer: clientPlanSetWeek write failed', wRes.status, wText.slice(0, 300));
      return json(502, { error: 'write_failed', op: 'clientPlanSetWeek', detail: wText.slice(0, 200) });
    }

    // THE READ-BACK IS THE PROOF, for all seven, compared value by value. A
    // partial write says exactly which days landed rather than reporting a
    // whole week that is not there.
    const vRes = await fetch(`${URL}/rest/v1/training_plans?client_code=eq.${encodeURIComponent(code)}`
      + '&select=plan,week_overrides,name,weeks&order=id.asc&limit=5', { headers: svc(SERVICE) });
    if (!vRes.ok) return json(502, { error: 'unconfirmed', op: 'clientPlanSetWeek' });
    const vRows = await vRes.json() || [];
    if (vRows.length !== 1) return json(502, { error: 'unconfirmed', op: 'clientPlanSetWeek', rows_found: vRows.length });
    let stored = vRows[0].plan;
    if (typeof stored === 'string') { try { stored = JSON.parse(stored); } catch (e) { stored = null; } }
    if (!stored || typeof stored !== 'object') return json(502, { error: 'unconfirmed', op: 'clientPlanSetWeek' });

    const landed = [], missed = [];
    PLAN_DAYS.forEach((d) => { (planDaySame(stored[d], days[d]) ? landed : missed).push(d); });
    const keptOneOffs = oneOffs.filter((k) => stored[k] !== undefined);
    if (missed.length) {
      return json(502, {
        error: 'partial_write', op: 'clientPlanSetWeek', client_code: code,
        days_landed: landed, days_missing: missed,
        read_back: missed.reduce((o, d) => { o[d] = stored[d] || null; return o; }, {}),
      });
    }
    if (keptOneOffs.length !== oneOffs.length) {
      return json(502, { error: 'one_off_keys_lost', op: 'clientPlanSetWeek',
        expected: oneOffs, still_present: keptOneOffs });
    }

    return json(200, [{
      client_code: code, client_name: who.name || code,
      created_new_row: creating,
      days_landed: landed,
      week: PLAN_DAYS.reduce((o, d) => { o[d] = { type: stored[d].type, exercises: (stored[d].ex || []).length }; return o; }, {}),
      preserved_one_off_keys: keptOneOffs,
      other_keys_preserved: otherKeys.filter((k) => stored[k] !== undefined),
      week_key: weekKey, cleared_week_overrides: clearedOverride,
      shadowed_now: args.clear_week_overrides === true ? [] : shadowedNow,
      confirmed_by_read_back: true,
    }]);
  } catch (e) {
    console.error('trainer: clientPlanSetWeek threw', e && e.message);
    return json(502, { error: 'write_failed', op: 'clientPlanSetWeek' });
  }
}

async function handleClientPlanSetDay(URL, SERVICE, args) {
  let code, day, type, ex;
  try {
    code = enc_raw(args.client_code);
    day = planDayKey(args.day);
    type = str(args.type, 60);
    if (!type) throw new Error('bad_arg');
    ex = planExercises(args.exercises);
    if (type.toLowerCase() === 'rest') ex = [];
    if (ex == null) throw new Error('bad_arg');
  } catch (e) { return json(400, { error: 'bad_arg' }); }

  try {
    // ONE ROW PER CLIENT, and that is enforced, not assumed: training_plans
    // carries a unique index on client_code (idx_training_plans_client — it is
    // what every writer's on_conflict=client_code targets). So "the row the app
    // reads" and "the only row" are the same row. Ordered and counted anyway,
    // so if that ever stops being true this answers ambiguous instead of
    // picking whichever row PostgREST happened to return first.
    const rRes = await fetch(`${URL}/rest/v1/training_plans?client_code=eq.${encodeURIComponent(code)}`
      + '&select=id,client_code,plan,week_overrides,name,weeks&order=id.asc&limit=5', { headers: svc(SERVICE) });
    if (!rRes.ok) return json(502, { error: 'query_failed', op: 'clientPlanSetDay' });
    const rows = await rRes.json() || [];
    if (rows.length > 1) return json(409, { error: 'ambiguous_plan_rows', count: rows.length });
    // A client with no saved plan has their week DERIVED from their profile
    // every load. Creating a row here would replace that derived week with a
    // row containing one day and six holes — every other day would resolve to
    // nothing. Refuse; the week has to exist before a day of it can be
    // replaced.
    if (!rows.length) return json(409, { error: 'no_saved_plan', client_code: code });
    const row = rows[0];

    let plan = row.plan;
    if (typeof plan === 'string') { try { plan = JSON.parse(plan); } catch (e) { plan = null; } }
    if (!plan || typeof plan !== 'object') return json(409, { error: 'plan_unreadable' });

    let ovs = row.week_overrides;
    if (typeof ovs === 'string') { try { ovs = JSON.parse(ovs); } catch (e) { ovs = {}; } }
    ovs = ovs && typeof ovs === 'object' ? ovs : {};

    // Everything that would still shadow this day after the write.
    const weekKey = currentWeekKey();
    const shadowWeeks = Object.keys(ovs).filter((k) => ovs[k] && ovs[k][day]);
    const oneOffs = Object.keys(plan).filter((k) => k.charAt(0) === '@');

    const before = plan[day] || null;
    const after = { type: type, ex: ex };

    if (args.dry_run === true) {
      return json(200, [{
        preview: true, client_code: code, day: day,
        before: before, after: after,
        week_key: weekKey,
        shadowed_by_week_override: shadowWeeks,
        shadowed_now: shadowWeeks.indexOf(weekKey) > -1,
        one_off_day_keys: oneOffs,
      }]);
    }

    const nextPlan = Object.assign({}, plan);
    nextPlan[day] = after;

    const body = { client_code: code, plan: nextPlan, updated_at: new Date().toISOString() };
    // clear_week_override is opt-in and only ever touches THIS week and THIS
    // day. Without it a change can land in the template and stay invisible
    // behind a client's own override, which is the one outcome that would make
    // this op look like it worked when it did nothing.
    let clearedOverride = null;
    if (args.clear_week_override === true && ovs[weekKey] && ovs[weekKey][day]) {
      const nextOvs = Object.assign({}, ovs);
      nextOvs[weekKey] = Object.assign({}, nextOvs[weekKey]);
      delete nextOvs[weekKey][day];
      if (!Object.keys(nextOvs[weekKey]).length) delete nextOvs[weekKey];
      body.week_overrides = nextOvs;
      clearedOverride = weekKey;
    }
    // NEVER created_at — the column means "when this plan was first written",
    // and every training_plans writer in the app leaves it out for that reason.
    const wRes = await fetch(`${URL}/rest/v1/training_plans?on_conflict=client_code`, {
      method: 'POST',
      headers: Object.assign({}, svc(SERVICE), { 'Content-Type': 'application/json',
        Prefer: 'return=representation,resolution=merge-duplicates' }),
      body: JSON.stringify(body),
    });
    const wText = await wRes.text();
    if (!wRes.ok) {
      console.error('trainer: clientPlanSetDay write failed', wRes.status, wText.slice(0, 300));
      return json(502, { error: 'write_failed', op: 'clientPlanSetDay', detail: wText.slice(0, 200) });
    }

    // THE READ-BACK IS THE PROOF. Not the 2xx, not the echoed representation —
    // a fresh SELECT, compared field by field against what was sent. JSONB
    // comes back with its keys in whatever order Postgres chose, so this
    // compares the values themselves and never two stringified blobs.
    const vRes = await fetch(`${URL}/rest/v1/training_plans?client_code=eq.${encodeURIComponent(code)}`
      + '&select=plan,week_overrides&limit=1', { headers: svc(SERVICE) });
    if (!vRes.ok) return json(502, { error: 'unconfirmed', op: 'clientPlanSetDay' });
    const vRows = await vRes.json() || [];
    let stored = vRows[0] && vRows[0].plan;
    if (typeof stored === 'string') { try { stored = JSON.parse(stored); } catch (e) { stored = null; } }
    const landed = stored && stored[day];
    const same = !!landed && String(landed.type) === String(type)
      && Array.isArray(landed.ex) && landed.ex.length === ex.length
      && landed.ex.every((e, i) => String(e.n) === String(ex[i].n)
        && (+e.s || 0) === (+ex[i].s || 0) && String(e.r || '') === String(ex[i].r || ''));
    if (!same) {
      return json(502, { error: 'unconfirmed', op: 'clientPlanSetDay', day: day, read_back: landed || null });
    }
    // Every other day is still whatever it was — stated, not assumed, because
    // "keep the normal Mon–Thu" is half of what was asked for.
    const untouched = {};
    PLAN_DAYS.forEach((d) => { if (d !== day && stored[d]) untouched[d] = stored[d].type; });

    let storedOvs = vRows[0] && vRows[0].week_overrides;
    if (typeof storedOvs === 'string') { try { storedOvs = JSON.parse(storedOvs); } catch (e) { storedOvs = {}; } }
    storedOvs = storedOvs && typeof storedOvs === 'object' ? storedOvs : {};
    const stillShadowed = Object.keys(storedOvs).filter((k) => storedOvs[k] && storedOvs[k][day]);

    return json(200, [{
      client_code: code, day: day, day_after: landed,
      other_days_unchanged: untouched,
      week_key: weekKey, cleared_week_override: clearedOverride,
      shadowed_by_week_override: stillShadowed,
      shadowed_now: stillShadowed.indexOf(weekKey) > -1,
      one_off_day_keys: oneOffs,
      confirmed_by_read_back: true,
    }]);
  } catch (e) {
    console.error('trainer: clientPlanSetDay threw', e && e.message);
    return json(502, { error: 'write_failed', op: 'clientPlanSetDay' });
  }
}

// CLIENT-SESSION-GATED, the same exception and the same reasoning as
// myVipCalls — a client reading their OWN one-off booked calls, so the Day
// page can show a booked call the day it happens the way it already shows a
// standing one. client_code is ALWAYS the session's own claim; there is no
// argument that names a client and adding one would make this a shared table
// read wearing a narrow name.
//
// `note` is deliberately never selected, exactly as vip_calls.notes is not:
// it is the trainer's own text about the booking, not the client's to read.
// `spent` likewise — what a call cost against their plan is the door's
// bookkeeping, not something to put on their screen.
//
// Upcoming and uncancelled only. A cancelled booking is not a call, and a past
// one belongs to the Day page's own history, which reads it from elsewhere.
async function handleMyBookings(URL, SERVICE, code) {
  try {
    const from = new Date(Date.now() - 60 * 60000).toISOString();  // an hour's grace: a call in progress is still today's call
    const r = await fetch(`${URL}/rest/v1/bookings?client_code=eq.${encodeURIComponent(code)}`
      + `&starts_at=gte.${encodeURIComponent(from)}`
      + '&select=id,starts_at,duration_min,status,client_tz,created_at&order=starts_at.asc&limit=100',
      { headers: svc(SERVICE) });
    const text = await r.text();
    if (!r.ok) {
      console.error('trainer: myBookings query failed', r.status, text.slice(0, 300));
      return json(502, { error: 'query_failed', op: 'myBookings' });
    }
    let rows = []; try { rows = JSON.parse(text) || []; } catch (e) { rows = []; }
    // Filtered here rather than in the query so a null status — which means
    // booked, the same way loadBookings has always read it — is not silently
    // dropped by a status=neq.cancelled filter that never matches null.
    return json(200, rows.filter((b) => String(b.status || 'booked') !== 'cancelled'));
  } catch (e) {
    console.error('trainer: myBookings threw', e && e.message);
    return json(502, { error: 'query_failed', op: 'myBookings' });
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
  if (op === 'spendWeeklyCall') {
    return handleSpendWeeklyCall(URL, SERVICE, claims.client_code);
  }
  if (op === 'myVipCalls') {
    return handleMyVipCalls(URL, SERVICE, claims.client_code);
  }
  if (op === 'bookingsBusy') {
    return handleBookingsBusy(URL, SERVICE);
  }
  if (op === 'myBookingCreate') {
    return handleMyBookingCreate(URL, SERVICE, args, claims.client_code);
  }
  if (op === 'myBookingCancel') {
    return handleMyBookingCancel(URL, SERVICE, args, claims.client_code);
  }
  if (op === 'myBookings') {
    return handleMyBookings(URL, SERVICE, claims.client_code);
  }
  // Shared call notes, the client's own half. Same exception and the same
  // discipline as the three above: the account acted on is ALWAYS
  // claims.client_code, passed in below, never anything a caller could
  // supply. myCallNoteAdd additionally proves the OCCURRENCE belongs to that
  // client before it writes, because here the session's own code is not
  // enough on its own — a booking id names someone.
  if (op === 'myCallNotes') {
    return handleCallNotesRead(URL, SERVICE, claims.client_code);
  }
  if (op === 'myCallNoteAdd') {
    return handleCallNoteAdd(URL, SERVICE, args, claims.client_code, false, claims.client_code);
  }
  if (op === 'myCallNoteDelete') {
    return handleCallNoteDelete(URL, SERVICE, args, claims.client_code);
  }
  if (op === 'myPhoneSet') {
    return handleMyPhoneSet(URL, SERVICE, args, claims.client_code);
  }
  if (op === 'myPhoneHas') {
    return handleMyPhoneHas(URL, SERVICE, claims.client_code);
  }

  if (claims.is_trainer !== true) {
    // A real client's session reaching the trainer-only door is worth knowing about.
    console.warn('trainer: non-trainer session attempted', claims.client_code, op);
    return json(403, { error: 'not_a_trainer' });
  }

  // TRAINER-AUTHORED, read-then-write, past the gate. These act on a NAMED
  // client, which is exactly why they sit here and not with the three
  // session-scoped ops above.
  if (op === 'bookCallForClient') return handleBookCallForClient(URL, SERVICE, args, claims.client_code);
  if (op === 'consultInsert') return handleConsultInsert(URL, SERVICE, args);
  if (op === 'consultDelete') return handleConsultDelete(URL, SERVICE, args);
  if (op === 'logPhoto') return handleLogPhoto(URL, SERVICE, args);
  // The two guarded row ops. Registered HERE, past the is_trainer gate, and
  // never beside the session-scoped my* ops above — those act on the caller's
  // own claim, these act on a NAMED client, which is the whole difference.
  if (op === 'mealEdit') return handleMealEdit(URL, SERVICE, args);
  if (op === 'mealDelete') return handleMealDelete(URL, SERVICE, args);
  if (op === 'cancelCallForClient') return handleCancelCallForClient(URL, SERVICE, args);
  if (op === 'vipOccurrences') return handleVipOccurrences(URL, SERVICE, args);
  // The trainer's half of the same threads. forCode null: any client's call.
  if (op === 'callNotes') {
    let only = null;
    // Validated out here, not inside the handler's catch-all: a malformed code
    // is a bad request, and answering 502 for one reads as a sick database.
    try { only = args.client_code ? enc_raw(args.client_code) : null; }
    catch (e) { return json(400, { error: 'bad_arg' }); }
    return handleCallNotesRead(URL, SERVICE, only);
  }
  if (op === 'callNoteAdd') return handleCallNoteAdd(URL, SERVICE, args, claims.client_code, true, null);
  if (op === 'callNoteDelete') return handleCallNoteDelete(URL, SERVICE, args, null);
  if (op === 'moveVipOccurrence') return handleMoveVipOccurrence(URL, SERVICE, args);
  if (op === 'clientPlanSetDay') return handleClientPlanSetDay(URL, SERVICE, args);
  if (op === 'clientPlanSetWeek') return handleClientPlanSetWeek(URL, SERVICE, args);

  // READ. Unchanged from before writes existed, plus one recovery: a select=
  // naming a column that doesn't exist yet (see badColumn above) gets that
  // column dropped and the query retried — looped, not just once, since this
  // migration alone adds two columns and a single retry would still 400 on
  // the second one if neither has landed yet.
  if (Object.prototype.hasOwnProperty.call(OPS, op)) {
    let path;
    try { path = OPS[op](args); }
    catch (e) { return json(400, { error: 'bad_arg' }); }
    try {
      let r, text;
      for (let attempt = 0; attempt < 4; attempt++) {
        r = await fetch(`${URL}/rest/v1/${path}`, {
          headers: { apikey: SERVICE, Authorization: 'Bearer ' + SERVICE },
        });
        text = await r.text();
        if (r.ok) break;
        const bad = badColumn(text);
        if (!bad) break;
        const stripped = stripSelectColumn(path, bad);
        if (stripped === path) break;
        console.warn('trainer: ' + op + ' has no column "' + bad + '" — retrying without it');
        path = stripped;
      }
      if (!r.ok) {
        // A table that hasn't been created yet, for the handful of ops whose
        // table ships with this code rather than ahead of it: [] is the honest
        // answer (there are genuinely no rows), and it keeps the surface that
        // reads it from looking broken during a rollout.
        if (TOLERATE_MISSING[op] && missingTable(text)) {
          console.warn('trainer: ' + op + ' table not created yet — answering []');
          return { statusCode: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: '[]' };
        }
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
