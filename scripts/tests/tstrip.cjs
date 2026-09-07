// THE STRIP STARTS THE DAY THEY JOINED (Yusuf, 7 Sep): "why would any days
// before that in their little 14-day ticker even be visible? And then have it
// go from the left."
const fs=require('fs');
const {closure}=require('./_lift.cjs');
let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };
global.window={}; global.CLIENTS={}; global._crm={logs:{}};
eval(closure(['_crmStripKeysFor','_crmStripHtml','_crmLogStreak','_crmLogSumWords','_CRM_STRIP_DAYS']).code||'');
global._escHtml=global._escHtml||(s=>String(s));
const today=_dfToday();
function key(daysAgo){ const d=new Date(new Date(today+'T12:00:00').getTime()-daysAgo*86400000); return _dfDayKey(d.toISOString()); }
CLIENTS.newkid={started_at:key(2)};
CLIENTS.oldhand={started_at:key(60)};
CLIENTS.nodate={};
t(_crmStripKeysFor('newkid').length===3, 'joined two days ago: three boxes, not fourteen', String(_crmStripKeysFor('newkid').length));
t(_crmStripKeysFor('newkid')[0]===key(2) && _crmStripKeysFor('newkid')[2]===today, 'day 1 on the left, today on the right');
t(_crmStripKeysFor('oldhand').length===14, 'sixty days in, the full fourteen');
t(_crmStripKeysFor('nodate').length===14, 'no join date on file, the full fourteen - never guessed shorter');
_crm.logs={tony:{days:{[key(1)]:1,[today]:1}}, old:{days:{[key(40)]:1,[key(1)]:1}}};
CLIENTS.tony={started_at:key(80)}; CLIENTS.old={started_at:key(80)};
t(_crmStripKeysFor('tony').length===2, 'roster row from June, first log yesterday: two boxes - the first log wins over the roster date', String(_crmStripKeysFor('tony').length));
t(_crmStripKeysFor('old').length===14, 'a client with history older than the strip keeps the fourteen');
const h=_crmStripHtml({days:{[key(2)]:1,[today]:1}}, 'newkid');
t((h.match(/crmTick/g)||[]).length===3 && /day 1</.test(h) && /today</.test(h), 'labelled day 1 and today', h.replace(/<[^>]+>/g,'|').slice(0,80));
const h1=_crmStripHtml({days:{}}, 'nodate');
t((h1.match(/crmTick/g)||[]).length===14 && /14d ago</.test(h1), 'a full strip still says 14d ago');
t(_crmLogStreak({days:{[today]:1,[key(1)]:1,[key(2)]:1,[key(4)]:1}})===3, 'three in a row ending today');
t(_crmLogStreak({days:{[key(1)]:1,[key(2)]:1}})===2, 'today not logged yet does not break a streak ending yesterday');
t(_crmLogSumWords({ever:true, since:0, inStrip:3, window:3, streak:3})==='every day so far (3 of 3) · 3 in a row', 'the words for a new client who has not missed');
t(_crmLogSumWords({ever:true, since:0, inStrip:2, window:3, streak:0})==='2 of 3 days so far', 'and one who has');
t(_crmLogSumWords({ever:true, since:0, inStrip:12, window:14, streak:5})==='12 of the last 14 days · 5 in a row', 'an old hand keeps the fourteen and gets the streak');
console.log();
if(bad){ console.log('  '+bad+' FAILED'); process.exit(1); }
console.log('  all strip assertions pass');
process.exit(0);
