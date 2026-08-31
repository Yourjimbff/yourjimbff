-- ============================================================================
-- GOOGLE EVENT ID — one booking, one calendar event, forever.
-- Run once in the Supabase SQL editor.
--
-- Every call booked in the app lands on Yusuf's own Google Calendar. The id of
-- the event it landed as is stored HERE, on the row the booking already has,
-- because that is the only thing that makes the rule "never a duplicate"
-- enforceable: a second write for the same booking updates the event named in
-- this column instead of creating another one beside it.
--
-- NULLABLE, AND STAYING THAT WAY. A booking whose calendar write failed — or
-- one made while the Google credentials were not configured at all — is a
-- perfectly good booking with a null here. The client's booking never depends
-- on his calendar being reachable (his rule), so this column can never be
-- required and nothing may ever treat null as an error.
--
-- BOTH TABLES, because both are calls he turns up to: `bookings` is a client's
-- own one-off, `consult_requests` is a lead's consultation off the offer page.
-- vip_calls deliberately has NO column here: it is a recurring RULE, not a
-- booking, and expanding it into events is a different job with a different
-- set of questions (how far ahead, what happens to a moved occurrence) that
-- this migration does not answer.
--
-- ADOPTION. An event the app finds already sitting at the exact instant of a
-- booking is adopted rather than duplicated — its id is written here and it
-- becomes the booking's event from then on. That is how the one he already
-- keeps for Blake Bernstein by hand stops being a duplicate risk without
-- anybody having to find its id first.
-- ============================================================================

begin;

alter table public.bookings
  add column if not exists google_event_id text;

alter table public.consult_requests
  add column if not exists google_event_id text;

comment on column public.bookings.google_event_id is
  'Google Calendar event id for this booking, or null. Null is normal: the '
  'calendar write is best-effort and never gates the booking.';
comment on column public.consult_requests.google_event_id is
  'Google Calendar event id for this consultation, or null. Same rule as '
  'bookings.google_event_id.';

notify pgrst, 'reload schema';

commit;
-- ============================================================================
