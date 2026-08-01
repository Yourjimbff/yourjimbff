# YOURJIMBFF App

Single-file PWA. Everything lives in index.html.
Deployed via GitHub → Netlify on push to main.
Backend: Supabase.

## Before every ship
- Run `scripts/check.sh` (extracts inline JS from index.html and runs `node --check` on it)
- Bump APP_VERSION

## Approval flow
- For non-trivial changes: show me the plan first and get approval.
- Once I approve a plan: build, commit, and push in one go — don't ask again before pushing.
- Only hold the push if the build surfaced something I didn't know about when I approved (a schema change, a behavior trade-off, a bug in existing code). Then show me before pushing.
- For small changes with no plan step: show the diff, then commit and push on my approval.

## Known landmines
- Duplicate element IDs silently grab the wrong element. Check for collisions before adding markup.
- `sbInsert` returns a boolean on failure, not an error. Check the return value.

## Users
Real clients use this daily on phones. Never push untested changes to main.

## Design
Gold/yellow, black, grey, white. Mobile-first.
