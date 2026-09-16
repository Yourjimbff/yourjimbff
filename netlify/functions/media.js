// THE MEDIA DOOR — how a private bucket is looked at.
//
// WHAT BROKE, AND IT WAS ME. Closing progress-photos on 15 Sep was right: the
// bucket was world-readable, 24 clients' folders were listable by anybody, and
// a body photo came back over plain HTTP with no key at all. Making it private
// shut that. What nobody checked afterwards is that the app has only ever built
// ONE shape of URL for a stored image —
//     /storage/v1/object/public/<bucket>/<path>
// — and a private bucket answers 400 to every one of them. Both buckets are
// private now. So every progress photo and every meal-library photo in the
// database has been pointing at a 400 since the lock went on.
//
// A lock that silently deletes the thing it was protecting is not a lock, it is
// a loss. This is the other half of that change, and it should have shipped in
// the same hour.
//
// WHAT THIS DOES. Takes a signed session, decides whether that person is
// allowed to see that object, and asks Supabase — with the service key, which
// lives here and nowhere else — for a short-lived signed URL. The browser then
// loads the image straight from storage. The bytes never come through here.
//
// WHO MAY SEE WHAT, and the check is on the PATH rather than on a row:
//   * your own folder — the first path segment is your client code;
//   * a trainer, who coaches these people and needs to see their photos;
//   * meal-photos/coach/... — the shared meal library, which is the same
//     picture of the same chicken for everybody and belongs to no client.
// Anything else is refused. There is no op here that writes, deletes or lists,
// so the worst this door can do is show somebody a picture they were already
// entitled to.
//
// REQUIRED ENVIRONMENT (already set): SUPABASE_URL, SUPABASE_SERVICE_KEY,
// SUPABASE_JWT_SECRET.
const { verify } = require('./session.js');

const json = (code, obj) => ({
  statusCode: code,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  body: JSON.stringify(obj),
});

const BUCKETS = ['progress-photos', 'meal-photos'];
// Deliberately narrow. No .., no backslash, no leading slash, no query string —
// the path is pasted into a URL that is signed with the service key, so it is
// treated as hostile input even though it came out of our own database.
const SAFE = /^[A-Za-z0-9][A-Za-z0-9_\-./]{0,300}$/;

function allowed(bucket, path, claims) {
  if (BUCKETS.indexOf(bucket) < 0) return false;
  if (!SAFE.test(path)) return false;
  if (path.indexOf('..') >= 0) return false;
  const first = path.split('/')[0];
  if (!first) return false;
  if (claims.is_trainer === true) return true;
  if (first === String(claims.client_code || '')) return true;
  if (bucket === 'meal-photos' && first === 'coach') return true;
  return false;
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'POST only' });

  const URL = process.env.SUPABASE_URL;
  const SERVICE = process.env.SUPABASE_SERVICE_KEY;
  const SECRET = process.env.SUPABASE_JWT_SECRET;
  if (!URL || !SERVICE || !SECRET) return json(503, { error: 'not_configured' });

  const auth = (event.headers && (event.headers.authorization || event.headers.Authorization)) || '';
  const claims = verify(auth.replace(/^Bearer\s+/i, ''), SECRET);
  if (!claims) return json(401, { error: 'no_session' });
  if (!claims.client_code) return json(401, { error: 'no_session' });

  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch (e) { body = {}; }
  if (String(body.op || 'sign') !== 'sign') return json(400, { error: 'unknown_op' });

  // One call can carry a page's worth of thumbnails. A feed that signs twenty
  // images one request at a time is twenty cold starts.
  const want = Array.isArray(body.items) ? body.items.slice(0, 40)
    : [{ bucket: body.bucket, path: body.path }];
  const expiresIn = Math.min(Math.max(parseInt(body.expires, 10) || 3600, 60), 86400);

  const H = { apikey: SERVICE, Authorization: 'Bearer ' + SERVICE, 'Content-Type': 'application/json' };
  const out = [];
  for (const it of want) {
    const bucket = String((it && it.bucket) || '');
    const path = String((it && it.path) || '');
    if (!allowed(bucket, path, claims)) { out.push({ bucket, path, error: 'not_yours' }); continue; }
    try {
      const r = await fetch(`${URL}/storage/v1/object/sign/${bucket}/${path.split('/').map(encodeURIComponent).join('/')}`, {
        method: 'POST', headers: H, body: JSON.stringify({ expiresIn }),
      });
      if (!r.ok) { out.push({ bucket, path, error: 'sign_' + r.status }); continue; }
      const d = await r.json();
      // Supabase answers with a root-relative /object/sign/... under /storage/v1.
      const rel = String((d && d.signedURL) || '');
      if (!rel) { out.push({ bucket, path, error: 'no_url' }); continue; }
      out.push({ bucket, path, url: URL + '/storage/v1' + (rel[0] === '/' ? '' : '/') + rel });
    } catch (e) {
      out.push({ bucket, path, error: 'threw' });
    }
  }
  return json(200, { ok: true, items: out, expiresIn });
};
