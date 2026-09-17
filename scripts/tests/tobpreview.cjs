// "Let me know when you push the feedback opt in so i can see it on my screen as
// well (thegoat)." (Yusuf, 16 Sep.)
//
// He could not. _obShouldRun refuses a trainer outright and refuses anyone whose
// setup is done, so the one screen every new signup meets is the one screen the
// person who designed it has never been able to look at. Wiping his own profile
// to see it is not an option.
const fs=require('fs');
const guard=require('./_guard.cjs');
const {defOf}=require('./_lift.cjs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };

let started=null, toast='', closed=0, stored=null;
global.window={};
global.obStart=(force,row)=>{ started={force:force,row:row}; };
global.showToast=m=>{ toast=String(m); };
global.closeM=()=>{};
global.obClose=()=>{ closed++; };
global.localStorage={setItem:(k,v)=>{ stored=v; },getItem:()=>null};
global._ob={a:{x:1}};
global._obSetupKey=()=>'k';
global.isTrainer=c=>c==='thegoat';
global.cl={code:'thegoat'};
eval(defOf('obPreview'));
eval(defOf('_obSetupStash'));
guard(['obPreview','_obSetupStash'], n=>eval(n));

console.log('\n  HE CAN OPEN HIS OWN FRONT DOOR:');
t(obPreview()===true, 'the trainer can open it');
t(window._obPreview===true, '  and it is flagged as a preview');
t(started && started.force===1, '  forced, so the usual refusals do not apply', JSON.stringify(started));
t(started && started.row===null, '  with no server row, which is what a new signup looks like');
t(/onclick="obPreview\(\)"/.test(src), 'and there is a door for it');
t(/Preview setup</.test(src), '  labelled plainly');
/* IT WAS IN THE WRONG ROOM FIRST. The Calls box is headed "who can book you,
   and when you're available" - he went looking in Settings, which is where
   anyone would, and reported he could not see it. */
const callsBox=src.slice(src.indexOf('id="manageClientsBox"'), src.indexOf('id="manageClientsBox"')+2600);
t(!/onclick="obPreview\(\)"/.test(callsBox), 'and it is NOT in the Calls box, which is about being booked');
t(/_gpPreviewRow\(\)/.test(src), 'it sits in Settings, on the Account card');
global.cl={code:'thegoat'};
eval(defOf('_gpPreviewRow'));
global._escHtml=x=>String(x);
t(/Preview setup/.test(_gpPreviewRow()), '  where the trainer sees it');
t(/Nothing is saved/.test(_gpPreviewRow()), '  told plainly that it writes nothing');
global.cl={code:'alim1'};
t(_gpPreviewRow()==='', 'and a client gets no row at all, not a dead one');

console.log('\n  AND NOBODY ELSE CAN:');
window._obPreview=false; started=null; toast='';
global.cl={code:'alim1'};
t(obPreview()===false, 'a client cannot');
t(started===null, '  and nothing opens');
t(/Trainer only/.test(toast), '  and it says why', toast);
t(window._obPreview===false, '  and no flag is left behind');
global.cl=null;
t(obPreview()===false, 'and it refuses cleanly with nobody signed in');

console.log('\n  A PREVIEW THAT SAVES IS NOT A PREVIEW:');
t(/if\(window\._obPreview===true\)\{\n    try\{ showToast\('Preview only/.test(src),
  'obFinish refuses to write while the flag is up');
t(/Preview only \\u2014 nothing was saved/.test(src), '  and says so in as many words');
t(/Refusing here rather\n     than at the button/.test(src),
  'and it refuses at the LAST tap, so every screen behaves exactly as it really does');

console.log('\n  HIS OWN SAVED ANSWERS ARE NOT TOUCHED:');
window._obPreview=true; stored=null;
_obSetupStash();
t(stored===null, 'tapping through a preview stashes nothing');
window._obPreview=false;
_obSetupStash();
t(stored!==null, '  while a real run still stashes normally');

console.log('\n  AND THE FLAG CANNOT SURVIVE INTO A REAL RUN:');
t(/function obClose\(\)\{\n  try\{ window\._obPreview=false; \}catch\(e\)\{\}/.test(src),
  'closing the overlay clears it');

console.log(bad?('\n  '+bad+' FAILED'):'\n  all good (he can finally look at it)');
process.exit(bad?1:0);
