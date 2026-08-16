// Fired by a Supabase Database Webhook the instant a row lands in
// consult_requests — see migrations/2026-08-16-notify-consult-WEBHOOK.sql
// for the trigger that calls this. Not something the offer page or
// index.html ever calls directly: consult_requests is written straight
// into Supabase by the offer page's own repo with the anon key, never
// through a Netlify function here, so a database-level trigger is the only
// point that sees every insert regardless of which code performed it.
//
// REQUIRED ENVIRONMENT (Netlify → Site settings → Environment variables):
//   CONSULT_WEBHOOK_SECRET   a random string, also pasted into the trigger's
//                            own header config — proves the request actually
//                            came from the Supabase trigger, not a stranger
//                            POSTing to this public URL to spam Yusuf's inbox
//                            or run up his email bill
//   RESEND_API_KEY, NOTIFY_EMAIL_TO, NOTIFY_EMAIL_FROM   see _notify.js
//
// Fails loud, never silent: every failed send attempt logs to Netlify's
// function log. The Booked consults panel in the cockpit reads
// consult_requests directly and is completely untouched by any of this —
// it is the ground truth regardless of whether this message ever sends.

const { sendEmail } = require('./_notify.js');

const json = (code, obj) => ({
  statusCode: code,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(obj || {}),
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'POST only' });

  const SECRET = process.env.CONSULT_WEBHOOK_SECRET;
  if (!SECRET) {
    console.error('notify-consult: missing CONSULT_WEBHOOK_SECRET');
    return json(503, { error: 'not_configured' });
  }
  const got = event.headers['x-webhook-secret'] || event.headers['X-Webhook-Secret'];
  if (got !== SECRET) {
    console.error('notify-consult: rejected, bad or missing secret header');
    return json(401, { error: 'unauthorized' });
  }

  let payload;
  try { payload = JSON.parse(event.body || '{}'); }
  catch (e) { return json(400, { error: 'bad_request' }); }

  // Supabase's own Database Webhook payload shape: {type, table, schema, record, old_record}.
  if (payload.type !== 'INSERT' || payload.table !== 'consult_requests') {
    return json(200, { skipped: true });
  }

  const r = payload.record || {};
  let when = 'an unspecified time';
  try {
    if (r.requested_at) {
      when = new Date(r.requested_at).toLocaleString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric',
        hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York',
      }) + ' ET';
    }
  } catch (e) {}

  const subject = 'New consult booked — ' + (r.name || 'someone');
  const lines = [
    (r.name || 'Someone') + ' just booked a consult.',
    '',
    'When: ' + when,
    'Phone: ' + (r.phone || 'not given'),
  ];
  if (r.goal) lines.push('Goal: ' + r.goal);
  if (r.main_problem) lines.push('Problem: ' + r.main_problem);

  const ok = await sendEmail(subject, lines.join('\n'));
  // 200 either way: Stripe-style retry-on-failure doesn't apply here, this
  // isn't idempotent against Supabase re-delivering, and the send helper
  // above already retried on its own. A non-2xx would just make the
  // Postgres trigger log an error with nothing useful to do about it.
  return json(200, { sent: ok });
};
