# YOURJIMBFF App

Single-file PWA. Everything lives in index.html.
Deployed via GitHub → Netlify on push to main.
Backend: Supabase.

**Only main deploys.** Work on a branch and nothing reaches a client, however many
times you push. Main also moves several times a day — `git fetch` and read
`git show origin/main:VERSION` immediately before bumping, or you'll pick a number
that's already live and `checkForUpdate()` will never pull the release.

The app lives at `yourjimbff.netlify.app`. The apex `yourjimbff.com` has no A record
and `www` points at ClickFunnels.

## Before every ship
- Run `scripts/check.sh` (extracts inline JS from index.html and runs `node --check` on it)
- Bump the version in `VERSION` (not `APP_VERSION` in index.html — that line is a
  `__APP_VERSION__` placeholder now, stamped at deploy time by `scripts/stamp-version.sh`).
  Keeping it out of index.html is what stops parallel branches colliding on every merge.

## Parallel branches
One-time setup per clone, so VERSION bumps auto-resolve to the higher version
instead of stopping the merge:

    git config merge.maxversion.driver 'scripts/merge-version.sh %O %A %B'

Skip it and you just get a normal one-line conflict — nothing breaks.

The driver takes the higher version and **bumps it** when both sides moved,
because the merged tree is newer than either parent. Taking the higher number
as-is lands on a version that's already deployed, and `checkForUpdate` then
never pulls the merge.

It can't help when both branches pick the *same* number — git resolves that
without calling the driver. Bump by two on one side if you're working in
parallel, or check `VERSION` before you merge.

## Approval flow
- For non-trivial changes: show me the plan first and get approval.
- Once I approve a plan: build, commit, and push in one go — don't ask again before pushing.
- Only hold the push if the build surfaced something I didn't know about when I approved (a schema change, a behavior trade-off, a bug in existing code). Then show me before pushing.
- For small changes with no plan step: show the diff, then commit and push on my approval.
- Ask decision questions as plain text I can copy, never as an interactive picker.

## The trainer side has two surfaces, always
Every trainer feature has to be built twice or it only half exists:

- **Desktop cockpit** — `jvRenderTriage()` → `#jvWall`, inside `#jarvisDesktop`.
  Only visible at ≥1024px with `body.jv-on`.
- **Mobile front desk** — `renderMobFrontDesk()` → `#mobFrontDesk`, on the Clients tab.

Shipping to one and not the other is the single most repeated mistake in this
codebase's history. The hidden-clients view and the client-search status line both
went out cockpit-only and read as "not shipped" on a phone.

They also own different state. `loadTrainerDashboard()` sets `window._lastActivity`;
`jvLoadTriage()` sets `jvTriage`/`jvData`. The front desk calls only the latter, so
anything reading `_lastActivity` is empty there. Prefer `jvTriage.per`.

## Known landmines
- Duplicate element IDs silently grab the wrong element. Check for collisions before adding markup.
- `sbInsert` returns a boolean on failure, not an error. Check the return value.
- `sbSelect` **returns `[]` on failure — it never throws.** So `try/catch` around it
  never fires, and any fallback keyed on `!rows.length` fires on a network error as
  well as on genuinely-empty data. That's how the roster loader could silently drop
  `started_at`/`term_months` and make every client read "no term set".
- Deleting a function by searching for the next `\n}\n` over-deletes when the function
  is a one-liner (`function f(){ ... }`), silently swallowing whatever follows.
  `check.sh` catches it only if the result is invalid syntax. Many helpers here are
  one-liners — delete by line range, not by brace.
- A lone apostrophe inside a **regex literal** (`/don'?t/`) reads as an opening quote
  to `check.sh`'s string-stripper, which then blanks every line down to the next
  apostrophe. Two of them a few lines apart hide the `_UPPER` constants in between
  and the check reports them as orphaned when they are defined right there. Build
  such a pattern with `new RegExp("…")` — inside a double-quoted string the stripper
  blanks the contents anyway, so the apostrophes are invisible to it (17 Aug).
- `<input type="date">` renders in the **OS region setting**, not `navigator.language`
  and not anything the page can set. If a date must be unambiguous, echo it beneath the
  field with `_usDate()`. There are seven of these inputs; only the contract one echoes.
