-- ============================================================================
-- THE ATTORNEY PASS — the two clocks, and the review date.
-- Run once in the Supabase SQL editor. One transaction, rollback at the bottom.
--
-- THE PRINCIPLE THIS SERVES (Yusuf, ruling, 22 Aug): a client not logging is an
-- open loop the trainer has not closed. Jarvis flags and prepares; the contact
-- is always Yusuf. So the thing that has to be recorded is HIS DELIBERATE
-- CONTACT, separately from the client's activity — two clocks, never one.
--
-- NO NEW CONTACT TABLE. client_contacts already exists and already carries
-- coach_code, client_code, kind, about, replied and contacted_at, and the app
-- already reads and writes it through the trainer door. Two implementations of
-- one idea is this file's disease, so this EXTENDS it rather than building a
-- second store beside it.
--
-- WHAT IS ADDED
--   source        'observed' | 'self'. Observed = the app saw him do it (a text
--                 sent from here, a cite, a call booked and taken, a note left
--                 after a call). Self = HIS ONE-TAP MARK for a channel the app
--                 cannot see: his personal phone, Instagram, in person.
--                 NEVER-ASSERT RIDES ON THIS COLUMN: a self-reported contact is
--                 always SAID as self-reported, because the app did not witness
--                 it and must not imply that it did. Existing rows default to
--                 'observed' — every one of them was written by the app at the
--                 moment he acted inside it, so that default is a fact, not a
--                 guess.
--   responded_at  when the CLIENT responded — a reply, a log, or a call taken.
--                 Any of the three clears the response clock. Null means no
--                 response is recorded, which is NOT the same as "they ignored
--                 him": a read receipt means nothing and is never written here.
--                 The existing `replied` boolean stays exactly as it is; this is
--                 the timestamp it never had, and the flag logic reads this.
--   clients.review_date   the scheduled review, one per client. It lives on
--                 `clients` rather than in a table of its own because it is one
--                 value per client with no history worth keeping, and `clients`
--                 is already dark and already door-only.
--
-- DARK, AS RULED. client_contacts was created with an `open_all` policy, so the
-- public key could read every contact record. Nothing in the app has ever used
-- that path — verified before writing this: there is no sbSelect, no raw fetch
-- and no sbInsert against client_contacts anywhere; every read goes through the
-- door's `contacts` op and every write through `contactInsert`, both on the
-- service role, which bypasses RLS. So closing it takes nothing away and shuts
-- a door that should never have been open: these are records of what the
-- trainer said to whom, and no client surface has any business reading them.
-- ============================================================================

begin;

-- ---- 1. the two clocks --------------------------------------------------
alter table public.client_contacts
  add column if not exists source text not null default 'observed';

alter table public.client_contacts
  add column if not exists responded_at timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'client_contacts_source_ck') then
    alter table public.client_contacts
      add constraint client_contacts_source_ck check (source in ('observed','self'));
  end if;
end $$;

comment on column public.client_contacts.source is
  'observed = the app witnessed it. self = his one-tap mark for an off-app channel. Always said as self-reported.';
comment on column public.client_contacts.responded_at is
  'When the client responded (reply, log, or call taken). Null = no response recorded, NOT "ignored". Read receipts are never written here.';

-- The flag reads "his last deliberate contact per client", newest first.
create index if not exists client_contacts_clock_idx
  on public.client_contacts (coach_code, client_code, contacted_at desc);

-- ---- 2. the review date -------------------------------------------------
alter table public.clients
  add column if not exists review_date date;

comment on column public.clients.review_date is
  'The next scheduled review for this client. One value, no history. Surfaced in the brief and the who-needs-me list.';

-- ---- 3. close the contact records to the public key ---------------------
-- Nothing in the app reads or writes this table with the anon key; every path
-- is the trainer door on the service role, which is not affected by any of this.
drop policy if exists open_all on public.client_contacts;
alter table public.client_contacts enable row level security;
revoke all on public.client_contacts from anon;
revoke all on public.client_contacts from authenticated;

notify pgrst, 'reload schema';

commit;

-- ROLLBACK, in one paste, if this needs to go away. The columns are additive
-- and safe to keep; this restores the old open policy if closing it turns out
-- to have broken something:
--   begin;
--   create policy open_all on public.client_contacts for all using (true) with check (true);
--   grant all on public.client_contacts to anon, authenticated;
--   notify pgrst, 'reload schema';
--   commit;
-- ============================================================================
