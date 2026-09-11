// THE TOTAL OPENS INTO ITS PARTS - AS AN OVERLAY (Yusuf, 10 Sep: "it should be an
// overlay instead of a drop down... crisp, clean... with glass"); THE WEIGHT
// STAT OPENS INTO ITS HISTORY. Lifted and driven with real-shaped rows.
const fs=require('fs'), vm=require('vm');
const src=fs.readFileSync('index.html','utf8');
let bad=0; const t=(p,l)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l); };
const a=src.indexOf('function _tlTotLine(slots, dayState, ds){'), b=src.indexOf('// ===== THE MEAL SECTION');
const doc={_els:{}, getElementById(id){ return this._els[id]||null; }, createElement(){ const el={cls:'',classList:{add(c){ el.cls=c; },remove(){ el.cls=''; }},setAttribute(){},addEventListener(){},innerHTML:'',querySelector(){ return {scrollTop:0,addEventListener(){},querySelector(){ return {addEventListener(){}}; }}; }}; return el; }, body:{appendChild(el){ doc._els.fdOv=el; }}, addEventListener(){}, querySelector(){ return null; }};
const ctx={String,Math,Number,Array,Date,isNaN,window:{}, document:doc, _escHtml:(x)=>String(x==null?'':x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'), _tlMins:(r)=>{ const d=new Date(r.logged_at); return d.getHours()*60+d.getMinutes(); }, _tlClock:(m)=>{ const h=Math.floor(m/60), mm=m%60, hh=h%12||12; return hh+':'+(mm<10?'0':'')+mm+(h>=12?'pm':'am'); }, _tlDayLabel:(d)=>'Today', _tcase:(x)=>String(x).split(' ').map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(' ')};
vm.createContext(ctx); vm.runInContext(src.slice(a,b), ctx);
const slots={breakfast:[{name:'Banana Walnut Chocolate Chip Pancakes',calories:1021,protein:22,carbs:114,fat:53,logged_at:'2026-09-10T13:52:00',photo:'data:image/jpeg;base64,AAAA'}],dinner:[{name:'Sweet & Sour Chicken',calories:452,protein:59,carbs:32,fat:10,logged_at:'2026-09-10T20:26:00',photo:'data:image/jpeg;base64,BBBB'},{name:'Buffalo Wings',calories:668,protein:37,carbs:40,fat:40,logged_at:'2026-09-10T20:26:00',photo:'data:image/jpeg;base64,CCCC'}],snack:[{name:'a handful of almonds',calories:0,protein:0,carbs:0,fat:0,logged_at:'2026-09-10T22:00:00'}]};
vm.runInContext('globalThis.__s='+JSON.stringify(slots), ctx);
const line=vm.runInContext("_tlTotLine(__s,'today','Sep 10, 2026')", ctx);
t(/class="tlTot" data-tl="tottog" data-ds="Sep 10, 2026"/.test(line), 'the total line is still the door');
t(/<b>2,141<\/b><span>cal<\/span>/.test(line) && /<span>118P<\/span>/.test(line) && /<span>186C<\/span>/.test(line) && /<span>103F<\/span>/.test(line), 'it reads short now: 2,141 cal · 118P · 186C · 103F');
t(/1 without numbers/.test(line), 'a meal with no numbers is still said on the line');
t(!/tlItems/.test(line), 'and nothing unfolds under it any more');
vm.runInContext("window._tlSlotsByDs['Sep 10, 2026']=__s", ctx);
const opened=vm.runInContext("_fdOpen('Sep 10, 2026')", ctx);
const html=doc._els.fdOv ? doc._els.fdOv.innerHTML : '';
t(opened===true && doc._els.fdOv.cls==='open' && /^<div class="fdPanel">/.test(html), 'the tap opens the glass sheet');
t(/fdTitle">Today<i>Sep 10<\/i>/.test(html) && /fdTot"><b>2,141<\/b> cal · 118P · 186C · 103F/.test(html), 'the sheet is titled with the day and carries its total');
t(/fdMh"><span>Breakfast<\/span><span><b>1,021<\/b> cal · 22P · 114C · 53F/.test(html) && /fdMh"><span>Dinner<\/span><span><b>1,120<\/b> cal · 96P · 72C · 50F/.test(html), 'each meal is a block with its own numbers');
t(/fdBand one"><img src="data:image\/jpeg;base64,AAAA"/.test(html) && /fdBand"><img src="data:image\/jpeg;base64,BBBB" alt=""><img src="data:image\/jpeg;base64,CCCC"/.test(html), 'the photos band across the top of the meal - one wide, two side by side');
t(/fdNm">Sweet &amp; Sour Chicken<i>8:26pm<\/i><\/span><span class="fdKc">452<i>59P · 32C · 10F<\/i>/.test(html), 'every food lists with its time, calories and P C F');
t(/fdMh"><span>Snack<\/span><span>no numbers<\/span>/.test(html) && /A Handful Of Almonds<i>10:00pm<\/i><\/span><span class="fdKc"><i>no numbers<\/i>/.test(html) && !/fdBand"><\/div>/.test(html), 'a food without numbers says so, and a meal without photos draws no band');
t(/fdFoot">YOURJIMBFF</.test(html), 'the sheet signs off with the brand, small');
t(vm.runInContext("_fdOpen('Sep 9, 2026')", ctx)===false, 'a day the page has not drawn cannot open');
t(/if\(a==='tottog'\)\{ ev\.stopPropagation\(\); try\{ _fdOpen\(el\.getAttribute\('data-ds'\)\); \}catch\(e\)\{\} return; \}/.test(src) && /if\(a==='dwhist'\)/.test(src), 'both taps are wired on the Day page');
t(/window\._tlSlotsByDs\[ds\]=slots/.test(src) && /_metaHtml\.replace\('class="tlTot"','class="tlTot inHd"'\)/.test(src) && /html\+=\(_totInHd \? '' : _metaHtml\);/.test(src), 'the day remembers its slots, and the total rides the title row instead of sitting under it');
t(/\.fdOv\{[^}]*backdrop-filter:blur/.test(src) && /\.fdPanel\{[^}]*radial-gradient\(120% 140% at 0% 0%,#232323 0%,#171717 46%,#121212 100%\)/.test(src), 'glass: blurred backdrop, the pgCard recipe on the sheet');
t(/body\.tlwnav #tFeed\{padding-top:6px;\}/.test(src) && /body\.tlwnav #tlScroll\{height:calc\(100vh - 194px\);height:calc\(100svh - 194px\);\}/.test(src), 'the gap above the week strip closed and the scroller grew by the same amount');
t(/\.mbg\.open, \.fdOv\.open/.test(src), 'the foreground update check waits while the sheet is up');
const dw=src.slice(src.indexOf('function _dayWeightHtml(ds){'), src.indexOf('function _dayWeightRepaint(){'));
const dws=src.slice(src.indexOf('function _dwSheetHtml(){'), src.indexOf('function _dayWeightRepaint(){'));
t(/data-tl="dwhist"/.test(dw) && /window\._dwSheet=\{rows:rows/.test(dw) && /for\(var i=asc\.length-1;i>=0;i--\)/.test(dws) && /dd==null\)\?'first'/.test(dws) && /if\(a==='dwhist'\)\{ ev\.stopPropagation\(\); try\{ _dwOpen\(\); \}catch\(e\)\{\} return; \}/.test(src), 'the weight card opens a sheet that lists every weigh-in newest first with the change from the one before - no drop-down');
t(!/#e07b6a|#7fcf9a/.test(src.slice(src.indexOf('.dwSheetList .tlItemR span'), src.indexOf('.dwSheetList .tlItemR span')+80)), 'no red or green on a weight change - a direction is not a verdict');
console.log(bad?'\n  '+bad+' FAILED':'\n  all day-list assertions pass');
process.exit(bad?1:0);
