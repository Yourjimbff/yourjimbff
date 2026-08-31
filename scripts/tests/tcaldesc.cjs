// WHAT HIS SCREEN SAYS WHEN THE CALL RINGS.
//
// The event description is the whole point of routing bookings to his
// calendar: the time alone he could get from a reminder. This suite lifts the
// real builders out of netlify/functions/trainer.js and renders them against a
// mock PostgREST, so the text below is the text the event actually carries.
//
// THE RULE IT EXISTS TO HOLD: never a summary that loses their words. A
// client's answer is copied verbatim, under the question they were asked, in
// the order they were asked. Nothing shortens or joins one.
//
// The second rule, which is this codebase's own: a failed read is said out
// loud. A section that could not be read must never render as absence, or he
// reads a blank line as "she said nothing" when the truth is nobody could ask.
const fs = require('fs');
const path = require('path');
const SRC = fs.readFileSync(path.join(process.cwd(), 'netlify/functions/trainer.js'), 'utf8');
const L = SRC.split('\n');

function grab(name) {
  const re = new RegExp('^(?:async )?function ' + name + '\\s*\\(');
  const a = L.findIndex((l) => re.test(l));
  if (a < 0) throw new Error('not found: ' + name);
  let depth = 0, started = false, b = a;
  for (; b < L.length; b++) {
    for (const ch of L[b]) { if (ch === '{') { depth++; started = true; } else if (ch === '}') depth--; }
    if (started && depth <= 0) break;
  }
  return L.slice(a, b + 1).join('\n');
}
function grabConst(decl) {
  const a = L.findIndex((l) => l.startsWith(decl));
  if (a < 0) throw new Error('not found: ' + decl);
  // A trailing line comment still ends the statement. Without this, `const X =
  // 7000;  // why` looked unterminated and the walk below swallowed every
  // declaration down to the next closing bracket — which is how this suite
  // first came up with CONSULT_INTAKE declared twice.
  if (/;\s*(\/\/.*)?$/.test(L[a])) return L[a];
  let b = a;
  while (b < L.length && !/^\];|^\};|^\);/.test(L[b])) b++;
  return L.slice(a, b + 1).join('\n');
}

// ---- the mock database ----
// One table of canned answers keyed by the path the code asks for. A path with
// no entry answers a 500, so a read this suite did not think about shows up as
// "couldn't read" rather than quietly as empty.
let ROUTES = {};
global.fetch = async (url) => {
  const p = String(url).split('/rest/v1/')[1] || '';
  const key = Object.keys(ROUTES).find((k) => p.indexOf(k) === 0);
  const r = key ? ROUTES[key] : { status: 500, body: '{"message":"mock: unrouted"}' };
  return {
    ok: r.status >= 200 && r.status < 300,
    status: r.status,
    text: async () => r.body,
    json: async () => JSON.parse(r.body),
  };
};

const svc = () => ({});
const TRAINER_TZ = 'America/New_York';
// The two error classifiers, lifted so the "couldn't read" branches are tested
// against the real ones rather than a guess at what they match.
eval([
  grab('missingTable'),
  grab('badColumn'),
  grabConst('const CAL_DESC_MAX'),
  grabConst('const CONSULT_INTAKE'),
  grab('firstNameOf'),
  grab('calRead'),
  grab('callEventDescription'),
  grab('consultEventDescription'),
].join('\n'));

let fails = 0, ran = 0;
function ok(label, cond, got) {
  ran++;
  if (!cond) { fails++; console.log('FAIL  ' + label + (got === undefined ? '' : ('\n      got: ' + JSON.stringify(got)))); }
}

const QS = ['How was your trip?',
  "What would you like to focus on for the first few weeks that you're back?",
  'How do you feel about it?'];
const AS = ['Long, but really good thank you',
  "Getting my steps back up and not skipping breakfast, honestly that's it",
  'Nervous but ready'];

