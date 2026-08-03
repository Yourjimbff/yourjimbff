# YOURJIMBFF — Build Backlog

Ordered by leverage. Each item is self-contained unless noted.

## Design standard — applies to everything below

- **Palette:** gold/yellow as the single accent, black, grey, white. Gold means action — never decorative. If everything is gold, nothing is.
- **Space over density.** This app is used at 6am and 9pm by people who are tired. Bigger touch targets, more padding, fewer things per screen. When in doubt, cut a row rather than shrink it.
- **One primary action per screen.** Everything else is secondary and should look it.
- **Empty states are not errors.** An empty section should invite, not apologise. "No meals yet — build your first" with a button, not a shrug.
- **Motion is confirmation, not decoration.** A tap should produce something instant and physical. No spinners where an optimistic update would do.
- **Language is a coach, not an app.** "Nice — that's logged" beats "Success." "Give it a name" beats "Name is required." Never clinical, never cute.
- **Portions speak human.** Handfuls, palms, cups, ounces. Never grams unless the client asked for grams.
- **Mobile-first, always.** Nothing gets designed at desktop width first.

## 1. Muscle inventory — SHIPPED (strength check)

*Shipped as the Strength Check: anatomy chart + Push/Pull/Legs/Core checklist, three states, recurring check-in. Protocol prescription and performance logging were deliberately cut — programming comes from Yusuf, not the app. That code is parked in place, unreachable.*

Makes training feel personal instead of templated, and it's client-reported so it costs me nothing to run.

- **Intake:** full baseline once. Every muscle group and main lift — how strong do you feel, what do you avoid, what's weak.
- **Recurring:** short form every 1–2 weeks. Not the full baseline, just what changed. Client leaves a note per group:
  - Great connection with back this week
  - Legs were weak, dealing with something, couldn't push it
  - Chest improved, moved up on press
- **Output:** the app knows what got missed and what's behind. Next week's programming emphasises it. A weak leg week means legs get priority.

**Design:** this must not feel like a survey. Cards, not a form. One group per screen or a swipeable stack. Big tap targets for the rating. The note field is optional and should feel like talking, not filling in a box.

## 1b. Key lifts checklist

