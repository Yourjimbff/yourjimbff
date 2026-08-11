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

async function vipCallOccurrences(URL, SERVICE, from, to) {
  try {
    const path = 'vip_calls?select=weekdays,time_local,tz,start_date,end_date'
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
    const out = [];
    const rangeStart = new Date(from + 'T00:00:00.000Z');
    const rangeEnd = new Date(to + 'T00:00:00.000Z');
    (rows || []).forEach((row) => {
      const rowStart = new Date(row.start_date + 'T00:00:00.000Z');
      const rowEnd = new Date(row.end_date + 'T00:00:00.000Z');
      const spanStart = rowStart.getTime() > rangeStart.getTime() ? rowStart : rangeStart;
      const spanEnd = rowEnd.getTime() < rangeEnd.getTime() ? rowEnd : rangeEnd;
      for (let t = spanStart.getTime(); t <= spanEnd.getTime(); t += 86400000) {
        const d = new Date(t);
        const dow = ((d.getUTCDay() + 6) % 7) + 1; // 1=Mon..7=Sun — same contract as movement_prefs
        if (!Array.isArray(row.weekdays) || !row.weekdays.includes(dow)) continue;
        out.push(zonedTimeToUtc(isoDateStr(d), row.time_local, row.tz).toISOString());
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
