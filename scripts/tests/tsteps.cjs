// STEPS, THE WAY A PHONE SHOWS THEM (Yusuf, 10 Sep 9:55am): the rolling week,
// the average, one box, and an import that reads the Health export.
const fs=require('fs'); const src=fs.readFileSync('index.html','utf8');
let bad=0; const t=(ok,l)=>{ if(!ok) bad++; console.log((ok?'  ok    ':'  FAIL  ')+l); };
function lift(name){ const re=new RegExp('\\n(?:async )?function '+name+'\\('); const i=src.search(re); if(i<0) throw new Error('missing '+name); const b=src.slice(i+1); let d=0; for(let k=b.indexOf('{');k<b.length;k++){ if(b[k]==='{') d++; else if(b[k]==='}'){ d--; if(!d) return b.slice(0,k+1); } } throw new Error('unterminated '+name); }
const code=[
  'var window={_stepMap:{}};',
  'function _tlDateStr(d){ return d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}); }',
  'function _parseDs(ds){ try{ var d=new Date(ds); return isNaN(d.getTime())?null:d; }catch(e){ return null; } }',
  'function _escHtml(x){ return String(x).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }',
  lift('_stepsFor'), lift('_stDaysBack'), lift('_stSpan'), lift('_stWeek'), lift('_stAvgLine'), lift('_stChartHtml'), lift('_stParseHealthXml'), lift('_stParseLines'),
  'module.exports={_stDaysBack,_stWeek,_stChartHtml,_stParseHealthXml,_stParseLines,setMap:function(m){ window._stepMap=m; }};'
].join('\n');
const m={exports:{}}; new Function('module','exports',code)(m,m.exports);
const {_stDaysBack,_stWeek,_stChartHtml,_stParseHealthXml,_stParseLines,setMap}=m.exports;

