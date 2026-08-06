-- ============================================================================
-- MOVEMENT PREFERENCES — run once in the Supabase SQL editor. Idempotent.
--
-- What a client INTENDS: which walks they've scheduled and on what days, how
-- many cardio days they're aiming for in a week, and whether recovery is on and
-- for how long. Preferences only. Nothing here records what they actually did —
-- completions live on the Day side and are not this column's business.
--
-- Written by the Profile page, read by the Day page to decide which slots to
-- draw. One column rather than a table because it is one small object per
-- client, always read whole and always written whole, and because profiles is
-- already the row both sides load.
--
-- Text and not jsonb, deliberately: split_week on this same table already
-- stores JSON as text, both sides already JSON.parse what comes back, and two
-- sessions have agreed this shape. A different type here would return a parsed
-- object on one column and a string on its neighbour, which is exactly the kind
-- of quiet inconsistency that costs an afternoon.
--
-- SHAPE
--   {
--     "v": 1,
--     "walks": [
--       { "id": "w1", "name": "Morning walk", "days": [1,2,3,4,5] },
--       { "id": "w2", "name": "After dinner", "days": [1,2,3,4,5,6,7] }
--     ],
--     "cardio":   { "days_per_week": 3 },
--     "recovery": { "on": true, "minutes": 10 }
--   }
--
--   days: 1=Mon … 7=Sun — the same numbering the program marker already uses.
--
-- THE MISSING-ROW RULE (agreed law, both sessions)
--   NULL or absent means: walks none, cardio 0 days, recovery ON at 10 minutes.
--   Recovery is on for everyone by default, INCLUDING clients who never open
--   the screen — and those clients have nothing stored at all. So that default
--   lives in code on both sides and never in the row. A side that reads a
--   missing value as "recovery off" silently takes the slot away from every
--   client who hasn't touched Profile, and nothing on screen would say so.
--
-- Safe to run late. Until it exists the app's profile save sheds the unknown
-- column and says so rather than pretending it saved.
-- ============================================================================

alter table profiles add column if not exists movement_prefs text;

-- Either nothing, or something that actually parses. A column that can hold
-- half a JSON object is a column that will, and the failure would surface days
-- later as a slot that silently stopped drawing. An invalid cast raises here,
-- which fails the write loudly instead.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_movement_prefs_json') then
    alter table profiles
      add constraint profiles_movement_prefs_json
      check (movement_prefs is null or movement_prefs::jsonb is not null);
  end if;
end $$;

comment on column profiles.movement_prefs is
  'Client movement intentions as JSON text: walks (name + days 1=Mon..7=Sun), '
  'cardio days_per_week, recovery {on, minutes}. NULL means walks none, '
  'cardio 0, recovery ON at 10 min — that default lives in app code, not here. '
  'Preferences only; completions are not stored on this column.';

notify pgrst, 'reload schema';
