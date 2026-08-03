# YOURJIMBFF App

Single-file PWA. Everything lives in index.html.
Deployed via GitHub → Netlify on push to main.
Backend: Supabase.

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
- Ask decision questions as plain text in your reply — the question, the options, your
  recommendation. Never an interactive picker. I copy these out to answer them elsewhere,
  and a picker doesn't come with me.

## Known landmines
- Duplicate element IDs silently grab the wrong element. Check for collisions before adding markup.
- `sbInsert` returns a boolean on failure, not an error. Check the return value.

## Users
Real clients use this daily on phones. Never push untested changes to main.

## Design
Gold/yellow, black, grey, white. Mobile-first.
Full design standard lives in [BACKLOG.md](BACKLOG.md) — read it before designing any new screen.

## What's next
[BACKLOG.md](BACKLOG.md) holds the ordered build backlog. Read it at the start of a session
when I ask for something new, or ask "what's next" — the top unbuilt item is the answer.