console.log('  the rolling week:');
const days=_stDaysBack('Sep 10, 2026',7).map(x=>x.ds);
t(days[0]==='Sep 4, 2026' && days[6]==='Sep 10, 2026', 'seven days ending on the picked day');
setMap({'Sep 10, 2026':11204,'Sep 9, 2026':8000,'Sep 8, 2026':5000,'Sep 6, 2026':12000});
const w=_stWeek('Sep 10, 2026');
t(w.total===36204 && w.logged===4 && w.avg===9051 && w.max===12000, 'total, days logged, average over LOGGED days only, and the tallest bar');
const h=_stChartHtml('Sep 10, 2026');
t((h.match(/class="stCol( sel)?"/g)||[]).length===7, 'seven columns');
t((h.match(/class="stBar"/g)||[]).length===4 && (h.match(/stBarNone/g)||[]).length===3, 'four bars, three gaps - a day with no row is a gap, never a zero');
t(/stCol sel" onclick="stPick\('Sep 10, 2026'\)"/.test(h), 'the picked day is the lit one');
t(/avg 9,051/.test(h) && /36,204 this week/.test(h), 'the average line and the week total are drawn');
setMap({});
t(/Nothing logged this week yet/.test(_stChartHtml('Sep 10, 2026')) && !/stAvg/.test(_stChartHtml('Sep 10, 2026')), 'an empty week says so and draws no average');

console.log('\n  the Health export:');
const xml='<HealthData>'
 +'<Record type="HKQuantityTypeIdentifierStepCount" sourceName="iPhone" unit="count" startDate="2026-09-09 07:12:34 -0400" endDate="2026-09-09 07:20:00 -0400" value="1200"/>'
 +'<Record type="HKQuantityTypeIdentifierStepCount" sourceName="iPhone" unit="count" startDate="2026-09-09 12:00:00 -0400" endDate="2026-09-09 12:30:00 -0400" value="3000"/>'
 +'<Record type="HKQuantityTypeIdentifierStepCount" sourceName="Apple Watch" unit="count" startDate="2026-09-09 07:00:00 -0400" endDate="2026-09-09 21:00:00 -0400" value="5100"/>'
 +'<Record type="HKQuantityTypeIdentifierHeartRate" sourceName="Apple Watch" startDate="2026-09-09 07:00:00 -0400" value="70"/>'
 +'<Record type="HKQuantityTypeIdentifierStepCount" sourceName="iPhone" unit="count" startDate="2026-09-08 09:00:00 -0400" endDate="2026-09-08 09:30:00 -0400" value="2500"/>'
 +'</HealthData>';
const hx=_stParseHealthXml(xml);
t(hx.samples===4, 'four step samples read, the heart rate ignored');
t(hx.days['Sep 9, 2026']===5100, 'a day is the LARGEST single source (5,100 from the watch), never the sum across phone and watch (9,300)');
t(hx.days['Sep 8, 2026']===2500, 'a day with one source is that source');

console.log('\n  CSV and pasted lines:');
const L=_stParseLines('date,steps\n2026-09-09,8432\nSep 8, 2026 7,110\n9/7/2026\t6000\njunk line\n');
t(L.days['Sep 9, 2026']===8432, 'an ISO date reads as that LOCAL day (not the evening before)');
t(L.days['Sep 8, 2026']===7110, 'a "Sep 8, 2026 7,110" line, comma in the number');
t(L.days['Sep 7, 2026']===6000, 'a 9/7/2026 line');
t(Object.keys(L.days).length===3, 'the header and the junk line are skipped');

console.log('\n  where it lives:');
const cardio=src.slice(src.indexOf('function _tlCardioRow'), src.indexOf('/* THE END OF THE DAY'));
t(/data-tl="steps"/.test(cardio) && /_tlAskRow\('steps', ds, 'Steps'\)/.test(cardio), 'the Steps row sits with the training, beside Cardio');
const stats=src.slice(src.indexOf('function _tlStatsBlock'), src.indexOf('/* ===== THE CHECK IN'));
t(!/_tlAskRow\('steps'/.test(stats), 'and not in the Body rows any more');
t(/class="stSheet pgCard"/.test(src), 'the sheet is the glass card');
t(/cdnjs\.cloudflare\.com\/ajax\/libs\/jszip\/3\.10\.1\/jszip\.min\.js/.test(src), 'export.zip opens in the browser');
t(/f\.size>400\*1024\*1024/.test(src), 'a zip over 400 MB is refused with a reason, not attempted');
t(/sbUpsert\('step_logs',\{client_code:code, steps:v, date_str:ds/.test(src.slice(src.indexOf('async function _stWriteDays'))) && /await _stWriteDays\(days, cl\.code/.test(src.slice(src.indexOf('async function stImportGo'))), 'the import writes through the same upsert the box uses, one row per day');
console.log('\n  the taps answer on a phone (10 Sep 10:34, "import from Apple Health hit nothing"):');
const sheet=src.slice(src.indexOf('function _stChartHtml'), src.indexOf('function stPick'));
t(!/data-tl="stpick"|data-tl="stimport"/.test(sheet), 'no data-tl inside the sheet - it lives outside the day page delegate');
t(/onclick="stPick\(/.test(sheet) && /onclick="stImportOpen\(\)"/.test(sheet), 'the bars and the import row carry their own onclick');
t(/onclick="cardioImportOpen\(\)"/.test(src) && !/placeholder="30 minutes on the stairmaster"/.test(src), 'the cardio sheet has its import row and no placeholder');
t(/^\.msheet\{/m.test(src), '.msheet has a rule at all now - the same glass as the Steps sheet');
console.log('\n  the screenshot reader:');
const rd=src.slice(src.indexOf('var _SHOT_SYS'), src.indexOf('function stImportPaste'));
t(/Reply with ONLY compact JSON/.test(rd) && /Never estimate a bar; the bars are measured separately/.test(rd) && /"tallest"/.test(rd), 'asks for JSON, the printed range and average, and never a guessed bar - the bars are measured off the pixels');
t(/thinking:\{type:'disabled'\}/.test(src.slice(src.indexOf('async function _shotRead'), src.indexOf('function _shotDs'))), 'the reader turns thinking off - sonnet spent its whole budget thinking about 31 bars and wrote nothing');
t(/never estimate calories or distance/.test(rd), 'cardio: never invents calories or distance');
t(/d\.getTime\(\)>Date\.now\(\)\+864e5\) return null/.test(rd), 'a day in the future is dropped');
t(/downscaleImage\(raw, 1440, 0\.85\)/.test(rd), 'the picture is shrunk before it goes up');
const cd=src.slice(src.indexOf('async function cardioImportShot'), src.indexOf('async function cardioSave'));
t(/x\.dup=have\.some/.test(cd) && /filter\(function\(x\)\{ return !x\.dup; \}\)/.test(cd), 'a session already on that day with the same words is not written twice');
console.log(bad?('\n'+bad+' FAILED'):'\n  all steps assertions pass'); process.exit(bad?1:0);
