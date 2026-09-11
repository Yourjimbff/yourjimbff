// THE DEMO IMPORT DOOR (Yusuf, 11 Sep: "import it into my app fully, i only
// want 3d model, no person").
//
// wger.de is an open exercise database (CC-BY-SA). Its media server sends no
// CORS header, so a browser on this app's origin cannot read the bytes - it
// can only display them, which would leave every demo hotlinked to somebody
// else's server forever. This door fetches one wger image server-side and
// hands the bytes back, so the app can copy them into its OWN storage once
// and serve them from there.
//
// It is a PROXY, so it is nailed shut: session required, GET only, and the
// only URLs it will fetch are wger.de exercise images. Nothing else.
const { verify } = require('./session.js');

const json = (code, obj) => ({
  statusCode: code,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  body: JSON.stringify(obj),
});

const ALLOW = /^https:\/\/wger\.de\/media\/exercise-images\/[\w\-./]+\.(png|jpg|jpeg|jfif|webp|gif)$/i;

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, body: '' };
  if (event.httpMethod !== 'GET') return json(405, { error: 'GET only' });

  const SECRET = process.env.SUPABASE_JWT_SECRET;
  if (!SECRET) return json(503, { error: 'not_configured' });
  const auth = (event.headers && (event.headers.authorization || event.headers.Authorization)) || '';
  if (!verify(auth.replace(/^Bearer\s+/i, ''), SECRET)) return json(401, { error: 'no_session' });

  const u = String((event.queryStringParameters || {}).u || '').trim();
  if (!ALLOW.test(u)) return json(400, { error: 'not_allowed' });

  let res;
  try {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 12000);
    res = await fetch(u, { signal: ctl.signal }); clearTimeout(t);
  } catch (e) { return json(502, { error: 'wger_unreachable' }); }
  if (!res.ok) return json(res.status, { error: 'wger_said_' + res.status });

  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > 4 * 1024 * 1024) return json(413, { error: 'too_big' });
  return json(200, {
    type: res.headers.get('content-type') || 'image/png',
    bytes: buf.length,
    b64: buf.toString('base64'),
  });
};
