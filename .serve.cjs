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
  window.addEventListener('DOMContentLoaded',function(){
    try{ if(typeof window.doLogin==='function'){ window.doLogin=function(){ try{console.error('[sandbox] BLOCKED doLogin — use a throwaway code');}catch(e){} return Promise.resolve(false); }; } }catch(e){}
  });
  try{ console.info('[sandbox] preview guard active — reads only, no live writes, login disabled'); }catch(e){}
})();<\/script>`;

http.createServer((req,res)=>{
  let p=decodeURIComponent(req.url.split('?')[0]);
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
