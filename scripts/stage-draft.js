#!/usr/bin/env node
/* THE COMPOSER'S WRITE PATH INTO THE DRAFTS STORE.
 *
 * The Composer runs on the Mac, not in the browser, so it cannot call
 * dfWrite(). This is the same row, written the same way: a [DRAFT] marked
 * JSON payload on client_notes, which is where drafts live until this lane
 * has DDL. The board, the guard and the learning loop all read these rows.
 *
 * Usage, one draft:
 *   node scripts/stage-draft.js <client_code> "the draft text" ["what it answers"]
 * Or many, from stdin, one JSON object per line:
 *   {"code":"alim1","text":"...","re":"they said: ..."}
 *   node scripts/stage-draft.js --stdin < board.jsonl
 *
 * It prints one line per draft: OK <code> <id>, or FAILED <code> <reason>.
 * Nothing is reported written that did not come back from the database.
 *
 * ONE HONEST NOTE ABOUT TODAY. As of 1 Sep the Mac's shell has no outbound
 * HTTP - this script gets EAI_AGAIN on the Supabase host - so the path that
 * actually works right now is the browser the Composer already has open on
 * the app, signed in as him:
 *     await dfWrite('alim1', {text:'...', re:'they said: ...'})
 * Same row, same store, same board. This file is here for the day that shell
 * gets egress, and it was never claimed to have run.
 */
const SB_URL = 'https://frxptalfyutukmnsvysg.supabase.co';
const SB_KEY = process.env.YJB_ANON_KEY || '';
const MARK = '[DRAFT] ';

function newId(){ return 'd'+Date.now().toString(36)+Math.random().toString(36).slice(2,8); }

async function stage(d){
  if(!d || !d.code || !d.text) return {ok:false, reason:'code and text are required'};
  const id = d.id || newId();
  const note = MARK + JSON.stringify({
    schema:1, id:id, text:String(d.text), at:d.at || new Date().toISOString(),
    re:String(d.re||''), status:d.status||'pending', by:d.by||'composer'
  });
  const res = await fetch(SB_URL+'/rest/v1/client_notes', {
    method:'POST',
    headers:{'Content-Type':'application/json', apikey:SB_KEY,
             Authorization:'Bearer '+SB_KEY, Prefer:'return=representation'},
    body: JSON.stringify({client_code:d.code, note:note, logged_at:new Date().toISOString()})
  });
  if(!res.ok) return {ok:false, reason:res.status+' '+(await res.text()).slice(0,160)};
  const rows = await res.json();
  if(!rows || !rows.length) return {ok:false, reason:'no row came back'};
  return {ok:true, id:id};
}

(async function(){
  if(!SB_KEY){ console.error('FAILED - set YJB_ANON_KEY to the public anon key (it is the same one that ships in index.html).'); process.exit(1); }
  const a = process.argv.slice(2);
  let items = [];
  if(a[0]==='--stdin'){
    const text = await new Promise(r=>{ let s=''; process.stdin.on('data',c=>s+=c); process.stdin.on('end',()=>r(s)); });
    items = text.split('\n').map(l=>l.trim()).filter(Boolean).map(l=>{ try{ return JSON.parse(l); }catch(e){ return null; } }).filter(Boolean);
  } else {
    items = [{code:a[0], text:a[1], re:a[2]||''}];
  }
  let bad = 0;
  for(const it of items){
    const r = await stage(it);
    if(r.ok) console.log('OK '+it.code+' '+r.id);
    else { bad++; console.log('FAILED '+(it.code||'?')+' '+r.reason); }
  }
  process.exit(bad?1:0);
})();
