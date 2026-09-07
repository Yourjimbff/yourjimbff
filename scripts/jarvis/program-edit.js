/* JARVIS EDITS A CLIENT'S PROGRAM (Yusuf, order, 7 Sep):
     "put jarvis in there too. he needs to be able to edit a clients program
      from his point of view as well. wire it all up."
     "i should be able to say 'increase @chrismcarthy pull day rep count for
      lat pull downs / pull ups to 15-20 reps all but 1 set, 1 set is 8 reps
      and its set #3. and he does it for all the pull days.' ... and then he
      implements it onto the clients program immediately"

   HOW IT RUNS. This file is pasted into the trainer session in the browser
   pane (the only route to the live database from Jarvis's side) and called
   once per order. It reads the client's training_plans row, applies ONE
   mutation, writes it back through the same upsert saveTrainingPlan uses,
   reads the row back, and only reports ok when what came back is what was
   sent. It never invents a row: a client with no training_plans row gets
   {ok:false} and nothing is written.

   LAW. One order, one named client, one change. Jarvis runs this on Yusuf's
   word for that client and never on his own. zzscratchnotaclient is the only
   row it may touch without an order.

   THE SHAPE. training_plans.plan = {Mon:{type:'Pull', ex:[{n,s,r,c,v}]}, ...}
   n name, s sets (number), r reps (string, "6-8"), c connection flag, v note.
   Reps live per EXERCISE, not per set - there is no per-set field - so a
   per-set instruction ("set 3 is 8") goes in the note, which the Day page
   prints beside the sets as "4 x 15-20 . <note>". */
async function jarvisProgramEdit(code, mutate, label){
  var enc=encodeURIComponent;
  var H=function(extra){ return Object.assign({}, sbHeaders(), extra||{}); };
  var read=async function(){
    var r=await fetch(SB_URL+'/rest/v1/training_plans?client_code=eq.'+enc(code)+'&limit=1',{headers:H()});
    if(!r.ok) throw new Error('read '+r.status);
    var rows=await r.json(); return rows[0]||null;
  };
  var row=await read();
  if(!row) return {ok:false, why:'no training_plans row for '+code+' - nothing written'};
  var plan=(typeof row.plan==='string')?JSON.parse(row.plan):row.plan;
  if(!plan || !plan.Mon) return {ok:false, why:'plan has no days - nothing written'};
  var before=JSON.stringify(plan);
  var changes=[];
  mutate(plan, changes);
  if(!changes.length) return {ok:false, why:'nothing matched - nothing written'};
  var body={client_code:code, name:row.name||'', weeks:row.weeks||4, plan:plan, updated_at:new Date().toISOString()};
  var w=await fetch(SB_URL+'/rest/v1/training_plans?on_conflict=client_code',{method:'POST',
    headers:H({'Content-Type':'application/json','Prefer':'resolution=merge-duplicates,return=minimal'}),
    body:JSON.stringify(body)});
  if(!w.ok){ var t=''; try{ t=await w.text(); }catch(e){} return {ok:false, why:'write refused '+w.status+' '+t.slice(0,200)}; }
  var back=await read();
  var after=JSON.stringify((typeof back.plan==='string')?JSON.parse(back.plan):back.plan);
  return {ok: after===JSON.stringify(plan), label:label||'', changes:changes, before:before, after:after};
}
/* The mutation for the first order. Every day whose type is Pull, the named
   movement: sets stay, reps become "15-20", and the note leads with the
   per-set instruction. Idempotent: running it twice changes nothing the
   second time. */
function jarvisPullRepsMutation(exerciseName, reps, setNote){
  var key=String(exerciseName).toLowerCase().replace(/\s+/g,' ').trim();
  return function(plan, changes){
    Object.keys(plan).forEach(function(dk){
      var d=plan[dk]; if(!d || !/pull/i.test(String(d.type||''))) return;
      (d.ex||[]).forEach(function(e){
        if(String(e.n||'').toLowerCase().replace(/\s+/g,' ').trim()!==key) return;
        var oldR=e.r, oldV=e.v||'';
        var v=oldV.indexOf(setNote)===0 ? oldV : (setNote+(oldV?(' '+oldV):''));
        if(e.r===reps && e.v===v) return;
        e.r=reps; e.v=v;
        changes.push(dk+' '+d.type+': '+e.n+' '+e.s+'x'+oldR+' -> '+e.s+'x'+reps+' | note: '+v);
      });
    });
  };
}
