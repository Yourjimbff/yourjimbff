// STEPS ON THE FEED (Yusuf, 11 Sep).
//
//   "Really quickly, can I see step counts being added on the feed? I don't
//    believe I see very many step counts on it."
//
// The honest answer was NONE, not few. The feed read seven things - meals,
// workouts, weigh-ins, progress photos, shared check-ins, reactions, moments -
// and step_logs was not one of them, so a step count had never once appeared
// there. What he was seeing was a WALK logged as a workout.
//
//   "whenever someone logs steps and it updates, I should get notified... I add
//    steps in multiple times throughout the day or I update it throughout the
//    day. So clients are more than welcome to have that same thing happen."
//
// step_logs is ONE ROW PER CLIENT PER DAY, upserted. So adding steps three times
// does not make three cards: the one card's number rises and its clock moves,
// which floats it back to the top of the feed. That is the notification, on the
// surface he already watches, with no stream of near-identical rows behind it.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let bad=0; const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&x!==''?('  '+x):'')); };

console.log('  THE FEED READS THEM NOW:');
t(/var _stepsP = \(lens==='all'\) \? sbSelect\('step_logs'/.test(src),
  'step_logs is one of the feed\'s reads');
t(/_stepsP\]\)/.test(src) && /_resAll\[7\]/.test(src),
  'awaited with the rest and read off the right slot');
t(/updated_at=gte\.'\+encodeURIComponent\(_feedSince\)/.test(src),
  'over the same window as everything else');

console.log('\n  ORDERED BY WHEN IT WAS LAST ADDED TO:');
t(/step_logs is the one table here with NO logged_at/.test(src),
  'and the reason is written down where the next person will hit it');
t(/new Date\(r\.updated_at\)\.getTime\(\)/.test(src) && /r\._ts=t/.test(src),
  'the clock is updated_at, not date_str - a count last touched at 9pm does not sit at midnight');
t(/ts:r\._ts,kind:'steps'/.test(src),
  'and that is the timestamp the item carries, so a fresh update floats to the top');

console.log('\n  WHAT IT REFUSES TO SHOW:');
t(/if\(!r \|\| !r\.client_code \|\| !\(\+r\.steps>0\)\) return false;/.test(src),
  'a row with no steps on it is not a card - zero is not an achievement to announce');
t(/if\(!t \|\| isNaN\(t\)\) return false;/.test(src),
  'nor is a row whose clock could not be read');
t(/steps=steps\.filter\(function\(r\)\{ return !FEED_HIDE\[r\.client_code\]; \}\)/.test(src),
  'a feed-hidden client stays hidden here too');
t(/steps\.forEach\(function\(r\)\{ var c=r\.client_code; if\(!c\|\|hidden\[c\]\|\|c===cl\.code\)return;/.test(src),
  'and his own steps stay off his own feed, like every other kind');

console.log('\n  THE CARD:');
const card=src.slice(src.indexOf("} else if(it.kind==='steps'){"), src.indexOf("} else if(it.kind==='journal'){"));
t(card.length>200, 'the steps card is where this test says it is', String(card.length)+' chars');
t(/what='Steps';/.test(card), 'it says what it is');
t(/_feedNumBind\(Number\(d\.steps\|\|0\)\.toLocaleString\(\)\)/.test(card),
  'the count carries its commas and does not break across a line');
t(/rating='So far today'/.test(card) && /d\.date_str===todayDateStr/.test(card),
  '"So far today" while the day is still running, because the row is still being added to');
/* Read the OUTPUT strings, not the comment prose around them - the note above
   the card uses the word "goal" to say it has none. */
const _out=(card.match(/'[^']*'/g)||[]).join(' ');
t(!/goal|target|behind|short of|only/i.test(_out),
  'and no goal, no verdict, nothing that grades them on it - the weigh-in row\'s rule', _out.slice(0,90));

console.log(bad? '\n  '+bad+' FAILED' : '\n  a step count reaches the feed and keeps itself current');
process.exit(bad?1:0);
