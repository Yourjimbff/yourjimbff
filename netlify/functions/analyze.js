// The assistant's proxy to the Anthropic API.
//
// THIS WAS AN OPEN PROXY. No session, no origin check, CORS wildcard, and both
// the model and max_tokens taken straight from the request body. Anyone who
// found the URL had a free LLM billed to Yusuf's key, at whatever model and
// whatever token count they asked for, callable from any website in a browser.
// Confirmed live before this change: a POST from a foreign Origin with no
// credentials answered 200 with a completion.
//
// It reaches no client data and no database — the hole was spend and abuse,
// not disclosure. That is why it is fixed here rather than staged: nothing
// depends on its openness.
//
// THE GATE IS ANY VALID SESSION, NOT is_trainer. Thirty call sites in
// index.html reach this, and most are a client's own surfaces — Jim's replies,
// food lookup, journal reflections, label reading. Trainer-gating it would
// take the assistant away from every client. Same reasoning, and the same
// placement, as spendCallCredit and myVipCalls in trainer.js: signed in is the
// bar, because the thing being protected is the key rather than a row.
//
// REQUIRED ENVIRONMENT (Netlify → Site settings → Environment variables):
//   ANTHROPIC_API_KEY      already set
//   SUPABASE_JWT_SECRET    already set — the same secret session.js signs with

const { verify } = require('./session.js');

// The app asks for exactly these two and nothing else (index.html sends no
// model at all except MB_LABEL_MODEL for reading a nutrition label). An
// allowlist rather than a passthrough means a stolen session cannot redirect
// the spend onto the most expensive model available.
const ALLOWED_MODELS = {
  'claude-haiku-4-5-20251001': 1,
  'claude-sonnet-5': 1,
};
const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';
// The app's own largest request is 1200. This is the ceiling, not the default,
// and it exists so one session cannot ask for a hundred thousand tokens.
const MAX_TOKENS_CAP = 2000;
const MAX_MESSAGES = 60;

const json = (code, obj) => ({
  statusCode: code,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  body: JSON.stringify(obj),
});

exports.handler = async function (event) {
  // No CORS headers anywhere in this file any more. Every caller is
  // index.html on the same origin, so none of them ever needed one, and a
  // wildcard was what let any page on the internet call this from a browser.
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, body: '' };
  if (event.httpMethod !== 'POST') return json(405, { error: 'POST only' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const SECRET = process.env.SUPABASE_JWT_SECRET;
  if (!apiKey || !SECRET) {
    console.error('analyze: missing env', { key: !!apiKey, secret: !!SECRET });
    return json(503, { error: 'not_configured' });
  }

  // A claim in an unsigned token is just a wish — same sentence, same check,
  // as the door.
  const auth = (event.headers && (event.headers.authorization || event.headers.Authorization)) || '';
  const claims = verify(auth.replace(/^Bearer\s+/i, ''), SECRET);
  if (!claims) return json(401, { error: 'no_session' });

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch (e) { return json(400, { error: 'bad_request' }); }

  if (!Array.isArray(body.messages) || !body.messages.length) {
    return json(400, { error: 'bad_request' });
  }
  if (body.messages.length > MAX_MESSAGES) {
    return json(400, { error: 'too_many_messages' });
  }

  const model = ALLOWED_MODELS[String(body.model || '')] ? String(body.model) : DEFAULT_MODEL;
  let maxTokens = Number(body.max_tokens);
  if (!isFinite(maxTokens) || maxTokens <= 0) maxTokens = 700;
  maxTokens = Math.min(Math.round(maxTokens), MAX_TOKENS_CAP);
  let temperature = Number(body.temperature);
  if (!isFinite(temperature) || temperature < 0 || temperature > 1) temperature = 0.2;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model,
        max_tokens: maxTokens,
        temperature: temperature,
        messages: body.messages,
      }),
    });

    const data = await response.json();
    // If Anthropic rejected the call, pass the real status + message through
    // instead of masking it as a 200 the app can't interpret.
    if (!response.ok || (data && data.type === 'error')) {
      console.error('analyze: upstream', claims.client_code, response.status,
        (data && data.error && data.error.type) || '');
      return json(response.status || 502, {
        error: (data && data.error && data.error.message) || 'Upstream error',
        type: (data && data.error && data.error.type) || 'unknown',
        upstream_status: response.status,
      });
    }
    // Attributable: every completion this key pays for now has a name against
    // it in the logs. Without a session there was nobody to name.
    try {
      const u = data && data.usage;
      if (u) console.log('analyze:', claims.client_code, model, 'in', u.input_tokens, 'out', u.output_tokens);
    } catch (e) {}
    return json(200, data);
  } catch (err) {
    console.error('analyze: threw', claims.client_code, err && err.message);
    return json(502, { error: 'upstream_unreachable' });
  }
};
