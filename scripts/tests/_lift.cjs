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
const _lineOf=new Map();   // name -> line it is defined on, for source-order emission
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
    _lineOf.set(name, a);
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
  _lineOf.set(name, a);
  // A one-line var that ends in a comment - `var progressPhotos = [];  // rows` -
  // is still one line. Tested with the comment off, or the lifter scanned 1,235
  // lines to the next lone `};` and called that the definition (7 Sep).
  // Only a // that follows whitespace is a comment here: "https://" in SB_URL
  // is not, and cutting there turned a one-line constant into a 1,501-line one.
  if(/;\s*$/.test(L[a].replace(/\s+\/\/.*$/,''))) return L[a];
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
const _unparsable=new Set();
function closure(seeds){
  const names=seeds.slice(); const seen=new Set(seeds);
  for(let round=0; round<200; round++){
    // SOURCE ORDER, NOT CHASE ORDER (7 Sep). A `var MT_UNIT_ALIAS={oz:MT_G_PER_OZ}`
    // initializer runs at eval time and needs MT_G_PER_OZ defined ABOVE it, as it
    // is in index.html. Chase order put it below and threw ReferenceError.
    // Functions hoist either way; only var initializers care, and they care.
    const ordered=names.slice().filter(n=>defOf(n)).sort((x,y)=>(_lineOf.get(x)??0)-(_lineOf.get(y)??0));
    const code=ordered.map(defOf).join('\n');
    const have=definedIn(code);
    // BLOCK COMMENTS OUT FIRST (7 Sep). They were left in, so a function named
    // in a /* */ note was chased as a dependency - and one apostrophe inside a
    // block comment opened a string that swallowed the rest of the body and
    // stopped the chase dead, green over a hole. Both gone with one line.
    // ONE PASS FOR BOTH QUOTES (7 Sep). Two passes, single first, meant a
    // "don't" in double quotes opened a single-quoted string that ran to the
    // next apostrophe and blanked real code between - MT_G_PER_OZ vanished
    // from the chase behind one. One alternation, left to right, and a string
    // never crosses a line, so a stray quote cannot run across the file.
    const bare=code.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/[^\n]*/g,'')
                   .replace(/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"/g,'""');
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
      const d=defOf(n);
      if(!d) return;
      // A DEFINITION THAT DOES NOT PARSE ON ITS OWN IS NOT LIFTED (7 Sep). The
      // brace counter is fooled by a regex literal holding a "}" - analyze()
      // ends on /:\s*(?=[,}\]])/ - and one such body in the closure turned the
      // whole suite into "Unexpected end of input". It was only ever reached
      // through a mis-stripped string anyway. Left out and named, so a test
      // that really needs it sees the hole rather than a syntax error.
      try{ new Function(d); }catch(e){ seen.add(n); _unparsable.add(n); return; }
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
      return {code, names, unparsable:[..._unparsable],
              unresolved:[...refs].filter(n=>!have.has(n) && (!defOf(n) || _unparsable.has(n)) && looksOurs(n))};
    }
  }
  throw new Error('static closure did not converge');
}
module.exports={defOf, definedIn, closure, src, L};
