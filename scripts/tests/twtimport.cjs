// PAST WEIGH-INS OFF A PICTURE (Yusuf, 15 Sep, after Zadkiel Rios wrote in):
// "is there a way to upload a photo of someone's previous weigh ins? and import
// a chart of data. with relevant weight points. and dates"
//
// ZADKIEL'S ASK WAS ALREADY BUILT AND THAT IS THE POINT. He asked for "a spark
// line or something to make the progress feel a little bit more alive" while
// looking at a card that has drawn one since the Progress page existed. Checked
// live before writing anything: weight_logs has exactly ONE row for him, and the
// sparkline needs two. The card was right; it just said nothing about why.
//
// So two things here. The card now explains a single reading, and the history
// he was holding - he sent a screenshot of a weight chart going back to July -
// can be imported.
//
// THE RULE THAT MATTERS: only points with a PRINTED number are taken. A value
// read off a curve by eye is a guess, and a guess on somebody's weight record is
// worse than a gap.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const L=src.split('\n');
function fnAt(n){
  const a=L.findIndex(l=>l.indexOf('function '+n+'(')===0 || l.indexOf('async function '+n+'(')===0);
  if(a<0) return '';
  let b=a,d=0,seen=false;
  for(; b<L.length; b++){
    for(const ch of L[b]){ if(ch==='{'){ d++; seen=true; } else if(ch==='}'){ d--; } }
    if(seen && d===0) break;
  }
  return L.slice(a,b+1).join('\n');
}
let bad=0;
const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined?('  '+x):'')); };

const shot=fnAt('weightImportShot'), go=fnAt('weightImportGo'), open_=fnAt('weightImportOpen');
const card=fnAt('renderWeightCard'), read=fnAt('_shotRead');
t(!!shot && !!go && !!open_, 'the three importer pieces exist');

// ---- the reader knows a third kind --------------------------------------
t(/_SHOT_WEIGHT/.test(src), 'there is a weight prompt block');
t(/\(kind==='weight'\)\?_SHOT_WEIGHT/.test(read), '_shotRead routes the weight kind');
t(/kind==='cardio'\)\?_SHOT_CARDIO/.test(read), '...without disturbing cardio');
t(/_SHOT_STEPS/.test(read), '...or steps');

// ---- a guess is not a weigh-in ------------------------------------------
t(/ONLY POINTS WITH A PRINTED NUMBER AND A DATE YOU CAN PIN/.test(src),
  'the prompt refuses to read values off a curve');
t(/do not interpolate between labels/.test(src), '...and refuses to interpolate');
t(/never convert, return the number as shown/.test(src), 'units are never converted');
t(/"unlabelled"/.test(src), 'it reports how many points it had to leave behind');
t(/had no printed number, so /.test(shot), '...and the person is told, rather than it being silent');

// ---- what gets through --------------------------------------------------
// The filter, run the way the importer runs it.
function keep(p){
  if(!p.date) return false;
  const w=parseFloat(p.weight);
  if(!isFinite(w) || w<=0) return false;
  if(w<40 || w>1000) return false;
  return true;
}
t(keep({date:'2026-07-01', weight:165})===true,  'a real weight is kept');
t(keep({date:'2026-07-01', weight:'170.4'})===true, 'a decimal is kept');
t(keep({date:'2026-07-01', weight:2025})===false, 'a YEAR misread as a weight is dropped', '2025');
t(keep({date:'2026-07-01', weight:12})===false,   'an axis label is dropped');
t(keep({date:'2026-07-01', weight:0})===false,    'zero is dropped');
t(keep({date:'2026-07-01', weight:'abc'})===false,'a non-number is dropped');
t(keep({weight:165})===false,                     'no date, no row');
t(/if\(w<40 \|\| w>1000\) return;/.test(shot), 'the sane-weight window is in the shipped code');

// ---- it does not double somebody's history ------------------------------
t(/p\.dup=!!seen\[p\.ds\+'\|'\+p\.w\]/.test(shot), 'same day + same number is already logged');
t(/weight_logs'/.test(shot), '...checked against weight_logs, the table the card reads');
t(/filter\(function\(p\)\{ return !p\.dup; \}\)/.test(go), 'only fresh rows are written');

// ---- nothing is written until he sees the list --------------------------
const iBtn=shot.indexOf('weightImportGo()');
const iPost=go.indexOf("/rest/v1/weight_logs");
t(iBtn>0 && iPost>0, 'the write lives behind a button, in a different function');
t(!/\/rest\/v1\/weight_logs/.test(shot), 'READING the screenshot writes nothing at all');
t(/nothing is written until you see the list/.test(open_), '...and the door says so');

// ---- dates land on the right day ----------------------------------------
t(/new Date\(p\.ds\+'T12:00:00'\)/.test(go), 'each row is dated at midday so a timezone cannot move it');

// ---- the card explains one reading --------------------------------------
// NB: the source carries the escape sequence, not the character, so this
// matches either rather than pinning one spelling of a dash.
t(/One reading so far .{1,8}the line starts at two/.test(card),
  'a single weigh-in now says why there is no line');
t(/Weigh in again, or import your history below/.test(card),
  '...and names both ways out of it');
t(/series\.length<2 && !_tr/.test(card), '...only when there is genuinely one, and not to the trainer');
t(/if\(series\.length>1\)\{/.test(card), 'the sparkline itself is unchanged - two points and it draws');
t(/Import past weigh-ins/.test(card), 'the history door is on the card');

console.log(bad? ('twtimport: '+bad+' FAILED') : 'twtimport: all passed');
process.exit(bad?1:0);