*Parked — do not build yet. Extends the strength check (#1), which has shipped.*

A second checklist alongside the muscle one: am I good or bad at the lifts themselves. Same three-state answer — Strong / Okay / Weak.

- Push-ups, dips, shoulder press, chest press
- Pull-ups, rows
- Deadlifts, squats
- (extend as the list settles)

The point: muscle groups tell me what's behind anatomically; lifts tell me what's behind in practice. They're different answers and both matter.

**Why it's worth waiting for:** this eventually crosses over with what they actually log in training — the app already stores per-exercise performance in `set_logs`, so a client who says "bad at pull-ups" can be checked against whether they've ever logged one. That crossover is the real feature, and it's why this shouldn't ship as just another form.

## 2. Meal planning

*Unblocked now the library exists.*

Right now clients improvise at log time. They should mostly know what they're eating before they eat it.

- Client sets a default breakfast / lunch / dinner from their library
- Those pre-fill the day's blocks — logging becomes confirming, not composing
- Any block stays overridable without friction

**Design:** planned meals should look different from logged ones — ghosted or outlined until confirmed, solid once done. The day should visually fill in as it goes.

## 3. Morning walk block — SHIPPED

*Was already built when I came to build it: its own sheet, rotating prompts, photo,
time, free-text reflection and a send-off. The one bullet that genuinely didn't work
was the duration — the quick-pick chips had CSS, a populate call and a setter, but no
element to render into, so `getElementById` returned null and every walk logged
`duration: null`. Fixed by adding the missing container.*

- Mark as done ✓
- How did you feel this morning — short, free text, genuinely optional ✓
- Optional photo (themselves or the scenery) ✓
- Duration, quick-pick chips ✓ *(was orphaned; now wired)*

## 4. Free / creative workout mode — SHIPPED

*Already built, and built well: `openFreestyleWorkout` opens one box — "What did
you do?" — with voice input and a photo. Free text goes through
`looseFormatWorkout`, which structures it, and falls back to the raw words if that
fails, so nothing they wrote is ever lost. Duration, notes, steps and intensity are
deliberately hidden inputs; the sheet was cut back to one field on purpose, which is
the design this item asked for. Programs default off, so freestyle IS the path.*

*One real fault found: that tidy-up call had no timeout, and it runs with the save
button disabled. On a bad connection someone stood at "Sorting it out…" forever with
their workout unsaved — the fallback existed but was unreachable while the request
never returned. Capped at six seconds.*

- Log that you trained, pick a few exercises or name a class, done ✓
- No program required ✓
- All that matters is you trained today ✓

## 5. Goals — own tab — SHIPPED

*It had drifted the other way: the Goals tile was deliberately hidden with the note
"Configuration belongs behind the avatar. This page is for looking, not setting," and
goals lived in a sheet. Now a full page (`openGoals`), with the tile back as the way
in and the avatar route landing on the same place.*

*The panel is relocated, not rebuilt — every field id and `saveProfileTab`'s read of
them is untouched, so nothing about how goals persist changed.*

**Still open, and it needs the database:** `bedtime` and `waketime` never reach the
server. `_pSaveSleep` calls `saveProfile()`, which doesn't exist — only
`saveProfileTab` does — and the call is guarded by `typeof`, so it fails silently.
Neither field appears in any upsert payload. Sleep schedules are device-local and
invisible to the trainer.

## 6. Progress → Profile rebuild

Currently half-built and clunky. Should become the place a client defines themselves to the app and to me.

- Goals, stated clearly
- How do I want to be measured? Client picks their own success metrics
- Schedule, life context, who they are, what they do
- Personality settings: *tell me exactly what to eat* ⟷ *mostly free logging with light guidance* — a real range, and the app behaves differently based on where they sit
- Progress photos, weigh-ins, the record of what they've built
- Reflect their own work back at them: look what you've made

**Design:** this is the most emotionally loaded page in the app. It should feel like a profile, not a settings screen.

## 7. Journal marker on the timeline

Small. If they journaled, a marker appears on the day's timeline at the time they did it — so they can see they reflected at that point in the day.

## 8. Jim Chat

*Large — the one that changes how the app feels.*

The gold bar handles one line. This handles a conversation.

- Multi-item, multi-slot in one message → separate logs, correct slots, correct times
- Workouts too, not just food
- Holds context across turns: "actually make that 2pm" or "add a shake to that" amends rather than duplicates
- Confirm before writing — show what it's about to log, one-tap confirm
- Feedback mode: *just log it* (default) or *coach me* — opt-in, per message or persistent
- Also where questions live: *is two eggs and sourdough too much for me?* — answered from their actual data, not generic advice
- Library integration: matches a saved meal → cached macros, no AI round trip, bump `times_logged`
- Trainer mirror: I see client chats. I can correct, and the pattern of questions tells me what content to make

Everything it writes lands in the same tables the manual flows use. Nothing bypasses existing logging.

## 9. Workout progress visibility

*Needs #1 first.*

Clients should see themselves getting better at specific things. Not just weights logged — the narrative.

> You said you were weak here a while back. You're not anymore.

## 10. Screenshot ingest

Client uploads a screenshot from another app — a Strava run, a workout, a food log — and it recognises it, pulls the relevant stats, logs it, and compares against their history over time.

## 11. Yusuf tab → social page

Currently just my log — what I did. Should be what I did *and how I'm doing*. How the workouts felt, how the food's going, what's actually going on with me. Something they follow along with rather than observe.

## 12. Split index.html into concatenated source files

*Not ES modules. See "what we're not doing" at the bottom.*

Today index.html is 30,400 lines: one `<style>` block (1,038), ~1,640 lines of markup,
and **one `<script>` block of 27,700 lines**. Parallel branches can't avoid each other
inside it.

Tier 0 already shipped the cheap half: the `APP_VERSION` bump used to be the one line
every single commit touched, so any two branches conflicted 100% of the time regardless
of anything else. That's gone — version lives in `VERSION` now.

This item is the other half: carve the script block into `src/*.js` and have a build
step concatenate them back into index.html between markers. **Not modules — a literal
join.** Output is semantically identical to today: globals stay global, load order is
preserved, the 745 inline `onclick=` handlers keep working, still one HTTP request.

**Roughly 1–2 days.** The easy domains lift straight out — they're already physically
contiguous:

| prefix | fns | contiguity |
|---|---|---|
| `slog` | 9 | 100% |
| `mp` | 10 | 99% |
| `mi` | 87 | 94% |
| `feed` / `pp` | 15 / 15 | 94% |
| `tp` | 62 | 93% |

The work is the scattered ones, which need physically moving — and that's where bugs
get in: `tl` (64 fns spread over lines 8248–29071, 18% contiguity), `ml` (27%),
`food` (38%), `jv` (114 fns spanning 3110–29304).

CSS and markup split first, at near-zero risk. Markup is already delineated by screen
(`sLogin`, `sSetup`, `sApp`, the tab divs, the modal views).

Also needed: `scripts/check.sh` switches to running on `src/*.js` directly (simpler
than today's HTML parsing), and netlify.toml's build command grows the concat step
alongside the version stamp.

**Watch for:** 8 duplicate element IDs already exist today — `aviDot`, `cfbtn`,
`foodPhotoInput`, `jCallback`, `jNewLock`, `jPageComposer`, `mlibPhotoInput`,
`woPhotoInput`. Splitting markup across files makes these *harder* to spot, not easier.
Worth fixing before or during, not after.

**No safety net.** There are no tests — check.sh only verifies syntax. A 27k-line
reshuffle rests entirely on manual device testing, against clients using this daily.
Do it in slices that each ship independently, not one big-bang commit.

### What we're not doing: real ES modules

Scoped and rejected. The blockers:

- **745 inline handlers.** `type="module"` scopes everything; every `onclick="closeM(…)"`
  breaks unless re-exported to `window`. Runtime-only failures — check.sh catches none of them.
- **The self-update mechanism.** `checkForUpdate()` fetches index.html and regexes
  `/var APP_VERSION = '([^']+)'/`. Break that and every client on a phone silently stops
  receiving updates — no error, they just keep running cached code forever.
- **273 mutable globals**, `cl` alone referenced 600 times. You can't assign to an imported
  binding. (Mitigating: only 3–6 reassignments each, so setters would be tractable.)
- **1,144 cross-domain call edges / 2,581 calls.** Circular imports become real.

It's a rewrite of the app's wiring for no user-visible gain.

## Standing rules for every item

- Plan before writing. Show the plan, get approval, then build, commit and push in one go.
- Only hold the push if something surfaces mid-build that I didn't know when I approved.
- `scripts/check.sh` before every ship. Bump `VERSION` (not the line in index.html).
- Additive by default. Existing logging flows keep working untouched.
- Watch for duplicate element IDs — grep the prefix before writing markup.
- `sbInsert` returns a boolean on failure, not an error. Check the return.
- Real clients use this daily on phones. Degrade gracefully if a migration hasn't run.
