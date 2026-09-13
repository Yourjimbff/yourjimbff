-- ============================================================
-- SHELF GAPS — run once in the Supabase SQL editor.
-- Idempotent: re-running it changes nothing.
--
-- Four foods that appear in meals Yusuf dictated himself and are not on the
-- shared shelf. Found 13 Sep by resolving his own six test meals against
-- meal_components and seeing what failed to resolve:
--
--   Tortilla        "8oz of chicken breast, 1 whole wheat tortilla, ..."
--   Cottage Cheese  named in the breakfast format he dictated to Jim
--   Apple           exists only as another client's private row (amyt1)
--   Pear            exists only as another client's private row (amyt1)
--
-- Apple and Pear being another client's rows is why they looked present in a
-- raw table query and absent in the app: _mbComponents is owner-filtered, so
-- a name that resolves against meal_components can still be private to
-- someone else. These are the shared ones.
--
-- owner_code is 'yusuf1' to match the other 80 shared rows. MB_SHELF_OWNERS
-- in index.html carries both 'thegoat' and 'yusuf1', so either is visible to
-- every client; matching the existing 80 keeps the shelf in one place.
--
-- Units follow the shelf's own conventions: a whole fruit is measured in
-- itself (Banana is ['banana']), a carb that comes as one object is measured
-- in that object (Bread is ['slice']).
--
-- Macros are per ONE unit, total carbohydrate, matching the existing rows
-- (Rice [handful] is 100/2/22/0 — a half-cup cooked, total carbs not net).
--
-- Safe to run late: index.html already lists Tortilla and Cottage Cheese in
-- the breakfast steps, and mbManyOptions drops a name the shelf does not
-- carry rather than showing it broken. Until this runs they simply are not
-- offered. Nothing errors.
-- ============================================================

insert into meal_components (owner_code, kind, name, unit, per_unit, sort, is_archived)
select v.owner_code, v.kind, v.name, v.unit, v.per_unit::jsonb, v.sort, false
from (values
  ('yusuf1', 'carb',    'Tortilla',       'tortilla', '{"cal":140,"p":4,"c":22,"f":4}',  130),
  ('yusuf1', 'protein', 'Cottage Cheese', 'cup',      '{"cal":183,"p":24,"c":10,"f":5}', 131),
  ('yusuf1', 'fruit',   'Apple',          'apple',    '{"cal":95,"p":0,"c":25,"f":0}',   132),
  ('yusuf1', 'fruit',   'Pear',           'pear',     '{"cal":101,"p":1,"c":27,"f":0}',  133)
) as v(owner_code, kind, name, unit, per_unit, sort)
where not exists (
  select 1 from meal_components m
  where m.owner_code = v.owner_code and m.name = v.name
);

notify pgrst, 'reload schema';
