-- ============================================================
-- FOOD AVOID — run once in the Supabase SQL editor.
-- Idempotent. One nullable column on the existing profiles table.
--
-- The short list of foods a person does not eat. Jim reads it before he
-- writes a meal plan, so a plan never names something they will not eat.
--
-- Safe to run late: until it does, the list lives in localStorage on that
-- person's own device and the app degrades quietly. Nothing errors, and
-- because Jim's prompt is assembled in the browser, the local list already
-- reaches him. Running this is what makes it follow them to a second device.
--
-- Same shape as migrations/meal_usuals.sql, deliberately.
-- ============================================================

alter table profiles add column if not exists food_avoid jsonb;

notify pgrst, 'reload schema';
