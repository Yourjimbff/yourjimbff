// THE DEVELOPER NOTES COME OUT OF THE FILE THAT IS SERVED.
//
// Yusuf, 15 Sep, from the report a client sent him: "remove developer notes
// from HTML ... Your role level security logic is right within your developer
// notes also exposed within your html."
//
// This runs the real stripper over the real index.html, in memory, and checks
// the result. It is slower than a text assertion and it is worth it: the thing
// being guarded is a script that rewrites six megabytes of live application on
// its way out of the door, and the only honest test of that is to run it.
//
// WHAT IT IS ALLOWED TO DO: remove comments. Nothing else. Every gate below is
// a way of asking that same question from a different angle.
const fs=require('fs');
const { execFileSync } = require('child_process');
const os=require('os');
const path=require('path');
let bad=0;
const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };

const src=fs.readFileSync('index.html','utf8');
const tmp=path.join(os.tmpdir(), 'tstrip-'+process.pid+'.html');
let out='', ran=false, log='';
try{
  log=execFileSync(process.execPath, ['scripts/strip-notes.cjs','index.html','--dry',tmp], {encoding:'utf8'});
  out=fs.readFileSync(tmp,'utf8');
  ran=true;
}catch(e){ log=String((e.stdout||'')+(e.stderr||'')); }
try{ fs.unlinkSync(tmp); }catch(e){}

console.log('\n  IT RUNS, AND IT SAYS WHAT IT DID:');
t(ran, 'strip-notes.cjs completed', log.slice(0,300));
if(!ran){ console.log('\n  '+bad+' FAILED'); process.exit(1); }
t(/verified byte-identical/.test(log), 'and it verified every literal byte-for-byte');
t(/removed \d+ comments/.test(log) || /would remove \d+ comments/.test(log), 'and counted what it took');

console.log('\n  THE NOTES ARE GONE:');
const GONE=[
  'THE AGREEMENT, AND THE DOOR OUT',
  'A CORRECT CODE IS NEVER TOLD IT IS WRONG',
  'THE SILENT EXCHANGE',
  'WHERE THEY CAME FROM, so the way out lands them back on it',
];
GONE.forEach(function(g){
  t(src.indexOf(g)>=0, '  the source still has "'+g.slice(0,34)+'..."');
  t(out.indexOf(g)<0,  '  and the served file does not');
});
t(out.length < src.length*0.8, 'the served file is meaningfully smaller',
  ((out.length/src.length)*100).toFixed(1)+'%');

console.log('\n  AND THE PROGRAM IS NOT:');
const vm=require('vm');
function bodies(s){
  const o=[]; const re=/<script\b([^>]*)>/gi; let m;
  while((m=re.exec(s))){
    const attrs=m[1]||'';
    const from=m.index+m[0].length;
    const close=s.toLowerCase().indexOf('</script>', from);
    if(close<0) break;
    const type=(attrs.match(/type\s*=\s*["']?([^"'\s>]+)/i)||[])[1]||'';
    if(!/\ssrc\s*=/i.test(attrs) && (!type || /^(text\/javascript|application\/javascript|module)$/i.test(type)))
      o.push(s.slice(from, close));
    re.lastIndex=close;
  }
  return o;
}
const bIn=bodies(src), bOut=bodies(out);
t(bOut.length===bIn.length && bIn.length>0, 'the same number of script blocks', bIn.length+' -> '+bOut.length);
let parsed=true, why='';
bOut.forEach(function(b,i){ try{ new vm.Script(b); }catch(e){ parsed=false; why='block '+i+': '+e.message; } });
t(parsed, 'every stripped script block still parses', why);

console.log('\n  THE THINGS THAT WOULD BE SILENTLY FATAL SURVIVE:');
[ "var APP_VERSION = '__APP_VERSION__'",     // checkForUpdate regexes the served file for this
  'function legalGate(',
  'var LEGAL_VERSION=',
  '/.netlify/functions/erase',
  'function sbHeaders(',
  'function isTrainer(',
].forEach(function(k){ t(out.indexOf(k)>=0, '  '+k); });

console.log('\n  AND THE BUILD IS WHAT RUNS IT:');
const stamp=fs.readFileSync('scripts/stamp-version.sh','utf8');
t(/strip-notes\.cjs/.test(stamp), 'stamp-version.sh calls the stripper');
t(/set -euo pipefail/.test(stamp), '  under set -e, so a refusal fails the build');
const toml=fs.readFileSync('netlify.toml','utf8');
t(/command = "bash scripts\/stamp-version\.sh"/.test(toml), '  and Netlify runs stamp-version.sh');
/* The repository is the publish directory, so the script itself is reachable by
   URL unless the existing /scripts/* redirect holds. It does; this is the line
   that says so out loud, because the stripper is now one of the files that
   describes how the app is put together. */
t(/from = "\/scripts\/\*"[\s\S]{0,120}status = 404/.test(toml), 'and /scripts/* is still 404 to the public');

console.log(bad?('\n  '+bad+' FAILED'):'\n  all good (the notes stay in git and never reach a browser)');
process.exit(bad?1:0);
