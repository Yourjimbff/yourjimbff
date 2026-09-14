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

## A CLAMP IS NOT A CEILING (13 Sep)

`portionFor` divided a carb target by a food's carbs-per-unit and clamped the
answer at 8. Perfectly correct code, and it told a man to eat four and a half
handfuls of mixed berries next to two eggs. `mbDefaultQty` handled palms and
fell through to `return 1` for everything else, so an egg — 6g of protein
against a rule aiming at 42 — came out as one egg.

Neither bug is visible in the source. Both bodies read as sound arithmetic.
They only appear when the arithmetic is RUN against the real rows: 28 ÷ 6 =
4.67, 42 ÷ 6 = 7. So portioning gets a suite that evals the lifted functions
and asserts numbers (`tportion.cjs`), not one that regexes the file.

The fix has a shape worth reusing: **compute from the goal, then stop at what a
person actually does.** The ceiling is named per unit (`MB_COUNT_CAP`,
`mbFruitCap`) and is a separate idea from the clamp that stops a divide by a
tiny number from running away. A clamp is arithmetic safety; a ceiling is
domain knowledge. Writing one where the other belongs is how 8 ends up standing
in for "nobody eats eight handfuls of blackberries".

Two things to check whenever you touch a portion rule:
- **A second path may hard-code the same answer.** `MB_INSPO` carries
  `{name:'Turkey Bacon', qty:3}`, so the guided door says 3 and the picker now
  says 2 — same food, two answers.
- **The shelf may not have the food at all.** `_mbComponents` is owner-filtered,
  so a name that resolves against `meal_components` in a query can still be
  another client's private row. Query the filtered shelf, not the table.

## SUPABASE ACCESS TOKENS ARE ES256 HERE, NOT HS256 (13 Sep)

Building email sign-up, signup.js verified the user's access token locally with
session.js's `verify()` — an HMAC-SHA256 check against `SUPABASE_JWT_SECRET`, on
the reasonable-sounding assumption that a Supabase access token is signed with
the project's JWT secret. Every genuine signup came back `bad_token`.

This project issues `{"alg":"ES256","kid":"…","typ":"JWT"}` — asymmetric signing
keys. The JWT secret signs nothing Supabase hands a user. Reading the code could
never have shown this; it took decoding a real token off a real signup.

**The rule: Supabase verifies its own tokens.** `GET /auth/v1/user` with the
user's token as the Bearer and the service key as `apikey`. It checks the
signature against whichever key signed it, and returns 401 for expired, revoked
or foreign tokens. That cannot drift when a key rotates or an algorithm changes,
and it needs one environment variable fewer.

`session.js`'s own tokens ARE HS256 with that secret — it mints them itself, so
`verify()` stays right for those. Don't confuse the two: a session token names a
CLIENT CODE in `sub`, a Supabase token names a user id.

## A NEW COLUMN IS NOT READABLE BY THE ANON KEY (13 Sep)

`clients` carries COLUMN-LEVEL grants from 2026-08-07-lock-down-anon.sql
(`revoke select (phone, email, stripe_session) … from anon`). Once a table has
those, a column added later is **not** selectable by anon by default.

Adding `is_free_app` and asking for it in the sign-in read returned **401 for the
whole row** — and that read IS sign-in, for every account whose code the device
had not cached. Not just new members: everyone.

Two things, every time a migration adds a column the client reads:
- `grant select (<column>) on public.<table> to anon;` in the same migration.
- The client's retry must widen on ANY refusal, not just a 400. "No such column"
  is a 400; "not allowed to see that column" is a 401, and only the second one
  happens on a table with column grants.

## A SLICE THAT CANNOT FIND ITS END READS THE WHOLE FILE (14 Sep)

Twenty-three suites carried this helper:

```js
function slice(a,b){ const i=src.indexOf(a); return i<0?'':src.slice(i, src.indexOf(b,i)); }
```

It guards the START and not the END. When the end marker is missing,
`indexOf` answers -1 and `src.slice(i,-1)` hands back **everything from the
start anchor to the last byte of a 6 MB file**. The suite does not fail. It
goes green against text it was never meant to be reading, and a regex that
should have been scoped to one function now matches anywhere in the app.

