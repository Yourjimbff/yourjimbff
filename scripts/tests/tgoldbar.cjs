// THE GOLD BAR (Yusuf, order, 27 Aug — before the recording).
//
// P1 THE REFRESH. He logged through the gold bar, Jim said "added to
// yesterday", the row really was there, and the Day view did not change until a
// hard refresh. A save nobody can see reads as a save that did not happen, and
// a client has already reported that as the app "being wrong".
//
// The cause was two renderers. The chat log refreshed rendTodayFood, the old
// food list. The DAY VIEW is renderDayTimeline off window._tlCache, and nothing
// in the chat path ever invalidated it. The back-dated branch did try, but only
// when the day on screen happened to BE the target day — which it is not, since
// he is looking at today when he says "yesterday".
//
// P4 THE ROW. Mic far left, then the field, then camera, then send, with the
// send holding its place so nothing moves when he starts typing.
const fs=require('fs');
const guard=require('./_guard.cjs');
const src=fs.readFileSync('index.html','utf8');
const L=src.split('\n');
function fn(n){ const a=L.findIndex(l=>l.indexOf('async function '+n+'(')===0); if(a<0) return '';
  let b=a; while(b<L.length && L[b]!=='}') b++; return L.slice(a,b+1).join('\n'); }
function plain(n){ const a=L.findIndex(l=>l.indexOf('function '+n+'(')===0); if(a<0) return '';
  let b=a; while(b<L.length && L[b]!=='}') b++; return L.slice(a,b+1).join('\n'); }
let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };

const chat=fn('logFoodFromChat');
guard(['logFoodFromChat'], ()=>chat||undefined);

console.log('\n  P1 — A LOGGED MEAL SHOWS UP ON THE DAY HE IS LOOKING AT:');
t(/_tlRefreshDay\(_targetDate\)/.test(chat), 'the chat log refreshes the day it wrote to');
t(/typeof _tlRefreshDay==='function'/.test(chat), 'guarded, so a missing helper cannot break a log');

// The call must sit ABOVE the back-dated early return, or a backfill never
// reaches it — which is the exact case he reported.
const iCall=chat.indexOf('_tlRefreshDay(_targetDate)');
const iBackdated=chat.indexOf('if(_daysAgo>0){');
const iOther=chat.indexOf('if(_forOther){');
t(iCall>-1 && iBackdated>-1 && iCall<iBackdated, 'it runs BEFORE the back-dated early return, so a backfill reaches it');
t(iCall>-1 && iOther>-1 && iCall>iOther, 'and after the other-client return, so his screen is not repainted for their row');

t(!/await\s+_tlRefreshDay/.test(chat), 'it is NOT awaited — it can never delay or fail a log');
t(/Promise\.resolve\(_tlRefreshDay\(_targetDate\)\)\.catch\(/.test(chat), 'and it swallows its own errors');

console.log('\n  and it uses the seam every other write on that page already uses:');
const refresh=fn('_tlRefreshDay');
t(!!refresh, '_tlRefreshDay still exists');
t(/_tlCacheMerge/.test(refresh), 'it merges fresh server rows into the day cache');
t(/_tlPatchDay\(ds\)/.test(refresh), 'and repaints just that one day');
t(/freshEmpty && hadRows/.test(refresh), 'and keeps what is on screen when the read comes back empty');

console.log('\n  THE SACRED PATH IS UNTOUCHED:');
t(/logFoodFromChat/.test(src) && /insertFoodLog|_ins\s*=/.test(chat), 'the write itself is still the write');
t(chat.indexOf('_tlRefreshDay')>chat.indexOf('if(!_ins || !_ins.ok) return false'),
  'nothing refreshes until the insert has been verified');

console.log('\n  P4 — THE EXPANDED BAR ROW IS LAID OUT ON PURPOSE:');
const bar=plain('jimBarHtml');
t(/class="jimIcon jimMicBtn"/.test(bar), 'the mic has a name of its own');
t(/class="jimIcon jimCamBtn"/.test(bar), 'and so does the camera');
const cssAt=s=>{ const i=src.indexOf(s); return i<0?'':src.slice(i, src.indexOf('}', i)+1); };
t(/order:2/.test(cssAt('.tlJimFoot .jimMicBtn{')), 'the mic is first in the row');
t(/order:3/.test(cssAt('.tlJimFoot .jimCamBtn{')) && /margin-left:auto/.test(cssAt('.tlJimFoot .jimCamBtn{')),
  'the camera is pushed to the right');
const send=cssAt('.tlJimFoot .jimSend{');
t(/order:4/.test(send), 'and the send is last, on the far right');
t(/visibility:hidden/.test(send) && /pointer-events:none/.test(send),
  'the send holds its place while it is not ready');
t(/\.tlJimFoot \.jimBar\.ready \.jimSend\{ visibility:visible; pointer-events:auto; \}/.test(src),
  'and becomes visible AND tappable together — no dead tap zone');
t(!/order:3;\s*\n\s*margin-left:auto;/.test(send), 'the old send-pushes-itself-right rule is gone');

console.log('\n  and the collapsed dock is not touched by any of it:');
t(!/jimMicBtn|jimCamBtn/.test(cssAt('#tlJimDock .jimIcon{')), 'the dock keeps its own single-row treatment');

console.log('\n'+(bad?(bad+' FAILED'):'all pass'));
process.exit(bad?1:0);
