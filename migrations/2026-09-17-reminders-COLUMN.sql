-- OPTIONAL REMINDERS, WHICH HE NAMED FIRST (17 Sep).
--
--   "a library of push notifications for the app ... push notifications will be
--    optional reminders for the user to set. to log their food. log your
--    training. hit 10,000 steps. wind down before bed. and this one is a
--    definite one - of the journal entry and the prompt of the day."
--
-- WHY A COLUMN AND NOT localStorage, and this lesson is eight days old in this
-- same table: the Jim voice settings were written to localStorage for eight days
-- while the app went on asking the question. 178 profiles, zero saved answers.
-- A reminder that only exists in one browser cannot be sent by a server, which
-- is the entire point of a reminder.
--
-- THE SHAPE, deliberately flat and deliberately sparse:
--   [{"k":"breakfast","at":"08:30"}, {"k":"steps","at":"19:30"}]
-- Only the reminders that are ON appear. A scheduler asks one question -
-- "whose array holds an entry whose at is this minute" - and that is an index
-- away from being fast. An off switch removes the entry rather than storing a
-- false, so there is no difference between never set and turned off.
--
-- tz is stored beside it because 08:30 means nothing on a server. It is the
-- IANA name the phone reports, e.g. "America/New_York".

alter table public.profiles
  add column if not exists reminders jsonb,
  add column if not exists reminder_tz text,
  -- WHAT ALREADY WENT OUT TODAY, per reminder: {"steps":"2026-09-17"}.
  -- The sender runs every fifteen minutes and a person's 7:30pm sits inside
  -- three of those windows depending on rounding and clock drift. Without this
  -- they get the same nudge three times, which is the fastest way to have
  -- notifications turned off for good.
  add column if not exists reminder_last jsonb;

-- A NEW COLUMN IS NOT READABLE BY THE ANON KEY UNLESS IT IS GRANTED (13 Sep,
-- written up in CLAUDE.md). profiles carries column-level grants, so a column
-- added later is NOT selectable by default and the read that fails is SIGN IN,
-- for everybody. Both halves go in the same migration, every time.
grant select (reminders, reminder_tz) on public.profiles to anon;
grant update (reminders, reminder_tz) on public.profiles to anon;
-- reminder_last is written ONLY by the sender, on the service key. anon never
-- needs it and is not given it.

-- VERIFY, and expect two rows back:
--   select column_name, data_type from information_schema.columns
--   where table_schema='public' and table_name='profiles'
--     and column_name in ('reminders','reminder_tz');
--
-- And that anon can see them:
--   select column_name, privilege_type from information_schema.column_privileges
--   where table_schema='public' and table_name='profiles' and grantee='anon'
--     and column_name in ('reminders','reminder_tz');
--
-- WHO HAS SET ONE, once this is live:
--   select count(*) filter (where reminders is not null
--                             and jsonb_array_length(reminders) > 0) as people,
--          sum(jsonb_array_length(coalesce(reminders,'[]'::jsonb))) as reminders
--   from public.profiles;
