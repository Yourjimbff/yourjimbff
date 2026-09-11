// THE WHOLE DAY AS A TIMELINE (Yusuf, 11 Sep: "the timeline looks best... close to
// like the actual day itself"; the door: tap the day's name). Lifted, driven with
// real-shaped rows.
const fs=require('fs'), vm=require('vm');
const src=fs.readFileSync('index.html','utf8');
let bad=0; const t=(p,l)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l); };
const a=src.indexOf('function _tlTotLine(slots, dayState, ds){'), b=src.indexOf('// ===== THE MEAL SECTION');
const doc={_els:{}, getElementById(id){ return this._els[id]||null; }, createElement(){ const el={cls:'',classList:{add(c){ el.cls=c; },remove(){ el.cls=''; }},setAttribute(){},addEventListener(){},innerHTML:'',querySelector(){ return {scrollTop:1}; }}; return el; }, body:{appendChild(el){ doc._els.fdOv=el; }}, addEventListener(){}, querySelector(){ return null; }};
const ctx={String,Math,Number,Array,Date,isNaN,window:{}, document:doc,
  _escHtml:(x)=>String(x==null?'':x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'),
  _tlMins:(r)=>{ const d=new Date(r.logged_at); return d.getHours()*60+d.getMinutes(); },
  _tlClock:(m)=>{ const h=Math.floor(m/60), mm=m%60, hh=h%12||12; return hh+':'+(mm<10?'0':'')+mm+(h>=12?'pm':'am'); },
  _tcase:(x)=>String(x).split(' ').map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(' '), _tlDayLabel:(d)=>'Today', _woDisplayTitle:(w)=>'Chest, Forearms, Shoulders', _stepsFor:(ds)=> ds==='Sep 10, 2026' ? 11800 : null,
  _bfItemsFor:(w)=>({items:[{name:'Smith Machine Chest Press',detail:'4 sets'},{name:'Forearm Curls · 4 sets',detail:''},{name:'Hip Mobility',detail:'15 min'}],note:''}) };
vm.createContext(ctx); vm.runInContext(src.slice(a,b), ctx);
const slots={breakfast:[{name:'Banana walnut chocolate chip pancakes',calories:1021,protein:22,carbs:114,fat:53,logged_at:'2026-09-10T09:52:00',photo:'data:image/jpeg;base64,AAAA'}],dinner:[{name:'Sweet & Sour Chicken',calories:366,protein:59,carbs:10,fat:10,logged_at:'2026-09-10T16:26:00'}],lunch:[],snack:[{name:'a handful of almonds',calories:0,logged_at:'2026-09-10T22:00:00'}],
  walk:[{title:'Morning walk',logged_at:'2026-09-10T07:30:00'}], workout:[{title:'Workout',logged_at:'2026-09-10T14:30:00'}], weigh:[{weight:168,logged_at:'2026-09-10T07:00:00'}]};
vm.runInContext('globalThis.__s='+JSON.stringify(slots)+"; window._tlSlotsByDs['Sep 10, 2026']=__s; window._tlSlotsByDs['Sep 9, 2026']={breakfast:[],lunch:[],dinner:[],snack:[],walk:null,workout:[],weigh:null};", ctx);
t(vm.runInContext("_wdOpen('Sep 10, 2026')", ctx)===true && doc._els.fdOv.cls==='open', 'tapping the day opens the sheet');
const html=doc._els.fdOv.innerHTML;
const order=['7:00am','7:30am','9:52am','2:30pm','4:26pm','10:00pm'].map(c=>html.indexOf('wdT">'+c+'<'));
t(order.every(i=>i>=0) && order.every((v,i)=>i===0||v>order[i-1]), 'everything on the day, in clock order: weigh-in, walk, pancakes, session, dinner, snack');
t(/wdRow first"><div class="wdT">7:00am/.test(html) && /wdRow last"><div class="wdT">10:00pm/.test(html), 'the line starts at the first thing and ends at the last');
t(/wdFood"><img src="data:image\/jpeg;base64,AAAA" alt=""><div><div class="wdN">Banana Walnut Chocolate Chip Pancakes<\/div><div class="wdM">22P · 114C · 53F<\/div><\/div><b class="wdK">1,021<\/b>/.test(html), 'a food shows its photo, its meal and P C F, its calories - and its name in the same case as every other');
t(/wdFood"><div><div class="wdN">Sweet &amp; Sour Chicken<\/div>/.test(html), 'a food logged without a photo simply has none');
t(/A Handful Of Almonds<\/div><div class="wdM">no numbers<\/div><\/div><\/div>/.test(html), 'a food without numbers says so and shows no calorie figure');
t(/wdWo"><div class="wdN">Chest, Forearms, Shoulders<\/div><div class="wdExs"><div class="wdEx"><span>Smith Machine Chest Press<\/span><span>4 sets<\/span><\/div><div class="wdEx"><span>Forearm Curls<\/span><span>4 sets<\/span><\/div><div class="wdEx"><span>Hip Mobility<\/span><span>15 min<\/span><\/div><\/div>/.test(html), 'the session carries its smart title and one line per exercise, the sets at the right (split off a typed line too) - never a run-on sentence');
t(/^<div class="fdPanel wdFull">/.test(html) && /<\/div><div class="wdTiles">[\s\S]*<\/div><\/div><\/div>$/.test(html) && !/fdFoot/.test(html), 'the sheet stands full height and the tiles are the last thing on it');
t(/\.fdPanel\.wdFull\{height:calc\(100% - 34px\);max-height:none;display:flex;flex-direction:column;/.test(src) && /\.wdTiles\{[^}]*margin-top:auto/.test(src), 'and the stylesheet says so');
t(/var _WO_OPEN='<div class="tlMeals tlFirst"><div class="tlMealsHead"><span class="tlMealsEy">Workout<\/span><\/div>';/.test(src) && /if\(html\.length===_woMark\+_WO_OPEN\.length\) html=html\.slice\(0,_woMark\); else html\+='<\/div>';/.test(src) && /\.tlAsks \+ \.tlAsks\{margin-top:0;\}/.test(src) && /\.tlAsks\{margin:10px 0 2px;padding:0;\}/.test(src), 'the day stacks in one grammar: the workout gets a section head like Food, Body and Stats, dropped when empty; ask rows share one indent and one group');
t(/wdN">Morning walk</.test(html) && /wdN">Weighed in<\/div><div class="wdM">168 lb</.test(html), 'walks and weigh-ins are on the line too');
t(/wdTk">Steps<\/div><div class="wdTv">11,800</.test(html) && /wdTk">Calories<\/div><div class="wdTv">1,387</.test(html) && /wdTk">Protein<\/div><div class="wdTv">81<small>g<\/small>/.test(html), 'steps and the day\'s numbers sit at the foot');
t(/fdHd"><div class="wdEy">YOURJIMBFF<\/div><span class="fdTitle">Today<i>Thursday, September 10<\/i>/.test(html), 'the brand small above, the day, the full date under it');
t(/wdHead"><div class="wdT"><\/div><div class="wdL"><\/div><div class="wdHb"><span>Breakfast<\/span><span>1,021 cal<\/span>/.test(html) && /wdHb"><span>Dinner<\/span><span>366 cal<\/span>/.test(html) && /wdHb"><span>Snack<\/span><span><\/span>/.test(html) && (html.match(/wdHb/g)||[]).length===3, 'each meal heads its foods on the line with its calories; a meal with no numbers heads with none');
t(/\.fdPanel\.wdFull\{[^}]*padding:14px 18px calc\(84px \+ env\(safe-area-inset-bottom,0px\)\)/.test(src) && /\.wdFull \.fdHd\{display:block;padding:44px 4px 18px;\}/.test(src), 'share margins: the title sits well down, the numbers well up');
t(/data-key="food" data-ds="'\+_escHtml\(ds\)\+'" role="button" tabindex="0" aria-label="Add a food"/.test(src) && /if\(_ak==='food'\)\{ nlOpen\(_ads, null\); return; \}/.test(src), 'today always has an Add a food door, and it opens Jim with no slot');
t(vm.runInContext("_wdOpen('Sep 9, 2026')", ctx)===true && /wdEmpty">Nothing logged\.</.test(doc._els.fdOv.innerHTML) && !/wdTile/.test(doc._els.fdOv.innerHTML), 'an empty day says Nothing logged and draws no tiles');
t(vm.runInContext("_wdOpen('Sep 8, 2026')", ctx)===false, 'a day the page has not drawn cannot open');
t(/data-tl="daytog" data-ds="'\+_escHtml\(ds\)\+'"/.test(src) && /if\(a==='daytog'\)\{ ev\.stopPropagation\(\); try\{ _wdOpen\(el\.getAttribute\('data-ds'\)\); \}catch\(e\)\{\} return; \}/.test(src), 'the day\'s name is the door and the tap is wired');
t(/\.wdL::after\{[^}]*background:rgba\(240,236,228,0\.72\)/.test(src) && !/\.wdL::after\{[^}]*gold/.test(src), 'the dots are white - gold on the Day tab is now-and-next only');
console.log(bad?'\n  '+bad+' FAILED':'\n  all whole-day assertions pass');
process.exit(bad?1:0);
