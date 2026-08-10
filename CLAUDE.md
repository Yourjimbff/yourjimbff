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
Full design standard lives in [BACKLOG.md](BACKLOG.md) — read it before designing any new screen.

## What's next
[BACKLOG.md](BACKLOG.md) holds the ordered build backlog. Read it at the start of a session
when I ask for something new, or ask "what's next" — the top unbuilt item is the answer.
