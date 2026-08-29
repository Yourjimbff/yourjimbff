// A LIFTER THAT RESOLVES ITS OWN DEPENDENCIES, STATICALLY.
//
// Why static and not "run it and see what throws": every function in the Jim
// clock/day chain swallows its own errors. A missing dependency therefore does
// not throw — it returns null, the caller falls back, and the harness reports
// that fallback as product behaviour. Three separate dependencies were missed
// exactly that way while building the phantom guard (_JIM_ANCHOR_SLOTS, then
// _jimParse, then _jimSpokenClock), and each time the suite was GREEN over a
// chain with a hole in it. That is _guard.cjs's disease with a longer reach:
// _guard can only check the names a suite thought to ask for.
//
// So the closure is computed from the TEXT. Every underscore-prefixed name a
// lifted body mentions is itself lifted, until nothing new appears, and the
// caller is handed the list of names that could NOT be found so it can assert
// they are all browser/harness globals rather than silent holes.
//
// It handles the four shapes CLAUDE.md lists as lifting traps: `async function
// f(`, a one-liner `function f(){ ... }` (brace-counted, never scanned to the
// next lone "}"), a multi-line `var X=[ ... ];`, and a plain single-line var.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const L=src.split('\n');

// MEMOISED. defOf walks a 100,000-line array, and the closure below asks it
// about every identifier it meets — which after the chase was widened past
// _-prefixed names is thousands of lookups per run. Uncached that is ~40s a
// suite and four time zones blow a two-minute budget; the answers never change
// within a run, so they are computed once.
const _defCache=new Map();
function defOf(name){
  if(_defCache.has(name)) return _defCache.get(name);
  const out=_defOf(name);
  _defCache.set(name, out);
  return out;
}
function _defOf(name){
  const esc=String(name).replace(/[$]/g,'\\$');
  const fnRe=new RegExp('^(?:async )?function '+esc+'\\s*\\(');
  let a=L.findIndex(l=>fnRe.test(l));
  if(a>=0){
    let depth=0, started=false, b=a;
    for(; b<L.length; b++){
      const line=L[b];
      for(let i=0;i<line.length;i++){
        const ch=line[i];
        if(ch==='{'){ depth++; started=true; }
        else if(ch==='}'){ depth--; }
      }
      if(started && depth<=0) break;
    }
    return L.slice(a,b+1).join('\n');
  }
  // const and let as well as var. CITE_MAX is `const CITE_MAX=...` and a
  // var-only pattern missed it — which surfaced as a loud ReferenceError from
  // inside _citeClip rather than a silent fallback, because that one is not
  // wrapped in a try/catch. Not every hole is that polite.
  const vRe=new RegExp('^(?:var|const|let) '+esc+'\\s*=');
  a=L.findIndex(l=>vRe.test(l));
  if(a<0) return '';
  if(/;\s*$/.test(L[a])) return L[a];
  let b=a;
  while(b<L.length && !/^\];|^\};|^\);/.test(L[b])) b++;
  return L.slice(a,Math.min(b,L.length-1)+1).join('\n');
}

function definedIn(code){
  const out=new Set();
  code.split('\n').forEach(l=>{
    let m=/^(?:async )?function ([A-Za-z_$][\w$]*)\s*\(/.exec(l); if(m) out.add(m[1]);
    // EVERY DECLARATOR ON THE LINE. `var allFood=[], todayFood=[], todayWo=[];`
    // declares three, and counting only the first left the other two looking
    // undefined — which is how a harness ends up stubbing a name the lifted
    // code has already shadowed with an empty array.
    m=/^(?:var|const|let) /.exec(l);
    if(m){ (l.slice(m[0].length).match(/([A-Za-z_$][\w$]*)\s*=/g)||[])
             .forEach(d=>out.add(d.replace(/\s*=$/,''))); }
    m=/^\s+(?:var|const|let|function) ([A-Za-z_$][\w$]*)/.exec(l); if(m) out.add(m[1]);
    // for(var _si=0; ...) declares _si and does not start with var.
    (l.match(/for\s*\(\s*(?:var|let)\s+([A-Za-z_$][\w$]*)/g)||[])
      .forEach(d=>out.add(d.replace(/^for\s*\(\s*(?:var|let)\s+/,'')));
  });
  return out;
}

// Returns {code, names, unresolved}. Strings and line comments are blanked
// before names are harvested, so a helper named inside a prompt line or a
// comment is never chased as though it were a call.
function closure(seeds){
  const names=seeds.slice(); const seen=new Set(seeds);
  for(let round=0; round<200; round++){
    const code=names.map(defOf).filter(Boolean).join('\n');
    const have=definedIn(code);
    const bare=code.replace(/\/\/[^\n]*/g,'')
                   .replace(/'(?:[^'\\]|\\.)*'/g,"''")
                   .replace(/"(?:[^"\\]|\\.)*"/g,'""');
    // ANY identifier that has a top-level definition, not only _-prefixed ones.
    // CITE_MAX is `var CITE_MAX=96;` and an underscore-only chase never looked
    // for it — _citeClip then threw at the first long name. The filter that
    // matters is defOf: a name with no definition in index.html is a browser or
    // harness global and is left alone, so widening this cannot pull in String
    // or Math, only things this file really declares.
    const refs=new Set(bare.match(/\b[A-Za-z_$][\w$]*/g)||[]);
    let added=false;
    refs.forEach(n=>{
      if(have.has(n) || seen.has(n)) return;
      if(!defOf(n)) return;
      seen.add(n); names.push(n); added=true;
    });
    if(!added){
      // CHASED WIDE, REPORTED NARROW. The chase has to consider every
      // identifier or it misses a constant like CITE_MAX. The REPORT is for a
      // caller asking "is anything missing that this file ought to define", and
      // at that width it would hand back every keyword and property name in the
      // lifted bodies. So the report keeps the two shapes that are file-level
      // identifiers here by convention: _prefixed, and ALL_CAPS.
      // Single letters are character-class fragments from regex literals
      // ([A-Za-z]), which the string-stripper above does not blank.
      const looksOurs=n=>n.length>1 && (/^_/.test(n) || /^[A-Z][A-Z0-9_]*$/.test(n));
      return {code, names, unresolved:[...refs].filter(n=>!have.has(n) && !defOf(n) && looksOurs(n))};
    }
  }
  throw new Error('static closure did not converge');
}
module.exports={defOf, definedIn, closure, src, L};
