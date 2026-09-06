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

1. CARDIO slot + sheet (additive, writes workout_logs, nothing existing moves)
2. STEPS row on the day (a surface for a value the app already stores)
3. WEIGH-IN + PROGRESS PHOTO slot (both writes already exist; this is a door)
4. Move the echo under the meals
5. Remove the Jim bar from this page
6. Header down to "Today"

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
