// THE TOTAL OPENS INTO ITS PARTS; THE WEIGHT STAT OPENS INTO ITS HISTORY
// (Yusuf, 10 Sep). Lifted and driven with real-shaped rows.
const fs=require('fs'), vm=require('vm');
const src=fs.readFileSync('index.html','utf8');
let bad=0; const t=(p,l)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l); };
const a=src.indexOf('function _tlTotLine(slots, dayState, ds){'), b=src.indexOf('// ===== THE MEAL SECTION');
const ctx={String,Math,Number,Array,window:{_totOpen:{'Sep 10, 2026':true}}, _escHtml:(x)=>String(x==null?'':x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'), _tlMins:(r)=>{ const d=new Date(r.logged_at); return d.getHours()*60+d.getMinutes(); }, _tlClock:(m)=>{ const h=Math.floor(m/60), mm=m%60, hh=h%12||12; return hh+':'+(mm<10?'0':'')+mm+(h>=12?'pm':'am'); }};
vm.createContext(ctx); vm.runInContext(src.slice(a,b), ctx);
const slots={breakfast:[{name:'Banana Walnut Chocolate Chip Pancakes',calories:1021,protein:22,carbs:114,fat:53,logged_at:'2026-09-10T13:52:00'}],dinner:[{name:'Sweet & Sour Chicken',calories:452,protein:59,carbs:32,fat:10,logged_at:'2026-09-10T20:26:00'},{name:'Buffalo Wings',calories:668,protein:37,carbs:40,fat:40,logged_at:'2026-09-10T20:26:00'}]};
vm.runInContext('globalThis.__s='+JSON.stringify(slots), ctx);
const html=vm.runInContext("_tlTotLine(__s,'today','Sep 10, 2026')", ctx);
t(/class="tlTot open" data-tl="tottog" data-ds="Sep 10, 2026"/.test(html), 'the total line is a door, and it knows it is open');
t(/<b>2,141<\/b><span>cal<\/span>/.test(html), 'the total still reads 2,141 cal');
t(/tlItemsHead"><span>Breakfast<\/span><span>1,021 cal<\/span>/.test(html) && /tlItemsHead"><span>Dinner<\/span><span>1,120 cal<\/span>/.test(html), 'each meal heads its own group with its own calories');
t(/Sweet &amp; Sour Chicken/.test(html) && /<b>452<\/b><span>59P · 32C · 10F<\/span>/.test(html), 'every food lists with calories and P C F');
t(/tlItemT">8:26pm</.test(html) || /tlItemT">9:52am</.test(html), 'and the time it was logged');
ctx.window._totOpen={};
const closed=vm.runInContext("_tlTotLine(__s,'today','Sep 10, 2026')", ctx);
t(/class="tlTot" data-tl="tottog"/.test(closed) && !/tlItems/.test(closed), 'folded, it is the one line it always was');
t(/if\(a==='tottog'\)/.test(src) && /if\(a==='dwhist'\)/.test(src), 'both taps are wired on the Day page');
const dw=src.slice(src.indexOf('function _dayWeightHtml(ds){'), src.indexOf('function _dayWeightRepaint(){'));
t(/data-tl="dwhist"/.test(dw) && /if\(_hOpen\)\{/.test(dw) && /for\(var i=asc\.length-1;i>=0;i--\)/.test(dw) && /d==null\)\?'first'/.test(dw), 'the weight card lists every weigh-in newest first with the change from the one before');
t(!/#e07b6a|#7fcf9a/.test(src.slice(src.indexOf('.tlItemR .dwUp'), src.indexOf('.tlItemR .dwUp')+120)), 'no red or green on a weight change - a direction is not a verdict');
console.log(bad?'\n  '+bad+' FAILED':'\n  all day-list assertions pass');
process.exit(bad?1:0);
