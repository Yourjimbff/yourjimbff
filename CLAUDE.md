# YOURJIMBFF App

Single-file PWA. Everything lives in index.html.
Deployed via GitHub → Netlify on push to main.
Backend: Supabase.

## Before every ship
- Run `node --check`
- Bump APP_VERSION
- Show me the diff before committing
- Hold the push if the change affects live client behavior

## Known landmines
- Duplicate element IDs silently grab the wrong element. Check for collisions before adding markup.
- `sbInsert` returns a boolean on failure, not an error. Check the return value.

## Users
Real clients use this daily on phones. Never push untested changes to main.

## Design
Gold/yellow, black, grey, white. Mobile-first.
