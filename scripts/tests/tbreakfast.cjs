// BREAKFAST HAD NO STARCH.
//
// Yusuf, 13 Sep, after the builder audit: "the egg assumption at breakfast and
// the overall click count." The assumption turned out to be a symptom, and the
// cause was findable by walking the door rather than reading it:
//
//   THE ONLY CARBOHYDRATE THE ENTIRE BREAKFAST TREE COULD REACH WAS OATS.
//
// Every branch -- Meaty, Sweet, Well-rounded, the omelette -- ended protein,
// greens, fruit. No potatoes. No bread. No rice. So eggs with greens and a
// side of berries was very nearly the only complete thing breakfast could
// make, and his own Breakfast 1 (three eggs, a handful of potatoes, a handful
// of peppers) could not be built through the door at all.
//
// HIS STANDARD, VERBATIM: "creating these meals should take no more than as
// many clicks as it is to simply select the protein source, the vegetable
// source, and the carb source."
//
// So this suite walks the door the way mbManyOptions and _mbCommit will, and
// counts screens. Named foods are checked against the SHELF's spelling, not
// against a wish -- a pick nobody can resolve is silently dropped at runtime,
// which is exactly how a door goes quietly empty.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };

// ---- lift the door itself, not a regex of it ----
// A DEPTH COUNTER, NOT A LINE PATTERN. _MB_BF_CARB ends `], next:null};` and
// _MB_SIDE ends `\n};`, so any "scan to a line that starts with };" rule reads
// straight past one of them and swallows whatever follows -- which is how this
// suite first failed, on a helper four hundred lines away.
function decl(name){
  const at=src.indexOf('\nvar '+name+'='); if(at<0) return '';
  let i=at+1, depth=0, started=false, q=null;
  for(; i<src.length; i++){
    const ch=src[i];
    if(q){ if(ch==='\\'){ i++; continue; } if(ch===q) q=null; continue; }
    if(ch==="'"||ch==='"'){ q=ch; continue; }
    if(ch==='/'&&src[i+1]==='/'){ while(i<src.length&&src[i]!=='\n') i++; continue; }
    if(ch==='{'||ch==='['||ch==='('){ depth++; started=true; }
    else if(ch==='}'||ch===']'||ch===')'){ depth--; if(started&&depth===0){
      const semi=src.indexOf(';', i); return src.slice(at+1, semi+1);
    } }
  }
  return '';
}
const pieces=['var MB_SIDE_CARB='+(/var MB_SIDE_CARB = (\d+);/.exec(src)||[])[1]+';'];
['_MB_SIDE','_MB_BF_CARB','_MB_BF_VEG','_MB_BF_PROTEIN'].forEach(n=>{
  const d=decl(n);
  if(!d){ console.log('  FAIL  '+n+' is not declared'); }
  else pieces.push(d);
});
// MB_INSPO's other builds lean on helpers this suite has no need for, so take
// the object as far as breakfast and close it.
const bi=src.indexOf('var MB_INSPO={');
const li=src.indexOf('\n  lunch:{', bi);
pieces.push(src.slice(bi, li)+'\n};');
let INSPO, BF_PROTEIN, BF_VEG, BF_CARB, SIDE;
try{
  const o=new Function(pieces.join('\n')+'\nreturn {MB_INSPO:MB_INSPO,_MB_BF_PROTEIN:_MB_BF_PROTEIN,_MB_BF_VEG:_MB_BF_VEG,_MB_BF_CARB:_MB_BF_CARB,_MB_SIDE:_MB_SIDE};')();
  INSPO=o.MB_INSPO; BF_PROTEIN=o._MB_BF_PROTEIN; BF_VEG=o._MB_BF_VEG; BF_CARB=o._MB_BF_CARB; SIDE=o._MB_SIDE;
}catch(e){ console.log('  FAIL  the breakfast door does not evaluate: '+e.message); process.exit(1); }

const B=INSPO.breakfast;
const labels=(B.a||[]).map(a=>a.label);

// ---- what every route can reach ----
function reach(step, seen, depth){
  seen=seen||{}; depth=depth||0; if(!step||depth>8) return seen;
  (step.many||[]).forEach(p=>{ if(p.name) seen[p.name]=1; if(p.expand) reach(p.expand, seen, depth+1); });
  (step.a||[]).forEach(x=>{ (x.picks||[]).forEach(p=>{ if(p.name) seen[p.name]=1; }); if(x.next) reach(x.next, seen, depth+1); });
  if(step.next) reach(step.next, seen, depth+1);
  return seen;
}
const reachable=reach(B);

console.log('\n  THE DOOR IS FOUR ANSWERS, NOT A TREE:');
t(labels.length===4, 'four answers on the front screen', labels.join(', '));
t(labels.indexOf('Meaty')>-1 && labels.indexOf('Sweet')>-1, 'his two branch names are still there', labels.join(', '));
t(labels.indexOf('Omelette')>-1, 'and the omelette keeps its own name');
t(labels.indexOf('Well-rounded')<0, '"Well-rounded" is gone -- it was a container, not a meal');
t(labels.indexOf('Build it')>-1, 'and there is a way to build your own');

console.log('\n  THREE OF THEM ARE ONE TAP AND A WHOLE MEAL:');
['Meaty','Sweet','Omelette'].forEach(L=>{
  const a=B.a.filter(x=>x.label===L)[0];
  t(!!a && !a.next, L+' finishes on the tap -- no second screen', a&&a.next?'has next':'');
  t(!!a && (a.picks||[]).length>=3, L+' hands over at least three foods', a?(a.picks||[]).length:0);
  const kinds={}; ((a&&a.picks)||[]).forEach(p=>kinds[p.kind]=1);
  t(!!kinds.protein, L+' has a protein in it');
  t(!!(kinds.carb||kinds.fruit), L+' has a carbohydrate in it', Object.keys(kinds).join('/'));
});

