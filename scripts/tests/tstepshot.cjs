// THE BARS READ OFF A SCREENSHOT (Yusuf, 10 Sep 10:40am): his own Health
// screens have no number on any bar. The pixels are measured, one bar a day
// from the printed range, scaled so the mean equals the printed average.
const fs=require('fs'); const src=fs.readFileSync('index.html','utf8');
let bad=0; const t=(ok,l)=>{ if(!ok) bad++; console.log((ok?'  ok    ':'  FAIL  ')+l); };
function lift(name){ const re=new RegExp('\\n(?:async )?function '+name+'\\('); const i=src.search(re); if(i<0) throw new Error('missing '+name); const b=src.slice(i+1); let d=0; for(let k=b.indexOf('{');k<b.length;k++){ if(b[k]==='{') d++; else if(b[k]==='}'){ d--; if(!d) return b.slice(0,k+1); } } throw new Error('unterminated '+name); }
const code=[
  'var window={_stepMap:{}}; var cl={code:"zz"};',
  'function _tlDateStr(d){ return d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}); }',
  'function _parseDs(ds){ try{ var d=new Date(ds); return isNaN(d.getTime())?null:d; }catch(e){ return null; } }',
  'function _escHtml(x){ return String(x).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }',
  'var _status=""; var _stImport=null; var document={getElementById:function(id){ return id==="stImpStatus"?{set innerHTML(v){ _status=v; }, get innerHTML(){ return _status; }}:null; }};',
  lift('_stepsFor'), lift('_stDaysBack'), lift('_stSpan'), lift('_stWeek'), lift('_stAvgLine'), lift('_stChartHtml'),
  lift('_shotDs'), lift('_shotDate'), lift('_stBarsScan'), lift('_stRangeDays'), lift('_stBarsToDays'), lift('_stImpStatus'), lift('_stPreview'),
  'module.exports={_stSpan,_stChartHtml,_stBarsScan,_stRangeDays,_stBarsToDays,_stPreview,status:function(){ return _status; },imp:function(){ return _stImport; },setMap:function(m){ window._stepMap=m; }};'
].join('\n');
const m={exports:{}}; new Function('module','exports',code)(m,m.exports);
const {_stSpan,_stChartHtml,_stBarsScan,_stRangeDays,_stBarsToDays,_stPreview,status,imp,setMap}=m.exports;

// a fake phone screen: dark, with orange rectangles where asked
function screen(W,H,rects,extras){
  const px=new Uint8ClampedArray(W*H*4);
  for(let i=0;i<W*H;i++){ px[i*4]=18; px[i*4+1]=18; px[i*4+2]=18; px[i*4+3]=255; }
  const paint=(x0,y0,x1,y1,c)=>{ for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++){ const i=(y*W+x)*4; px[i]=c[0]; px[i+1]=c[1]; px[i+2]=c[2]; } };
  (extras||[]).forEach(f=>f(paint));            /* gridlines sit behind the bars, as on the phone */
  rects.forEach(r=>paint(r[0],r[1],r[2],r[3],[232,104,56]));
  return px;
}
console.log('  the bars off the pixels:');
const W=400,H=800, floor=600, heights=[148,182,207,196,134,110,313];
const rects=heights.map((h,i)=>[40+i*50, floor-h+1, 40+i*50+29, floor]);
// an orange trend line under the chart, an orange word, a grey gridline, a white number
const extras=[
  p=>p(60,720,340,724,[232,104,56]),
  p=>{ for(let k=0;k<6;k++) p(300+k*6,60,300+k*6+2,80,[232,104,56]); },   /* letter strokes: thin, not filled */
  p=>p(0,400,399,400,[90,90,90]),
  p=>p(340,300,380,320,[240,240,240]),
];
const sc=_stBarsScan(screen(W,H,rects,extras),W,H);
t(sc.bars.length===7, 'seven bars found, the trend line, the word, the gridline and the number all fall away ('+sc.bars.length+')');
t(sc.bars.every((b,i)=>b.h===heights[i]), 'each bar measured to the pixel, left to right');
t(sc.floor===floor && sc.width===30, 'they stand on one floor at one width');
t(sc.colour && sc.colour[0]>200 && sc.colour[1]<130, 'the bar colour is the orange');

