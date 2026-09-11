// THE DEMONSTRATIONS (Yusuf, 11 Sep: "import it into my app fully, i only want
// 3d model, no person ... upload it against my entire exercise library, exact
// matches preferably"). Every demo is checked against EX_LIB by name, because
// a demo filed under a name the library does not have is a picture nobody will
// ever see, and a name spelled differently is a picture on the wrong movement.
const fs=require('fs'), vm=require('vm');
const src=fs.readFileSync('index.html','utf8');
let bad=0; const t=(p,l)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l); };

const ctx={String,Object,Math,Array,JSON,window:{},document:{addEventListener(){}},
  SB_URL:'https://sb.test', SB_BUCKET:'progress-photos',
  _escHtml:(x)=>String(x==null?'':x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'),
  _pgLastWeight:()=>'', _fdShow:(h,l,c)=>{ ctx.window.__sheet={h:h,label:l,cls:c}; return true; }};
vm.createContext(ctx);
const a=src.indexOf('var EX_LIB = {'), b=src.indexOf('var DAY_TYPES=');
vm.runInContext(src.slice(a,b), ctx);
const f=src.indexOf('function _exFind(name){');
vm.runInContext(src.slice(f, src.indexOf('\n}', f)+2), ctx);
const EX_LIB=vm.runInContext('EX_LIB', ctx), EX_DEMO=vm.runInContext('EX_DEMO', ctx);

const names=[]; Object.keys(EX_LIB).forEach(k=>EX_LIB[k].forEach(x=>names.push(x.n)));
t(names.length===49, 'the library is 49 movements', String(names.length));
const demoNames=Object.keys(EX_DEMO);
t(demoNames.length===38, '38 of the 49 have a demo, and the other 11 are the shot list', String(demoNames.length));

const orphans=demoNames.filter(n=>names.indexOf(n)<0);
t(orphans.length===0, 'EVERY demo is filed under a name the library actually has', orphans.join(', '));

const slugs={}, dupes=[];
demoNames.forEach(n=>{ const s=EX_DEMO[n].split('|')[0]; if(slugs[s]) dupes.push(s); slugs[s]=n; });
t(dupes.length===0, 'no two movements point at the same picture', dupes.join(', '));
t(demoNames.every(n=>/^[a-z0-9-]+\|(jpg|gif)\|.+$/.test(EX_DEMO[n])), 'every entry reads slug|ext|author');
t(demoNames.every(n=>EX_DEMO[n].split('|')[0]===n.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')),
  'and the slug is the movement name, so a file can be found from the app and the other way round');

const d=vm.runInContext("_exDemo('Lateral Raises')", ctx);
t(d.img==='https://sb.test/storage/v1/object/public/progress-photos/_exercise/lateral-raises.jpg', 'the picture is served from the app own storage, not from wger', d.img);
t(d.thumb==='https://sb.test/storage/v1/object/public/progress-photos/_exercise/t/lateral-raises.jpg', 'lists load the small copy');
const g=vm.runInContext("_exDemo('Overhead Tricep Extension')", ctx);
t(g.ext==='gif' && g.thumb===g.img, 'the one that moves is a gif, and it is not shrunk into a still');
t(vm.runInContext("_exDemo('lateral raises')", ctx)!==null, 'a name typed in any case still finds its demo');
t(vm.runInContext("_exDemo('Preacher Curls')", ctx)===null && vm.runInContext("_exDemoThumb('Preacher Curls')", ctx)==='',
  'a movement with no demo draws nothing - never an empty box');

t(vm.runInContext("_exDemoOpen('Squat')", ctx)===true, 'tapping one opens the sheet');
const sh=ctx.window.__sheet;
t(/\bmid\b/.test(sh.cls), 'it floats in the middle, like the weight sheet');
t(/exDemoT">Squat</.test(sh.h) && /exDemoEy">Legs</.test(sh.h), 'titled with the movement and the muscle group it lives under');
t(/exChip">4 × 8</.test(sh.h), "and it carries Yusuf's own prescription, not the database's");
t(/exDemoV">Barbell ideal</.test(sh.h), 'his note on which variation counts rides with it');
t(/exDemoCr">Demo: Workout Guru · wger · CC BY-SA</.test(sh.h), 'the picture is credited to whoever drew it, by name, with the licence');
t(!/@/.test(JSON.stringify(EX_DEMO)), 'nobody\'s email address is printed on a client\'s screen');
t(/onclick="_exDemoOpen\(/.test(src) && /class="pgLibRow hasDemo"/.test(src), 'the library row is the door');
t((src.match(/\+_exDemoThumb\(x\.n\)/g)||[]).length===2, 'the swap picker and the add picker show the picture too');
console.log(bad?('\n  '+bad+' FAILED'):'\n  all demo assertions pass');
process.exit(bad?1:0);