It bit twice in one hour. `tobwidth` ended a slice at `// THE PLAN.`, a
comment deleted that same day, and immediately started counting every
`<input>` in the file — reported as "no date input anywhere in the flow"
failing, which sounded like a real product regression. `tfirstopen` sliced on
`visibilitychange` when there are now TWO listeners with that name, grabbed
the wrong one, then ran to EOF when its end marker never matched.

Guarding the end turned up **eight more that were already broken**, some for
weeks — `tonenumber2` ending at `insertFoodLog`, `tsettings2` at
`function CONSULT_BOOK_URL` (which is a `var`, so that anchor was never real),
and `tonboard`'s `fin` ending at `function obRender()` when `obFinish` sits
AFTER `obRender` in the file, so it could never have matched once. Every one
of them had been passing.

**The rules:**

- A missing END anchor is a broken test, not an empty result. It throws now,
  and it names the anchor it could not find.
- An end anchor must come AFTER the start anchor in the file. `indexOf(b,i)`
  searches forward only — an anchor earlier in the file is the same as no
  anchor.
- Anchor on something the code cannot lose quietly: a named function, not a
  comment and not an event name that two listeners share. If a test needs an
  anchor, that is a reason to NAME the thing (`_obDemoVisibility`) rather than
  to write a cleverer regex.
- A whole-file scan cries wolf on comments. Three times now a global
  `!/phrase/.test(src)` has failed on a comment recording why the phrase went
  — which is exactly what that comment is for. Scope to what a screen
  DISPLAYS (`q:'...'`, `>Word<`, `showToast(...)`), never to the file.

## CHECK THE BYTES BEFORE WRITING A PYTHON ANCHOR (14 Sep, again)

Fourth time. The file mixes real characters and their escapes with no rule:
`fdPrefHtml` writes the multiplication sign as a real character while the
onboarding writes the middle dot as a backslash-u escape, and both are
correct where they sit. This very note got it wrong on the way in: the
escape was typed and a real character landed in the file. Reasoning about which one a
heredoc produced is always slower than `grep -n ... | cat -A`. Look first.

## THE SHIP ROUTE IS `git push`, NOT THE GITHUB WEB UI (14 Sep)

Sessions have been shipping by driving github.com/Yourjimbff/yourjimbff/upload
in his Chrome — find the file input, upload, fill the commit fields, click
Commit with JS. Minutes per ship, and every step a place to go wrong.

The Mac VM can reach github over HTTPS and there is a credential store at
`.git/.jarvis-credentials`. `git ls-remote`, `git fetch` and `git push` all
work from `device_bash`. Ship with git.

THE TRAP, and why it is not as simple as committing in place: the local repo
in `~/mnt/yourjimbff` is STALE. Its HEAD sits many commits behind origin/main
because every web-UI ship happened on the server and the clone never learned
about it — while `index.html` on disk kept being edited directly. So
`git diff --stat` there reports ~21,000 changed lines against a HEAD nobody
has used for weeks, and committing that tree would push a month of resurrected
old code.

The working FILES are the truth; the local git HISTORY is not. So:

1. `git fetch origin main` and diff the working files against `origin/main:<path>`
   — not against HEAD. Confirm that ONLY the files you edited differ. On 14 Sep
   the whole tree matched origin except the three files that session touched.
2. Clone fresh into `$HOME` (OUTSIDE `mnt/`, so nothing lands in his folder and
   nothing hits the mount's no-delete rule):
   `git clone --depth 1 --branch main https://github.com/Yourjimbff/yourjimbff.git`
3. Point the clone at the existing credential store by ABSOLUTE path:
   `git config credential.helper "store --file=$HOME/mnt/yourjimbff/.git/.jarvis-credentials"`
4. Copy in only the files you changed, commit, `git push origin main`.

Never read the credential file. Never `git checkout`/`git stash` in his working
tree — his index.html is the only copy of the work.

Netlify still builds from main, so the deploy wait is unchanged (~2 min).