- Never infer client codes from `PAID_INTERM`, `CLIENT_DOSSIERS` or the hardcoded
  `CLIENTS` map — they're stale, and several codes in them have no row in the live
  `clients` table. Query the real table. `UPDATE ... WHERE code='wrong'` reports
  `UPDATE 0` and looks exactly like success.
- A chat-logged `workout_logs` row carries both a one-line `description` (the
  marker format's own rule: "one clean line of what was done") and a properly
  structured `exercises` JSONB array. Anything rendering a session's exercise
  list must read `exercises` first and only re-parse `description` when it's
  absent — `_bfParseDesc` only ever split on newlines, so a correctly-formed
  one-line description collapsed into a single exercise wearing every other
  exercise's name and sets crammed into its own text (`_bfItemsFor` is the
  fix, 10 Aug — a real client's five-exercise session had rendered as one).

## Supabase traffic
All of it passes through a `fetch` wrapper (search `SUPABASE BACKOFF + CIRCUIT BREAKER`)
that adds exponential backoff with jitter and opens a breaker after 5 consecutive
failures. Nothing needs to opt in — but a request that isn't `SB_URL`-prefixed bypasses
it entirely, which is what keeps the analyze function and the version check working.

Two things that must stay in step with the schema:
- `JV_CLIENT_TABLES` lists every table keyed on `client_code` and drives client deletion.
  A new client-keyed table that isn't in it leaves orphaned rows behind forever.
- Loading the app fires ~25 table reads. Adding more is not free during an outage.

**Verify writes by reading them back**, never by trusting a return value. A boolean says
the request didn't error; it doesn't say the row landed with the values you sent.

## Testing without a database
There are no tests, so the working pattern is:
- **Logic** — extract functions out of index.html by name with `sed`/`awk`, `eval` them
  in node against stubs, assert. Concatenate everything into one string and `eval` once
  at module scope; evaluating inside a callback scopes the declarations to it.
- **The real app, offline** — `.serve.cjs` + `.claude/launch.json` serve index.html
  locally. Copy it with `SB_URL` rewritten to `http://127.0.0.1:9` to exercise every
  failure path without a single request reaching the real project.
- `node --check` (what `check.sh` runs) proves syntax only. It will happily pass code
  that throws on load or has been half-deleted.

## Shared design pieces
- `.ov*` classes (`ovCard`, `ovEy`, `ovBig`, `ovTrack`, `ovFill`, `ovEnds`, `ovMeta`) are
  the progress-overview language, used by the profile page and — with `.ovSm` — the
  client card. Reuse them rather than restating the design.
- The app reports facts and doesn't grade people. "Going the wrong way" and percentage
  scores were removed deliberately; state the numbers and let the trainer conclude.

## Users
Real clients use this daily on phones. Never push untested changes to main.

## Design
Gold/yellow, black, grey, white. Mobile-first.
No emoji anywhere, house law (Yusuf, 10 Aug) — including fallback icons like a
lifter glyph on a workout title. SVG icons are fine; the rule is emoji specifically.
Full design standard lives in [BACKLOG.md](BACKLOG.md) — read it before designing any new screen.

## What's next
[BACKLOG.md](BACKLOG.md) holds the ordered build backlog. Read it at the start of a session
when I ask for something new, or ask "what's next" — the top unbuilt item is the answer.

## Consult alerts: one channel works, the other never has (12 Sep)
The "stranger booked a consult" alert was built as TWO things and only one of
them has ever fired:
  · the TEXT comes from send_watch.py's check_consults() on his Mac, polling
    the trainer door. It works — a 1:11:42am booking texted him at 1:13:18am,
    96 seconds. But it only fires while his Mac is awake, so a booking made
    while it sleeps waits for the wake.
  · the EMAIL (netlify/functions/notify-consult.js, fired by a Supabase
    database webhook on INSERT) is NOT configured. POST it and it answers
    503 {"error":"not_configured"} — CONSULT_WEBHOOK_SECRET was never set in
    Netlify. Never tell him he was emailed about a booking. Nothing in his
    Gmail has ever come from this door.

## The booking forms are in a DIFFERENT repo
consult_requests is written straight into Supabase with the anon key by
github.com/Yourjimbff/yourjimbff-offer (private) — never through a function
in this repo. Two doors in it:
  · `/` (index.html, 65.8 KB) — the full offer page. Its modal is the only
    one that asks age/height/weight/main_problem, so a row carrying those
    came from there.
  · `/book` — the text-thread link. Phone is explicitly optional there and it
    sets no age/height/weight/main_problem.
NEITHER validates the number's length: row 47 stored the phone as the literal
string "4692580 66" — nine digits with a space in the middle. Ten digits is
the test everywhere on this side of the wall (_cqPhone, clients.phone's
has_phone, the send queue's own refusal), and that repo has never heard of it.

## THE STAND-IN PROFILE IS NOT AN EMPTY PROFILE (12 Sep)

An account with no `profiles` row is handed a local stand-in a few lines into
`signIn` so the Day page has numbers to draw:

    goal:'maintain', cal_target:1800, protein_target:150

`profile` is therefore NEVER empty for anybody, ever. Any check that asks "has
this person filled anything in?" by reading `profile` will answer yes for a
brand-new account. That is exactly how the first-run questions shipped in a
state where they could not fire for a single human being: three of the
stand-in's own invented values sat on the signs-of-life list.

If you need to know whether a human has ever filled something in, read the
SERVER row - `profiles[0]` from the sbSelect in `signIn`, or null when the
array came back empty. `cal_target_seeded` marks the fake 1800 for the same
reason, and is the older half of this same landmine.

## COACH FURNITURE VS THE FREE APP (12 Sep)

`isTrainer(code)` splits the app in two, and for two years "not a trainer"
meant "one of Yusuf's clients". It does not any more. Surfaces that only make
sense because a coach is on the other end - the phone-number ask, the Calls
card, Your file on the Progress page - must test `isFreeApp(cl.code)` as well,
or a stranger who downloaded the app is told Yusuf needs their number.

`FREE_APP_CODES` is the one list. Add the next free code there and nowhere
else; the first-run questions read the same list.

## LAW IS GLASS. NO OLD SCREEN EVER COMES BACK (12 Sep, learned the hard way)

Twice in one night a NEW client-facing screen went out as the trainer's old
builder (`renderTrainingBuilder`) in a full-screen sheet - old chrome, a This
week pager, a "set it in my goals" card - designed and checked at 1512px on a
Mac. Both were regressions of the design function, and both came from one
omission: BACKLOG.md's design standard was not read first.

Rules, in the order they were broken:
- **Read BACKLOG.md's "Design standard" before designing any screen.** It is
  eight lines. "Mobile-first, always. Nothing gets designed at desktop width
  first" is one of them.
- **Every client surface is the house glass**: the `.tlHero` / `.pgCard`
  recipe (radial-gradient, #2e2e2e edge, 20px radius, deep shadow, gold corner
  glow). Reusing a trainer screen's MECHANISM (its data, its save, its
  read-back) is right. Reusing its SCREEN is a regression.
- **Before building a client surface, grep for the one that already exists.**
  The Program tab has carried a glass builder for clients since v7.981.104
  (`_gpDaysInner`: add a session, eight kinds, add a movement, sets/reps, make
  a rest day, `pgSavePlan`). It was invisible to a free user only because it
  refused to draw an empty week. An empty week is not an invented one.
- **Nothing is invented, and a sentence does not change that.** A week
  composed from a sex and a day count is invented whether or not "nothing is
  yours until you save it" is written underneath. Build means seven empty days.
- **`_saveTrainingPlanQuiet` fires on every type change** when `#tpBody` is on
  screen. A test that opens the trainer builder writes to the live account.

## MEASURING A COLOUR ON A BACKGROUNDED TAB LIES (13 Sep)

Verifying the gold "done" state on the served build, `getComputedStyle(el).color`
kept answering the OLD colour even with the class on, the rule matching, and
`--gold` resolving. Even an inline `style.color='var(--gold)'` read back as the
old value.

The cause: the element has `transition:color .18s`, and a computed style during
a transition is the INTERPOLATED value at the current time. His Chrome window
was not in front, so `document.hidden` was true, so no animation frames ran, so
time never advanced and the interpolation sat forever at frame zero.

Two ways out, both cheap: read `document.hidden` first, and set
`el.style.transition='none'` before measuring (restore it after). Do this for
every colour assertion on a live page — the alternative is half an hour spent
hunting a CSS bug that was never there.
