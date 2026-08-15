-- ============================================================================
-- CLIENTS.BLOCKED — a tier above hidden. Run once in the Supabase SQL editor.
--
-- Hidden is a display state: a hidden client still renders, in the roster's
-- own labeled "Hidden from clients" section, visible to the trainer on
-- purpose (that's the whole point of that section — nobody stays
-- permanently unfindable through the UI). Blocked is different in kind, not
-- degree: a blocked record is filtered out of every trainer-facing read path
-- the app touches — no roster row, no search result, no count, no card, no
-- sales-tab line. Not a softer hidden; the record simply isn't there as far
-- as any screen in this app is concerned.
--
-- Built as a filter, not a delete. The row stays exactly where it is —
-- nothing breaks on joins to food_logs, workout_logs, sales, or anything
-- else keyed on client_code, and payment records are never deleted, full
-- stop. Application code (index.html) reads this column through the
-- existing anon-tier roster query and strips a blocked row out of CLIENTS
-- at the point of ingestion, before any downstream surface (roster, search,
-- call access, training board, sales) gets a chance to read it — the sales
-- tab additionally filters _salesRows directly, since a sale row carries its
-- own denormalized client_name rather than looking one up from clients.
--
-- ONLY REACHABLE BY DIRECT DB QUERY, ON PURPOSE. No UI control in this app
-- sets this column, and the trainer door's clientPatch (netlify/functions/
-- trainer.js) does not whitelist it — passing blocked in a clientPatch
-- payload is silently ignored, not written, same as any other field that
-- isn't on the whitelist. The only way this is ever true is a statement run
-- by hand, here, so a mis-click in the app can never do what this is for.
--
-- SHAPE
--   blocked   boolean, not null, default false — every existing row and
--             every future insert (clientInsert doesn't set it, so the
--             column default applies) starts unblocked.
-- ============================================================================

begin;

alter table public.clients
  add column if not exists blocked boolean not null default false;

comment on column public.clients.blocked is
  'A tier above hidden: filtered out of every trainer-facing read path in '
  'the app entirely (no roster row, no search result, no count). Row is '
  'never deleted. Only ever set by a direct DB statement — no UI or API '
  'path in this app writes it.';

-- Readable by the anon key, same as the other identity/display columns
-- (code, name, initials, coach_code, is_trainer, is_primary, active,
-- hidden) — the app's own filtering is what keeps a blocked record out of
-- view, not a missing grant. sbSelect already self-heals a column PostgREST
-- rejects (drops it from the query and retries), so the app keeps working
-- exactly as it does today even before this line runs.
grant select (blocked) on public.clients to anon;

commit;

-- ----------------------------------------------------------------------------
-- APPLY TO ADISA — confirmed by reading her actual row through the trainer
-- door before this was written, never guessed from a name: code adisa1,
-- currently active=false, hidden=true (she is the client the hidden-clients
-- gap in the roster search was found against). Run separately, after the
-- column above exists:
-- ----------------------------------------------------------------------------
-- update public.clients set blocked = true where code = 'adisa1';

-- ----------------------------------------------------------------------------
-- ROLLBACK — unblock Adisa (or anyone) without touching the column/grant:
--   update public.clients set blocked = false where code = 'adisa1';
--
-- Remove the mechanism entirely:
--   begin;
--   revoke select (blocked) on public.clients from anon;
--   alter table public.clients drop column if exists blocked;
--   commit;
-- ----------------------------------------------------------------------------
