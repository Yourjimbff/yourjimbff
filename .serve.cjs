const http=require('http'),fs=require('fs'),path=require('path');
const ROOT=__dirname;
http.createServer((req,res)=>{
  let p=decodeURIComponent(req.url.split('?')[0]);
  if(p==='/') p='/.serve-test.html';
  const f=path.join(ROOT,p);
  if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);return res.end('not found');}
  const ext=path.extname(f);
  const type=ext==='.html'?'text/html':ext==='.js'?'text/javascript':ext==='.json'?'application/json':'text/plain';
  res.writeHead(200,{'Content-Type':type+'; charset=utf-8'});
  fs.createReadStream(f).pipe(res);
}).listen(8899,()=>console.log('serving on http://localhost:8899'));
