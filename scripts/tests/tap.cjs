// _apTitleFrom end to end, with its real dependencies pulled out of the file.
const fs=require('fs');
const L=fs.readFileSync('index.html','utf8').split('\n');
function grab(startPred){ const a=L.findIndex(startPred); let b=a; while(L[b]!=='}') b++; return L.slice(a,b+1).join('\n'); }
function line(pred){ return L[L.findIndex(pred)]; }
const parts=[
  line(l=>l.startsWith('var _JV_BOOK_RE=')),
  line(l=>l.startsWith('var _AP_WORD_RE=')),
  grab(l=>l.startsWith('function _jvNormAmPm(')),
  grab(l=>l.startsWith('function _titleCap(')),
  grab(l=>l.startsWith('function _apTitleFrom('))
].join('\n');
eval(parts);
const C=[
  ['dentist at 2 thursday','Dentist'],
  ['put a haircut on my calendar friday at 3pm','Haircut'],
  ['schedule a physical therapy session tomorrow at 9am','Physical Therapy Session'],
  ['book car service monday at 8am','Car Service']
];
let bad=0;
C.forEach(function(c){ const g=_apTitleFrom(c[0]); const ok=(g===c[1]); if(!ok) bad++;
  console.log((ok?'  ok    ':'  FAIL  ')+JSON.stringify(c[0])+' -> '+JSON.stringify(g)+(ok?'':'  (wanted '+JSON.stringify(c[1])+')')); });
console.log(bad? '\n'+bad+' differ (inspect above)' : '\nall '+C.length+' pass');
