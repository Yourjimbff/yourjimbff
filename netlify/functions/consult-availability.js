// The offer page's own public read: how busy is a given date range, so the
// booker's picker can grey out taken slots before they submit. No session, on
// purpose — a stranger calls this BEFORE any session could exist, same as the
// INSERT into consult_requests itself. Reads with the service key server-side,
// same discipline as trainer.js, so this can answer without ever needing a
// SELECT grant on the public key — consult_requests stays INSERT-only for
// anon, untouched by this file.
//
// Returns ONLY timestamps. No name, no phone, no id — a busy list that
// carried who was busy would turn a scheduling convenience into a leak of
// exactly the private mailbox this table exists to protect. A cancelled
// request is not busy — the slot it held is open again.

const json = (code, obj) => ({
  statusCode: code,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    // The offer page is a separate site — a plain GET, so no preflight is
    // strictly required, but the response still needs this or the browser
    // discards it anyway once it notices the origins don't match.
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  },
  body: JSON.stringify(obj),
});

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_RANGE_DAYS = 14;

// ---- VIP CALLS UNION --------------------------------------------------------
// Recurring trainer-set call blocks (netlify/functions/trainer.js owns writing
// them) occupy real slots too. Their occurrences fold into the exact same
// busy[] this file already returns, so the offer page needs zero changes to
// stop offering a VIP client's own call time to a stranger.
//
// Fail-soft, on purpose: vip_calls not existing yet, or erroring, must never
// take down the booking grid that consult_requests already serves on its own —
// see vipCallOccurrences below, which never throws past its own boundary.

// The offset (in minutes) `tz` sits at when `utcDate` lands — independent of
// whatever timezone this function's own process happens to run in.
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
// A wall-clock "HH:MM" on a given calendar date, in an IANA zone, as a real
// UTC instant — DST-aware because the offset is read for that specific date,
// never a fixed number baked in ahead of time.
function zonedTimeToUtc(dateStr, timeStr, tz) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = timeStr.split(':').map(Number);
  const guess = new Date(Date.UTC(y, m - 1, d, hh, mm, 0));
  const offsetMin = tzOffsetMinutes(guess, tz);
  return new Date(guess.getTime() - offsetMin * 60000);
}
function isoDateStr(d) { return d.toISOString().slice(0, 10); }

// Per-occurrence exceptions, as {vip_call_id: {occurrence_date: row}}. Fail-soft
// in both directions and for the same reason the whole vip union is: a table
// that hasn't been created yet, or a read that errors, must never take down the
// grid consult_requests already serves on its own. What it costs when this
// returns empty is one moved occurrence still showing at its old time on the
// PUBLIC grid — a stranger could be offered a slot Yusuf has moved into. That's
// the same exposure the grid had before exceptions existed at all, so it is a
// return to the previous behaviour, never worse than it.
async function vipExceptions(URL, SERVICE, ids) {
  if (!ids || !ids.length) return {};
  try {
    const path = 'vip_call_exceptions?select=vip_call_id,occurrence_date,kind,new_date,new_time_local'
      + `&vip_call_id=in.(${ids.map((i) => encodeURIComponent(i)).join(',')})&limit=2000`;
    const r = await fetch(`${URL}/rest/v1/${path}`, {
      headers: { apikey: SERVICE, Authorization: 'Bearer ' + SERVICE },
    });
    if (!r.ok) {
      console.warn('consult-availability: vip_call_exceptions unavailable', r.status);
      return {};
    }
    const rows = await r.json();
    const by = {};
    (rows || []).forEach((x) => {
      const k = String(x.vip_call_id);
      by[k] = by[k] || {};
      by[k][String(x.occurrence_date).slice(0, 10)] = x;
    });
    return by;
  } catch (e) {
    console.error('consult-availability: vip_call_exceptions threw', e && e.message);
    return {};
  }
}

