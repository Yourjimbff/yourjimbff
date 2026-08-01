-- ============================================================
-- MEAL USUALS — run once in the Supabase SQL editor.
-- Idempotent. One nullable column on the existing meals table.
--
-- A "usual" is the meal a client has decided they always eat in a slot.
-- It waits on their day as a pencilled-in card until they confirm it.
--
-- Safe to run late: until it does, usuals live in localStorage on the
-- client's own device and the app degrades quietly. Nothing errors.
-- ============================================================

alter table meals add column if not exists default_slot text;   -- 'Breakfast' | 'Lunch' | 'Dinner' | null

-- Only a handful of rows per client ever carry this, so a partial index
-- is the whole story.
create index if not exists meals_default_slot_idx
  on meals (client_code, default_slot)
  where default_slot is not null;

notify pgrst, 'reload schema';
