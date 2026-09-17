// ===== THE OTHER HALF OF THE REMINDER LIBRARY ============================
//
// A screen where somebody sets a reminder and nothing ever sends it is not a
// feature, it is a form. This is the sender.
//
// Yusuf, 17 Sep: "push notifications will be optional reminders for the user to
// set. To log their food. Log your training. Hit 10,000 steps. Wind down before
// bed. And this one is a definite one - of the journal entry and the prompt of
// the day."
//
// It runs every fifteen minutes, on Netlify's own scheduler. There was no
// server-side scheduler anywhere in this stack before this file - trainer.js
// says so in its own comment - which is why every "we should remind them"
// idea has stopped at the idea.
//
// WHAT IT WILL NOT DO, and this is deliberate:
//   · It never invents a reminder. Only what somebody switched on themselves.
//   · It never sends twice. reminder_last carries the day each one last went,
//     because a 7:30pm sits inside more than one fifteen-minute window once
//     clocks drift, and the same nudge three times is how somebody turns
//     notifications off for good.
//   · It never sends into the middle of the night. Anything landing outside
//     06:00-23:00 in the person's OWN timezone is skipped rather than delayed,
//     because a reminder to log breakfast is worthless at 2am.
//   · A dead token is left alone unless Apple says 410 Unregistered. A
//     BadDeviceToken usually means the environment disagrees with the build on
//     the phone, and clearing a good token over a config mistake silences
//     somebody for good.
const { pushOne, isDeadToken } = require('./_apns.js');

const URL = process.env.SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_KEY;
const svc = () => ({ apikey: SERVICE, Authorization: 'Bearer ' + SERVICE });

// How wide a window counts as "now". The schedule is every 15 minutes; the
// window is 16 so a run that starts a few seconds late still catches its own
// minute rather than dropping somebody's reminder silently for a day.
const WINDOW_MIN = 16;
const DAY_START = 6 * 60;       // nothing before 6am, local
const DAY_END = 23 * 60;        // nothing after 11pm, local

// His list, in his words where he gave them. The body is what lands on a lock
// screen, so it is short, it is never a guilt trip, and it never pretends to
// know something it cannot know - "time to log lunch" is honest, "you haven't
// logged lunch" is a claim this function has not checked.
const COPY = {
  breakfast: ['Breakfast', 'Log it while you can still see it'],
  lunch:     ['Lunch', 'Log it while you can still see it'],
  dinner:    ['Dinner', 'Log it while you can still see it'],
  training:  ['Training', 'Did you train today? Two taps.'],
  steps:     ['10,000 steps', 'Still time to go and get them'],
  winddown:  ['Wind down', 'Screens off, food done, bed soon'],
  journal:   ['Prompt of the day', ''],
};

// THE PROMPT OF THE DAY. He called this one "a definite one" and said it feeds
// the deep profile, so these are questions whose answers are worth keeping -
// not affirmations. One a day, the same one for everybody, rotating by date so
// it is stable for a whole day and nobody gets two.
const PROMPTS = [
  'What did you eat today that you actually enjoyed?',
  'What went well today that you would do again tomorrow?',
  'When were you hungriest today, and what happened just before it?',
  'What is one thing you did today for the person you want to be?',
  'How did you sleep, and what did that change about today?',
  'What got in the way today, honestly?',
  'What did your body ask for today that you ignored?',
  'What would have made today a 10 out of 10?',
  'Where did your energy go today?',
  'What did you learn about yourself this week?',
  'Which meal today would you eat again tomorrow?',
  'What are you putting off, and what is the smallest first piece of it?',
  'Who did you spend time with today, and how did you feel after?',
  'What did you do today that took discipline?',
];
function promptFor(dateStr) {
  let h = 0;
  for (let i = 0; i < dateStr.length; i++) h = (h * 31 + dateStr.charCodeAt(i)) >>> 0;
  return PROMPTS[h % PROMPTS.length];
}

// The person's own wall clock. An 8:30 reminder means 8:30 where they are, and
// a server that reasons in UTC sends breakfast at four in the morning.
function localNow(tz) {
  const d = new Date();
  let parts;
  try {
    parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz || 'UTC', hour12: false,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    }).formatToParts(d);
  } catch (e) {
    // An unknown or missing zone is not a reason to send at the wrong time.
    return null;
  }
  const g = (t) => (parts.find((p) => p.type === t) || {}).value || '';
  const hh = parseInt(g('hour'), 10), mm = parseInt(g('minute'), 10);
  if (!isFinite(hh) || !isFinite(mm)) return null;
  return { date: g('year') + '-' + g('month') + '-' + g('day'), mins: hh * 60 + mm };
}

