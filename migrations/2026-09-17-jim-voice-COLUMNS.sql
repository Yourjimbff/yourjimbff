-- JIM'S VOICE HAD NOWHERE TO LIVE (17 Sep).
--
-- The app asked every client how Jim should talk to them, took the answer, and
-- wrote it to localStorage. 178 profiles, zero saved answers. Yusuf could not
-- see one person's choice or count how many had made one; anyone who cleared
-- their data or opened the app on a second device was asked all over again.
--
-- The file that reads these settings had said so in a comment since it shipped:
-- "those columns are not added yet - a schema change is waiting on Yusuf's
-- word." It waited eight days while the question kept being asked.
--
-- jim_tone already existed as text and had never been written to, so it is left
-- as text and the number is stored as its digits - every reader already runs it
-- through parseInt.
--
-- APPLIED 17 Sep in the SQL editor; all four columns confirmed present.

alter table public.profiles
  add column if not exists jim_optin boolean,
  add column if not exists jim_tone smallint,
  add column if not exists jim_no_critique boolean,
  add column if not exists jim_asked_at timestamptz;

-- How many people have actually answered:
--   select count(*) as profiles, count(jim_optin) as answered,
--          count(*) filter (where jim_optin) as opted_in
--   from public.profiles;
