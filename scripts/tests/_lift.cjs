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

function defOf(name){
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
  const vRe=new RegExp('^var '+esc+'\\s*=');
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
    m=/^var ([A-Za-z_$][\w$]*)\s*=/.exec(l); if(m) out.add(m[1]);
    m=/^\s+(?:var|function) ([A-Za-z_$][\w$]*)/.exec(l); if(m) out.add(m[1]);
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
    const refs=new Set(bare.match(/\b_[A-Za-z_$][\w$]*/g)||[]);
    let added=false;
    refs.forEach(n=>{
      if(have.has(n) || seen.has(n)) return;
      if(!defOf(n)) return;
      seen.add(n); names.push(n); added=true;
    });
    if(!added) return {code, names, unresolved:[...refs].filter(n=>!have.has(n) && !defOf(n))};
  }
  throw new Error('static closure did not converge');
}
module.exports={defOf, definedIn, closure, src, L};