async function vipCallOccurrences(URL, SERVICE, from, to) {
  try {
    const path = 'vip_calls?select=id,weekdays,time_local,tz,start_date,end_date'
      + '&active=eq.true'
      + `&start_date=lte.${encodeURIComponent(to)}&end_date=gte.${encodeURIComponent(from)}`;
    const r = await fetch(`${URL}/rest/v1/${path}`, {
      headers: { apikey: SERVICE, Authorization: 'Bearer ' + SERVICE },
    });
    if (!r.ok) {
      console.error('consult-availability: vip_calls query failed', r.status);
      return [];
    }
    const rows = await r.json();
    const excBy = await vipExceptions(URL, SERVICE, (rows || []).map((x) => x.id));
    const out = [];
    const rangeStart = new Date(from + 'T00:00:00.000Z');
    const rangeEnd = new Date(to + 'T00:00:00.000Z');
    // A move can carry an occurrence onto a date the rule doesn't fire, so the
    // scan runs a week wider than the question and the results are trimmed
    // after — otherwise an occurrence moved INTO this range from just outside
    // it would be missed, and the public grid would offer a slot Yusuf is in.
    // The trim keeps a day of slack either side; a busy instant outside the
    // asked-for range costs nothing (the picker matches exact instants) while
    // a missing one costs a double-booked stranger.
    const PAD = 7 * 86400000;
    const scanStart = new Date(rangeStart.getTime() - PAD);
    const scanEnd = new Date(rangeEnd.getTime() + PAD);
    const keepFrom = rangeStart.getTime() - 86400000;
    const keepTo = rangeEnd.getTime() + 2 * 86400000;
    (rows || []).forEach((row) => {
      const rowStart = new Date(row.start_date + 'T00:00:00.000Z');
      const rowEnd = new Date(row.end_date + 'T00:00:00.000Z');
      const spanStart = rowStart.getTime() > scanStart.getTime() ? rowStart : scanStart;
      const spanEnd = rowEnd.getTime() < scanEnd.getTime() ? rowEnd : scanEnd;
      const exc = excBy[String(row.id)] || {};
      for (let t = spanStart.getTime(); t <= spanEnd.getTime(); t += 86400000) {
        const d = new Date(t);
        const dow = ((d.getUTCDay() + 6) % 7) + 1; // 1=Mon..7=Sun — same contract as movement_prefs
        if (!Array.isArray(row.weekdays) || !row.weekdays.includes(dow)) continue;
        const ds = isoDateStr(d);
        const e = exc[ds];
        // A skipped occurrence FREES its slot — that is half of what moving one
        // means, and the half a rule alone can never express.
        if (e && e.kind === 'skip') continue;
        const useDate = (e && e.new_date) ? String(e.new_date).slice(0, 10) : ds;
        const useTime = (e && e.new_time_local) ? String(e.new_time_local).slice(0, 5) : row.time_local;
        const at = zonedTimeToUtc(useDate, useTime, row.tz);
        if (at.getTime() < keepFrom || at.getTime() > keepTo) continue;
        out.push(at.toISOString());
      }
    });
    return out;
  } catch (e) {
    console.error('consult-availability: vip_calls threw', e && e.message);
    return [];
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: json(204, {}).headers, body: '' };
  }
  if (event.httpMethod !== 'GET') return json(405, { error: 'GET only' });

  const URL = process.env.SUPABASE_URL;
  const SERVICE = process.env.SUPABASE_SERVICE_KEY;
  if (!URL || !SERVICE) {
    console.error('consult-availability: missing env');
    return json(503, { error: 'not_configured' });
  }

  const q = event.queryStringParameters || {};
  const from = String(q.from || '');
  const to = String(q.to || '');

  if (!DATE_RE.test(from) || !DATE_RE.test(to)) {
    return json(400, { error: 'from and to are required, each YYYY-MM-DD' });
  }
  const fromDate = new Date(from + 'T00:00:00.000Z');
  const toDate = new Date(to + 'T00:00:00.000Z');
  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    return json(400, { error: 'from or to is not a real date' });
  }
  if (fromDate.getTime() > toDate.getTime()) {
    return json(400, { error: 'from must not be after to' });
  }
  const spanDays = (toDate.getTime() - fromDate.getTime()) / 86400000;
  if (spanDays > MAX_RANGE_DAYS) {
    return json(400, { error: 'range too wide — 14 days max' });
  }

  // Inclusive of the whole `to` day.
  const rangeStart = fromDate.toISOString();
  const rangeEnd = new Date(toDate.getTime() + 86400000 - 1).toISOString();

  try {
    const path = 'consult_requests?select=requested_at&status=eq.accepted'
      + `&requested_at=gte.${encodeURIComponent(rangeStart)}`
      + `&requested_at=lte.${encodeURIComponent(rangeEnd)}`;
    const r = await fetch(`${URL}/rest/v1/${path}`, {
      headers: { apikey: SERVICE, Authorization: 'Bearer ' + SERVICE },
    });
    if (!r.ok) {
      const text = await r.text();
      console.error('consult-availability: query failed', r.status, text.slice(0, 300));
      return json(502, { error: 'query_failed' });
    }
    const rows = await r.json();
    const busy = (rows || []).map((row) => row.requested_at).filter(Boolean);
    const vipBusy = await vipCallOccurrences(URL, SERVICE, from, to);
    return json(200, { busy: busy.concat(vipBusy) });
  } catch (e) {
    console.error('consult-availability: threw', e && e.message);
    return json(502, { error: 'query_failed' });
  }
};
