-- ============================================================================
-- WEEKLY CHECK-IN CALLS — two new columns on clients. Run once in the
-- Supabase SQL editor.
--
-- A third call-access tier alongside the existing calls_enabled (unlimited)
-- and call_credits (one-off, non-refilling). weekly_calls holds ONE credit
-- at a time and never accumulates: book it, it's gone until it refills.
--
-- No server-side scheduler exists in this stack, so nothing ever writes a
-- credit back on a timer. Entitlement is computed at READ time instead, from
-- weekly_call_spent_at alone — the boundary is Sunday 00:00 America/New_York,
-- the same for every client, recomputed fresh wherever it's checked
-- (index.html's hasWeeklyCreditNow, trainer.js's own copy — duplicated for
-- the same reason vip_calls' occurrence math already is: a Netlify function
-- can't import from another, or from the page).
--
-- weekly_call_spent_at is written exactly once per spend, by the guarded
-- spendWeeklyCall op (trainer.js) — never by the flexible clientPatch op,
-- which only ever sets weekly_calls itself.
-- ============================================================================

begin;

alter table public.clients add column if not exists weekly_calls boolean default false;
alter table public.clients add column if not exists weekly_call_spent_at timestamptz;

comment on column public.clients.weekly_calls is
  'Weekly check-in tier: one credit, refilling Sunday 00:00 America/New_York. Mutually exclusive with calls_enabled in the app''s own Call access panel.';
comment on column public.clients.weekly_call_spent_at is
  'Last time the weekly credit was spent. Written only by trainer.js''s spendWeeklyCall op. NULL means never spent (credit available).';

notify pgrst, 'reload schema';

commit;
-- ============================================================================
