-- ============================================================================
-- LOCK DOWN THE PUBLIC KEY  —  DO NOT PASTE THIS YET
-- ============================================================================
-- Audited 7 Aug 2026 with the anon key that ships in the page: 34 tables
-- readable, 14,910 rows, nothing locked. The same key can also INSERT, UPDATE
-- and DELETE (proven — 34 programs written and 26 rows deleted through it).
--
-- WHY NOT YET: the TRAINER app authenticates with the SAME anon key as clients.
-- sbHeaders() sends it for every request from both sides, and there is no
-- Supabase Auth anywhere in the app. The moment this runs, the trainer cockpit
-- goes blind along with the attacker. Run it at cutover, once the trainer's
-- reads come from a Netlify function holding the service key (spec accompanies
-- this file), not before.
--
-- WHAT THIS FILE DOES AND DOES NOT FIX
--   Fixes:      private notes, payments, contact logs, trainer board state
--               stop being readable by the public key at all.
--   Fixes:      the two-column rule on client_notes becomes a database
--               guarantee instead of a convention in our query text.
--   DOES NOT:   scope a client to their OWN rows. Postgres cannot tell one
--               client from another while everyone shares one anon key and
--               identity is a code typed into a box. Until clients get real
--               per-client auth, anyone holding the key can still read every
--               client's logs, weigh-ins, photos and phone number. That is
--               phase three and it needs a decision, not just SQL.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. TRAINER-ONLY TABLES — the public key loses them entirely.
--    Verified against the app: every reader of these is a trainer surface.
--    sales          _ensureSaleFor / saveSale       (addClientToDb, trainer)
--    client_contacts jvLogContact / jvSyncContacts  (cockpit)
--    jv_handled     jvMarkHandled / jvUnhandle      (cockpit board)
--    engine_moments loadEngineMoments               (gated on isTrainer)
--    coach_moments  _loadMoments                    (trainer feed)
--    coach_reposts  loadTrainerFeed / jvRepostMeal  (trainer feed)
--    coach_notes    loadCoachNote returns early for non-trainers
-- ---------------------------------------------------------------------------
alter table public.sales            enable row level security;
alter table public.client_contacts  enable row level security;
alter table public.jv_handled       enable row level security;
alter table public.engine_moments   enable row level security;
alter table public.coach_moments    enable row level security;
alter table public.coach_reposts    enable row level security;
alter table public.coach_notes      enable row level security;

-- RLS with no policy = deny all. Belt and braces: drop the grants too, so the
-- table is invisible rather than merely empty.
revoke all on public.sales           from anon;
revoke all on public.client_contacts from anon;
revoke all on public.jv_handled      from anon;
revoke all on public.engine_moments  from anon;
revoke all on public.coach_moments   from anon;
revoke all on public.coach_reposts   from anon;
revoke all on public.coach_notes     from anon;

-- ---------------------------------------------------------------------------
-- 2. client_notes — THE TWO-COLUMN RULE, ENFORCED BY THE DATABASE
--    `note` is what Yusuf wrote for himself. `shared_note` is the copy he
--    decided a client may read. Today the app simply never asks for `note`;
--    that is a convention one typo away from failing, and it is the shape of
--    the August near-miss. After this, the public key CANNOT select `note`
--    even if some future query asks for it, and can only see rows that were
--    explicitly shared.
-- ---------------------------------------------------------------------------
alter table public.client_notes enable row level security;
revoke all on public.client_notes from anon;
-- Column-level: the private text is simply not grantable to the public key.
grant select (id, client_code, shared_note, shared_at) on public.client_notes to anon;

drop policy if exists client_notes_shared_only on public.client_notes;
create policy client_notes_shared_only
  on public.client_notes
  for select
  to anon
  using (shared_at is not null);

-- ---------------------------------------------------------------------------
-- 3. CONTACT DETAILS — off the public key even where the table stays readable.
--    clients and profiles must stay selectable for now because sign-in reads
--    clients, and the client app reads its own profile. Neither needs phone,
--    email, or the intake paperwork, and those are the columns that turn a
--    roster leak into a personal-data leak.
--    NOTE: this is the one section that changes behaviour for the TRAINER too
--    (the cockpit shows phone numbers), so it lands with the function cutover.
-- ---------------------------------------------------------------------------
revoke select (phone, email, stripe_session) on public.clients  from anon;
revoke select (phone, birthday, intake_json, signed_waiver, content_consent)
  on public.profiles from anon;

-- ---------------------------------------------------------------------------
-- 4. WRITES — the public key should not be able to erase the business.
--    It can currently DELETE from every table. Nothing client-facing deletes
--    anything except a client removing their own logged row, and that path is
--    moving behind the function layer with the rest.
-- ---------------------------------------------------------------------------
revoke delete on all tables in schema public from anon;
revoke truncate on all tables in schema public from anon;

commit;

-- ============================================================================
-- ROLLBACK, if a client surface breaks and you need it back fast:
--
--   begin;
--   alter table public.sales disable row level security;   -- and each table above
--   grant all on public.sales to anon;                     -- and each table above
--   grant delete on all tables in schema public to anon;
--   commit;
--
-- Then tell me which surface broke and I will fix it properly rather than
-- leaving the whole thing open.
-- ============================================================================
