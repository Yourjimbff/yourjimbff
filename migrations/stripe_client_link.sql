-- ============================================================================
-- Two columns on `clients`, so a Stripe payment can become a client safely.
--
-- I could not run this myself. PostgREST (the only database door the app has)
-- does CRUD, not DDL; the anon key's role has no schema grants; there are no
-- RPCs exposed; and no Supabase CLI, psql or service key exists on this
-- machine. It needs the SQL editor, which needs your login.
-- Run this BEFORE pointing the Stripe webhook at the site. Without it every
-- payment logs "client insert failed" and Stripe retries forever.
--
-- Checked against the live schema on 2026-08-03: `clients` has code, name,
-- initials, phone, coach_code, is_trainer, active, created_at, tier,
-- term_months, paid, started_at, term_ends, calls_enabled, call_credits —
-- and neither of the two below.
-- ============================================================================

-- stripe_session — the checkout session that created them.
-- This is the idempotency key and it is not optional. Stripe retries a webhook
-- whenever it doesn't hear a 2xx, including for deliveries that actually
-- succeeded. Without something unique to check, one payment quietly becomes two
-- clients, two access codes and two sales rows.
ALTER TABLE clients ADD COLUMN IF NOT EXISTS stripe_session TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS clients_stripe_session_idx
  ON clients (stripe_session) WHERE stripe_session IS NOT NULL;

-- email — how instalment two finds its way home.
-- A split sends the second charge 30 days later as its own Stripe event, which
-- carries the customer's email and nothing else that ties back here. With no
-- email on the row, that payment can't be matched to a client and the split
-- client reads as underpaid for the rest of their term.
ALTER TABLE clients ADD COLUMN IF NOT EXISTS email TEXT;
CREATE INDEX IF NOT EXISTS clients_email_idx ON clients (lower(email));


-- ---------------------------------------------------------------------------
-- After running, confirm both are visible to PostgREST:
--
--   SELECT code, email, stripe_session FROM clients LIMIT 1;
--
-- If that errors but the ALTERs succeeded, reload the schema cache:
--   NOTIFY pgrst, 'reload schema';
-- ---------------------------------------------------------------------------