console.log('\n  AND THE FOURTH IS THE THREE HE ASKED FOR:');
/* "no more clicks than it is to simply select the protein source, the
   vegetable source, and the carb source." */
const build=B.a.filter(x=>x.label==='Build it')[0];
t(build.next===BF_PROTEIN, 'Build it goes straight to the protein');
t(BF_PROTEIN.next===BF_VEG,  'protein hands to vegetables');
t(BF_VEG.next===BF_CARB,     'vegetables hand to the carbohydrate');
t(BF_CARB.next===null,       'and the carbohydrate is the last screen -- three, not four');
t(!!BF_PROTEIN.many && !!BF_VEG.many && !!BF_CARB.many, 'each one is a pick-as-many, so two eggs and bacon is still one screen');
t(BF_PROTEIN.q==='Start with the protein.', 'and each screen says plainly what it wants', BF_PROTEIN.q);

console.log('\n  THE FRUIT SIDE COSTS A SCREEN ONLY IF YOU WANT IT:');
const doorway=(BF_CARB.many||[]).filter(x=>x.expand)[0];
t(!!doorway, 'it rides on the carbohydrate screen as a doorway');
t(doorway && doorway.expand===SIDE, 'opening into the side list that already existed');
t(SIDE.target===10, 'which keeps its own smaller target, so berries stay a side', SIDE.target);

console.log('\n  BREAKFAST HAS A STARCH NOW:');
['Potatoes','Sweet Potatoes','Oats','Bread','Rice'].forEach(n=>{
  t(!!reachable[n], n+' is reachable from breakfast');
});
t(!!reachable['Tortilla'], 'and a tortilla, once migrations/shelf_gaps.sql has run');

console.log('\n  HIS OWN TEST MEALS GO THROUGH:');
/* Breakfast 1: 3 eggs, 1 handful of potatoes, 1 handful of peppers. */
['Eggs','Potatoes','Bell Peppers'].forEach(n=>{
  t(!!reachable[n], 'Breakfast 1 needs '+n+', and breakfast can reach it');
});
/* Breakfast 2: 2 eggs, 2 slices of turkey bacon, 1 handful of berries. */
['Eggs','Turkey Bacon','Mixed Berries'].forEach(n=>{
  t(!!reachable[n], 'Breakfast 2 needs '+n+', and breakfast can reach it');
});
t(!!reachable['Cottage Cheese'], 'and cottage cheese, from his own dictated format');

console.log('\n  EVERY ENTRY IS SHAPED SO IT CAN RESOLVE AT ALL:');
/* THE CHECK THIS SUITE CANNOT DO, AND WHY IT DOES NOT PRETEND TO.
   Whether a name is really on the shelf is a question about Supabase, not
   about this file -- meal_components holds it, mbFind resolves it, and
   mbManyOptions drops what it cannot resolve WITHOUT SAYING SO. A first pass
   here tried to stand in for that by flagging any food named only once in
   index.html. Every consolidated food failed it -- Bison and Sauerkraut are
   named once now precisely BECAUSE the duplicate branches are gone -- so the
   check punished the fix. MT_ROWS is no better: 254 names, and not Cottage
   Cheese, Kiwi or Sauerkraut among them. Shelf membership is proved on the
   served build against the real rows. What is proved here is the shape, which
   is where a typo that silently empties a screen actually begins. */
function entries(step, out, depth){
  out=out||[]; depth=depth||0; if(!step||depth>8) return out;
  (step.many||[]).forEach(p=>{ out.push(p); if(p.expand) entries(p.expand, out, depth+1); });
  (step.a||[]).forEach(x=>{ (x.picks||[]).forEach(p=>out.push(p)); if(x.next) entries(x.next, out, depth+1); });
  if(step.next) entries(step.next, out, depth+1);
  return out;
}
const all=entries(B);
const KINDS={protein:1, veg:1, carb:1, fruit:1, fat:1};
const shapeless=all.filter(p=>!p.expand && !(p.kind && p.name));
t(shapeless.length===0, 'every food entry carries both a kind and a name', JSON.stringify(shapeless));
const wrongKind=all.filter(p=>p.kind && !KINDS[p.kind]);
t(wrongKind.length===0, 'and a kind the shelf actually has', wrongKind.map(p=>p.kind).join(', '));
const doorways=all.filter(p=>p.expand);
t(doorways.every(p=>p.label), 'a doorway is labelled, or it renders blank', doorways.length);
t(all.length>25, 'and the door is not quietly thin', all.length);

console.log('\n  THE COACH’S AMOUNTS ARE STILL THE COACH’S:');
/* Yusuf declined moving these to the computed rule. They stay written down. */
const eggs=(BF_PROTEIN.many||[]).filter(x=>x.name==='Eggs')[0];
const bacon=(BF_PROTEIN.many||[]).filter(x=>x.name==='Turkey Bacon')[0];
t(eggs && eggs.qty===3,  'eggs are still written as three',        eggs&&eggs.qty);
t(bacon && bacon.qty===3,'turkey bacon still written as three',    bacon&&bacon.qty);
t((BF_VEG.many||[]).every(x=>x.qty==null), 'and nothing else carries a number the rule should own');

console.log(bad? ('\n  '+bad+' FAILED\n') : '\n  all good\n');
process.exit(bad?1:0);
