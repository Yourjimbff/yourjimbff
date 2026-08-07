# Trainer read path — spec for approval BEFORE building

Written 7 Aug 2026. Nothing here is built. Flagging the shape first, as ruled.

## The problem in one line

The trainer app and the client app send the **same public key**. So there is no
way to lock a table against the public without also locking it against Yusuf.

Confirmed in code: `sbHeaders()` returns the anon key as both `apikey` and
`Authorization: Bearer` for every request, and there is no Supabase Auth
anywhere in the app — no `signInWith`, no session, no JWT. Postgres sees the
role `anon` for the trainer and for a stranger, identically.

## The pattern already exists

`netlify/functions/stripe-hook.js` already reads `SUPABASE_SERVICE_KEY` from
the environment and talks to Supabase with it. The page never holds that key.
That is exactly the shape needed, so this is an extension of something proven
in this repo rather than a new idea.

## Proposed shape

**One function, one door.** `netlify/functions/trainer.js`

    POST /.netlify/functions/trainer
    { op: "<named operation>", args: { ... } }

- Holds `SUPABASE_SERVICE_KEY` server-side. Never returned, never logged.
- **Named operations only — never a passthrough query.** A function that
  accepts a table name and filter is the same hole with extra steps. The op
  list is closed: `roster`, `clientDeep`, `notes`, `sales`, `board`,
  `markHandled`, `saveNote`, and so on — each one a fixed query with typed
  arguments.
- **Auth on the function, not the page.** A shared trainer secret in an
  `Authorization` header, kept in the trainer's device storage after one
  sign-in against the function. Not the access code, which is guessable and
  ships in the page today.
- **Rate limited and logged.** Every call records op + timestamp. A leaked
  trainer secret should be visible and revocable, unlike the current key.

**Client side stays on the anon key for now**, reading only what phase-one SQL
leaves open. Clients do not go through the function in this phase.

## Sequencing — nothing half-locked

1. Build `trainer.js` with the read ops only. Deploy. **Trainer surfaces read
   through it while the tables are still open**, so the cockpit is provably
   working on the new path before anything is taken away.
2. Verify on the deployed app: signed in as trainer, every cockpit surface;
   signed in as a client, nothing changed.
3. Then paste `2026-08-07-lock-down-anon.sql`.
4. Verify again, both sides. If a surface breaks, the rollback block in the SQL
   file puts it back in one paste.

Step 1 before step 3 is the whole point. Reversed, the cockpit goes dark.

## What this still does not fix

Client data — logs, weigh-ins, photos, phone numbers — stays readable by anyone
holding the public key, because the database cannot tell one client from
another. Fixing that needs **real per-client auth**, and that is a product
decision as much as a technical one:

- **Option A — magic link / OTP by email.** Supabase Auth does it natively,
  RLS then keys on `auth.uid()` and everything scopes properly. Cost: clients
  stop typing a code and start receiving an email. Changes how ~40 people sign
  in.
- **Option B — the access code exchanged for a real token.** A function
  validates the code once and returns a short-lived signed JWT carrying
  `client_code`. RLS keys on that claim. Clients keep typing a code, so nothing
  changes for them. Weaker than A, because the code is still the secret — but
  it is a enormous improvement on today, where the code is checked in
  JavaScript on the device and the database asks nothing.
- **Option C — everything through functions.** Most secure, largest rebuild:
  every read in the app changes.

My recommendation is **B**, then A later if he wants it. B keeps the sign-in
Yusuf's clients already know, and it is the smallest change that lets the
database enforce "your own data only" rather than trusting the page.

## What I need from you

1. Approve the function shape above, or redirect it.
2. Pick a direction for client auth (A, B or C) so phase three has a target.
3. Tell Admin the cutover order — their page strip and my function layer both
   have to be live before the SQL runs.
