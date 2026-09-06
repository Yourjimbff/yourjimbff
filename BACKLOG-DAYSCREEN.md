# THE NEW FRONT PAGE (Yusuf, order, 6 Sep)

His words: "no unnecessary words, or characters. no useless business. just enough."
Keep it glass. And the requirement under all of it: THE CORE LOGGING MUST ACTUALLY
WORK, SAVE, AND SHOW UP ON HIS END.

## THE SCREEN, TOP TO BOTTOM

1. Day strip - unchanged.
2. Header - "Today" ONLY. The date and the steps link come off it.
3. WORKOUT
   - today's session, as now (name, exercise count, set a time, trained another day)
   - NEW: a CARDIO button beside it. It is a real toggle, not decoration - it
     stands there as a reminder that cardio is supposed to happen.
   - tapping it opens an open-type sheet with the echo:
       "30 minutes on the stairmaster"
       optional dictation, understated
       optional photo - proof and memory, NO placeholder box
       optional note, and sentiment is welcome:
       "30 minutes of stairs and it kicked my ass" is a great log
4. NUTRITION (or Food, or Meals - he does not care which word)
   - breakfast / lunch / dinner, unchanged
5. THE ECHO, moved here, directly under the meals
6. STEPS - a row below for the day's final tally
7. WEIGH-IN and PROGRESS PHOTOS - an optional slot that slips onto the screen

## WHAT COMES OFF

- The Jim chat bar on this page. Jim has his own tab; that is what it is for.
  The one thing worth keeping from him is the ECHO, and it moves under the meals.
- The "Today, Sep 6" + steps header line.

## HOW IT IS BUILT

The day screen is _tlDaySectionHtml, composed from NAMED SLOTS:
  {walk, breakfast, lunch, dinner, snack, workout, weigh}
So cardio, steps and the weigh/photo row are ADDITIVE - new slots beside the
existing ones - not a rewrite of the renderer. That is what makes this safe to
ship in pieces instead of one drop.

## BUILD ORDER, safest first

1. CARDIO slot + sheet - SHIPPED v7.981.082, corrected v7.981.084
2. STEPS row on the day - SHIPPED v7.981.086
3. WEIGH-IN + PROGRESS PHOTO slot - SHIPPED v7.981.086
6. Header down to "Today" - SHIPPED v7.981.086 (moved up: once Steps had its
   own row, the chip in the header was a second door to one screen, which was
   the inconsistency he was pointing at)
4. Move the echo under the meals - NOT DONE
5. Remove the Jim bar from this page - NOT DONE, and not started on purpose.
   He wrote "elim jim bar?" with a question mark. That is a door 75 people
   already use, and a question is not an order. Waiting on his word.

WHAT IS PROVEN AND WHAT IS NOT: 1, 2, 3 and 6 are green on check.sh, green on
the full suite, and confirmed in the SERVED file. They have been looked at in
Chromium on his Mac. NOBODY HAS OPENED THIS ON A PHONE. The sheet, the keyboard,
the mic and the file picker are unproven until he looks.

## THE FOUR ASKS ARE ONE SHAPE (his correction, 6 Sep)

"and the buttons are inconsistent. why didnt you move steps and weigh in?"

Cardio shipped as a bespoke glass box while steps was a header chip and the
weigh-in had a third look again. Three designs for one job. They are all
.tlMealAsk now - the row the meals have always asked with - built by one
function, _tlAskRow. .tlCardioRow and its three helper classes are deleted so
nothing can drift back to two designs.

Order on the page, which is his: session, cardio, food, steps, weigh-in,
progress photo.

Each row stops asking when it should. Cardio goes when cardio is logged. Steps
turns into the number. The weigh-in drops off once it is on the day. The photo
stays, because there is no wrong number of progress photos - but it only draws
on TODAY, because openProgressPhotoModal stamps todayDateStr and has no date
field, so that row on a past day would have filed a photo dated today and said
nothing about it.

## THE ECHO IN THE CARDIO SHEET

He had to ask twice: "the echo is not there. i instructed that did i not?"

It is a LIVE READ-BACK on oninput, not a mic button. It runs under the food
echo's law, NO NUMBER RATHER THAN A GUESSED ONE:

  "30 minutes on the stairmaster"  ->  Stairmaster        30 min
  "stairmaster"                    ->  Stairmaster        no time given
  "an hour and a half"             ->  (no number - words are not a figure)
  "pushed the sled til legs quit"  ->  their own words, logged as cardio

It never prices cardio in calories, because this app has no honest way to. Its
vocabulary is _JIM_CARDIO_RE, the same constant Jim reads, so the sheet and the
bar cannot disagree about what counts as cardio.

## HOUSE LAW BROKEN HERE ONCE

The first cardio sheet shipped with two literal emoji for the mic and the
camera. NO EMOJI. SVG is fine; the rule is emoji. tcardio.cjs now fails on any
emoji in the sheet or in a day row.

## A TRAP WORTH REMEMBERING

One apostrophe in a block comment inside a lifted function stopped the test
lifter's dependency chase dead - it blanks quoted strings without stripping
block comments first. The suite went green over a chain with a hole in it.
Keep block comments inside lifted functions apostrophe-free, and assert
CL.unresolved is empty.

1 through 3 are additive and cannot break logging. 4 through 6 move or remove
things 75 people already use, so they ship after the additions are proven, and
they get proved ON HIS PHONE, not in the browser pane. Modals, tap targets and
keyboards do not count as fixed from a desktop pane - that law already exists in
HOW-I-CHECK-MY-WORK.md and this screen is exactly what it was written for.

## THE CARDIO ROW WRITES

workout_logs, the same table his feed already reads, so it lands on his end with
no new plumbing:
  title       'Cardio'
  description what they said, verbatim
  notes       their sentiment, if they gave any
  photo       optional
  date_str    the day they are on, not the UTC day
