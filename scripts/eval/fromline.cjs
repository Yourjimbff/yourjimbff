// Turns the pane's compact pipe form into a run file. The browser tool returns
// strings, and a large JSON round-trip through it arrives double-escaped and
// easy to corrupt by hand — this form cannot be corrupted silently, because a
// wrong field count throws instead of producing a plausible wrong record.
const fs=require('fs');
const lines=fs.readFileSync(process.argv[2],'utf8').split('\n').map(x=>x.trim()).filter(Boolean);
const out=lines.map(L=>{
  const p=L.split('|');
  if(p.length!==8) throw new Error('bad record ('+p.length+' fields): '+L);
  const id=/^\d+$/.test(p[0])?+p[0]:p[0];
  const chain=p[6]?p[6].split('>').map(c=>{const [tool,client,conf]=c.split(':');return {tool,client:client||'',confirm:conf==='1'};}):[];
  return {id, ok:p[1]==='1', tool:p[2], client:p[3], confirm:p[4]==='1',
          ask_which:p[5]?p[5].split('+'):[], chain, then:chain.slice(1), why:'', ms:+p[7]};
});
fs.writeFileSync(process.argv[3], JSON.stringify(out,null,1));
console.log('wrote '+out.length+' records to '+process.argv[3]);
