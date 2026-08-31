// Shared "put this call on Yusuf's Google Calendar" helper. Not a Netlify
// function itself — no exports.handler — required by trainer.js the same way
// notify-consult.js requires _notify.js.
//
// REQUIRED ENVIRONMENT (Netlify → Site settings → Environment variables):
//   GOOGLE_CLIENT_ID       OAuth 2.0 client id, from Google Cloud Console
//   GOOGLE_CLIENT_SECRET   ...and its secret
//   GOOGLE_REFRESH_TOKEN   a refresh token for HIS account, granted once,
//                          scope https://www.googleapis.com/auth/calendar
//   GOOGLE_CALENDAR_ID     optional; defaults to 'primary'
//   GOOGLE_CALENDAR_TZ     optional; defaults to America/New_York, which is
//                          the same TRAINER_TZ trainer.js already assumes
//
// See scripts/GOOGLE-CALENDAR-SETUP.md for how to get the refresh token. Until
// all three of the first values are set, every function here answers
// {ok:false, reason:'not_configured'} and logs it. Nothing throws, ever.
//
// A BOOKING NEVER DEPENDS ON THIS (his rule, and it is the important one).
// Every export returns a result object instead of raising, every network call
// is time-boxed, and every caller in trainer.js runs this AFTER the booking is
// already confirmed in the database. Google being down is a line in the log
// and a flag on the response, never a client who could not book a call.
//
// THE EVENT IS HIS AND NOBODY ELSE'S. No attendees are ever sent — not the
// client, not anyone — so Google never emails an invitation and the event is
// not shared with the person it is about. sendUpdates is pinned to 'none' on
// every write for the same reason: belt and braces, because the default has
// changed before.

const TOKEN_URL = process.env.GOOGLE_OAUTH_URL || 'https://oauth2.googleapis.com/token';
const API_BASE = process.env.GOOGLE_CALENDAR_API || 'https://www.googleapis.com/calendar/v3';
const TIMEOUT_MS = 8000;
const ATTEMPTS = 2;

// ===== THE TIME BUDGET, AND WHY IT IS NOT OPTIONAL ==========================
// A Netlify function has ten seconds. A booking that hangs waiting on Google
// does not merely arrive late: it arrives as a FAILURE to the person standing
// at the picker, while the row is already in the database — the worst of both,
// and a direct breach of "a client's booking never depends on his calendar
// being reachable".
//
// So a caller on the booking path opens a budget for the WHOLE calendar
// exchange — token refresh, adoption lookup, and the write itself, together —
// and every request inside it is clamped to whatever is left. When the budget
// runs out the calendar write reports 'out_of_time' and the booking response
// goes out on schedule.
//
// Module-scoped because a Lambda container serves one request at a time, which
// is what makes a single ambient deadline safe here. Anything that changes
// that has to pass the deadline explicitly instead.
let _deadlineAt = 0;
function gcalBudget(ms) { _deadlineAt = Date.now() + Math.max(500, Number(ms) || 0); }
function gcalClearBudget() { _deadlineAt = 0; }
function msLeft() {
  if (!_deadlineAt) return TIMEOUT_MS;
  return _deadlineAt - Date.now();
}

function calendarId() {
  return process.env.GOOGLE_CALENDAR_ID || 'primary';
}
function calendarTz() {
  return process.env.GOOGLE_CALENDAR_TZ || 'America/New_York';
}
function gcalConfigured() {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN);
}

// Time-boxed fetch that never throws. A hung Google is a failed calendar
// write, not a hung booking response.
async function tfetch(url, opts) {
  const left = Math.min(TIMEOUT_MS, msLeft());
  if (left <= 0) return { ok: false, status: 0, text: 'out_of_time', outOfTime: true };
  const o = Object.assign({}, opts || {});
  try { o.signal = AbortSignal.timeout(left); } catch (e) { /* older runtime: no timeout */ }
  try {
    const r = await fetch(url, o);
    const text = await r.text();
    return { ok: r.ok, status: r.status, text: text };
  } catch (e) {
    return { ok: false, status: 0, text: String((e && e.message) || e) };
  }
}

// The access token, refreshed from the refresh token and cached in module
// scope for as long as Google says it is good for. Netlify keeps a warm
// function container across invocations, so this is usually one exchange per
// container rather than one per booking — and when the container is cold it
// is simply done again.
let _tok = { value: '', expires: 0 };
async function accessToken() {
  const now = Date.now();
  if (_tok.value && now < _tok.expires) return { ok: true, token: _tok.value };
  const body = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN || '',
    grant_type: 'refresh_token',
  }).toString();
  const r = await tfetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body,
  });
  if (!r.ok) {
    console.error('gcal: token refresh failed', r.status, String(r.text).slice(0, 300));
    return { ok: false, reason: 'auth_failed' };
  }
  let d = null; try { d = JSON.parse(r.text); } catch (e) { d = null; }
  if (!d || !d.access_token) {
    console.error('gcal: token refresh returned no access_token');
    return { ok: false, reason: 'auth_failed' };
  }
  // A minute of headroom, so a token cannot expire between this check and the
  // request that uses it.
  const ttl = Math.max(60, Number(d.expires_in || 3600)) * 1000;
  _tok = { value: String(d.access_token), expires: now + ttl - 60000 };
  return { ok: true, token: _tok.value };
}

