// THE CALENDAR CLIENT, AGAINST A MOCK OF GOOGLE.
//
// What this proves: the request shapes, the token exchange and its cache, the
// create / adopt / update / delete lifecycle, the "one booking, one event"
// rule, the time budget, and the two guarantees that matter most — that a
// calendar failure is never raised as an exception, and that no attendee is
// ever sent.
//
// What this CANNOT prove: that Google accepts these requests. Nothing here has
// ever spoken to Google, because that needs an OAuth client and a refresh
// token for Yusuf's own account, which only he can create. A green run here
// means the client is correct against the API as documented, and no more.
//
// The mock is a real HTTP server on localhost. _gcal.js reads its endpoints
// from GOOGLE_OAUTH_URL / GOOGLE_CALENDAR_API at require time, which is the
// seam that makes this testable at all, so both are set BEFORE the require.
const http = require('http');
const path = require('path');

let fails = 0, ran = 0;
function ok(label, cond, got) {
  ran++;
  if (!cond) { fails++; console.log('FAIL  ' + label + (got === undefined ? '' : ('\n      got: ' + JSON.stringify(got)))); }
}

const seen = [];               // every request the client made, in order
const events = new Map();      // the mock calendar
let nextId = 1;
let tokenCalls = 0;
let tokenTtl = 3600;
let failNext = null;           // {status} — the next API call answers this
let stall = 0;                 // ms the next API call sleeps before answering

const server = http.createServer((req, res) => {
  let body = '';
  req.on('data', (c) => { body += c; });
  req.on('end', async () => {
    const u = new URL(req.url, 'http://127.0.0.1');
    seen.push({ method: req.method, path: u.pathname, query: u.search, body: body });

    if (u.pathname === '/token') {
      tokenCalls++;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ access_token: 'tok-' + tokenCalls, expires_in: tokenTtl }));
      return;
    }
    if (stall) { const s = stall; stall = 0; await new Promise((r) => setTimeout(r, s)); }
    if (failNext) { const f = failNext; failNext = null; res.writeHead(f.status); res.end(JSON.stringify({ error: 'mock' })); return; }

    const m = /^\/calendars\/([^/]+)\/events(?:\/(.+))?$/.exec(u.pathname);
    if (!m) { res.writeHead(404); res.end('{}'); return; }
    const evId = m[2] ? decodeURIComponent(m[2]) : null;

    if (req.method === 'POST') {
      const id = 'ev' + (nextId++);
      const row = Object.assign({ id: id }, JSON.parse(body || '{}'));
      events.set(id, row);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(row));
      return;
    }
    if (req.method === 'PATCH') {
      if (!events.has(evId)) { res.writeHead(404); res.end('{}'); return; }
      const row = Object.assign({}, events.get(evId), JSON.parse(body || '{}'));
      events.set(evId, row);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(row));
      return;
    }
    if (req.method === 'DELETE') {
      if (!events.has(evId)) { res.writeHead(404); res.end('{}'); return; }
      events.delete(evId);
      res.writeHead(204); res.end('');
      return;
    }
    // GET — the adoption lookup, filtered by the window the client asked for.
    const tMin = new Date(u.searchParams.get('timeMin')).getTime();
    const tMax = new Date(u.searchParams.get('timeMax')).getTime();
    const items = [...events.values()].filter((e) => {
      const s = e.start && e.start.dateTime ? new Date(e.start.dateTime).getTime() : NaN;
      return !isNaN(s) && s >= tMin && s <= tMax;
    });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ items: items }));
  });
});

const START = '2026-09-08T14:00:00.000Z';
const EV = { summary: 'Check-in: Adriana', description: 'x', startISO: START, durationMin: 30, adoptMatch: 'Adriana' };

