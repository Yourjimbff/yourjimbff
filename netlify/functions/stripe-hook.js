// Stripe → a client who can sign in.
//
// A payment lands here, and this creates their place: a clients row carrying tier,
// term, start date and access code, and a sales row carrying what they actually paid.
// By the time the call ends they can log in.
//
// No npm. The repo has no package.json and analyze.js is dependency-free, so the
// signature is verified with node's own crypto rather than pulling in the Stripe SDK.
//
// REQUIRED ENVIRONMENT (Netlify → Site settings → Environment variables):
//   STRIPE_WEBHOOK_SECRET   whsec_...  from the Stripe webhook you point here
//   SUPABASE_URL            https://frxptalfyutukmnsvysg.supabase.co
//   SUPABASE_SERVICE_KEY    the service_role key — NEVER the anon key, and never
//                           anywhere near index.html
//   STRIPE_SECRET_KEY       sk_live_... — needed to STOP a split subscription. See below.
//   RESEND_API_KEY, NOTIFY_EMAIL_TO, NOTIFY_EMAIL_FROM   optional — see _notify.js.
//                           A new client landing here is money moving with zero action
//                           from Yusuf; without these three he only finds out by opening
//                           Admin. Missing them just means no email, same as before.
//
// Without the first three this returns 500 and writes nothing. It never half-creates.
//
// WHY THE SECRET KEY MATTERS. The two split links are Stripe SUBSCRIPTIONS billed
// monthly with no end: checked against the live checkout pages, they read "$550.00 per
// month · Billed monthly" and "charge you according to the terms until you cancel".
// Nothing in Stripe stops them at two payments. A 3-month client on the split owes
// $1,100 and would be charged $550 every month forever. So once the contract total has
// been collected, this cancels the subscription. Without STRIPE_SECRET_KEY it can't,
// and every split has to be cancelled by hand in Stripe on the right day.

const crypto = require('crypto');
const { sendEmail } = require('./_notify.js');

// The same table as SELL_PLANS in index.html.
const PLANS = {
  solo_3_full:  {tier: '1on1', term: 3,  first: 997,  total: 997,  parts: 1},
  solo_3_x2:    {tier: '1on1', term: 3,  first: 550,  total: 1100, parts: 2},
  solo_6_full:  {tier: '1on1', term: 6,  first: 1500, total: 1500, parts: 1},
  solo_6_x2:    {tier: '1on1', term: 6,  first: 850,  total: 1700, parts: 2},
  solo_12_full: {tier: '1on1', term: 12, first: 2000, total: 2000, parts: 1}
};

// HOW A PAYMENT BECOMES A PLAN.
//
// Stripe's dashboard has no metadata field on Payment Links, so tagging them by hand
// isn't available. Reading Stripe's own product is better than tagging anyway: the
// product says what was bought, and unlike the amount it doesn't move when a discount
// is applied. Three ways in, best first:
//
//   1. metadata.plan   — if it's ever set by API, it wins outright.
//   2. the product     — name and recurrence, fetched from Stripe at payment time.
//                        "1:1 Coaching - 6 Months" + recurring = solo_6_x2.
//   3. the amount      — last resort, and only when it matches exactly one plan.
//
// Every payment logs the price and product ids it saw, so the exact ids can be pinned
// here later without guessing at them now.
function planFromName(name, recurring) {
  const n = String(name || '').toLowerCase();
  if (!n) return null;
  const term = /\b12\b|twelve/.test(n) ? 12 : /\b6\b|six/.test(n) ? 6 : /\b3\b|three/.test(n) ? 3 : null;
  if (!term) return null;
  const tier = /vip/.test(n) ? 'vip' : '1on1';
  // Recurring means it's being paid off in instalments; one-time means paid in full.
  const want = (tier === 'vip' ? 'vip_' : 'solo_') + term + (recurring ? '_x2' : '_full');
  return PLANS[want] ? Object.assign({key: want}, PLANS[want]) : null;
}
function planFromAmount(amountDollars) {
  const hit = Object.keys(PLANS).filter(k => PLANS[k].first === amountDollars);
  // Two plans on one amount means the table drifted. Refuse rather than guess a term —
  // a wrong term is a wrong renewal date and a wrong card for months.
  if (hit.length !== 1) return null;
  return Object.assign({key: hit[0]}, PLANS[hit[0]]);
}
// Ask Stripe what was actually bought. Needs the secret key; without it this returns
// null and the amount fallback carries the payment.
async function lineItemOf(sessionId) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  try {
    const res = await fetch('https://api.stripe.com/v1/checkout/sessions/'
      + encodeURIComponent(sessionId) + '/line_items?limit=1&expand[]=data.price.product',
      {headers: {'Authorization': 'Bearer ' + key}});
    if (!res.ok) { console.error('line_items failed', res.status, await res.text()); return null; }
    const j = await res.json();
    const li = (j.data || [])[0];
    if (!li) return null;
    const price = li.price || {};
    const product = price.product || {};
    return {
      name: product.name || li.description || '',
      recurring: !!price.recurring,
      priceId: price.id || '',
      productId: (typeof product === 'string') ? product : (product.id || '')
    };
  } catch (e) { console.error('line_items threw', e); return null; }
}

