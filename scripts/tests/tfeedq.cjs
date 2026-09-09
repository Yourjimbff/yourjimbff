// A NAME BOX ON THE PHONE FEED (Yusuf, 9 Sep): "there's no search function
// at the client feed section". Hides groups, never re-reads, day headings go
// with their groups. Proven on a tiny DOM stand-in.
const fs=require('fs'); const src=fs.readFileSync('index.html','utf8');
let bad=0; const t=(ok,l)=>{ if(!ok) bad++; console.log((ok?'  ok    ':'  FAIL  ')+l); };
function lift(name){ const re=new RegExp('\\n(?:async )?function '+name+'\\('); const i=src.search(re); if(i<0) throw new Error('missing '+name); const b=src.slice(i+1); let d=0; for(let k=b.indexOf('{');k<b.length;k++){ if(b[k]==='{') d++; else if(b[k]==='}'){ d--; if(!d) return b.slice(0,k+1); } } throw new Error('unterminated '+name); }
t(/id="fdQ" class="fdQ" type="search" placeholder="Find a name"/.test(src), 'the box is in the lens row');
t(/oninput="_feedSearch\(this\.value\)"/.test(src), 'and it filters as he types');
t(/value="'\+_escHtml\(_fq\)\+'"/.test(src), 'the text survives a repaint');
t(/<div class="fdGroup" data-name="'\+_gnm\+'">/.test(src), 'each phone group carries the name');
t(/try\{ _feedApplySearch\(holder\); \}catch\(e\)\{\}/.test(src), 'every paint re-applies it');
// a stand-in DOM: one day heading, three groups, one reach line
function El(cls, name){ this.classList={contains:c=>cls.split(' ').indexOf(c)>-1}; this.hidden=false; this._name=name; this.nextElementSibling=null; this.getAttribute=k=>k==='data-name'?name:null; this.querySelector=()=>null; this.querySelectorAll=()=>[]; }
const day=new El('fdDay'), reach=new El('fdReach'), g1=new El('fdGroup','vic benner'), g2=new El('fdGroup','samantha v'), g3=new El('fdGroup','leandra m');
day.nextElementSibling=reach; reach.nextElementSibling=g1; g1.nextElementSibling=g2; g2.nextElementSibling=g3;
const holder={ querySelectorAll:sel=>{ if(sel.indexOf('fdGroup[data-name]')>-1) return [g1,g2,g3]; if(sel==='.fdReach') return [reach]; if(sel==='.fdDay') return [day]; return []; } };
const code=[lift('_feedApplySearch'),'module.exports={_feedApplySearch};'].join('\n');
const m={exports:{}}; new Function('module','exports','window',code)(m,m.exports,global);
const {_feedApplySearch}=m.exports;
global._feedQ='vic'; _feedApplySearch(holder);
t(!g1.hidden && g2.hidden && g3.hidden, '"vic" keeps Vic and hides the other two');
t(!day.hidden, 'the day heading stays while a group under it shows');
t(reach.hidden, 'the reached-out line hides during a search');
global._feedQ='nobody'; _feedApplySearch(holder);
t(g1.hidden && g2.hidden && g3.hidden && day.hidden, 'no match hides the day heading too');
global._feedQ=''; _feedApplySearch(holder);
t(!g1.hidden && !g2.hidden && !g3.hidden && !day.hidden && !reach.hidden, 'clearing the box brings everything back');
global._feedQ='  SAM '; _feedApplySearch(holder);
t(g2.hidden===false && g1.hidden, 'case and spaces do not matter');
console.log(bad?('\n'+bad+' FAILED'):'\n  all feed search assertions pass'); process.exit(bad?1:0);