console.log('\n  bars to days:');
t(_stRangeDays('2026-09-03','2026-09-09')===7 && _stRangeDays('2026-08-11','2026-09-10')===31 && _stRangeDays('2026-09-03','2026-09-03')===1, 'the printed range counts its days');
t(_stRangeDays('2026-09-09','2026-09-03')===0 && _stRangeDays('x','2026-09-03')===0, 'a backwards or broken range is nothing');
const d7=_stBarsToDays(sc.bars,'2026-09-03',7,6816,{},20000);
const vals=Object.values(d7.days);
t(d7.how==='avg' && vals.length===7, 'seven days, matched to the printed average');
t(Math.abs(vals.reduce((a,b)=>a+b,0)/7-6816)<=10, 'their mean IS the printed average ('+Math.round(vals.reduce((a,b)=>a+b,0)/7)+')');
t(d7.days['Sep 3, 2026']>0 && d7.days['Sep 9, 2026']===Math.max(...vals), 'the first bar is the first day, the tallest is Wednesday the 9th');
t(vals.every(v=>v%10===0), 'every estimate is rounded to ten');
const dAx=_stBarsToDays(sc.bars,'2026-09-03',7,6816,{},8000);
t(dAx===null, 'an axis the numbers cannot fit under means the words and the picture disagree: nothing');
const dMax=_stBarsToDays(sc.bars,'2026-09-03',7,0,{'Sep 9, 2026':11500,'Sep 3, 2026':5000},0);
t(dMax && dMax.how==='max' && dMax.days['Sep 9, 2026']===11500, 'no printed average: the tallest bar takes the model’s read of it');
// a week with two days missing: bars for slots 0,1,2,4,5 (no Sat, no Wed)
const gapBars=sc.bars.filter((b,i)=>i!==3 && i!==6);
const dGap=_stBarsToDays(gapBars,'2026-09-03',7,6000,{},0);
t(dGap && Object.keys(dGap.days).length===5 && !dGap.days['Sep 6, 2026'] && !dGap.days['Sep 9, 2026'] && dGap.days['Sep 7, 2026']>0, 'missing bars are placed by the spacing: Sat and Wed stay empty, Mon lands on Monday');
const dLead=_stBarsToDays(sc.bars.slice(2),'2026-09-03',7,6000,{},0);
t(dLead && dLead.days['Sep 3, 2026']>0 && !dLead.days['Sep 9, 2026'], 'a chart missing its first days cannot be told from one missing its last: it lands from the first day and the preview shows the dates');
t(_stBarsToDays(sc.bars,'2026-09-03',5,6816,{},0)===null, 'more bars than days: nothing, never a guess');
t(_stBarsToDays([sc.bars[0]],'2026-09-03',7,6816,{},0)===null, 'one bar in a week is not a chart');

console.log('\n  the month view is rougher, and keeps what agrees:');
setMap({'Sep 9, 2026':11570,'Sep 3, 2026':5470,'Sep 5, 2026':9000});
_stPreview({days:{'Sep 9, 2026':11560,'Sep 3, 2026':5450,'Sep 5, 2026':7670,'Sep 4, 2026':6780}, rough:true, note:'Read off the bars.'},'screenshot');
t(imp() && Object.keys(imp().days).length===2 && imp().days['Sep 5, 2026']===7670 && imp().days['Sep 4, 2026']===6780, 'two days kept as they are, the disagreement and the new day import');
t(/2 kept as they are/.test(status()) && /kept 11,570/.test(status()) && /Import 2 days/.test(status()), 'the preview says what is kept and imports the rest');
_stPreview({days:{'Sep 9, 2026':11560,'Sep 3, 2026':5450}, rough:true},'screenshot');
t(/already on your record/.test(status()) && !/stImportGo/.test(status()), 'nothing to import: no button');
_stPreview({days:{'Sep 9, 2026':11560,'Sep 3, 2026':5450}, rough:false},'screenshot');
t(imp() && Object.keys(imp().days).length===2 && /2 would change/.test(status()), 'a week read is finer: it replaces');
setMap({'Sep 10, 2026':5670});
_stPreview({days:{'Sep 10, 2026':5670}},'screenshot');
t(/today, so far/.test(status()), 'today is marked as so far');

console.log('\n  week and month in the sheet:');
const map={}; for(let i=0;i<31;i++){ const d=new Date(2026,7,11+i); map[_tlDateStr(d)]=[11780,5280,6670,7560,3000,8610,4560,5330,4220,5610,1060,6670,10780,17110,3830,10720,5450,4670,6560,4220,6890,8220,8720,5470,6730,7650,7240,4950,4100,11570,5670][i]; }
function _tlDateStr(d){ return d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}); }
setMap(map);
const wk=_stSpan('Sep 10, 2026',7), mo=_stSpan('Sep 10, 2026',31);
t(wk.logged===7 && wk.avg===Math.round((6730+7650+7240+4950+4100+11570+5670)/7), 'the week ending today averages its seven days');
t(mo.logged===31 && mo.n===31 && mo.avg===6803, 'thirty-one days back, the window Health calls a month, all logged, and its average is the 6,804 on his screen (6,803 here, the fixture rounds to ten)');
const hm=_stChartHtml('Sep 10, 2026',31);
t((hm.match(/class="stCol( sel)?"/g)||[]).length===31 && /stChart mo/.test(hm), 'thirty-one thin columns');
t((hm.match(/class="stDay">[0-9]+\/[0-9]+</g)||[]).length===5 && /class="stDay">9\/10</.test(hm), 'a date under every seventh bar counted back from today, today last');
t(/this month/.test(hm) && /Last week [\d,]+ a day · last month 6,803 a day/.test(hm), 'the month line and both averages');
const hw=_stChartHtml('Sep 10, 2026',7);
t((hw.match(/class="stCol( sel)?"/g)||[]).length===7 && /this week/.test(hw) && /Last week/.test(hw), 'the week keeps its seven and says both averages too');

console.log(bad?('\n  '+bad+' FAILED'):'\n  all green');
process.exit(bad?1:0);
