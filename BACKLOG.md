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

## 3. Morning walk block

The day's opener. Gets the operating system running.

- Mark as done
- How did you feel this morning — short, free text, genuinely optional
- Optional photo (themselves or the scenery)
- Duration, quick-pick chips

**Design:** the softest thing on the page. This is the reflective block, not a task. Don't make it look like the food blocks.

## 4. Free / creative workout mode

Not every session is programmed.

- Log that you trained, pick a few exercises or name a class, done
- No program required
- All that matters is you trained today

**Design:** one screen, minimal fields. This exists for the person who's already at the gym on their phone.

## 5. Goals — own tab

Currently buried under the profile name in the top corner. Deserves a real destination.

Functions as a preferences page: macro and portion targets, training intensity, session frequency and structure, food goals.

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

## Standing rules for every item

- Plan before writing. Show the plan, get approval, then build, commit and push in one go.
- Only hold the push if something surfaces mid-build that I didn't know when I approved.
- `scripts/check.sh` before every ship. Bump `APP_VERSION`.
- Additive by default. Existing logging flows keep working untouched.
- Watch for duplicate element IDs — grep the prefix before writing markup.
- `sbInsert` returns a boolean on failure, not an error. Check the return.
- Real clients use this daily on phones. Degrade gracefully if a migration hasn't run.
