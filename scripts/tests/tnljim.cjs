/* JIM'S READ WAS ON THE WRONG SCREEN (17 Sep, and this is the actual answer).
   Yusuf opted in, logged a meal, saw nothing. Three things were checked off the
   server before anything was written here: his row said jim_optin=true, tone 3;
   his meal said cal=312 p=20 c=40 f=8; and its insight was zero characters long.

   The reason is not the opt-in and not truncation. The coaching engine - the ten
   logs, the tone, the direction taken off their two weights - has always lived on
   the OLD meal box. The door people log on is the nl sheet, and _NL_SYS asks that
   one for a "tidbit": a food fact or a compliment, explicitly instructed never to
   mention what is missing. Nice line. Not the product. There was no insight field
   on that path at all, so there was nothing for _jimCardHtml to draw and an empty
   card draws as no card. */
const fs=require('fs'), path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','..','index.html'),'utf8');
let fails=0;
const ok=(c,m)=>{ console.log((c?'  ok   ':'  FAIL ')+m); if(!c) fails++; };
function slice(a,b){
  const i=src.indexOf(a); if(i<0) throw new Error('tnljim: start anchor missing: '+a);
  const j=src.indexOf(b,i); if(j<0) throw new Error('tnljim: end anchor missing after start: '+b);
  return src.slice(i,j);
}
console.log('\ntnljim - the read on the door people use');

// ---- the card has a home on the result screen, and it is gated
const res=slice("else if(st.stage==='res'){","sh.innerHTML=h;");
ok(/id="nlJim"/.test(res), 'the result screen has somewhere for the read to go');
ok(/_jimOptedIn\(\)\?_jimCardHtml\(/.test(res), 'and it is empty for anyone who did not opt in');
ok(res.indexOf('id="nlJim"') < res.indexOf('id="nlGoBtn"'), 'the read is above Log it, not after it');
ok(/e\.tidbit/.test(res), 'the tidbit is still there - the read is added, nothing was taken away');

// ---- the fast road no longer carries a paying person past that screen
const sub=slice('async function nlSubmit(){',"st.stage='busy';");
ok(/if\(line && !_jimOptedIn\(\) && \(_nlStated\(line\) \|\| \(!st\.photo && _nlFastOn\(\)\)\)\)\{/.test(sub),
   'free logging keeps the instant road; opting in buys the look at it');

// ---- the read itself
const jr=slice('async function _nlJimRead(st){','// One macro, edited on the confirm screen');
ok(/if\(!st \|\| !st\.est \|\| !_jimOptedIn\(\)\) return false;/.test(jr), 'nobody who did not opt in pays for it');
ok(/if\(String\(e\.insight\|\|''\)\.trim\(\)\) return false;/.test(jr), 'a meal that already has words is left alone');
ok(/if\(seq!==_nlJimSeq\) return false;/.test(jr), 'a stale read never lands on a newer meal');
ok(/if\(window\._nl!==st\) return false;/.test(jr), 'and never on a sheet that has closed under it');
ok(/_jimTenLogs\(\)/.test(jr) && /_jimToneBlock\(\)/.test(jr) && /_jimGoalLine\(\)/.test(jr),
   'one voice: the same ten logs, tone and goal direction as every other read');
ok(/could not read that one just now/.test(jr), 'a failed read says so rather than leaving an empty card');
ok(/st\.est\.insight=out;/.test(jr), 'the words are put on the estimate BEFORE Log it');
ok(!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u.test(jr), 'no emoji (house law)');

// ---- and it is fired, and the row keeps what they read
ok(/st\.est=est; st\.stage='res'; nlRender\(\);\s*\n\s*\/\/[^\n]*\n\s*try\{ if\(_jimOptedIn\(\)\) _nlJimRead\(st\); \}catch\(e\)\{\}/.test(src),
   'it fires the moment the numbers are on screen');
// Anchored on the comment that is unique to THIS writer: there are two
// logFoodFromChat calls in nlConfirm and the first one is the fast road.
const wr=slice('/* _priced is the whole point','}, st.photo||null);');
ok(/insight:\(st\.est\.insight\|\|''\)/.test(wr), 'the row saves the words they actually read');

console.log(fails?('\n  '+fails+' FAILED\n'):'\n  all passed\n');
process.exit(fails?1:0);