// One authorised call against the Calendar API, retried once on a 5xx or a
// network failure — never on a 4xx, which is a request Google understood and
// refused and which a second identical try would only duplicate.
async function api(method, path, body) {
  if (!gcalConfigured()) {
    console.error('gcal: missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN — calendar not written:', method, path);
    return { ok: false, reason: 'not_configured' };
  }
  for (let i = 0; i < ATTEMPTS; i++) {
    if (msLeft() <= 0) return { ok: false, reason: 'out_of_time' };
    const t = await accessToken();
    if (!t.ok) return { ok: false, reason: t.reason };
    const r = await tfetch(API_BASE + path, {
      method: method,
      headers: { Authorization: 'Bearer ' + t.token, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (r.ok) {
      let d = null; try { d = r.text ? JSON.parse(r.text) : {}; } catch (e) { d = {}; }
      return { ok: true, data: d || {} };
    }
    // An expired-looking token is worth exactly one forced refresh.
    if (r.status === 401 && i === 0) { _tok = { value: '', expires: 0 }; continue; }
    if (r.status >= 400 && r.status < 500) {
      console.error('gcal: ' + method + ' ' + path + ' refused', r.status, String(r.text).slice(0, 300));
      return { ok: false, reason: 'refused', status: r.status };
    }
    if (r.outOfTime) return { ok: false, reason: 'out_of_time' };
    console.error('gcal: ' + method + ' ' + path + ' failed, attempt ' + (i + 1) + '/' + ATTEMPTS, r.status, String(r.text).slice(0, 200));
  }
  return { ok: false, reason: 'unreachable' };
}

// The event body. THE TIME IS SENT AS AN INSTANT PLUS HIS ZONE, never as a
// floating wall-clock: dateTime is the real UTC instant the call happens at,
// and timeZone names the zone it should DISPLAY in. Sending a local string
// without a zone is how an event lands an hour out twice a year, and this
// codebase has already learned that lesson once in vip_calls' own comments.
//
// THE TITLE IS WRITTEN ONCE, AT CREATION, AND NEVER AGAIN. PATCH is partial,
// so leaving `summary` out of an update leaves whatever the event already
// says — which is the app's own title on an event it created, and HIS OWN
// WORDS on one it adopted. Sending the title on every update renamed his
// hand-made "Blake Bernstein call" to "Check-in: Blake" the first time the
// app touched it, which is precisely the "do not touch existing events you
// did not create" line being crossed. Caught by scripts/tests/tgcal.cjs.
function eventBody(ev, withSummary) {
  const start = new Date(ev.startISO);
  const mins = Math.max(1, Number(ev.durationMin) || 30);
  const end = new Date(start.getTime() + mins * 60000);
  const body = {
    description: String(ev.description || ''),
    start: { dateTime: start.toISOString(), timeZone: ev.tz || calendarTz() },
    end: { dateTime: end.toISOString(), timeZone: ev.tz || calendarTz() },
    // Never anybody else's event to be on. Stated rather than omitted so a
    // future edit has to delete a line that says what it is doing.
    attendees: [],
    reminders: { useDefault: true },
  };
  if (withSummary) body.summary = String(ev.summary || 'Call');
  return body;
}

async function gcalCreate(ev) {
  const r = await api('POST', '/calendars/' + encodeURIComponent(calendarId()) + '/events?sendUpdates=none', eventBody(ev, true));
  if (!r.ok) return { ok: false, reason: r.reason, status: r.status };
  const id = r.data && r.data.id;
  if (!id) return { ok: false, reason: 'unconfirmed' };
  return { ok: true, id: String(id) };
}

// PATCH, not PUT: a partial update leaves alone every field this app does not
// own — his own colour, his own reminders, anything he typed into an event it
// adopted. PUT would silently blank all of it.
async function gcalUpdate(id, ev) {
  if (!id) return { ok: false, reason: 'no_event_id' };
  const r = await api('PATCH', '/calendars/' + encodeURIComponent(calendarId())
    + '/events/' + encodeURIComponent(id) + '?sendUpdates=none', eventBody(ev, false));
  if (!r.ok) return { ok: false, reason: r.reason, status: r.status };
  return { ok: true, id: String(id) };
}

// A 404 or a 410 means the event is already not there, which is the state this
// was asked to produce. Reported as done rather than as a failure, so a manual
// deletion in his own calendar does not leave a permanent error in the log.
async function gcalDelete(id) {
  if (!id) return { ok: false, reason: 'no_event_id' };
  const r = await api('DELETE', '/calendars/' + encodeURIComponent(calendarId())
    + '/events/' + encodeURIComponent(id) + '?sendUpdates=none', null);
  if (r.ok) return { ok: true };
  if (r.status === 404 || r.status === 410) return { ok: true, alreadyGone: true };
  return { ok: false, reason: r.reason, status: r.status };
}

// ADOPTION, and the narrowest version of it that answers the question asked.
// He already keeps some of these calls on his calendar by hand — Blake's is
// the one named — and creating a second event beside one of those is exactly
// the duplicate the rule forbids. So before creating, look for an event that
// STARTS AT THE SAME INSTANT and whose summary mentions the person. Same
// instant is the tight part: two different calls at the identical second is
// not a thing his day contains, so a match here is the same call.
//
// It deliberately does NOT match on "sometime that hour" or on title alone.
// A loose match would adopt — and then later move or delete — an event this
// app has no business touching, and "do not touch existing events you did not
// create" is the rule that would break.
async function gcalFindAt(opts) {
  const start = new Date(opts.startISO);
  if (isNaN(start.getTime())) return { ok: false, reason: 'bad_time' };
  // A one-second window either side, so a stored event whose start differs by
  // sub-second rounding still matches and nothing else can.
  const from = new Date(start.getTime() - 1000).toISOString();
  const to = new Date(start.getTime() + 1000).toISOString();
  const path = '/calendars/' + encodeURIComponent(calendarId()) + '/events'
    + '?singleEvents=true&maxResults=10&orderBy=startTime'
    + '&timeMin=' + encodeURIComponent(from) + '&timeMax=' + encodeURIComponent(to);
  const r = await api('GET', path, null);
  if (!r.ok) return { ok: false, reason: r.reason, status: r.status };
  const items = (r.data && r.data.items) || [];
  const needle = String(opts.contains || '').trim().toLowerCase();
  for (const it of items) {
    if (!it || it.status === 'cancelled') continue;
    const s = it.start && it.start.dateTime;
    if (!s) continue;                                  // an all-day event is not a call
    if (Math.abs(new Date(s).getTime() - start.getTime()) > 1000) continue;
    if (needle && String(it.summary || '').toLowerCase().indexOf(needle) < 0) continue;
    return { ok: true, id: String(it.id), summary: String(it.summary || '') };
  }
  return { ok: true, id: null };
}

// The one call trainer.js actually makes. Given whatever event id the booking
// already carries, it lands the event and hands back the id to store.
//
//   have an id  -> update it in place. One booking, one event, forever.
//   no id       -> adopt an event already sitting at that instant, or create.
//
// Returns {ok, id, adopted, reason}. ok:false is a calendar failure and NEVER
// a booking failure — the caller reports it and moves on.
async function gcalSync(existingId, ev) {
  if (!gcalConfigured()) return { ok: false, reason: 'not_configured' };
  if (existingId) {
    const u = await gcalUpdate(existingId, ev);
    if (u.ok) return { ok: true, id: String(existingId), adopted: false };
    // An id that no longer exists is not a reason to leave his calendar empty:
    // he deleted it by hand, and the booking is still real. Anything else is
    // reported as-is rather than papered over with a second event.
    if (u.status !== 404 && u.status !== 410) return { ok: false, reason: u.reason, status: u.status };
  }
  // THE LOOKUP FAILS CLOSED, and this is the bug the mock suite caught: a
  // lookup that ERRORED used to fall through to create, which is how a
  // transient 500 turns into a second event sitting beside the one he keeps by
  // hand — the exact duplicate the rule forbids. "Never a duplicate" outranks
  // "always get an event", every time: the booking is already safe in the
  // database, and he can be told the calendar did not take it.
  const found = await gcalFindAt({ startISO: ev.startISO, contains: ev.adoptMatch || '' });
  if (!found.ok) return { ok: false, reason: found.reason || 'lookup_failed', status: found.status };
  if (found.id) {
    const u = await gcalUpdate(found.id, ev);
    if (!u.ok) return { ok: false, reason: u.reason, status: u.status };
    return { ok: true, id: String(found.id), adopted: true };
  }
  const c = await gcalCreate(ev);
  if (!c.ok) return { ok: false, reason: c.reason, status: c.status };
  return { ok: true, id: c.id, adopted: false };
}

module.exports = {
  gcalConfigured, gcalSync, gcalCreate, gcalUpdate, gcalDelete, gcalFindAt,
  gcalBudget, gcalClearBudget, calendarId, calendarTz, eventBody,
};
