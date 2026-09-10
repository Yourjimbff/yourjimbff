// WHOEVER ANSWERS FIRST SHOWS; THE LABEL ALWAYS WINS (Yusuf, 10 Sep). And a
// late label never writes over numbers he edited himself.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let bad=0; const t=(p,l)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l); };
t(/var NL_LABEL_MS=20000, NL_TOTAL_MS=35000;/.test(src), 'the label gets 20s, the whole read 35s');
const sub=src.slice(src.indexOf('async function nlSubmit(){'), src.indexOf('function nlEdit(el, f){'));
t(/Promise\.race\(\[_labelLate, _estP\.then/.test(sub), 'label and estimate race; the first to answer shows');
t(/_labelLate\.then\(function\(lab\)\{[\s\S]{0,80}_nlLabelLanded\(st, lab\)/.test(sub), 'an estimate that wins keeps the label reading, and the label lands later');
t(/est\.source='label'/.test(sub) && /est\.source='estimate'/.test(sub), 'the result knows where its numbers came from');
const landed=src.slice(src.indexOf('function _nlLabelLanded(st, lab){'), src.indexOf('function _nlDone(st){'));
t(/if\(window\._nl!==st \|\| st\.stage!=='res'\) return;\s*st\.est=lab; nlRender\(\);/.test(landed), 'still on the result screen: the label replaces the numbers');
t(/sbSelect\('food_logs','id=eq\.'/.test(landed) && /if\(!same\) return;/.test(landed), 'already logged: the row is read first, and corrected ONLY if it still carries the estimate - an edit of his is never touched');
const res=src.slice(src.indexOf("else if(st.stage==='res'){"), src.indexOf("else if(st.stage==='res'){")+2500);
t(/if\(st\.photo\) h\+='<div class="nlPhoto"/.test(res), 'the photo stays above the numbers');
t(/From the label/.test(res) && /Estimated from the photo - still reading the label/.test(res), 'and the screen says label or estimate');
const done=src.slice(src.indexOf('function _nlDone(st){'), src.indexOf('async function nlSubmit(){'));
t(/nlDoneRing/.test(done) && /setTimeout\(function\(\)\{ try\{ if\(window\._nl===st\) nlClose\(\); \}catch\(e\)\{\} \}, 950\);/.test(done), 'a gold check draws and the sheet closes itself');
t((src.match(/_nlDone\(st\);/g)||[]).length===2, 'both log roads (fast and confirm) go out through it');
t(/NUTRITION SOLUTIONS meal sleeve/.test(src) && /FIVE small yellow circles/.test(src), 'the label reader knows the Nutrition Solutions sleeve by shape');
console.log(bad?'\n  '+bad+' FAILED':'\n  all label-race assertions pass');
process.exit(bad?1:0);
