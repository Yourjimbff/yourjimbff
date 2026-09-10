// WHAT HE DELETES STAYS DELETED (Yusuf, 10 Sep). A dictation box that he
// edits while the mic is running keeps his edit; the mic carries on from the
// box as it is, and the phrase it was mid-way through at the cut never lands.
const fs=require('fs'), vm=require('vm');
const src=fs.readFileSync('index.html','utf8');
let bad=0; const t=(p,l)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l); };
const a=src.indexOf('function _micTakeEdits(st, box, ev){'), b=src.indexOf('function jarvisVoiceToggle(ns){');
const ctx={}; vm.createContext(ctx); vm.runInContext(src.slice(a,b), ctx);
const take=(st,box,ev)=>vm.runInContext('_micTakeEdits', ctx)(st,box,ev);
function ev(resultIndex, results){ return {resultIndex, results:results.map(([tx,fin])=>Object.assign([{transcript:tx}],{isFinal:fin}))}; }
// the mic as the code drives it: base + finals, box = base + interim
function drive(st, box, e){ const r=take(st,box,e); if(r.f) st.base+=r.f; box.value=(st.base+r.it).trim(); st.wrote=box.value; }
let st={base:'', wrote:'', drop:{}, live:[]}, box={value:''};
drive(st, box, ev(0, [['I did three sets', false]]));
t(box.value==='I did three sets', 'interim shows as he speaks');
drive(st, box, ev(0, [['I did reset', true]]));
t(box.value==='I did reset', 'the final lands, wrong word and all');
box.value='';                                  // he deletes it while the mic runs
drive(st, box, ev(1, [['I did reset', true],['incline', false]]));
t(box.value==='incline', 'he deleted it, so it stays deleted and the next words start clean  -> "'+box.value+'"');
drive(st, box, ev(1, [['I did reset', true],['incline press three sets', true]]));
t(box.value==='incline press three sets', 'and the sentence finishes from there');
// cut in the middle of a phrase still being recognised
st={base:'', wrote:'', drop:{}, live:[]}; box={value:''};
drive(st, box, ev(0, [['I did reset', false]]));
box.value='';
drive(st, box, ev(0, [['I did reset incline', false]]));
t(box.value==='', 'a phrase cut mid-recognition does not creep back  -> "'+box.value+'"');
drive(st, box, ev(0, [['I did reset incline', true]]));
t(box.value==='', 'nor when that phrase finalises');
drive(st, box, ev(1, [['I did reset incline', true],['three sets of incline', false]]));
t(box.value==='three sets of incline', 'the next phrase is the first thing in the box');
// he types a correction by hand
st={base:'', wrote:'', drop:{}, live:[]}; box={value:''};
drive(st, box, ev(0, [['bench press', true]]));
box.value='bench press 3 sets';
drive(st, box, ev(1, [['bench press', true],['at 185', false]]));
t(box.value==='bench press 3 sets at 185', 'a hand-typed correction is kept and dictation continues after it');
// every mic that rewrites its box takes the same door
const jr=src.slice(src.indexOf('jarvisRec.onresult=function(e){'), src.indexOf('jarvisRec.onerror=function(ev){'));
t(/_micTakeEdits\(jarvisRec\._st, box, e\)/.test(jr) && /jarvisRec\._wrote=box\.value/.test(jr), 'the shared Jarvis recogniser (Creative mode, Feed, moments) keeps his edits');
t(/_micTakeEdits\(_slogSt/.test(src), 'the session log mic too');
t(/_micTakeEdits\(entryRecognition\._st\|\|/.test(src) || /var st=entryRecognition\._st/.test(src), 'the entry mic too');
t(/var st=foodRecognition\._st/.test(src), 'the food mic too');
console.log(bad?'\n  '+bad+' FAILED':'\n  all mic-edit assertions pass');
process.exit(bad?1:0);
