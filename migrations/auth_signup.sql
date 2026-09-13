-- ============================================================
-- EMAIL + PASSWORD SIGN-UP — run once in the Supabase SQL editor.
-- Idempotent. Nothing here changes how an existing client signs in.
--
-- Yusuf, 13 Sep: "I need to be able to send a link that allows them to sign up
-- with their email and create a password for themselves ... And all current
-- clients, all they have to do is enter their access code into the email slot
-- and it should be able to grant them."
--
-- THREE THINGS, AND ONE OF THEM IS THE ACTUAL BLOCKER:
--
-- 1. auth_uid — which Supabase Auth user a client row belongs to. Only
--    netlify/functions/signup.js ever writes it, with the service key, after
--    verifying the person's token. The browser never creates a client row.
--
-- 2. is_free_app — THE BLOCKER. Free-app access was a hard-coded map in
--    index.html (`var FREE_APP_CODES={freeuser:1}`), so every single new
--    signup would have needed a code deploy before that person could see the
--    app they just joined. A public sign-up link is impossible while that is
--    true. It moves here, alongside calls_enabled, which is already read off
--    the row for exactly this reason.
--
-- 3. A unique index on auth_uid, so two devices racing the same first sign-in
--    cannot produce two client rows for one person. signup.js reads the
--    winner's row back rather than fighting for it.
--
-- SAFE TO RUN LATE, WITH ONE EXCEPTION: signup.js returns 503 'not_migrated'
-- rather than writing a row it could never find again, so sign-UP is off until
-- this runs. Everything else — existing clients, code sign-in, the whole app —
-- is untouched either way.
-- ============================================================

alter table clients add column if not exists auth_uid uuid;
alter table clients add column if not exists is_free_app boolean not null default false;

create unique index if not exists clients_auth_uid_key
  on clients (auth_uid) where auth_uid is not null;

-- The existing tester keeps the access it already had. This is the one row
-- the hard-coded map named.
update clients set is_free_app = true where code = 'freeuser';

notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- AND THE PUBLIC KEY HAS TO BE ABLE TO READ IT.
--
-- Found on the live database 13 Sep, after the columns were added and before
-- the build shipped: `clients` carries COLUMN-LEVEL grants (see
-- 2026-08-07-lock-down-anon.sql, which revoked phone/email/stripe_session).
-- Once a table has those, a new column is NOT selectable by anon by default —
-- so asking for is_free_app returned 401 for the whole row, and that read is
-- sign-in itself. Every account whose code the device had not cached would
-- have been told the server could not be reached.
--
-- auth_uid is deliberately NOT granted. Only signup.js reads it, with the
-- service key, and it is nobody's business on the public key.
-- ---------------------------------------------------------------------------

grant select (is_free_app) on public.clients to anon;

notify pgrst, 'reload schema';
