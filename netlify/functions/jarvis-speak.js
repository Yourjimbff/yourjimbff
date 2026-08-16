// Jarvis's voice. Takes a line of text, returns the audio for it.
//
// THE KEY NEVER REACHES THE PAGE. index.html carries a live Supabase anon key
// in plain sight because that key is designed to be public; an ElevenLabs key
// is not, and it spends real money. So the page posts text here and gets audio
// back, and the key exists only in this process.
//
// SESSION-GATED, for the same reason. This endpoint costs credits on every
// call, and a public URL that turns text into paid audio is a bill waiting to
// be run up by anyone who finds it. A valid signed session is required, and
// only a trainer's — clients never speak as Jarvis.
//
// REQUIRED ENVIRONMENT (Netlify → Site settings → Environment variables):
//   ELEVENLABS_API_KEY     the account key. Server-side only, never shipped.
//   SUPABASE_JWT_SECRET    already set — used to verify the caller's session.
//
// Without the key this answers 503 and the page carries on in silence. That is
// the whole contract: voice is garnish. Nothing about Jarvis waits on it,
// nothing breaks without it, and a failure here is never shown as an error —
// see _jvSpeakLine in index.html, which renders its text first and speaks
// second, and never claims a line was spoken when the audio call failed.

const { verify } = require('./session.js');

const API = 'https://api.elevenlabs.io/v1';
// The voice Yusuf picked, by NAME, because an id means nothing to him and he
// renamed his choice to this in his own account. Second name is his stated
// fallback. If neither resolves this refuses and says what his list holds
// rather than choosing a voice on his behalf.
const WANTED = ['Jarvis', 'Talkative Joe'];

// Resolved once per warm container. The lookup is a whole extra round trip and
// the answer does not change between calls.
let VOICE_CACHE = null;

const json = (code, obj) => ({
  statusCode: code,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  body: JSON.stringify(obj || {}),
});

async function listVoices(KEY) {
  const r = await fetch(`${API}/voices`, { headers: { 'xi-api-key': KEY } });
  const text = await r.text();
  if (!r.ok) {
    console.error('jarvis-speak: voices lookup failed', r.status, text.slice(0, 200));
    return { ok: false, status: r.status, detail: text.slice(0, 200) };
  }
  let data = null;
  try { data = JSON.parse(text); } catch (e) { return { ok: false, status: 502, detail: 'bad json' }; }
  const voices = (data && data.voices) || [];
  return { ok: true, voices: voices.map((v) => ({ id: v.voice_id, name: v.name, category: v.category })) };
}

async function resolveVoice(KEY) {
  if (VOICE_CACHE) return { ok: true, voice: VOICE_CACHE, cached: true };
  const got = await listVoices(KEY);
  if (!got.ok) return got;
  for (const want of WANTED) {
    const hit = got.voices.find((v) => String(v.name).trim().toLowerCase() === want.toLowerCase());
    if (hit) { VOICE_CACHE = hit; return { ok: true, voice: hit, cached: false }; }
  }
  // Neither name is in his account. Say what IS, and choose nothing.
  return { ok: false, status: 404, noVoice: true, available: got.voices.map((v) => v.name) };
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'POST only' });

  const KEY = process.env.ELEVENLABS_API_KEY;
  const SECRET = process.env.SUPABASE_JWT_SECRET;
  if (!KEY) { console.error('jarvis-speak: missing ELEVENLABS_API_KEY'); return json(503, { error: 'not_configured' }); }
  if (!SECRET) { console.error('jarvis-speak: missing SUPABASE_JWT_SECRET'); return json(503, { error: 'not_configured' }); }

  const auth = event.headers.authorization || event.headers.Authorization || '';
  const claims = verify(auth.replace(/^Bearer\s+/i, ''), SECRET);
  if (!claims) return json(401, { error: 'no_session' });
  if (claims.is_trainer !== true) return json(403, { error: 'trainer_only' });

  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch (e) { return json(400, { error: 'bad_request' }); }

  // Diagnostic shape, so his voice list can be read without the key leaving
  // this process and without spending a credit.
  if (body.op === 'voices') {
    const got = await listVoices(KEY);
    if (!got.ok) return json(502, { error: 'lookup_failed', detail: got.detail });
    return json(200, { voices: got.voices });
  }

  const text = String(body.text || '').trim();
  if (!text) return json(400, { error: 'bad_request' });
  // Confirmations, not essays. A cap here is the difference between a month of
  // voice and a week of it — the plan is roughly a thousand short lines.
  if (text.length > 300) return json(400, { error: 'too_long' });

  const rv = await resolveVoice(KEY);
  if (!rv.ok) {
    if (rv.noVoice) return json(404, { error: 'no_voice', wanted: WANTED, available: rv.available });
    return json(502, { error: 'lookup_failed', detail: rv.detail });
  }

  try {
    const r = await fetch(`${API}/text-to-speech/${encodeURIComponent(rv.voice.id)}`, {
      method: 'POST',
      headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5',   // cheapest per character of the current line, and fast
        voice_settings: { stability: 0.45, similarity_boost: 0.8 },
      }),
    });
    if (!r.ok) {
      const detail = await r.text();
      console.error('jarvis-speak: tts failed', r.status, detail.slice(0, 200));
      // 429 is a rate limit or an exhausted quota. The page treats every
      // non-200 the same way — silence — but the log says which.
      return json(502, { error: 'tts_failed', status: r.status });
    }
    const buf = Buffer.from(await r.arrayBuffer());
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' },
      body: buf.toString('base64'),
      isBase64Encoded: true,
    };
  } catch (e) {
    console.error('jarvis-speak: threw', e && e.message);
    return json(502, { error: 'tts_failed' });
  }
};
