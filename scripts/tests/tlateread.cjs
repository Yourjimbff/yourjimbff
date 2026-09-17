/* WHY HIS PANCAKES CAME BACK WITH NUMBERS AND NO WORDS (17 Sep).
   Read off the server, not guessed: his row was cal=312 p=20 c=40 f=8,
   rating='unknown', insight length 0. The macros were fine. The coaching was
   missing - which renders as no card at all, because _jimCardHtml returns ''
   on an empty body by design.
   The meal JSON asks for an items array (one row per food, eight fields each)
   BEFORE it ever reaches rating and insight, and the call was capped at 1200
   tokens with nothing reading stop_reason. Run out of room and those two are
   exactly what goes; _salvageJson then closes the object and the log lands
   looking complete. */
const fs=require('fs'), path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','..','index.html'),'utf8');
let fails=0;
const ok=(c,m)=>{ console.log((c?'  ok   ':'  FAIL ')+m); if(!c) fails++; };
function slice(a,b){
  const i=src.indexOf(a); if(i<0) throw new Error('tlateread: start anchor missing: '+a);
  const j=src.indexOf(b,i); if(j<0) throw new Error('tlateread: end anchor missing after start: '+b);
  return src.slice(i,j);
}
console.log('\ntlateread - numbers without words');

// ---- the answer gets room to finish
const call=slice("var curParsed=null, _lastErr=null;","curResult=curParsed;");
ok(/max_tokens:2600/.test(call), 'the meal call has room for an items array AND the coaching');
ok(!/max_tokens:1200/.test(call), 'the old 1200 cap is gone from this call');

// ---- and a truncation is read from the API rather than guessed at
ok(/data && data\.stop_reason==='max_tokens'/.test(call), 'stop_reason is actually read on this path');
ok(/_hasMacros && !\(_cut && _try===0\)/.test(call), 'a cut-off first answer is retried before it is accepted');

// ---- the two fields he pays for are no longer last in the queue
const j=slice('Return ONLY valid JSON:','ITEMS ARRAY (required)');
const iR=j.indexOf('"rating"'), iI=j.indexOf('"insight"'), iS=j.indexOf('"sugar"'), iC=j.indexOf('"caffeine"');
ok(iR>0&&iI>0&&iS>0&&iC>0, 'all four fields are still asked for');
ok(iR<iS && iI<iS, 'rating and insight come before sugar, so sugar truncates first');
ok(iR<iC && iI<iC, 'and before caffeine');

// ---- the belt and braces: priced plate, no words, opted in -> ask again
const late=slice('async function _jimLateRead(r){','/* ===== THE RECAP BEFORE IT LANDS =');
ok(/if\(!r \|\| !_jimOptedIn\(\)\) return false;/.test(late), 'nobody who did not opt in pays for this read');
ok(/if\(!has\) return false;/.test(late), 'a plate with no numbers is not read - there is nothing to read');
ok(/if\(String\(r\.insight\|\|''\)\.trim\(\)\) return false;/.test(late), 'a meal that already has words is left alone');
ok(/if\(curResult!==r\) return false;/.test(late), 'a stale answer never paints over a screen that moved on');
ok(/_jimTenLogs\(\)/.test(late) && /_jimToneBlock\(\)/.test(late) && /_jimGoalLine\(\)/.test(late),
   'it reads under the same rules as every other read - not a second voice');
ok(!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u.test(late), 'no emoji (house law)');

// ---- and it is actually wired in, which is the half that gets forgotten
const wire=slice('window._jimBase=_jimSnap(curResult);','curResult.items');
ok(/_jimOptedIn\(\) && !window\._jimFirstRead\) _jimLateRead\(curResult\)/.test(wire),
   'it fires from the one place that knows the first answer said nothing');

console.log(fails?('\n  '+fails+' FAILED\n'):'\n  all passed\n');
process.exit(fails?1:0);
