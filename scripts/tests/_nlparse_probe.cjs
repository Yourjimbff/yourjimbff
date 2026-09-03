// Lifts _nlEchoParse and the words it reads, so a suite can ask what a phrase
// actually parsed to rather than inferring it from a calorie number.
const fs=require('fs');
const L=fs.readFileSync('index.html','utf8').split('\n');
function lift(name){ const s=L.findIndex(l=>l.startsWith('function '+name+'('));
  if(s<0) throw new Error('SEAM MOVED: '+name);
  let d=0,st=false;
  for(let i=s;i<L.length;i++){ for(const c of L[i]){ if(c==='{'){d++;st=true;} else if(c==='}'){d--;} } if(st&&d===0) return L.slice(s,i+1).join('\n'); }
  throw new Error('SEAM MOVED: close of '+name); }
function liftObj(n){ const s=L.findIndex(l=>l.startsWith('var '+n+' =')||l.startsWith('var '+n+'='));
  if(s<0) throw new Error('SEAM MOVED: '+n);
  for(let i=s;i<L.length;i++) if(L[i].trimEnd().endsWith('};')) return L.slice(s,i+1).join('\n');
  throw new Error('SEAM MOVED: close of '+n); }
function one(sw){ const l=L.find(x=>x.startsWith(sw)); if(l==null) throw new Error('SEAM MOVED: '+sw); return l; }
const src=[one('var MT_G_PER_OZ'), liftObj('MT_WEIGHT_G'), liftObj('MT_UNIT_ALIAS'),
  'var _NL_UW_CACHE=null;', lift('_nlUnitWords'), liftObj('_NL_WORD_QTY'), lift('_nlEchoParse'),
  'module.exports=_nlEchoParse;'].join('\n');
const m={exports:{}}; new Function('module','exports',src)(m,m.exports);
module.exports=m.exports;
