// Shared "send Yusuf an email" helper. Not a Netlify function itself — no
// exports.handler — required by notify-consult.js and stripe-hook.js the
// same way trainer.js requires session.js for `verify`.
//
// REQUIRED ENVIRONMENT (Netlify → Site settings → Environment variables):
//   RESEND_API_KEY     from resend.com — an API key with send permission
//   NOTIFY_EMAIL_TO    the inbox that should receive these
//   NOTIFY_EMAIL_FROM  optional; defaults to Resend's own shared sandbox
//                      sender, which can send to NOTIFY_EMAIL_TO without a
//                      verified domain as long as that address is the same
//                      one the Resend account itself was created with
//
// Retries with backoff, three attempts total. Every failed attempt logs to
// Netlify's function log — loud, not swallowed. Callers must never let a
// failed send here break whatever real work triggered it: the thing that
// actually happened (a consult booked, a payment landed) already landed in
// the database on its own, unconditionally, before this ever runs.
async function sendEmail(subject, text) {
  const KEY = process.env.RESEND_API_KEY;
  const TO = process.env.NOTIFY_EMAIL_TO;
  const FROM = process.env.NOTIFY_EMAIL_FROM || 'YOURJIMBFF <onboarding@resend.dev>';
  if (!KEY || !TO) {
    console.error('notify: missing RESEND_API_KEY or NOTIFY_EMAIL_TO — cannot send:', subject);
    return false;
  }
  const ATTEMPTS = 3;
  for (let i = 0; i < ATTEMPTS; i++) {
    try {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: FROM, to: [TO], subject, text }),
      });
      if (r.ok) return true;
      const body = await r.text();
      console.error('notify: send failed, attempt ' + (i + 1) + '/' + ATTEMPTS, r.status, body.slice(0, 300));
    } catch (e) {
      console.error('notify: send threw, attempt ' + (i + 1) + '/' + ATTEMPTS, e && e.message);
    }
    if (i < ATTEMPTS - 1) await new Promise((res) => setTimeout(res, 500 * Math.pow(2, i)));
  }
  console.error('notify: all ' + ATTEMPTS + ' attempts failed — nothing sent for:', subject);
  return false;
}

module.exports = { sendEmail };
