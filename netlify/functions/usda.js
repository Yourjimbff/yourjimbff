// The national food database, on the app's own door (Yusuf, 10 Sep: "what
// are the free ones we can do immediately? Can you just do that?").
//
// USDA FoodData Central: the government's nutrition database. Generic foods
// (SR Legacy, Foundation), the survey foods people actually eat (FNDDS - the
// "pancakes, from a restaurant" kind), and the Global Branded Foods database
// (packaged products by name and brand, per printed serving). It does NOT
// carry chain restaurant menus; those come from the chain's own posted
// numbers, which federal law makes any chain with 20+ locations publish.
//
// Same gate as analyze.js: any valid session, because the thing protected is
// the key's rate limit, not a row.
//
// REQUIRED ENVIRONMENT (Netlify -> Site settings -> Environment variables):
//   USDA_API_KEY   free, from https://api.data.gov/signup/ (name + email;
//                  the key arrives by email). Until it is set this runs on
//                  DEMO_KEY, which allows 30 requests an hour - enough to
//                  prove the door, not enough for a roster.
//   SUPABASE_JWT_SECRET   already set
//
// THE KEY CAN ALSO LIVE ON THE TRAINER'S OWN SHELF (Yusuf, 10 Sep: "I'm not
// touching anything, you're the IT guy"). Nobody with this session can reach
// the Netlify dashboard, so the key is also read from client_notes: the newest
// note on the trainer's row that starts "[USDA_KEY] ". That column is
// service-role only since 20 Aug, so the key is not readable from a browser.
// Order: the env var, then the shelf, then DEMO_KEY. Cached ten minutes.

const { verify } = require('./session.js');

const json = (code, obj, cache) => ({
  statusCode: code,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': cache || 'no-store' },
  body: JSON.stringify(obj),
});

// The four numbers the app runs on, out of USDA's nutrient list.
const N = {
  cal: ['Energy', 'Energy (Atwater General Factors)', 'Energy (Atwater Specific Factors)'],
  protein: ['Protein'],
  carbs: ['Carbohydrate, by difference'],
  fat: ['Total lipid (fat)'],
  fiber: ['Fiber, total dietary'],
  sugar: ['Sugars, total including NLEA', 'Total Sugars', 'Sugars, Total'],
};
function pick(nutrients, names) {
  for (const nm of names) {
    const hit = (nutrients || []).find(x => x.nutrientName === nm && (x.unitName === 'KCAL' || x.unitName === 'G'));
    if (hit && hit.value != null) return +hit.value;
  }
  return null;
}

// One row per USDA food, in the app's shape. Branded foods are priced per
// printed serving (servingSize in g/ml, with the household measure when the
// label gave one); everything else is per 100 g, said so.
function shape(f) {
  const nut = f.foodNutrients || [];
  const per100 = { cal: pick(nut, N.cal), protein: pick(nut, N.protein), carbs: pick(nut, N.carbs), fat: pick(nut, N.fat), fiber: pick(nut, N.fiber), sugar: pick(nut, N.sugar) };
  const branded = f.dataType === 'Branded';
  const g = branded && f.servingSize && /^(g|ml|GRM|MLT)$/i.test(f.servingSizeUnit || '') ? +f.servingSize : null;
  const scale = g ? g / 100 : 1;
  const r = (v) => (v == null ? null : Math.round(v * scale * 10) / 10);
  return {
    fdcId: f.fdcId,
    name: f.description,
    brand: f.brandOwner || f.brandName || '',
    dataType: f.dataType,
    serving: g ? (String(f.householdServingFullText || '').trim() || (g + ' ' + String(f.servingSizeUnit).toLowerCase().replace('grm', 'g').replace('mlt', 'ml'))) : '100 g',
    serving_g: g || 100,
    calories: r(per100.cal), protein: r(per100.protein), carbs: r(per100.carbs), fat: r(per100.fat),
    fiber: r(per100.fiber), sugar: r(per100.sugar),
    per100: per100,
  };
}

let _shelf = { key: null, at: 0 };
async function shelfKey() {
  if (Date.now() - _shelf.at < 10 * 60 * 1000) return _shelf.key;
  const url = process.env.SUPABASE_URL, svc = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !svc) return null;
  let key = null;
  try {
    const r = await fetch(url.replace(/\/$/, '') + '/rest/v1/client_notes?client_code=eq.thegoat&note=like.' + encodeURIComponent('[USDA_KEY]*') + '&select=note&order=logged_at.desc&limit=1',
      { headers: { apikey: svc, Authorization: 'Bearer ' + svc } });
    if (r.ok) {
      const rows = await r.json();
      const m = /^\[USDA_KEY\]\s*([A-Za-z0-9]{20,})\s*$/.exec(String((rows && rows[0] && rows[0].note) || ''));
      if (m) key = m[1];
    }
  } catch (e) { key = null; }
  _shelf = { key, at: Date.now() };
  return key;
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, body: '' };
  if (event.httpMethod !== 'GET') return json(405, { error: 'GET only' });

  const SECRET = process.env.SUPABASE_JWT_SECRET;
  if (!SECRET) return json(503, { error: 'not_configured' });
  const auth = (event.headers && (event.headers.authorization || event.headers.Authorization)) || '';
  const claims = verify(auth.replace(/^Bearer\s+/i, ''), SECRET);
  if (!claims) return json(401, { error: 'no_session' });

  const q = String((event.queryStringParameters || {}).q || '').trim().slice(0, 120);
  if (q.length < 2) return json(400, { error: 'bad_request' });
  const n = Math.max(1, Math.min(10, parseInt((event.queryStringParameters || {}).n || '6', 10) || 6));
  const types = String((event.queryStringParameters || {}).types || 'Branded,SR Legacy,Survey (FNDDS),Foundation');

  const key = process.env.USDA_API_KEY || (await shelfKey()) || 'DEMO_KEY';
  const url = 'https://api.nal.usda.gov/fdc/v1/foods/search?api_key=' + encodeURIComponent(key)
    + '&query=' + encodeURIComponent(q) + '&pageSize=' + n + '&dataType=' + encodeURIComponent(types);
  let res;
  try {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 8000);
    res = await fetch(url, { signal: ctl.signal }); clearTimeout(t);
  } catch (e) { return json(502, { error: 'usda_unreachable' }); }
  if (res.status === 429) return json(429, { error: 'usda_rate_limited', demo: key === 'DEMO_KEY' });
  if (!res.ok) return json(502, { error: 'usda_' + res.status });
  let data; try { data = await res.json(); } catch (e) { return json(502, { error: 'usda_bad_json' }); }
  const foods = (data.foods || []).map(shape).filter(x => x.calories != null || x.protein != null);
  // The same query is asked by many phones; USDA's answer changes rarely.
  return json(200, { q, total: data.totalHits || 0, demo: key === 'DEMO_KEY', foods }, 'public, max-age=86400');
};
