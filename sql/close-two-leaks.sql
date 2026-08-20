-- ============================================================================
-- CLOSE TWO LEAKS: client_notes (private trainer notes) and bookings
-- Written 20 Aug. Run in the Supabase SQL editor, as one paste.
--
-- WHAT IS WRONG RIGHT NOW
--   The anon key ships in the page source of yourjimbff.netlify.app. Anyone can
--   copy it. With it, today, an unauthenticated request returns:
--     * 62 rows of client_notes INCLUDING the private `note` column - your own
--       working notes about 20 named clients, which the app deliberately never
--       shows the client.
--     * 14 rows of bookings - who is booked with you and when.
--   vip_calls and coach_notes are already locked this way and refuse the anon
--   key with a 401. These two were missed.
--
-- PRECONDITION - ALREADY DONE, v7.980.96 IS LIVE
--   Every place the app wrote a client_note used to ask the server to hand the
--   whole row back, which includes `note`. Under this change that request would
--   be refused and your note-taking would break. Those seven writes now ask for
--   the id only. Do not run this against an older deploy.
--
-- ============================================================================
-- DO
-- ============================================================================

-- ---- 1. client_notes -------------------------------------------------------
-- The private column stops being readable by the public key. Everything else
-- about the table is unchanged: you keep writing notes from the app, and the
-- client keeps reading the notes you explicitly shared.
REVOKE SELECT ON public.client_notes FROM anon;
GRANT  SELECT (id, client_code, logged_at, shared_at, shared_note)
       ON public.client_notes TO anon;

-- Writing is untouched: the trainer surfaces insert, update and delete notes
-- with this key and must keep working.
GRANT INSERT, UPDATE, DELETE ON public.client_notes TO anon;

-- ---- 2. bookings -----------------------------------------------------------
-- Nothing in the app reads this table with the anon key. Both the trainer's
-- schedule and a client's own calls go through the trainer function, which uses
-- the service role and is unaffected by this.
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.bookings FROM anon;

-- ============================================================================
-- VERIFY (expect: private note DENIED, shared note OK, bookings DENIED)
-- ============================================================================
-- Run these three from a terminal, not here. The first two must fail, the
-- third must still return rows.
--
--   curl -s "$SB/rest/v1/client_notes?select=note&limit=1"        -H "apikey: $ANON"
--   curl -s "$SB/rest/v1/bookings?select=id&limit=1"              -H "apikey: $ANON"
--   curl -s "$SB/rest/v1/client_notes?select=shared_note&limit=1" -H "apikey: $ANON"

-- ============================================================================
-- RISK - EXACTLY WHAT BREAKS IF THIS IS WRONG
-- ============================================================================
-- * If the app is older than v7.980.96: saving any client note fails, silently
--   from your side apart from the "could not save" line. Fix = deploy current,
--   or run the UNDO below.
-- * If some surface I have not found reads client_notes.note with the anon key,
--   it returns 401 rather than wrong data. It fails loudly, not quietly.
-- * If anything reads bookings with the anon key, the same: 401, not bad data.
--   I checked every reference in index.html - loadBookings goes through the
--   door for trainer and client alike - but I would rather name this than
--   pretend the search was exhaustive.
-- * NOTHING IS DELETED. No row is touched. This changes permissions only, and
--   the UNDO puts them back exactly as they were.

-- ============================================================================
-- UNDO (restores today's behaviour, leaks included)
-- ============================================================================
-- REVOKE SELECT ON public.client_notes FROM anon;
-- GRANT  SELECT ON public.client_notes TO anon;
-- GRANT  SELECT, INSERT, UPDATE, DELETE ON public.bookings TO anon;
