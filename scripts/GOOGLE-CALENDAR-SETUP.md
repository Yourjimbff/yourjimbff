# Google Calendar — the four values, and where they come from

The code that puts every app booking on your calendar is written and tested.
It does nothing at all until these four environment variables exist in Netlify,
because they are the only part nobody but you can create: they authorise a
server to write to **your** calendar, and Google will only ever hand that
authority to you, in a browser, signed in as you.

Until they are set, every booking still works exactly as it does today and the
function log carries one line per booking saying the calendar was not written.
Nothing breaks while this is unconfigured. That is deliberate.

    GOOGLE_CLIENT_ID
    GOOGLE_CLIENT_SECRET
    GOOGLE_REFRESH_TOKEN
    GOOGLE_CALENDAR_ID       optional — defaults to 'primary', your main calendar

Set them in Netlify → Site settings → Environment variables, then redeploy.

---

## 1. Make the OAuth client (once, about five minutes)

1. <https://console.cloud.google.com/> → create a project, or pick one.
2. **APIs & Services → Library** → search "Google Calendar API" → **Enable**.
3. **APIs & Services → OAuth consent screen**:
   - User type **External** is fine. It stays in "Testing" and never needs
     verification, because you are the only user.
   - Add **your own email** under *Test users*. Miss this and step 2 below
     refuses you from your own project.
   - Scopes: you can leave the screen's scope list empty; the scope is
     requested in the URL below.
4. **APIs & Services → Credentials → Create credentials → OAuth client ID**
   - Application type: **Web application**
   - Authorised redirect URI: `https://developers.google.com/oauthplayground`
   - Create. Copy the **client ID** and **client secret** — those are the
     first two values.

## 2. Get the refresh token (once)

The playground is the least fiddly route and needs nothing installed.

1. <https://developers.google.com/oauthplayground/>
2. Gear icon, top right → tick **Use your own OAuth credentials** → paste the
   client ID and secret from step 1.
3. In the left-hand list, scroll to **Calendar API v3** and tick:

       https://www.googleapis.com/auth/calendar

   (the full scope, not `.readonly` and not `.events` — the app creates,
   updates and deletes.)
4. **Authorize APIs** → sign in as yourself → allow. You will get an
   "unverified app" warning; that is the Testing status from step 1, and
   *Advanced → go to (unsafe)* is the way through it on your own project.
5. **Exchange authorization code for tokens**. Copy the **refresh token** —
   that is the third value.

The refresh token does not expire while the project stays in Testing **and is
used at least every six months**. A calendar this app writes to on every
booking is used constantly, so in practice it does not expire. If it ever does,
every calendar write starts logging `gcal: token refresh failed` and this page
is how you make a new one — nothing else has to change.

## 3. Which calendar

Leave `GOOGLE_CALENDAR_ID` unset to use your main calendar. To use a different
one, open Google Calendar → that calendar's **Settings and sharing** → *Integrate
calendar* → copy **Calendar ID** (it looks like an email address).

---

## What you should see once it is on

- Book a call in the app. Within a second or two the event is on your calendar,
  titled `Check-in: <first name>`, at the booked time in your zone.
- Open it. The description carries what they answered before the call in their
  own words, what is open with them, and when they were last touched.
- Cancel the call in the app. The event goes.
- Nobody is invited to the event and nobody is emailed. It is yours; the
  client's confirmation stays inside the app.

## What to check if nothing appears

The Netlify function log for `trainer` says which, in these words:

| log line | what it means |
|---|---|
| `missing GOOGLE_CLIENT_ID / …` | the variables are not set, or the site was not redeployed after setting them |
| `token refresh failed` | the client id/secret/refresh token do not go together, or the token was revoked |
| `… refused 403` | the Calendar API is not enabled on the project, or the scope was too narrow |
| `… refused 404` | `GOOGLE_CALENDAR_ID` names a calendar this account cannot see |
| `out_of_time` | Google was too slow and the booking response went out without it — the booking is fine, the event is not there |
| `google_event_id column not migrated` | run `migrations/2026-08-31-google-event-id-COLUMNS.sql` |

## The one thing to run in Supabase

`migrations/2026-08-31-google-event-id-COLUMNS.sql`. Without it the events are
still created, but nothing remembers which event belongs to which booking — so
a cancel cannot remove the right one, and the log says so on every booking.
