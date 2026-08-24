const fs=require('fs');
const L=fs.readFileSync('index.html','utf8').split('\n');
function grab(p){ const a=L.findIndex(p); let b=a; while(L[b]!=='}') b++; return L.slice(a,b+1).join('\n'); }
let CLIENTS={};
eval(grab(l=>l.startsWith('function _codeAsStored(')));
let bad=0; const t=(lbl,got,want)=>{ const ok=got===want; if(!ok)bad++; console.log((ok?'  ok    ':'  FAIL  ')+lbl+'  -> '+JSON.stringify(got)+(ok?'':'  (wanted '+JSON.stringify(want)+')')); };

// Roster loaded, codes stored lowercase (how they really are today)
CLIENTS={kellyg1:{}, yusufa1:{}, thegoat:{}};
t('exact match',            _codeAsStored('kellyg1'), 'kellyg1');
t('typed with capitals',    _codeAsStored('KellyG1'), 'kellyg1');
t('all caps',               _codeAsStored('KELLYG1'), 'kellyg1');
t('padded',                 _codeAsStored('  kellyg1 '), 'kellyg1');
t('no such client REFUSES', _codeAsStored('kellyg9'), '');
t('empty in, empty out',    _codeAsStored(''), '');

// Roster where a stored code CARRIES a capital -- the case the bug is about.
CLIENTS={'KellyG1':{}, thegoat:{}};
t('stored capital, typed lower -> AS STORED', _codeAsStored('kellyg1'), 'KellyG1');
t('stored capital, typed exact',              _codeAsStored('KellyG1'), 'KellyG1');
t('stored capital, typed shouty',             _codeAsStored('KELLYG1'), 'KellyG1');

// No roster at all (every client account): unchanged old behaviour, never a refusal.
CLIENTS={};
t('no roster -> old lowercase', _codeAsStored('KellyG1'), 'kellyg1');
console.log(bad? '\n'+bad+' FAILED' : '\nall 10 pass');
process.exit(bad?1:0);
