-- ============================================================
-- MEAL COMPONENTS -- run once in the Supabase SQL editor. Idempotent.
--
-- Most of these numbers are Yusuf's own, recovered from the PROTEINS /
-- VEGGIES / CARBS tables that lived in the Meal Planner before it was
-- deleted. The handful listed as 'invented' in the build report were
-- filled in to cover gaps in the spec and should be checked.
--
-- per_unit is PER ONE UNIT of the named unit (one palm, one handful, one
-- slice). `c` is NET carbs. These numbers are never shown to a client --
-- the app converts them into an amount of real food.
-- ============================================================

create table if not exists meal_components (
  id             uuid primary key default gen_random_uuid(),
  owner_code     text not null,       -- 'yusuf1' = the coach library; anything else = that client's own
  kind           text not null,       -- protein | veg | carb | fruit
  name           text not null,
  unit           text not null,       -- palm | handful | cup | slice | tbsp | piece | scoop | banana | link | bar ...
  per_unit       jsonb not null,      -- {cal, p, c, f}   c = NET carbs, for ONE unit
  serving_note   text,                -- the packet's own words: "1 link (85g)". null on coach rows.
  grams_per_unit numeric,             -- parsed out of the bracket, for a future weigh-it feature
  sort           integer not null default 0,
  is_archived    boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- clients add their own by photographing a nutrition panel; these two carry
-- what the packet said so the conversion stays checkable
alter table meal_components add column if not exists serving_note   text;
alter table meal_components add column if not exists grams_per_unit numeric;

create index if not exists meal_components_kind_idx
  on meal_components (owner_code, kind, is_archived, sort);

-- one row per (owner, kind, name) so re-running this cannot duplicate
create unique index if not exists meal_components_uniq
  on meal_components (owner_code, kind, name);

insert into meal_components (owner_code, kind, name, unit, per_unit, sort) values
  ('yusuf1','protein','Ground Beef','palm','{"cal":250,"p":28,"c":0,"f":14}'::jsonb,0),
  ('yusuf1','protein','Steak','palm','{"cal":220,"p":31,"c":0,"f":11}'::jsonb,1),
  ('yusuf1','protein','Top Round','palm','{"cal":190,"p":35,"c":0,"f":5}'::jsonb,2),
  ('yusuf1','protein','N.Y. Strip','palm','{"cal":220,"p":31,"c":0,"f":11}'::jsonb,3),
  ('yusuf1','protein','Ribeye','palm','{"cal":290,"p":28,"c":0,"f":20}'::jsonb,4),
  ('yusuf1','protein','Filet','palm','{"cal":220,"p":32,"c":0,"f":10}'::jsonb,5),
  ('yusuf1','protein','Ground Chicken','palm','{"cal":190,"p":30,"c":0,"f":8}'::jsonb,6),
  ('yusuf1','protein','Chicken Breast','palm','{"cal":185,"p":35,"c":0,"f":4}'::jsonb,7),
  ('yusuf1','protein','Chicken Thighs','palm','{"cal":230,"p":28,"c":0,"f":13}'::jsonb,8),
  ('yusuf1','protein','Ground Turkey','palm','{"cal":200,"p":31,"c":0,"f":9}'::jsonb,9),
  ('yusuf1','protein','Ground Bison','palm','{"cal":200,"p":32,"c":0,"f":8}'::jsonb,10),
  ('yusuf1','protein','Ground Venison','palm','{"cal":180,"p":34,"c":0,"f":4}'::jsonb,11),
  ('yusuf1','protein','Ground Elk','palm','{"cal":180,"p":34,"c":0,"f":4}'::jsonb,12),
  ('yusuf1','protein','Salmon','palm','{"cal":230,"p":29,"c":0,"f":13}'::jsonb,13),
  ('yusuf1','protein','Tuna','palm','{"cal":130,"p":30,"c":0,"f":1}'::jsonb,14),
  ('yusuf1','protein','Shrimp','palm','{"cal":120,"p":26,"c":0,"f":2}'::jsonb,15),
  ('yusuf1','protein','Sausage','palm','{"cal":290,"p":22,"c":0,"f":23}'::jsonb,16),
  ('yusuf1','veg','Leafy Greens','handful','{"cal":7,"p":0,"c":1,"f":0}'::jsonb,0),
  ('yusuf1','veg','Salad Mix','handful','{"cal":10,"p":0,"c":2,"f":0}'::jsonb,1),
  ('yusuf1','veg','Spinach','handful','{"cal":7,"p":0,"c":1,"f":0}'::jsonb,2),
  ('yusuf1','veg','Arugula','handful','{"cal":5,"p":0,"c":1,"f":0}'::jsonb,3),
  ('yusuf1','veg','Romaine','handful','{"cal":8,"p":0,"c":1,"f":0}'::jsonb,4),
  ('yusuf1','veg','Lettuce','handful','{"cal":5,"p":0,"c":1,"f":0}'::jsonb,5),
  ('yusuf1','veg','Kale','handful','{"cal":33,"p":0,"c":3,"f":0}'::jsonb,6),
  ('yusuf1','veg','Cabbage','handful','{"cal":22,"p":0,"c":3,"f":0}'::jsonb,7),
  ('yusuf1','veg','Cucumbers','handful','{"cal":16,"p":0,"c":3,"f":0}'::jsonb,8),
  ('yusuf1','veg','Pickles','handful','{"cal":12,"p":0,"c":2,"f":0}'::jsonb,9),
  ('yusuf1','veg','Tomatoes','handful','{"cal":32,"p":0,"c":5,"f":0}'::jsonb,10),
  ('yusuf1','veg','Onions','handful','{"cal":64,"p":0,"c":12,"f":0}'::jsonb,11),
  ('yusuf1','veg','Mushrooms','handful','{"cal":15,"p":0,"c":2,"f":0}'::jsonb,12),
  ('yusuf1','veg','Bell Peppers','handful','{"cal":30,"p":0,"c":5,"f":0}'::jsonb,13),
  ('yusuf1','veg','Jalapeños','handful','{"cal":8,"p":0,"c":1,"f":0}'::jsonb,14),
  ('yusuf1','veg','Broccoli','handful','{"cal":30,"p":0,"c":4,"f":0}'::jsonb,15),
  ('yusuf1','veg','Broccolini','handful','{"cal":35,"p":0,"c":4,"f":0}'::jsonb,16),
  ('yusuf1','veg','Cauliflower','handful','{"cal":27,"p":0,"c":3,"f":0}'::jsonb,17),
  ('yusuf1','veg','Zucchini & Squash','handful','{"cal":20,"p":0,"c":3,"f":0}'::jsonb,18),
  ('yusuf1','veg','Asparagus','handful','{"cal":27,"p":0,"c":2,"f":0}'::jsonb,19),
  ('yusuf1','veg','Brussels Sprouts','handful','{"cal":38,"p":0,"c":5,"f":0}'::jsonb,20),
  ('yusuf1','veg','Green Beans','handful','{"cal":31,"p":0,"c":4,"f":0}'::jsonb,21),
  ('yusuf1','veg','Celery','handful','{"cal":14,"p":0,"c":1,"f":0}'::jsonb,22),
  ('yusuf1','veg','Carrots','handful','{"cal":52,"p":0,"c":9,"f":0}'::jsonb,23),
  ('yusuf1','veg','Eggplant','handful','{"cal":20,"p":0,"c":2,"f":0}'::jsonb,24),
  ('yusuf1','veg','Olives','handful','{"cal":59,"p":0,"c":1,"f":0}'::jsonb,25),
  ('yusuf1','veg','Kimchi','handful','{"cal":23,"p":0,"c":2,"f":0}'::jsonb,26),
  ('yusuf1','veg','Sauerkraut','handful','{"cal":20,"p":0,"c":2,"f":0}'::jsonb,27),
  ('yusuf1','carb','Potatoes','handful','{"cal":58,"p":1,"c":13,"f":0}'::jsonb,0),
  ('yusuf1','carb','Sweet Potatoes','handful','{"cal":90,"p":2,"c":17,"f":0}'::jsonb,1),
  ('yusuf1','carb','Rice','handful','{"cal":100,"p":2,"c":22,"f":0}'::jsonb,2),
  ('yusuf1','carb','Pasta','handful','{"cal":110,"p":4,"c":20,"f":1}'::jsonb,3),
  ('yusuf1','carb','Beans','handful','{"cal":114,"p":8,"c":13,"f":0}'::jsonb,4),
  ('yusuf1','carb','Lentils','handful','{"cal":115,"p":9,"c":12,"f":0}'::jsonb,5),
  ('yusuf1','carb','Chickpeas','handful','{"cal":135,"p":7,"c":16,"f":2}'::jsonb,6),
  ('yusuf1','carb','Corn','handful','{"cal":65,"p":2,"c":12,"f":1}'::jsonb,7),
  ('yusuf1','carb','Oats','handful','{"cal":75,"p":3,"c":12,"f":2}'::jsonb,8),
  ('yusuf1','fruit','Blueberries','handful','{"cal":42,"p":1,"c":9,"f":0}'::jsonb,9),
  ('yusuf1','fruit','Strawberries','handful','{"cal":25,"p":1,"c":4,"f":0}'::jsonb,10),
  ('yusuf1','fruit','Blackberries','handful','{"cal":31,"p":1,"c":3,"f":0}'::jsonb,11),
  ('yusuf1','fruit','Banana','banana','{"cal":105,"p":1,"c":24,"f":0}'::jsonb,12),
  ('yusuf1','carb','Bread','slice','{"cal":80,"p":3,"c":14,"f":1}'::jsonb,13),
  ('yusuf1','carb','Honey','tbsp','{"cal":64,"p":0,"c":17,"f":0}'::jsonb,14),
  ('yusuf1','protein','Chicken Wings','palm','{"cal":200,"p":27,"c":0,"f":10}'::jsonb,100),
  ('yusuf1','protein','Flank Steak','palm','{"cal":190,"p":32,"c":0,"f":7}'::jsonb,101),
  ('yusuf1','protein','Sirloin','palm','{"cal":200,"p":33,"c":0,"f":7}'::jsonb,102),
  ('yusuf1','protein','Tilapia','palm','{"cal":110,"p":26,"c":0,"f":2}'::jsonb,103),
  ('yusuf1','protein','Cod','palm','{"cal":90,"p":20,"c":0,"f":1}'::jsonb,104),
  ('yusuf1','protein','Eggs','piece','{"cal":72,"p":6,"c":0,"f":5}'::jsonb,105),
  ('yusuf1','protein','Greek Yogurt','cup','{"cal":130,"p":22,"c":8,"f":0}'::jsonb,106),
  ('yusuf1','protein','Protein Powder','scoop','{"cal":120,"p":25,"c":3,"f":1}'::jsonb,107),
  ('yusuf1','protein','Deli Turkey','palm','{"cal":100,"p":19,"c":1,"f":2}'::jsonb,108),
  ('yusuf1','protein','Turkey Bacon','piece','{"cal":35,"p":3,"c":0,"f":3}'::jsonb,109),
  ('yusuf1','protein','Sardines','palm','{"cal":190,"p":23,"c":0,"f":11}'::jsonb,110),
  ('yusuf1','fruit','Mixed Berries','handful','{"cal":35,"p":1,"c":6,"f":0}'::jsonb,111)
on conflict (owner_code, kind, name) do nothing;

notify pgrst, 'reload schema';
