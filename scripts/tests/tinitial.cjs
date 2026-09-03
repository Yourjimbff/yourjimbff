// A SURNAME INITIAL IS A NAME (Andrew N, 2 Sep).
//
// He asked "what's Andrew N's log looking like the past 14 days?" and got back
// today only, plus "last logged yesterday." The rows were in the database the
// whole time, and it was read for a week as a failure to READ them. It was not.
// The read never ran, because nobody had been identified.
//
// _jvFindClientIn dropped every token under three characters — a bar added for
// a real reason, because "28 g of protein" handed it a bare "g" and it came
// back with George Tremoulis, a real client, out of a unit. The same bar ate
// the N. So the matcher was offered "Andrew" alone, which is TWO people, and
// _jvResolveStep blanks the client on a tie. A debrief with no client falls
// through to the board snapshot, whose own system prompt says it reports "what
// each person logged today" — word for word the answer he got.
//
// _jvNameMatch has always accepted a single letter against an initial and says
// so in its own comment: "Kelly G" and "Anthony D" are how he names half the
// roster. Nothing downstream needed changing. The letter had to survive long
// enough to reach it.
//
// Five ACTIVE clients on the live roster of 87 could not be named to the router
// by the name stored for them: Andrew N, Anthony C, Anthony P, Joseph I,
// Joseph P. Kelly G worked by luck, because Kelly is unique.
const {closure}=require(__dirname+'/_lift.cjs');
global.window={addEventListener:()=>{},matchMedia:()=>({matches:false})};
global.document={addEventListener:()=>{},getElementById:()=>null,querySelectorAll:()=>[],body:{classList:{contains:()=>false}}};
global.localStorage={getItem:()=>null,setItem:()=>{}};
eval(closure(['_jvNameMatch','_jvFindClientIn','_jvResolveClient','_jvDepossess','_jvResolveOne','_jvStripBookWords','_jvSelfNames','_jvSelfCode','_jvTokBase','_jvNormAmPm','_JV_BOOK_RE','_JV_MOVE_RE']).code);
CLIENTS={ andrew1:{name:'Andrew Zamora'}, andrewn1:{name:'Andrew Nicklaw'},
          anthonyc1:{name:'Anthony C'}, anthonyd1:{name:'Anthony Delgado'}, anthonyp1:{name:'Anthony P'},
          josephi1:{name:'Joseph I'}, josephp1:{name:'Joseph P'}, josephs1:{name:'Joseph Silva'},
          chrism1:{name:'Chris McCarthy'}, christiana1:{name:'Christiana Ruiz'},
          kellyg1:{name:'Kelly G'}, georget1:{name:'George Tremoulis'}, thegoat:{name:'Yusuf'} };
cl={code:'thegoat', name:'Yusuf'};
let bad=0;
const t=(q,want,label)=>{ const r=_jvFindClientIn(q); const got=r.hits.join(',');
  const ok=got===want; if(!ok) bad++;
  console.log((ok?'  ok    ':'  FAIL  ')+label.padEnd(46)+'-> ['+got+']'+(ok?'':'   wanted ['+want+']')); };

console.log('  HIS EXACT SENTENCE:');
t("what's Andrew N's log looking like the past 14 days?", 'andrewn1', 'the question that came back with today');
console.log('\n  and the other four who could not be named:');
t('how is Anthony C doing',   'anthonyc1', '"Anthony C"');
t('debrief for Anthony P',    'anthonyp1', '"Anthony P"');
t("Joseph I's food this week",'josephi1',  '"Joseph I"');
t("Joseph P's week",          'josephp1',  '"Joseph P"');
console.log('\n  nothing that worked before stops working:');
t('how is Kelly G doing',            'kellyg1', '"Kelly G"');
t('debrief for Chris McCarthy',      'chrism1', '"Chris McCarthy"');
t("move Chris McCarthy's breakfast", 'chrism1', 'the possessive full name');
console.log('\n  and a unit is still not a person:');
t('28 g of protein',        '', '"28 g of protein" reaches nobody');
t('ate 30 g protein today', '', 'no George');
console.log('\n  a genuinely ambiguous name still asks:');
t('how is Andrew doing', 'andrew1,andrewn1', '"Andrew" alone is still two people');
console.log(bad?('\n'+bad+' FAILED'):'\nall pass');
process.exit(bad?1:0);
