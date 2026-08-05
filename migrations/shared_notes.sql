-- ============================================================================
-- SHARED NOTES — run once in the Supabase SQL editor. Idempotent.
--
-- Lets ONE note at a time be sent to the client it is about. Everything in
-- client_notes stays private until a note is explicitly shared: both columns
-- below are null on every row that already exists, so running this changes
-- nothing that is already there and exposes nothing.
--
-- WHY TWO COLUMNS AND NOT ONE FLAG
--
-- shared_note holds a SEPARATE copy of the words the client is allowed to
-- read. The client's app renders shared_note and must never read `note`.
-- That way a mistake at the display end shows nothing rather than showing a
-- private note — which is the exact failure this table came within one
-- repaired query of in August 2026. `note` stays the trainer's own text,
-- untouched, forever.
--
-- Safe to run late: until it does, the sharing control on the trainer side
-- says so plainly and refuses to pretend it worked. Nothing else changes.
-- ============================================================================

alter table client_notes add column if not exists shared_at   timestamptz;
alter table client_notes add column if not exists shared_note text;

-- A note is shared only when there are words to show. Makes "shared, with
-- nothing to read" impossible in the data rather than merely unlikely.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'client_notes_shared_pair') then
    alter table client_notes
      add constraint client_notes_shared_pair
      check (shared_at is null or shared_note is not null);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- The database's own refusal to share a private note.
--
-- Notes carry their kind as a marker on the front: '[COACHING] ' and
-- '[Jarvis] ' are things written about a client that could reasonably go to
-- them. '[PRIVATE] ', '[MEMORY] ' and anything unmarked are the coach's own
-- read and never leave his side. The app already enforces this. This makes it
-- true even if the app is wrong: any attempt to mark another kind as shared
-- fails loudly instead of quietly publishing it.
-- ---------------------------------------------------------------------------
create or replace function client_notes_share_guard() returns trigger
language plpgsql as $$
begin
  if new.shared_at is not null and new.note !~ '^\[(COACHING|Jarvis)\] ' then
    raise exception 'this kind of note cannot be shared with a client';
  end if;
  return new;
end $$;

drop trigger if exists client_notes_share_guard_trg on client_notes;
create trigger client_notes_share_guard_trg
  before insert or update on client_notes
  for each row execute function client_notes_share_guard();

-- Only a handful of rows are ever shared, so a partial index is the whole story.
create index if not exists client_notes_shared_idx
  on client_notes (client_code, shared_at desc)
  where shared_at is not null;

notify pgrst, 'reload schema';
