// The failure classifier and the word-restore contract, lifted from jimSend.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const i=src.indexOf('var _net=_off || /');
const line=src.slice(i, src.indexOf('\n', i)).trim();
const re=eval(line.replace('var _net=_off || ','').replace('.test(_msg);',''));
const NET=['Failed to fetch','NetworkError when attempting to fetch resource.','Load failed',
  'The operation was aborted.','signal is aborted without reason','TimeoutError: The operation timed out'];
const OTHER=['Empty reply','Unexpected token < in JSON at position 0','x is not a function'];
let bad=0;
console.log('  a dropped connection must be NAMED as one:');
NET.forEach(function(m){ const ok=re.test(m); if(!ok) bad++; console.log('   '+(ok?'ok    ':'FAIL  ')+JSON.stringify(m)); });
console.log('  and a real fault must not be blamed on the network:');
OTHER.forEach(function(m){ const ok=!re.test(m); if(!ok) bad++; console.log('   '+(ok?'ok    ':'FAIL  ')+JSON.stringify(m)); });
// The restore must be unconditional on a non-empty raw.
const body=src.slice(src.indexOf('AND ONLY NOW, HIS WORDS'), src.indexOf('try{ clearTimeout(_sendWait); }catch(_e){}\n  var aMsg'));
const restores=/_back\.value=raw;/.test(body) && /_back\.focus\(\)/.test(body) && /jimReady\(ds\)/.test(body) && /draftSave\('bar', raw\)/.test(body);
if(!restores) bad++;
console.log('\n  '+(restores?'ok    ':'FAIL  ')+'the catch puts his text back, the DRAFT back, refocuses, re-arms send');
const ceiling=/signal:_sbTimeout\(45000\)/.test(src);
if(!ceiling) bad++;
console.log('  '+(ceiling?'ok    ':'FAIL  ')+'the model call has a ceiling instead of hanging forever');
const waits=/jimEchoWait">Logging/.test(src);
if(!waits) bad++;
console.log('  '+(waits?'ok    ':'FAIL  ')+'past 1.5s the bar says it is trying');
console.log(bad? '\n'+bad+' FAILED' : '\nall pass');
process.exit(bad?1:0);