(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;

  // ---- not configured: nothing is attempted, nothing throws ----
  process.env.GOOGLE_OAUTH_URL = 'http://127.0.0.1:' + port + '/token';
  process.env.GOOGLE_CALENDAR_API = 'http://127.0.0.1:' + port;
  process.env.GOOGLE_CALENDAR_ID = 'primary';
  delete process.env.GOOGLE_CLIENT_ID;
  delete process.env.GOOGLE_CLIENT_SECRET;
  delete process.env.GOOGLE_REFRESH_TOKEN;

  const G = require(path.join(process.cwd(), 'netlify/functions/_gcal.js'));

  ok('UNCONFIGURED  gcalConfigured is false', G.gcalConfigured() === false);
  const un = await G.gcalSync(null, EV);
  ok('UNCONFIGURED  sync refuses without throwing', un && un.ok === false && un.reason === 'not_configured', un);
  ok('UNCONFIGURED  and made no request at all', seen.length === 0, seen.length);

  process.env.GOOGLE_CLIENT_ID = 'cid';
  process.env.GOOGLE_CLIENT_SECRET = 'secret';
  process.env.GOOGLE_REFRESH_TOKEN = 'refresh';
  ok('CONFIGURED  gcalConfigured is true once all three are set', G.gcalConfigured() === true);

  // ---- create ----
  const c = await G.gcalSync(null, EV);
  ok('CREATE  returns an id', c && c.ok === true && !!c.id, c);
  ok('CREATE  did not adopt', c && c.adopted === false, c);
  const posts = seen.filter((s) => s.method === 'POST' && s.path.indexOf('/events') > -1);
  ok('CREATE  exactly one POST', posts.length === 1, posts.length);
  const sent = JSON.parse(posts[0].body);
  ok('CREATE  the instant is sent as UTC', sent.start.dateTime === new Date(START).toISOString(), sent.start);
  ok('CREATE  ...with his zone alongside it', sent.start.timeZone === 'America/New_York', sent.start);
  ok('CREATE  the end is start plus the duration',
     new Date(sent.end.dateTime).getTime() - new Date(sent.start.dateTime).getTime() === 30 * 60000, sent.end);
  // THE EVENT IS HIS. This is the assertion that keeps a client from ever
  // being emailed a calendar invitation.
  ok('CREATE  no attendees are ever sent',
     Array.isArray(sent.attendees) && sent.attendees.length === 0, sent.attendees);
  ok('CREATE  sendUpdates=none on the write', /sendUpdates=none/.test(posts[0].query), posts[0].query);
  ok('CREATE  one token exchange so far', tokenCalls === 1, tokenCalls);

  // ---- update in place: one booking, one event, forever ----
  const before = seen.length;
  const u2 = await G.gcalSync(c.id, Object.assign({}, EV, { summary: 'Check-in: Adriana', description: 'moved' }));
  ok('UPDATE  same id back', u2 && u2.ok === true && u2.id === c.id, u2);
  const newPosts = seen.slice(before).filter((s) => s.method === 'POST' && s.path.indexOf('/events') > -1);
  ok('UPDATE  and NOT a second event', newPosts.length === 0, newPosts.length);
  ok('UPDATE  used PATCH, never PUT',
     seen.slice(before).some((s) => s.method === 'PATCH') && !seen.some((s) => s.method === 'PUT'));
  ok('UPDATE  the calendar still holds exactly one event', events.size === 1, events.size);
  ok('UPDATE  the token was reused, not re-exchanged', tokenCalls === 1, tokenCalls);

  // ---- adoption: his own hand-made event at that instant ----
  events.clear();
  events.set('handmade', { id: 'handmade', summary: 'Blake Bernstein call',
    start: { dateTime: START }, end: { dateTime: '2026-09-08T15:00:00.000Z' } });
  const before2 = seen.length;
  const a = await G.gcalSync(null, Object.assign({}, EV, { summary: 'Check-in: Blake', adoptMatch: 'Blake' }));
  ok('ADOPT  took the event that was already there', a && a.ok === true && a.id === 'handmade', a);
  ok('ADOPT  and says so', a && a.adopted === true, a);
  ok('ADOPT  created nothing',
     seen.slice(before2).filter((s) => s.method === 'POST' && s.path.indexOf('/events') > -1).length === 0);
  ok('ADOPT  the calendar still holds exactly one event', events.size === 1, events.size);

  // ---- adoption is narrow: a different name at the same instant is not it ----
  const before3 = seen.length;
  const a2 = await G.gcalSync(null, Object.assign({}, EV, { summary: 'Check-in: Toni', adoptMatch: 'Toni' }));
  ok('ADOPT  a different person at the same instant is NOT adopted', a2 && a2.adopted === false, a2);
  ok('ADOPT  ...it creates its own event',
     seen.slice(before3).filter((s) => s.method === 'POST' && s.path.indexOf('/events') > -1).length === 1);
  ok('ADOPT  ...and his event was left alone', events.get('handmade').summary === 'Blake Bernstein call');

  // ---- an id that no longer exists: fall through to create, never nothing ----
  const before4 = seen.length;
  const revived = await G.gcalSync('gone-forever', Object.assign({}, EV, { summary: 'Check-in: Nia', adoptMatch: 'Nia' }));
  ok('MISSING  an event deleted by hand is re-created', revived && revived.ok === true && !!revived.id, revived);
  ok('MISSING  ...by a POST', seen.slice(before4).some((s) => s.method === 'POST' && s.path.indexOf('/events') > -1));

  // ---- delete ----
  const d = await G.gcalDelete(a2.id);
  ok('DELETE  reports ok', d && d.ok === true, d);
  ok('DELETE  and the event is gone', !events.has(a2.id));
  const d2 = await G.gcalDelete(a2.id);
  ok('DELETE  deleting it again is still ok, not an error', d2 && d2.ok === true && d2.alreadyGone === true, d2);
  const d3 = await G.gcalDelete('');
  ok('DELETE  with no id refuses without throwing', d3 && d3.ok === false && d3.reason === 'no_event_id', d3);

  // ---- a refusal is reported, never raised ----
  failNext = { status: 400 };
  const bad = await G.gcalSync(null, EV);
  ok('REFUSED  a 4xx comes back as a result', bad && bad.ok === false, bad);
  ok('REFUSED  ...naming the reason', bad && (bad.reason === 'refused' || bad.reason === 'unreachable'), bad);

  // ---- the time budget: a slow Google cannot make a booking late ----
  stall = 900;
  G.gcalBudget(500);
  const t0 = Date.now();
  const slow = await G.gcalSync(null, EV);
  const took = Date.now() - t0;
  G.gcalClearBudget();
  ok('BUDGET  a stalled calendar gives up inside the budget', took < 1500, took);
  ok('BUDGET  ...and reports rather than throwing', slow && slow.ok === false, slow);

  // ---- a dead endpoint is a result, not an exception ----
  await new Promise((r) => server.close(r));
  const dead = await G.gcalSync(null, EV);
  ok('DOWN  an unreachable calendar is a result object', dead && dead.ok === false, dead);
  ok('DOWN  ...and never throws', true);

  if (fails) { console.log('tgcal: ' + fails + ' of ' + ran + ' FAILED'); process.exit(1); }
  console.log('all ' + ran + ' pass (against a MOCK of Google, never Google)');
})().catch((e) => { console.log('tgcal: threw — ' + (e && e.message)); process.exit(1); });