function dueNow(at, nowMins) {
  const m = String(at || '').match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return false;
  const want = parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
  if (!isFinite(want)) return false;
  const delta = nowMins - want;
  return delta >= 0 && delta < WINDOW_MIN;
}

exports.handler = async function () {
  if (!URL || !SERVICE) {
    console.error('reminders: SUPABASE_URL or SUPABASE_SERVICE_KEY is not set');
    return { statusCode: 500, body: 'not_configured' };
  }
  let rows = [];
  try {
    const q = URL + '/rest/v1/profiles'
      + '?select=client_code,push_token,reminders,reminder_tz,reminder_last'
      + '&push_token=not.is.null&reminders=not.is.null&limit=5000';
    const r = await fetch(q, { headers: svc() });
    if (!r.ok) {
      console.error('reminders: read failed', r.status, (await r.text()).slice(0, 200));
      return { statusCode: 502, body: 'read_failed' };
    }
    rows = await r.json();
  } catch (e) {
    console.error('reminders: read threw', e && e.message);
    return { statusCode: 502, body: 'read_threw' };
  }

  let sent = 0, skipped = 0, failed = 0;
  for (const row of rows || []) {
    const list = Array.isArray(row.reminders) ? row.reminders : [];
    if (!list.length || !row.push_token) continue;
    const now = localNow(row.reminder_tz);
    if (!now) { skipped++; continue; }
    if (now.mins < DAY_START || now.mins > DAY_END) continue;

    const last = (row.reminder_last && typeof row.reminder_last === 'object') ? row.reminder_last : {};
    let changed = false;

    for (const item of list) {
      if (!item || !item.k) continue;
      if (!dueNow(item.at, now.mins)) continue;
      if (last[item.k] === now.date) continue;           // already went today

      const copy = COPY[item.k];
      if (!copy) continue;                                // a kind this build does not know
      const body = (item.k === 'journal') ? promptFor(now.date) : copy[1];

      // pushOne answers an OBJECT - {ok, status, reason} - not a boolean. Reading
      // it as one would make every failure look like a success, which is the
      // exact shape of bug this codebase has already paid for twice.
      let res = null;
      try {
        res = await pushOne(row.push_token, copy[0], body, { tab: item.k === 'journal' ? 'Journal' : 'Today' });
      } catch (e) {
        console.warn('reminders: send threw for', row.client_code, item.k, e && e.message);
        res = null;
      }
      if (res && res.ok) {
        sent++;
        last[item.k] = now.date;                          // stamped only on a real send
        changed = true;
      } else {
        failed++;
        try { console.warn('reminders: refused', row.client_code, item.k, res && res.status, res && res.reason); } catch (e) {}
        // A token Apple has explicitly retired is cleared. Nothing else is:
        // see the note at the top of this file.
        try {
          if (isDeadToken(res)) {
            await fetch(URL + '/rest/v1/profiles?client_code=eq.' + encodeURIComponent(row.client_code), {
              method: 'PATCH',
              headers: Object.assign({}, svc(), { 'Content-Type': 'application/json', Prefer: 'return=minimal' }),
              body: JSON.stringify({ push_token: null }),
            });
          }
        } catch (e) { /* clearing a dead token is best effort */ }
      }
    }

    if (changed) {
      try {
        await fetch(URL + '/rest/v1/profiles?client_code=eq.' + encodeURIComponent(row.client_code), {
          method: 'PATCH',
          headers: Object.assign({}, svc(), { 'Content-Type': 'application/json', Prefer: 'return=minimal' }),
          body: JSON.stringify({ reminder_last: last }),
        });
      } catch (e) {
        // A stamp that fails to write means the same reminder may go again in
        // fifteen minutes. Loud, because that is the one failure people notice.
        console.error('reminders: could not stamp reminder_last for', row.client_code, e && e.message);
      }
    }
  }

  const line = 'reminders: ' + sent + ' sent, ' + failed + ' failed, ' + skipped + ' skipped (no usable timezone), '
    + (rows || []).length + ' people carry one';
  console.log(line);
  return { statusCode: 200, body: line };
};

// Every fifteen minutes. Netlify reads this export; nothing else schedules it.
exports.config = { schedule: '*/15 * * * *' };
