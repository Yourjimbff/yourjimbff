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
    return json(200, { busy });
  } catch (e) {
    console.error('consult-availability: threw', e && e.message);
    return json(502, { error: 'query_failed' });
  }
};
