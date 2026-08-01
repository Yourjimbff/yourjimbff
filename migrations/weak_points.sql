-- ============================================================
-- WEAK POINTS — run once in the Supabase SQL editor.
-- Idempotent. Touches no existing table.
-- Until this runs, the app hides the feature for clients and shows
-- a migration hint to the trainer. Nothing else changes.
-- ============================================================

-- 1. THE TRAINER'S PROTOCOL LIBRARY --------------------------
-- Reusable across clients. owner_code = the trainer's code,
-- mirroring how template programs are keyed.
create table if not exists mi_protocols (
  id          uuid        primary key,          -- client-generated, so an offline edit is a whole-row upsert
  owner_code  text        not null,
  name        text        not null,             -- "100 Push-Up Challenge"
  muscle      text,                             -- MI_MUSCLES key; null = general
  intent      text,                             -- one line the CLIENT reads
  exercises   jsonb       not null default '[]'::jsonb,
  -- exercises: [{n:name, m:metric, t:target, u:unit, cue:coaching note}]
  -- m is one of: time | hold | reps | weight_reps
  version     integer     not null default 1,
  is_archived boolean     not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists mi_protocols_owner_idx on mi_protocols (owner_code, is_archived, updated_at desc);

-- 2. PER-CLIENT ASSIGNMENT -----------------------------------
-- Carries a SNAPSHOT of the protocol as it was when assigned, so editing
-- a protocol later never rewrites the meaning of attempts already logged.
create table if not exists mi_assignments (
  id                uuid        primary key,
  client_code       text        not null,
  muscle            text        not null,       -- the weak point this answers
  protocol_id       uuid,
  protocol_snapshot jsonb       not null default '{}'::jsonb,
  snapshot_version  integer     not null default 1,
  note              text,
  status            text        not null default 'active',   -- active | resolved | archived
  assigned_by       text,
  started_at        timestamptz not null default now(),
  resolved_at       timestamptz,
  updated_at        timestamptz not null default now()
);
create index if not exists mi_assign_client_idx on mi_assignments (client_code, status, started_at desc);

-- 3. THE PERFORMANCE LOG -------------------------------------
-- Append-only. exercise/metric/muscle are denormalised onto every row so a
-- client's history survives a protocol being retired or renamed.
create table if not exists mi_attempts (
  id            bigserial   primary key,
  client_code   text        not null,
  assignment_id uuid,
  protocol_id   uuid,
  muscle        text,
  exercise      text        not null,
  metric        text        not null,           -- TEXT not an enum: a new metric is never a migration
  value         numeric,                        -- canonical sortable scalar (seconds | reps | weight)
  value2        numeric,                        -- secondary (reps, for weight x reps)
  unit          text,
  raw           jsonb       not null default '{}'::jsonb,
  note          text,
  date_str      text,                           -- display only, never ORDER BY
  logged_at     timestamptz not null default now()
);
create index if not exists mi_attempts_client_idx on mi_attempts (client_code, logged_at desc);
create index if not exists mi_attempts_series_idx on mi_attempts (assignment_id, exercise, logged_at desc);

-- 4. CHECK-IN HISTORY (used by Phase 2, the body chart) ------
-- One row per check-in EVENT. ratings jsonb: {"chest":{"r":"weak","n":"note"}}
-- An absent key means unchanged. Current state = fold oldest -> newest.
create table if not exists mi_checkins (
  id          bigserial   primary key,
  client_code text        not null,
  kind        text        not null default 'checkin',   -- baseline | checkin
  ratings     jsonb       not null default '{}'::jsonb,
  date_str    text,
  checked_at  timestamptz not null default now()
);
create index if not exists mi_checkins_client_idx on mi_checkins (client_code, checked_at desc);

-- 5. Make PostgREST pick up the new tables.
notify pgrst, 'reload schema';

-- ============================================================
-- 6. RLS — ONLY IF your existing tables have it enabled.
--    The app uses the anon key with no auth session, so any policy
--    must be permissive to anon, exactly like the existing tables.
--    Check first:
--      select relname, relrowsecurity from pg_class
--       where relname in ('food_logs','set_logs','clients');
--    If relrowsecurity is true for those, run:
--
-- alter table mi_protocols   enable row level security;
-- alter table mi_assignments enable row level security;
-- alter table mi_attempts    enable row level security;
-- alter table mi_checkins    enable row level security;
-- create policy mi_anon on mi_protocols   for all to anon using (true) with check (true);
-- create policy mi_anon on mi_assignments for all to anon using (true) with check (true);
-- create policy mi_anon on mi_attempts    for all to anon using (true) with check (true);
-- create policy mi_anon on mi_checkins    for all to anon using (true) with check (true);
-- ============================================================
