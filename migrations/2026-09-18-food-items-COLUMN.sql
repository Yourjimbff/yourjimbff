-- ITEMISE THE MEAL, AND STOP INVENTING TITLES FOR IT (Yusuf, 18 Sep).
--
-- Angela Walker typed one sentence:
--
--   "Two eggs with the salt and pepper ricotta cheese made in omelet with a
--    biscuit and four pieces of regular black labeled bacon on a great value
--    biscuit"
--
-- It became TWO rows, titled "Eggs, Bacon & Ricotta Omelette with Biscuit" and
-- "Eggs, Bacon & Biscuit with Ricotta" - the same words shuffled twice, neither
-- one a food anybody ate. His reading: "it's trying to create two different
-- things here. Instead it should itemize and bullet point the foods she used,
-- and she can adjust the quantity if she needs to."
--
-- THE ITEMISATION ALREADY EXISTS AND IS THROWN AWAY. The prompt has required it
-- for weeks - "ITEMS ARRAY (required): break the meal into ONE ROW PER FOOD the
-- user named, each with its own macros" - and _mtApplyItems prices every one of
-- them against the macro table. The totals are summed onto the row, the items
-- are dropped on the floor, and all that survives is `name`: a compression of
-- the whole meal into a few words, invented fresh each time. That compression
-- is the whole fault. Two attempts at it are two different meals.
--
-- THE SHAPE, one entry per food the client actually named:
--   [{"n":"Eggs","q":2,"u":"each","cal":140,"p":12,"c":1,"f":10},
--    {"n":"Ricotta cheese","q":1,"u":"tbsp","cal":40,"p":3,"c":1,"f":3},
--    {"n":"Bacon","q":4,"u":"slice","b":"black label","cal":180,"p":12,"c":0,"f":14},
--    {"n":"Biscuit","q":1,"u":"each","b":"Great Value","cal":190,"p":3,"c":24,"f":9}]
--
-- n is the plain food. q and u are the quantity the client can correct. b is the
-- brand, shown small and never part of the food name - "great value biscuit" is
-- a biscuit. The macros are per LINE so a corrected quantity re-prices that line
-- and nothing else.
--
-- Nothing reads this until the app is updated; an absent items array reads as
-- "not itemised yet" and the row falls back to its name exactly as today. So
-- this is safe to run before the deploy and safe to leave if it is rolled back.

alter table public.food_logs add column if not exists items jsonb;

-- The app writes as anon, gated by the session, the same as every other column
-- on this table. Without the column grant the write is refused and the retry
-- ladder in insertFoodLog silently drops the field - which looks exactly like
-- the feature never shipping.
grant select (items), insert (items), update (items) on public.food_logs to anon;
grant select (items), insert (items), update (items) on public.food_logs to authenticated;

-- PostgREST caches the schema and will not see a new column until told.
notify pgrst, 'reload schema';

select 'items column ready' as done,
       count(*) filter (where items is not null) as rows_itemised,
       count(*) as rows_total
from public.food_logs;
