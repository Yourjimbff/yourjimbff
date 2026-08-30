const http=require('http'),fs=require('fs'),path=require('path');
const ROOT=__dirname;
// ===== THE SANDBOX GUARD ===================================================
// index.html carries the live Supabase URL and anon key, so anything served here
// is a fully live client. This preview reached real data twice: a stray write,
// and rows going missing. It is injected ahead of every other script, so it
// wraps fetch and XHR before a line of app code runs.
// Lives in the dev server so nothing test-only ever ships.
const GUARD = `<script>(function(){
  var LIVE=/supabase\.co/i, SAFE={GET:1,HEAD:1,OPTIONS:1};
  function blocked(m,u){ return LIVE.test(String(u||'')) && !SAFE[String(m||'GET').toUpperCase()]; }
  function shout(m,u){ var s='[sandbox] BLOCKED '+String(m).toUpperCase()+' -> '+u; try{console.error(s);}catch(e){} return s; }
  var _f=window.fetch;
  window.fetch=function(i,init){
    var u=(typeof i==='string')?i:(i&&i.url)||'', m=(init&&init.method)||(i&&i.method)||'GET';
    if(blocked(m,u)) return Promise.resolve(new Response(JSON.stringify({error:shout(m,u)}),{status:403,headers:{'Content-Type':'application/json'}}));
    return _f.apply(this,arguments);
  };
  var _o=XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open=function(m,u){ if(blocked(m,u)){ shout(m,u); arguments[1]='data:application/json,'+encodeURIComponent('{}'); } return _o.apply(this,arguments); };
  if(navigator.sendBeacon){ var _b=navigator.sendBeacon.bind(navigator); navigator.sendBeacon=function(u){ if(LIVE.test(String(u||''))){ shout('BEACON',u); return false; } return _b.apply(null,arguments); }; }
  window.__SANDBOX__=true;
  // LOGIN IS BLOCKED BY DEFAULT AND OPT-OUT WITH ?readonly-login.
  // The WRITE block above is never opt-out and is what actually protects the
  // data: every non-GET to Supabase is refused whatever this flag says. Without
  // a way in, a branch cannot be checked against a real client's real screen at
  // all, which is the proof these orders keep asking for.
  // Flag lives in localStorage, not the query string: some harnesses drop the
  // query on navigate, and this has to survive a reload to be usable at all.
  var _allowLogin=false;
  try{ _allowLogin=(localStorage.getItem('yjb_sandbox_login')==='1'); }catch(e){}
  if(!_allowLogin){
    window.addEventListener('DOMContentLoaded',function(){
      try{ if(typeof window.doLogin==='function'){ window.doLogin=function(){ try{console.error('[sandbox] BLOCKED doLogin — set localStorage yjb_sandbox_login=1 to sign in read-only');}catch(e){} return Promise.resolve(false); }; } }catch(e){}
    });
  } else {
    try{ console.info('[sandbox] read-only login ENABLED — writes still blocked'); }catch(e){}
  }
  try{ console.info('[sandbox] preview guard active — reads only, no live writes, login disabled'); }catch(e){}
})();<\/script>`;

const https=require('https');
// Netlify functions are not on this box. Proxied so a locally-served branch can
// use the real session and analyser. Supabase is NOT proxied — the in-page guard
// still refuses every write to it.
function proxyFn(req,res){
  let body=[];
  req.on('data',c=>body.push(c));
  req.on('end',()=>{
    const data=Buffer.concat(body);
    const r=https.request({hostname:'yourjimbff.netlify.app',path:req.url,method:req.method,
      headers:Object.assign({},req.headers,{host:'yourjimbff.netlify.app'})},up=>{
      res.writeHead(up.statusCode,up.headers); up.pipe(res);
    });
    r.on('error',e=>{ res.writeHead(502,{'Content-Type':'application/json'}); res.end(JSON.stringify({error:String(e&&e.message)})); });
    if(data.length) r.write(data);
    r.end();
  });
}

http.createServer((req,res)=>{
  let p=decodeURIComponent(req.url.split('?')[0]);
  if(p.indexOf('/.netlify/')===0) return proxyFn(req,res);
  if(p==='/') p='/.serve-test.html';
  const f=path.join(ROOT,p);
  if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);return res.end('not found');}
  const ext=path.extname(f);
  const type=ext==='.html'?'text/html':ext==='.js'?'text/javascript':ext==='.json'?'application/json':'text/plain';
  if(ext==='.html'){
    let html=fs.readFileSync(f,'utf8');
    const at=html.search(/<head[^>]*>/i);
    html = (at>=0) ? html.replace(/<head[^>]*>/i, m=>m+GUARD) : GUARD+html;
    res.writeHead(200,{'Content-Type':type+'; charset=utf-8'});
    return res.end(html);
  }
  res.writeHead(200,{'Content-Type':type+'; charset=utf-8'});
  fs.createReadStream(f).pipe(res);
}).listen(process.env.PORT||8899,function(){ console.log('serving on '+(process.env.PORT||8899)); });