// Stripe signs the RAW body. Any re-serialising breaks this, which is why the handler
// hands the untouched string straight in.
function verify(rawBody, header, secret) {
  if (!header) return false;
  const parts = {};
  String(header).split(',').forEach(p => {
    const i = p.indexOf('=');
    if (i > 0) parts[p.slice(0, i).trim()] = p.slice(i + 1).trim();
  });
  if (!parts.t || !parts.v1) return false;
  // Reject anything older than five minutes so a captured payload can't be replayed.
  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(parts.t));
  if (!isFinite(age) || age > 300) return false;
  const expected = crypto.createHmac('sha256', secret)
    .update(parts.t + '.' + rawBody, 'utf8').digest('hex');
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(String(parts.v1), 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function sb(path, opts) {
  const url = process.env.SUPABASE_URL + '/rest/v1/' + path;
  const key = process.env.SUPABASE_SERVICE_KEY;
  return fetch(url, Object.assign({}, opts, {
    headers: Object.assign({
      'apikey': key,
      'Authorization': 'Bearer ' + key,
      'Content-Type': 'application/json'
    }, (opts && opts.headers) || {})
  }));
}

// firstname + last initial + a digit, checked against the LIVE table. The hardcoded
// CLIENTS map in index.html is stale and several codes in it have no row, so a
// collision check against it would happily hand out a code that's already taken.
async function makeCode(name) {
  const clean = String(name || '').trim().toLowerCase().replace(/[^a-z ]/g, '');
  const bits = clean.split(/\s+/).filter(Boolean);
  const base = ((bits[0] || 'client') + (bits[1] ? bits[1][0] : '')).slice(0, 14) || 'client';
  const res = await sb('clients?select=code&code=like.' + encodeURIComponent(base + '*'), {method: 'GET'});
  const taken = {};
  if (res.ok) { (await res.json() || []).forEach(r => { taken[r.code] = 1; }); }
  for (let n = 1; n < 200; n++) { if (!taken[base + n]) return base + n; }
  return base + Date.now().toString().slice(-5);
}

// Stop a split subscription once its contract is paid. Loud on failure: silently
// leaving it running means charging someone who has finished paying, which is the
// worst thing this file could do.
async function stopSubscription(subId) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) { console.error('CANCEL NEEDED, no STRIPE_SECRET_KEY set — cancel ' + subId + ' by hand'); return false; }
  try {
    const res = await fetch('https://api.stripe.com/v1/subscriptions/' + encodeURIComponent(subId), {
      method: 'DELETE', headers: {'Authorization': 'Bearer ' + key}
    });
    if (!res.ok) { console.error('cancel failed', subId, res.status, await res.text()); return false; }
    console.log('cancelled subscription', subId);
    return true;
  } catch (e) { console.error('cancel threw', subId, e); return false; }
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') return {statusCode: 405, body: 'Method Not Allowed'};

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('stripe-hook: missing env');
    return {statusCode: 500, body: 'not configured'};
  }

  const raw = event.isBase64Encoded
    ? Buffer.from(event.body || '', 'base64').toString('utf8')
    : (event.body || '');
  const sig = event.headers['stripe-signature'] || event.headers['Stripe-Signature'];
  if (!verify(raw, sig, secret)) return {statusCode: 400, body: 'bad signature'};

  let evt;
  try { evt = JSON.parse(raw); } catch (e) { return {statusCode: 400, body: 'bad json'}; }
  const obj = (evt.data && evt.data.object) || {};

  try {
    // ---- instalment two, thirty days later -------------------------------------
    // Stripe sends invoice.paid for the follow-up charge. There's no new client to
    // make; the money just has to land on the sale that already exists, or the split
    // client reads as underpaid for the rest of their term.
    if (evt.type === 'invoice.paid' || evt.type === 'invoice.payment_succeeded') {
      if (obj.billing_reason === 'subscription_create') return {statusCode: 200, body: 'first charge, handled at checkout'};
      const email = String(obj.customer_email || '').trim().toLowerCase();
      const paid = Math.round((obj.amount_paid || 0)) / 100;
      if (!email || !paid) return {statusCode: 200, body: 'nothing to apply'};
      const cr = await sb('clients?select=code&email=eq.' + encodeURIComponent(email) + '&limit=1', {method: 'GET'});
      const rows = cr.ok ? (await cr.json() || []) : [];
      if (!rows.length) { console.error('instalment for unknown email', email); return {statusCode: 200, body: 'no client'}; }
      const code = rows[0].code;
      const sr = await sb('sales?select=id,paid_amount,total_amount&client_code=eq.' + encodeURIComponent(code) + '&order=sale_date.asc&limit=1', {method: 'GET'});
      const sales = sr.ok ? (await sr.json() || []) : [];
      if (!sales.length) return {statusCode: 200, body: 'no sale row'};
      const s = sales[0];
      // Idempotent: Stripe retries, and paying twice must not bank the money twice.
      const total = Number(s.total_amount) || 0;
      const next = Math.min(total, (Number(s.paid_amount) || 0) + paid);
      if (next === Number(s.paid_amount)) return {statusCode: 200, body: 'already applied'};
      await sb('sales?id=eq.' + s.id, {method: 'PATCH', headers: {'Prefer': 'return=minimal'},
        body: JSON.stringify({paid_amount: next})});

      // The contract is settled, so the subscription has to stop. Stripe will otherwise
      // keep billing monthly forever — these links have no iteration limit — and a
      // client who has paid their $1,100 in full would be charged again next month.
      // Capping paid_amount above keeps the books right; only this keeps the card right.
      if (next >= total && obj.subscription) {
        const cancelled = await stopSubscription(obj.subscription);
        return {statusCode: 200, body: cancelled ? 'paid in full, subscription cancelled'
                                                 : 'paid in full, CANCEL FAILED — cancel it in Stripe'};
      }
      return {statusCode: 200, body: 'instalment applied'};
    }

    // ---- the sale ---------------------------------------------------------------
    if (evt.type !== 'checkout.session.completed') return {statusCode: 200, body: 'ignored'};
    if (obj.payment_status && obj.payment_status !== 'paid') return {statusCode: 200, body: 'not paid'};

    const details = obj.customer_details || {};
    const email = String(details.email || obj.customer_email || '').trim().toLowerCase();
    const name = String(details.name || '').trim() || (email ? email.split('@')[0] : 'New client');
    const amount = Math.round((obj.amount_total || 0)) / 100;
    const meta = (obj.metadata || {}).plan;
    const li = await lineItemOf(obj.id);
    // Logged on every payment so the exact ids can be pinned later without guessing.
    console.log('bought:', JSON.stringify({amount: amount, meta: meta || null, item: li}));
    let plan = (meta && PLANS[meta]) ? Object.assign({key: meta}, PLANS[meta]) : null;
    let via = plan ? 'metadata' : '';
    if (!plan && li) { plan = planFromName(li.name, li.recurring); if (plan) via = 'product'; }
    if (!plan) { plan = planFromAmount(amount); if (plan) via = 'amount'; }
    if (!plan) {
      console.error('UNMAPPED PAYMENT', amount, meta, li);
      return {statusCode: 200, body: 'unmapped payment'};
    }
    console.log('matched', plan.key, 'via', via);

    // Stripe retries on any non-2xx, and it retries successes it didn't hear about.
    // Keyed on the session so a retry finds the client it already made.
    const seen = await sb('clients?select=code&stripe_session=eq.' + encodeURIComponent(obj.id) + '&limit=1', {method: 'GET'});
    if (seen.ok) {
      const had = await seen.json() || [];
      if (had.length) return {statusCode: 200, body: 'already created ' + had[0].code};
    }

    const code = await makeCode(name);
    const today = new Date().toISOString().slice(0, 10);   // they pay, that's day one
    const initials = (name.split(/\s+/).map(w => w[0] || '').join('').slice(0, 2) || name.slice(0, 2)).toUpperCase();

    // calls_enabled/call_credits mirror acAccessFor() in index.html: 1:1 gets the two
    // credits (setup call + progress check), VIP books freely. A client created here
    // has to land with the same access as one added by hand.
    const access = plan.tier === 'vip'
      ? {calls_enabled: true,  call_credits: 0}
      : {calls_enabled: false, call_credits: 2};
    const row = Object.assign({
      // null, not '' — "no email on file" has to be one thing, or the roster count of
      // who still needs chasing quietly misses everyone stored as an empty string.
      code: code, name: name, initials: initials, email: (email || null),
      coach_code: 'yusuf1', is_trainer: false, active: true,
      tier: plan.tier, term_months: plan.term,
      paid: plan.first, started_at: today,
      stripe_session: obj.id
    }, access);
    const ins = await sb('clients', {method: 'POST', headers: {'Prefer': 'return=representation'}, body: JSON.stringify(row)});
    if (!ins.ok) {
      const why = await ins.text();
      console.error('client insert failed', ins.status, why);
      // Deliberately no step-down to a smaller row here. index.html does that when you
      // add someone by hand, but dropping stripe_session would drop idempotency, and
      // Stripe retries — so a "successful" degraded insert makes duplicate clients out
      // of one payment. Fail loudly and let it retry once the column exists.
      if (/column/i.test(why)) console.error('run migrations/stripe_client_link.sql');
      // 500 so Stripe retries. Money is in and there's no client — that must not rest.
      return {statusCode: 500, body: 'client insert failed'};
    }

    // total_amount is the contract, paid_amount is what's actually landed. On a split
    // those differ until instalment two, which is exactly what the card should show.
    await sb('sales', {method: 'POST', headers: {'Prefer': 'return=minimal'}, body: JSON.stringify({
      client_code: code, client_name: name,
      program: plan.tier === 'vip' ? ('VIP · ' + plan.term + ' months') : ('1:1 · ' + plan.term + ' months'),
      total_amount: plan.total, paid_amount: plan.first,
      sale_date: today, created_at: new Date().toISOString(),
      due_date: plan.parts > 1 ? new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10) : null
    })});

    console.log('created', code, plan.key, email);

    // Same pipe as the consult notification, same reasoning: a payment just
    // created a client with zero action from Yusuf, so he only finds out by
    // opening Admin unless something tells him. Fire-and-forget on purpose —
    // wrapped so a failed send can never turn into a 500 that makes Stripe
    // retry a payment that has already fully landed; sendEmail's own retries
    // and loud logging are the failure handling, not this function's return
    // code.
    try {
      await sendEmail(
        'New client — ' + name + ' (' + plan.key + ')',
        [
          name + ' just paid and is set up as ' + code + '.',
          '',
          'Plan: ' + (plan.tier === 'vip' ? 'VIP' : '1:1') + ' · ' + plan.term + ' months',
          'Paid today: $' + plan.first + (plan.parts > 1 ? (' of $' + plan.total + ' total') : ''),
          'Email: ' + (email || 'not given'),
        ].join('\n')
      );
    } catch (e) { console.error('stripe-hook: notify threw', e && e.message); }

    return {statusCode: 200, body: JSON.stringify({code: code, plan: plan.key})};
  } catch (e) {
    console.error('stripe-hook', e);
    return {statusCode: 500, body: 'error'};
  }
};
