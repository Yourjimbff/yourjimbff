-- ============================================================================
-- NOTIFY-CONSULT WEBHOOK — fires the instant a row lands in consult_requests.
-- Run once in the Supabase SQL editor.
--
-- consult_requests is written directly by the offer page's own code, with the
-- anon key, straight into Supabase — it never passes through a Netlify
-- function in this repo. A database-level trigger is the only point that
-- sees every insert regardless of which code performed it, which is why this
-- is a Postgres trigger rather than anything added to the offer page.
--
-- Uses supabase_functions.http_request, the same trigger function Supabase's
-- own Database → Webhooks dashboard page uses under the hood — this SQL and
-- clicking through that UI produce the same result. If this errors with
-- something like "schema supabase_functions does not exist," use the
-- dashboard instead: Database → Webhooks → Create a new hook → table
-- consult_requests → Insert → HTTP Request → the same URL and header below.
--
-- The X-Webhook-Secret header is what stops a stranger from POSTing fake
-- consult data at this same public URL to spam Yusuf's inbox or run up the
-- email bill — notify-consult.js refuses anything that doesn't carry it.
-- ============================================================================

begin;

create trigger notify_consult_insert
after insert on public.consult_requests
for each row
execute function supabase_functions.http_request(
  'https://yourjimbff.netlify.app/.netlify/functions/notify-consult',
  'POST',
  '{"Content-Type":"application/json","X-Webhook-Secret":"lteaERwGsxhPFjsvQhhXGlB2_V113PUQ"}',
  '{}',
  '5000'
);

commit;
-- ============================================================================
-- UNDO — removes the trigger only. consult_requests itself is untouched.
--
-- drop trigger if exists notify_consult_insert on public.consult_requests;
-- ============================================================================
