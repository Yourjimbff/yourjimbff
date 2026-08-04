const http=require('http'),fs=require('fs'),path=require('path');
const ROOT=__dirname;
// Parallel worktrees each want their own preview, so take the assigned port when
// there is one and only fall back to 8899.
const PORT=parseInt(process.env.PORT,10)||8899;

// ===== THE SANDBOX GUARD ===================================================
// index.html carries the production Supabase URL and anon key, so a page served
// here is a fully live client. Twice now the preview has reached real data: once
// a stray daily_scores write, once rows going missing. The preview has no
// business writing to production under any circumstances, and no business
// signing in as a real person.
//
// This lives in the DEV SERVER, not in the app, so nothing test-only ever ships.
// It is injected ahead of every other script, so it wraps fetch/XHR before a
// single line of app code has run and there is no window in which a write can
// escape.
const GUARD = `<script>(function(){
  var LIVE = /supabase\\.co/i;
  var SAFE = { GET:1, HEAD:1, OPTIONS:1 };
  function blocked(method, url){
    var m = String(method || 'GET').toUpperCase();
    return LIVE.test(String(url || '')) && !SAFE[m];
  }
  function shout(method, url){
    var msg = '[sandbox] BLOCKED ' + String(method).toUpperCase() + ' -> ' + url;
    try{ console.error(msg); }catch(e){}
    return msg;
  }
  var _fetch = window.fetch;
  window.fetch = function(input, init){
    var url = (typeof input === 'string') ? input : (input && input.url) || '';
    var method = (init && init.method) || (input && input.method) || 'GET';
    if(blocked(method, url)){
      var msg = shout(method, url);
      // Look like a refusal the app already knows how to handle, so its own
      // error paths run instead of an unhandled rejection.
      return Promise.resolve(new Response(JSON.stringify({error: msg}), {
        status: 403, headers: {'Content-Type': 'application/json'}
      }));
    }
    return _fetch.apply(this, arguments);
  };
  var _open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url){
    if(blocked(method, url)){ shout(method, url); arguments[1] = 'data:application/json,' + encodeURIComponent('{"error":"sandbox blocked"}'); }
    return _open.apply(this, arguments);
  };
  var _send = navigator.sendBeacon && navigator.sendBeacon.bind(navigator);
  if(_send){ navigator.sendBeacon = function(url){ if(LIVE.test(String(url||''))){ shout('BEACON', url); return false; } return _send.apply(null, arguments); }; }

  // No signing in as a real person. Real codes come from the CLIENTS map, and a
  // session is what wakes the app's sync timers in the first place.
  window.__SANDBOX__ = true;
  window.addEventListener('DOMContentLoaded', function(){
    try{
      if(typeof window.doLogin === 'function'){
        window.doLogin = function(){
          try{ console.error('[sandbox] BLOCKED doLogin — use a throwaway code, not a real account'); }catch(e){}
          try{ if(typeof showToast==='function') showToast('Sandbox: login disabled'); }catch(e){}
          return Promise.resolve(false);
        };
      }
    }catch(e){}
  });
  try{ console.info('[sandbox] preview guard active — reads only, no live writes, login disabled'); }catch(e){}
})();</script>`;

http.createServer((req,res)=>{
  let p=decodeURIComponent(req.url.split('?')[0]);
  if(p==='/') p='/.serve-test.html';
  const f=path.join(ROOT,p);
  if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);return res.end('not found');}
  const ext=path.extname(f);
  const type=ext==='.html'?'text/html':ext==='.js'?'text/javascript':ext==='.json'?'application/json':'text/plain';
  if(ext==='.html'){
    // Inject as early as the document allows, so the guard is installed before
    // any app script can issue a request.
    let html=fs.readFileSync(f,'utf8');
    const at=html.search(/<head[^>]*>/i);
    html = (at>=0)
      ? html.replace(/<head[^>]*>/i, m => m + GUARD)
      : GUARD + html;
    res.writeHead(200,{'Content-Type':type+'; charset=utf-8'});
    return res.end(html);
  }
  res.writeHead(200,{'Content-Type':type+'; charset=utf-8'});
  fs.createReadStream(f).pipe(res);
}).listen(PORT,()=>console.log('serving on http://localhost:'+PORT+' (sandbox guard on)'));
