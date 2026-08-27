#!/usr/bin/env node
// THE BASELINE HABIT, MADE DURABLE (27 Aug).
//
// Before any job that touches a real account, snapshot every food row for that
// code. Afterwards, diff it: rows added, removed, changed — and for a changed
// row, the exact fields with their before and after. That is what lets a report
// say "one row changed, one field on it" instead of hoping.
//
// This lived in a scratchpad and died with the window it was written in, twice.
// It is fifteen lines of work and it is the difference between a claim and a
// fact, so it lives here now.
//
// READ ONLY. It issues GETs and nothing else. No lane writes to a real client
// without his word, job by job.
//
//   node scripts/food-baseline.cjs snap thegoat            -> writes a snapshot
//   node scripts/food-baseline.cjs diff thegoat            -> diffs against it
//
// Snapshots go to .food-baseline/<code>.json (gitignored).
const fs=require('fs'), path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const url=(src.match(/var SB_URL = '([^']+)'/)||[])[1];
const key=(src.match(/var SB_KEY = '([^']+)'/)||[])[1];
if(!url||!key){ console.error('could not read SB_URL/SB_KEY out of index.html'); process.exit(1); }

const FIELDS=['id','client_code','name','emoji','calories','protein','carbs','fat','sugar',
              'rating','insight','meal','eat_time','date_str','logged_at','felt','meal_text','photo'];
const DIR=path.join(__dirname,'..','.food-baseline');

async function rows(code){
  // Paged, because a silent 1000-row cap would make a snapshot that is missing
  // the oldest rows look like a complete one.
  const out=[]; let from=0;
  for(;;){
    const r=await fetch(url+'/rest/v1/food_logs?client_code=eq.'+encodeURIComponent(code)
      +'&select='+FIELDS.join(',')+'&order=id.asc',
      {headers:{apikey:key, Authorization:'Bearer '+key, Range:from+'-'+(from+999), 'Range-Unit':'items'}});
    if(!r.ok){ console.error('read failed: HTTP '+r.status+' '+(await r.text()).slice(0,200)); process.exit(1); }
    const page=await r.json();
    out.push(...page);
    if(page.length<1000) break;
    from+=1000;
  }
  return out;
}
const totals=rs=>({rows:rs.length, cal:rs.reduce((s,r)=>s+(+r.calories||0),0)});

(async function(){
  const [mode, code]=process.argv.slice(2);
  if(!mode||!code){ console.log('usage: food-baseline.cjs snap|diff <client_code>'); process.exit(1); }
  const rs=await rows(code), t=totals(rs);
  const file=path.join(DIR, code+'.json');
  if(mode==='snap'){
    fs.mkdirSync(DIR,{recursive:true});
    fs.writeFileSync(file, JSON.stringify({code, takenAt:new Date().toISOString(), rows:rs}, null, 1));
    console.log('snapshot: '+code+' — '+t.rows+' rows / '+t.cal.toLocaleString()+' cal');
    console.log('written:  '+path.relative(process.cwd(), file));
    return;
  }
  if(!fs.existsSync(file)){ console.error('no snapshot for '+code+' — run snap first'); process.exit(1); }
  const base=JSON.parse(fs.readFileSync(file,'utf8'));
  const bt=totals(base.rows);
  const B=new Map(base.rows.map(r=>[String(r.id),r])), A=new Map(rs.map(r=>[String(r.id),r]));
  const added=[...A.keys()].filter(k=>!B.has(k)), removed=[...B.keys()].filter(k=>!A.has(k));
  const changed=[];
  A.forEach((a,k)=>{ const b=B.get(k); if(!b) return;
    const d=FIELDS.filter(f=>String(a[f]===undefined?'':a[f])!==String(b[f]===undefined?'':b[f]));
    if(d.length) changed.push({id:k, name:a.name, fields:d.map(f=>({f, was:b[f], now:a[f]}))});
  });
  console.log('baseline taken '+base.takenAt);
  console.log('  was: '+bt.rows+' rows / '+bt.cal.toLocaleString()+' cal');
  console.log('  now: '+t.rows+' rows / '+t.cal.toLocaleString()+' cal');
  if(!added.length && !removed.length && !changed.length){ console.log('\nNOTHING CHANGED. Not one row, not one field.'); return; }
  if(added.length){ console.log('\nADDED ('+added.length+'):');
    added.forEach(k=>{ const r=A.get(k);
      console.log('  id '+k+'  '+r.name+'  '+(r.calories||0)+' cal  '+(r.meal||'-')+'  '+(r.date_str||'-')+'  '+(r.eat_time||'-'));
      if(r.meal_text) console.log('      meal_text: '+JSON.stringify(String(r.meal_text).slice(0,120)));
      console.log('      rating: '+JSON.stringify(r.rating)+'  emoji: '+JSON.stringify(r.emoji)+'  insight: '+JSON.stringify(r.insight));
    });
  }
  if(removed.length){ console.log('\nREMOVED ('+removed.length+'):');
    removed.forEach(k=>{ const r=B.get(k); console.log('  id '+k+'  '+r.name+'  '+(r.calories||0)+' cal  '+(r.date_str||'-')); });
  }
  if(changed.length){ console.log('\nCHANGED ('+changed.length+'):');
    changed.forEach(c=>{ console.log('  id '+c.id+'  '+c.name);
      c.fields.forEach(x=>console.log('      '+x.f+': '+JSON.stringify(x.was)+' -> '+JSON.stringify(x.now)));
    });
  }
})();
