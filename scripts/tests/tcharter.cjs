// The charter is one shared machine: prove it still builds and reads.
const fs=require('fs');
const L=fs.readFileSync('index.html','utf8').split('\n');
const a=L.findIndex(l=>l.startsWith('var JARVIS_CHARTER = ['));
let b=a; while(!L[b].startsWith("].join('\\n');")) b++;
const JARVIS_CHARTER = eval(L.slice(a,b+1).join('\n').replace('var JARVIS_CHARTER = ',''));
const must=['=== JARVIS CHARTER v1 ===','1. EAGER','3. A REPLY IS NOT A WRITE','5. NEVER INVENT','5b. NEVER STATE A FACT HE DID NOT GIVE YOU','6. SELF','10. THE ATTORNEY','=== END CHARTER ==='];
let bad=0;
must.forEach(function(m){ const ok=JARVIS_CHARTER.indexOf(m)>=0; if(!ok) bad++; console.log((ok?'  ok    ':'  MISSING ')+m); });
if(/\\u201|\\u2014/.test(JARVIS_CHARTER)){ console.log('  FAIL  raw \\u escapes leaked into the text'); bad++; }
console.log('\n  charter chars: '+JARVIS_CHARTER.length);
console.log('  rule 5b reads: '+(JARVIS_CHARTER.split('\n').find(l=>l.startsWith('5b.'))||'').slice(0,120)+'…');
console.log(bad? '\nFAIL' : '\nall '+must.length+' present, no escape leakage');
process.exit(bad?1:0);
