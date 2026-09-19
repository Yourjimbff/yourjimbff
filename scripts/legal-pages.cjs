/* PUBLIC COPIES OF THE PRIVACY POLICY AND THE TERMS.

   Apple will not list an app without a privacy policy at a public address,
   and the only copy of ours lived inside the app behind sign-in. This lifts
   the one source (_LEGAL_DOCS in index.html) and writes /privacy/ and /terms/
   as plain pages in the /welcome look, so the store link, the sign-up gate
   and the Settings link all read the same words. Run it after any change to
   the legal text and commit the two pages:  node scripts/legal-pages.cjs   */
const fs=require('fs'), path=require('path');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'index.html'),'utf8');
const a=src.indexOf('var _LEGAL_DOCS={');
const b=src.indexOf('\n};\n', a);
if(a<0||b<0) throw new Error('_LEGAL_DOCS not found');
const emailM=src.match(/var LEGAL_EMAIL='([^']+)'/);
const LEGAL_EMAIL=emailM?emailM[1]:'yusuf@yourjimbff.com';
const DOCS=new Function('LEGAL_EMAIL', src.slice(a,b+3)+' return _LEGAL_DOCS;')(LEGAL_EMAIL);
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
function page(key, other){
  const d=DOCS[key];
  let body='';
  d.sec.forEach(s=>{ body+='<h2>'+esc(s.h)+'</h2>'; s.p.forEach(p=>{ body+='<p>'+esc(p)+'</p>'; }); });
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="#131313">
<title>YOURJIMBFF — ${esc(d.title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
:root{--gold:#f5c518;--bg:#131313;--text:#f0ece4;--muted:rgba(240,236,228,0.72);}
*{margin:0;padding:0;box-sizing:border-box;}
body{background:var(--bg);color:var(--text);font-family:'Plus Jakarta Sans',sans-serif;line-height:1.6;-webkit-font-smoothing:antialiased;padding:32px 20px 60px;}
.wrap{max-width:640px;margin:0 auto;}
.mark{font-size:13px;font-weight:800;letter-spacing:0.18em;margin-bottom:28px;}
h1{font-size:30px;font-weight:800;line-height:1.2;margin-bottom:6px;}
.upd{font-size:14px;color:var(--muted);margin-bottom:34px;}
h2{font-size:17px;font-weight:800;margin:30px 0 8px;}
p{font-size:16px;color:var(--muted);margin-bottom:10px;}
a{color:var(--gold);text-decoration:none;font-weight:700;}
.foot{margin-top:44px;padding-top:20px;border-top:1px solid #2e2e2e;font-size:14px;color:var(--muted);}
</style>
</head>
<body>
<div class="wrap">
<div class="mark">YOURJIMBFF</div>
<h1>${esc(d.title)}</h1>
<div class="upd">Updated ${esc(d.updated)}</div>
${body}
<div class="foot">See also the <a href="/${other}/">${esc(DOCS[other].title)}</a>. Questions: <a href="mailto:${esc(LEGAL_EMAIL)}">${esc(LEGAL_EMAIL)}</a></div>
</div>
</body>
</html>
`;
}
for(const [key,other] of [['privacy','terms'],['terms','privacy']]){
  const dir=path.join(root,key); if(!fs.existsSync(dir)) fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir,'index.html'), page(key,other));
  console.log('wrote', key+'/index.html');
}
