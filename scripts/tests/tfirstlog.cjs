// A FIRST LOG IS NOT A COMEBACK (Alex Cortes, 15 Sep).
//
// His card read "First log in over 194 days" beside a man who made the account
// at 03:19 that night, answered the setup questions at 03:22, and logged a
// treadmill walk at 04:13. He had never logged anything in his life. Checked
// against the database before changing a line: code u6gpr563954, the new-signup
// format, one workout, zero food logs, and the only Cortes in the whole table -
// so he had not signed into anybody's old account either.
//
// WHY THE FEED SAID IT. _fbGap walks backwards from today looking for the last
// day they logged, and stops when it runs out of read history. For somebody
// brand new it ALWAYS runs out, so it reported the width of the reading window
// as the length of their absence. Every account made that night wore the badge
// - Nick, George, Zadkiel, Alex.
//
// The account's own age is the only thing that separates "gone 200 days" from
// "never been here". You cannot have been away longer than you have existed.
const fs=require('fs');
const guard=require('./_guard.cjs');
const src=fs.readFileSync('index.html','utf8');
const L=src.split('\n');
function fnAt(n){
  const a=L.findIndex(l=>l.indexOf('function '+n+'(')===0 || l.indexOf('async function '+n+'(')===0);
  if(a<0) return '';
  let b=a,d=0,seen=false;
  for(; b<L.length; b++){
    for(const ch of L[b]){ if(ch==='{'){ d++; seen=true; } else if(ch==='}'){ d--; } }
    if(seen && d===0) break;
  }
  return L.slice(a,b+1).join('\n');
}
let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra!==undefined?('  '+extra):'')); };

global.window={};
global.CLIENTS={};
global.jvTriage={coverFrom:0};
function dayKey(back){
  const d=new Date(); d.setHours(12,0,0,0); d.setDate(d.getDate()-back);
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
global._jvDayKey=function(d){
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
};
global._fbDayKeyBack=dayKey;

eval([fnAt('_fbAccountDays'), fnAt('_fbGap')].join('\n'));
guard(['_fbAccountDays','_fbGap'], n=>eval(n));

function madeDaysAgo(n){ const d=new Date(); d.setDate(d.getDate()-n); return d.toISOString(); }
function loggedOn(backs){ const s={}; backs.forEach(b=>{ s[dayKey(b)]=1; }); return {dset:s}; }

console.log('\n  ALEX, WHO MADE THE ACCOUNT TONIGHT');
CLIENTS.alex={created_at: madeDaysAgo(0)};
t(_fbGap(loggedOn([0]), 'alex')===null,
  'logged today, account made today: no comeback badge at all');

CLIENTS.yday={created_at: madeDaysAgo(1)};
t(_fbGap(loggedOn([0]), 'yday')===null, 'made yesterday, first log today: still not a comeback');

console.log('\n  A REAL COMEBACK IS UNTOUCHED');
CLIENTS.old={created_at: madeDaysAgo(400)};
const g=_fbGap(loggedOn([0, 30]), 'old');
t(!!g && g.days===30 && g.exact===true, 'a client of a year, back after 30 quiet days', g&&(g.days+' days'));
const g2=_fbGap(loggedOn([0, 9]), 'old');
t(!!g2 && g2.days===9, 'and after nine', g2&&(g2.days+' days'));
// Away longer than the read window, but the account is far older: still honest.
jvTriage.coverFrom=new Date(Date.now()-60*86400000).getTime();
const g3=_fbGap(loggedOn([0]), 'old');
t(!!g3 && g3.exact===false && g3.days>=59,
  'gone past what was read, on an old account, still says "over N"', g3&&(g3.days+' over'));
jvTriage.coverFrom=0;

console.log('\n  AND IT NEVER INVENTS WHEN IT CANNOT TELL');
CLIENTS.nodate={};                      // created_at not loaded yet
const g4=_fbGap(loggedOn([0]), 'nodate');
t(!!g4, 'no account age known: it behaves exactly as it did before, never guesses "new"');
t(_fbAccountDays('nodate')===null, 'and the age reader says so plainly');
CLIENTS.junk={created_at:'not a date'};
t(_fbAccountDays('junk')===null, 'an unparseable date is unknown, not zero');
t(_fbGap(null,'alex')===null && _fbGap({}, 'alex')===null, 'no data at all is no badge');
t(_fbGap(loggedOn([3]), 'old')===null, 'nothing logged TODAY is never a comeback either');

console.log('\n  NEW CLIENT NOW READS ON A FREE SIGNUP');
const sd=fnAt('_fbStartDays');
t(/raw = r && r\.created_at/.test(sd),
  'started_at is a paid-plan field, so a free account falls back to the day it was made');

console.log(bad? ('\n  '+bad+' FAILED') : '\n  all passed');
process.exit(bad?1:0);
