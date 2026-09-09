// A NAME IS A TAG TOO (Yusuf, 9 Sep). "@Spencer" from a phone, where the
// picker is easy to miss, has to scope the question to Spencer.
const fs=require('fs'); const src=fs.readFileSync('index.html','utf8');
let bad=0; const t=(ok,l)=>{ if(!ok) bad++; console.log((ok?'  ok    ':'  FAIL  ')+l); };
function lift(name){ const re=new RegExp('\\n(?:async )?function '+name+'\\('); const i=src.search(re); if(i<0) throw new Error('missing '+name); const b=src.slice(i+1); let d=0; for(let k=b.indexOf('{');k<b.length;k++){ if(b[k]==='{') d++; else if(b[k]==='}'){ d--; if(!d) return b.slice(0,k+1); } } throw new Error('unterminated '+name); }
const code=[
  "var CLIENTS={spencerr1:{name:'Spencer R'}, chrism1:{name:'Chris McCarthy'}, christiana1:{name:'Christian A'}, samanthav1:{name:'Samantha V'}, tonia1:{name:'Toni A'}, tony1:{name:'Tony'}, thegoat:{name:'Yusuf',isTrainer:true}, brysonn1:{name:'Bryson Needles',active:false}, jackm1:{name:'Jack Martin'}, jackr1:{name:'Jack R'}};",
  "function getHiddenClientSet(){ return {brysonn1:true}; }",
  "var _JV_TAG_RE=new RegExp('@([a-z0-9_]{2,40})','ig');",
  lift('_jvTagResolve'), lift('_jvTagsIn'),
  'module.exports={_jvTagResolve,_jvTagsIn};'
].join('\n');
const m={exports:{}}; new Function('module','exports',code)(m,m.exports);
const {_jvTagResolve,_jvTagsIn}=m.exports;
t(_jvTagResolve('spencerr1')==='spencerr1',           'a code still resolves');
t(_jvTagResolve('Spencer')==='spencerr1',              '@Spencer resolves by first name');
t(_jvTagResolve('chris')==='chrism1',                  '@chris is Chris, not Christian');
t(_jvTagResolve('christian')==='christiana1',          '@christian is Christian');
t(_jvTagResolve('chrismccarthy')==='chrism1',          'the whole name run together');
t(_jvTagResolve('jack')===null,                        'two Jacks means nobody, never a guess');
t(_jvTagResolve('jackmartin')==='jackm1',              'but the whole name picks one');
t(_jvTagResolve('toni')==='tonia1' && _jvTagResolve('tony')==='tony1', 'Toni and Tony stay apart');
t(_jvTagResolve('yusuf')===null,                       'the trainer never matches');
t(_jvTagResolve('bryson')===null,                      'a hidden client never matches');
t(_jvTagResolve('the')===null,                         'ordinary words are text');
const q=_jvTagsIn('has @Spencer done a workout in the past few days');
t(q.codes.length===1 && q.codes[0]==='spencerr1' && !q.everyone, 'the question he typed scopes to Spencer');
t(_jvTagsIn('@everyone who trained').everyone===true,  '@everyone still works');
t(_jvTagsIn('@jack and @Spencer').codes.join()==='spencerr1', 'the ambiguous one drops, the clear one stays');
t(/ontouchend="_jvTagPick\(event,'\+i\+'\)"/.test(src), 'the picker row answers a touch');
console.log(bad?('\n'+bad+' FAILED'):'\n  all tag assertions pass'); process.exit(bad?1:0);
