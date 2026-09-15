// THE STRIP HAS TO ANSWER ABOUT THE PEOPLE UNDERNEATH IT (Yusuf, 15 Sep, on the
// Free tab): "If I hit active, it doesn't even show. It actually just shows me
// all of the current active clients." And: "I can't see a list of the free
// people. I only see their logs, but I would like a list of their free people."
//
// The Clients/Free segment narrowed the FEED and nothing else. So with Free
// selected the four tiles above the feed went on counting the paying roster -
// 61 Active over a stream of free users' logs - and tapping one listed clients.
// Two different groups of people on one screen, each labelled as the other.
//
// Also guarded here: the leading tile on the Free tab is the ROSTER, not the
// active count. A free account made an hour ago is not "active" under a
// fourteen-day rule, so that tile read a number that had nothing to do with
// what he was looking at.
const fs=require('fs');
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
const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined?('  '+x):'')); };

const strip=fnAt('renderMobFrontDesk');
const stat =fnAt('jvStatList');
t(!!strip && !!stat, 'both surfaces found');

// ---- the segment reaches both -------------------------------------------
t(/_feedWhoPass\(k\)/.test(strip), 'the COUNTS strip filters by the Clients/Free segment');
t(/_feedWhoPass\(k\)/.test(stat),  'the LIST filters by the same segment');
// Neither may keep the old unfiltered roster line.
t(!/Object\.keys\(CLIENTS\)\.filter\(function\(k\)\{ return !CLIENTS\[k\]\.isTrainer && !_hidden\[k\]; \}\)/.test(strip),
  'the strip no longer counts the whole roster regardless of segment');
t(!/Object\.keys\(CLIENTS\)\.filter\(function\(k\)\{ return !CLIENTS\[k\]\.isTrainer && !_hidden\[k\]; \}\)/.test(stat),
  'the list no longer names the whole roster regardless of segment');

// A failure to read the segment must not empty the strip: it falls back to
// showing everybody, which is what it did before, never to showing nobody.
t(/catch\(e\)\{ return true; \}/.test(strip), 'strip fails OPEN, never to an empty roster');
t(/catch\(e\)\{ return true; \}/.test(stat),  'list fails OPEN, never to an empty roster');

// ---- the free roster is reachable ---------------------------------------
t(/_onFree \? tile\(codes\.length,'Free people','freeall'\)/.test(strip),
  'on Free the leading tile is the roster count and opens the list');
t(/: tile\(_activeN,'Active','activeterm'\)/.test(strip),
  '...and on Clients it is still Active, unchanged');
t(/kind==='freeall'/.test(stat), 'jvStatList knows the freeall kind');
t(/title='Free people'/.test(stat), 'the list is titled Free people');

// ---- newest first, and not re-sorted ------------------------------------
t(/created_at\|\|0\)\.getTime/.test(stat), 'freeall sorts on created_at');
t(/if\(ta!==tb\) return tb-ta;/.test(stat), '...newest first - he is counting signups, not auditing');
t(/\} else if\(kind!=='freeall'\)\{/.test(stat),
  'the alphabetical fallback does NOT re-sort freeall and undo that');

// ---- the counts themselves still mean what they say ---------------------
// Sanity: run the free-roster filter the way the strip does, against a fake map.
global.CLIENTS={
  c1:{name:'Paying One'}, c2:{name:'Paying Two'},
  f1:{name:'Free One', created_at:'2026-09-15T04:00:00Z'},
  f2:{name:'Free Two', created_at:'2026-09-14T04:00:00Z'},
  f3:{name:'Free Three', created_at:'2026-09-15T06:00:00Z'},
  t1:{name:'Trainer', isTrainer:true}
};
const FREE={f1:1,f2:1,f3:1};
function _feedWhoPass(c){ return !!FREE[c]; }
const codes=Object.keys(CLIENTS).filter(function(k){
  if(CLIENTS[k].isTrainer) return false;
  try{ return _feedWhoPass(k); }catch(e){ return true; }
});
t(codes.length===3, 'the free roster counts only free people', codes.join(','));
t(codes.indexOf('c1')<0 && codes.indexOf('t1')<0, 'no paying clients, no trainer');
const sorted=codes.slice().sort(function(a,b){
  var ta=new Date((CLIENTS[a]||{}).created_at||0).getTime()||0;
  var tb=new Date((CLIENTS[b]||{}).created_at||0).getTime()||0;
  if(ta!==tb) return tb-ta;
  return (CLIENTS[a].name||a).localeCompare(CLIENTS[b].name||b);
});
t(sorted[0]==='f3' && sorted[2]==='f2', 'newest signup leads the list', sorted.join(','));

// ---- the +4 he asked about ----------------------------------------------
// It is free accounts created TODAY, and it refuses to guess: -1 when
// created_at has not loaded, so it never invents a zero.
const ft=fnAt('_feedFreeToday');
t(/return known \? n : -1;/.test(ft), '+N today says nothing rather than guessing when dates are missing');
t(/_localYmd\(new Date\(r\.created_at\)\)===today/.test(ft), '+N today counts accounts made today');
t(/if\(!isFreeApp\(c\)\) continue;/.test(ft), '...free accounts only');

console.log(bad? ('tfreelist: '+bad+' FAILED') : 'tfreelist: all passed');
process.exit(bad?1:0);
