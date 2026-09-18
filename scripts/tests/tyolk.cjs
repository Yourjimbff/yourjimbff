/* THE WHITE AND THE YOLK ARE TWO FOODS (Yusuf, 18 Sep).

   "We should be able to do math for the clients if they write six egg whites,
   one egg yolk, three egg whites, one egg yolk, two egg whites, one egg yolk,
   and have different ratios of the protein, fat, and calories depending on it.
   My guess is that taking the yolk out of a six gram of protein, six gram of
   fat egg takes out almost all the fat. So I believe egg whites is like pure
   protein."

   He is right, and the table already half knew it - the white row has carried
   3.6P and ZERO fat since it was written. The missing half was the yolk. It had
   no row, so _mtRow found the word "egg" inside "egg yolk", and the echo's own
   gate then refused that row because "yolk" changes what the food is. Correct
   refusal, wrong outcome: every yolk anybody ever logged went to the model.

   USDA, egg yolk, raw, fresh, one large (17g): 2.7P / 4.5F / 0.6C / 55 cal. */
const fs=require('fs'), path=require('path');
const root=path.join(__dirname,'..','..');
process.chdir(root);
const {closure}=require('./_lift.cjs');
let fails=0;
const ok=(c,m,x)=>{ console.log((c?'  ok   ':'  FAIL ')+m+(x!==undefined?('  '+JSON.stringify(x)):'')); if(!c) fails++; };

console.log('\ntyolk - the fat is in the yolk, and the app can now say so');

const lifted=closure(['_nlEcho','_mtRow','_mtItem']);
/* _nlSameFood declares `var keys=[], _seen={}`; the lifter registers only the
   first name in a multi-declarator var. */
const holes=lifted.unresolved.filter(n=>n!=='_seen');
ok(holes.length===0, 'it lifts with nothing missing', holes);
const F=new Function('var window={};'+lifted.code+'\nreturn {_nlEcho,_mtRow,_mtItem,MT_ROWS};')();
const echo=t=>F._nlEcho(t);
const one=t=>{ const e=echo(t); return e.lines[0]; };

// ------------------------------------------------------------- THE ROWS EXIST
const white=F.MT_ROWS.filter(r=>r.k==='egg white')[0];
const yolk =F.MT_ROWS.filter(r=>r.k==='egg yolk')[0];
const whole=F.MT_ROWS.filter(r=>r.k==='egg')[0];
ok(!!yolk, 'the yolk has a row of its own');
ok(white.f===0, 'and the white is exactly what he said it was: no fat at all', white.f);
ok(yolk.f>4 && yolk.p<3, 'the yolk carries the fat and barely any protein', {p:yolk.p,f:yolk.f});

/* THE TWO HALVES MUST ADD UP TO THE WHOLE, or the app contradicts itself the
   moment somebody logs the same breakfast two different ways. */
const calOf=r=>Math.round(r.p)*4+Math.round(r.c)*4+Math.round(r.f)*9;
const partsCal=(white.p+yolk.p)*4+(white.c+yolk.c)*4+(white.f+yolk.f)*9;
const wholeCal=whole.p*4+whole.c*4+whole.f*9;
ok(Math.abs(partsCal-wholeCal)/wholeCal < 0.05,
   'a white plus a yolk is a whole egg, within five percent',
   {parts:Math.round(partsCal), whole:Math.round(wholeCal)});
ok(Math.abs((white.p+yolk.p)-whole.p) < 0.5, 'and the protein lines up too',
   {parts:white.p+yolk.p, whole:whole.p});

// --------------------------------------------------- "1 EGG YOLK" IS PRICED
const y=one('1 egg yolk');
ok(y && y.known, 'a yolk is priced by the table now instead of going to the model');
ok(y && y.row && y.row.k==='egg yolk', 'and it is priced as a yolk, not as a whole egg', y&&y.row&&y.row.k);
['egg yolk','egg yolks','2 yolks','yolk'].forEach(t=>{
  const r=F._mtRow(t.replace(/^\d+\s*/,''));
  ok(r && r.k==='egg yolk', 'resolves: '+t, r&&r.k);
});
ok(F._mtRow('egg white').k==='egg white', 'and the white still resolves to the white');
ok(F._mtRow('egg').k==='egg', 'and a plain egg is still a whole egg');

// ----------------------------------------------------------- HIS OWN EXAMPLE
const e=echo('six egg whites, one egg yolk, three egg whites, one egg yolk, two egg whites, one egg yolk');
ok(e.lines.length===6, 'his six fragments come back as six lines', e.lines.length);
ok(e.lines.every(L=>L.known), 'and the table prices every one of them',
   e.lines.filter(L=>!L.known).map(L=>L.said));
/* 11 whites and 3 yolks. The point of the whole request: the fat is the yolks
   and nothing else, and the client never has to work that out. */
ok(e.total.protein>=47 && e.total.protein<=50, 'eleven whites and three yolks come to about 48g of protein', e.total.protein);
ok(e.total.fat>=12 && e.total.fat<=15, 'and about 14g of fat, all of it from the three yolks', e.total.fat);

/* THE COMPARISON THAT MAKES THE FEATURE WORTH HAVING. The same fourteen eggs
   logged whole would have been a different meal entirely. */
const asWhole=one('14 eggs');
ok(asWhole.fat - e.total.fat > 45,
   'logged as fourteen whole eggs it would have been more than 45g more fat',
   {whites_and_yolks:e.total.fat, whole:asWhole.fat});

// ---------------------------------------------------- AND WITHOUT THE COMMAS
const nc=echo('6 egg whites 1 egg yolk');
ok(nc.lines.length===2, 'the same plate with no commas in it still comes apart', nc.lines.map(L=>L.said));
ok(nc.total.fat>=4 && nc.total.fat<=5, 'and the fat is one yolk of it', nc.total.fat);

console.log(fails? ('\n  '+fails+' FAILED\n') : '\n  all good\n');
process.exit(fails?1:0);