(async () => {
  // ===== the full house: answers, what is open, last touch =================
  ROUTES = {
    'call_invites': { status: 200, body: JSON.stringify([{ questions: QS, answers: AS, answered_at: '2026-08-30T12:00:00Z' }]) },
    'client_notes': { status: 200, body: JSON.stringify([
      { note: '[PRIVATE] not this one', logged_at: '2026-08-29T10:00:00Z' },
      { note: '[COACHING] sleep, and getting her steps back up', logged_at: '2026-08-28T10:00:00Z' },
    ]) },
    'client_contacts': { status: 200, body: JSON.stringify([{ kind: 'text', contacted_at: '2026-08-25T15:30:00Z' }]) },
  };
  const full = await callEventDescription('http://db', 'k',
    { clientCode: 'adrianap1', clientName: 'Adriana Parker', bookingId: 41 });

  console.log('----- the description, as it renders -----');
  console.log(full);
  console.log('-----------------------------------------');

  ok('HEAD  names the client and their code', full.indexOf('Adriana Parker  (adrianap1)') === 0, full.slice(0, 60));
  QS.forEach((q, i) => {
    ok('VERBATIM  question ' + (i + 1) + ' is printed as asked', full.indexOf(q) > -1, q);
    ok('VERBATIM  answer ' + (i + 1) + ' is printed as given', full.indexOf(AS[i]) > -1, AS[i]);
  });
  // The order is the order he asked in. A description that shuffled them would
  // pair the right words with the wrong question on his screen.
  ok('ORDER  the three pairs are in his order',
     full.indexOf(QS[0]) < full.indexOf(QS[1]) && full.indexOf(QS[1]) < full.indexOf(QS[2]));
  ok('ORDER  each answer sits under its own question',
     full.indexOf(AS[0]) > full.indexOf(QS[0]) && full.indexOf(AS[0]) < full.indexOf(QS[1]));
  ok('OPEN  the coaching note is there, marker stripped',
     full.indexOf('sleep, and getting her steps back up') > -1 && full.indexOf('[COACHING]') < 0);
  ok('OPEN  the private note is NOT', full.indexOf('not this one') < 0);
  ok('TOUCH  the last touch date is his zone, said plainly',
     full.indexOf('Aug 25, 2026') > -1 && full.indexOf('text') > -1, full.slice(-80));

  // ===== a failed read is said out loud, never rendered as absence =========
  ROUTES = {
    'call_invites': { status: 500, body: '{"message":"boom"}' },
    'call_notes': { status: 500, body: '{"message":"boom"}' },
    'client_notes': { status: 500, body: '{"message":"boom"}' },
    'client_contacts': { status: 500, body: '{"message":"boom"}' },
  };
  const broken = await callEventDescription('http://db', 'k',
    { clientCode: 'adrianap1', clientName: 'Adriana Parker', bookingId: 41 });
  ok('NEVER-ASSERT  an unreadable answer set says so', /Couldn.t read their answers/.test(broken), broken);
  ok('NEVER-ASSERT  unreadable notes say so', /Couldn.t read their notes/.test(broken), broken);
  ok('NEVER-ASSERT  an unreadable contact record says so', /Couldn.t read their contact record/.test(broken), broken);

  // ===== a table that does not exist is silence, not a failure ============
  // call_invites may simply not be built on this deploy. That is nothing to
  // report; an unreachable database is.
  ROUTES = {
    // PostgREST's own words for a table that is not there, which is what
    // missingTable() is written against — not Postgres's raw "relation ...
    // does not exist", which never reaches this code.
    'call_invites': { status: 404, body: JSON.stringify({ code: 'PGRST205',
      message: "Could not find the table 'public.call_invites' in the schema cache" }) },
    'call_notes': { status: 200, body: '[]' },
    'client_notes': { status: 200, body: '[]' },
    'client_contacts': { status: 200, body: '[]' },
  };
  const noInvites = await callEventDescription('http://db', 'k',
    { clientCode: 'blakeb1', clientName: 'Blake B', bookingId: 9 });
  ok('MISSING TABLE  no invites table is silence', !/Couldn.t read their answers/.test(noInvites), noInvites);
  ok('MISSING TABLE  and the rest still renders', /LAST TOUCH/.test(noInvites), noInvites);
  ok('MISSING TABLE  no contact recorded is stated, not blank', /No contact recorded/.test(noInvites), noInvites);

  // ===== the notes thread is the fallback when there is no invite =========
  ROUTES = {
    'call_invites': { status: 200, body: '[]' },
    'call_notes': { status: 200, body: JSON.stringify([
      { author: 'client', body: 'I want to talk about my knee', created_at: '2026-08-29T10:00:00Z' },
      { author: 'trainer', body: 'my own note, not hers', created_at: '2026-08-29T11:00:00Z' },
    ]) },
    'client_notes': { status: 200, body: '[]' },
    'client_contacts': { status: 200, body: '[]' },
  };
  const viaNotes = await callEventDescription('http://db', 'k',
    { clientCode: 'toni1', clientName: 'Toni', bookingId: 5 });
  ok('FALLBACK  her own note is carried', viaNotes.indexOf('I want to talk about my knee') > -1, viaNotes);
  ok('FALLBACK  his own note is not — this section is HER words',
     viaNotes.indexOf('my own note, not hers') < 0, viaNotes);

  // ===== a consult is a lead, and its context is the intake form ==========
  const consult = consultEventDescription({
    name: 'Dana Whitfield', phone: '+15551234567',
    goal: 'lose 30 lbs before my sister gets married',
    main_problem: 'I start well and quit around week three',
    why_reaching_out: 'saw the reel about consistency',
  });
  console.log('----- a consult description -----');
  console.log(consult);
  console.log('---------------------------------');
  ok('CONSULT  names them and their number', consult.indexOf('Dana Whitfield') === 0 && consult.indexOf('+15551234567') > -1);
  ok('CONSULT  the form answers are verbatim',
     consult.indexOf('lose 30 lbs before my sister gets married') > -1
     && consult.indexOf('I start well and quit around week three') > -1);
  ok('CONSULT  an unanswered field prints nothing rather than an empty heading',
     consult.indexOf('Willing to invest') < 0, consult);
  const bare = consultEventDescription({ name: 'Someone', phone: '' });
  ok('CONSULT  no number is stated, not blank', /No number on file/.test(bare), bare);

  // ===== the first name is what titles the event ==========================
  ok('NAME  first word only', firstNameOf('Adriana Parker') === 'Adriana');
  ok('NAME  a single name survives', firstNameOf('Blake') === 'Blake');
  ok('NAME  nothing in, nothing out', firstNameOf('') === '' && firstNameOf(null) === '');

  if (fails) { console.log('tcaldesc: ' + fails + ' of ' + ran + ' FAILED'); process.exit(1); }
  console.log('all ' + ran + ' pass');
})().catch((e) => { console.log('tcaldesc: threw — ' + (e && e.message)); process.exit(1); });
