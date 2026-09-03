// A ROW THAT IS THERE IS NEVER ANNOUNCED AS LOST (Carly L, 1 Sep).
//
// She logged three things across 31 Aug and 1 Sep — a salami off its label, a
// tofu dinner backdated to Monday, and an oatmeal cranberry muffin. Jim
// answered all three with "I don't think that actually saved — can you tell me
// again what you ate?" All three are in food_logs. Read them off her own day:
//   AUG 31  Tofu with Teriyaki Sauce & Guava Juice ... Salami - 12 slices
//   SEP 1   Oatmeal Cranberry Muffin  204 cal
// Nothing about her logging was broken. She was told to type her food in again
// three times in one morning, and said she was going back to manual logging
// "cuz it keeps not saying this for some reason."
//
// The chain: the POST lands, _sbRowLanded cannot read it back inside its
// window, insertFoodLog answers unconfirmed — which it documents as "a
// different sentence, not a quieter one" — and its ONE caller flattened that
// to false, which the speaker says as an outright failure.
//
// A false failure is not a smaller sin than a false confirmation. It is the
// bigger one: a false confirmation loses a meal, a false failure loses the
// client.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(ok,label,extra)=>{ if(!ok) bad++;
  console.log((ok?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };

console.log('  the read-back tells absent apart from unknown:');
const rb=/async function _sbRowLanded\(table, id\)\{[\s\S]*?\n\}/.exec(src)[0];
t(/var answered=false/.test(rb),            'it tracks whether any read actually answered');
t(/answered=true/.test(rb),                 'and only sets that on a reply it parsed');
t(/return answered \? false : null/.test(rb),'no answer at all returns null, not false');
t(!/for\(var i=0;i<3;i\+\+\)/.test(rb),      'the 3 x 180ms window is gone');
t(/waits=\[0,200,450,900,1500\]/.test(rb),   'and the window is wide enough to see past lag');

console.log('\n  a null read-back is not "no row":');
t(/_rb===null/.test(src),                    'food insert branches on the unknown case');
t(/read-back unreachable/.test(src),         'and says unreachable, not empty');
t(/_rbw===null/.test(src),                   'the workout insert does the same');

console.log('\n  the caller keeps the distinction the writer made:');
const lf=src.slice(src.indexOf('var _ins = await insertFoodLog(foodRow, savedPhoto);'));
t(/_ins\.unconfirmed \|\| _ins\.duplicate/.test(lf.slice(0,2600)), 'unconfirmed and duplicate are both carried out');
t(/window\.__jimFoodUnsure/.test(lf.slice(0,2600)),                'on the turn, where the reply can read it');
t(/window\.__jimFoodUnsure=\[\]/.test(src),                        'and reset with the rest of the turn state');
t(/return false;/.test(lf.slice(0,2600)),                          'still false — nothing claims a verified save');

console.log('\n  and the sentence is the true one:');
t(/_allUnsure/.test(src),                    'the reply asks whether every shortfall was an unsure write');
t(/_unsure\.length >= \(_foodExpected-_foodVerified\)/.test(src), 'every one of them, not merely one');
t(/Do not log it again, it is there/.test(src), 'the uncertain line tells her NOT to type it again');
t(/already on your log/.test(src),           'and a duplicate says the meal is already down');
const tail=src.slice(src.indexOf('var _allUnsure'), src.indexOf('var _allUnsure')+2200);
t(/\} else \{[\s\S]*didn't actually save/.test(tail), 'the honest failure line still leads when a row is genuinely lost');

console.log(bad? ('\n'+bad+' FAILED') : '\nall pass');
process.exit(bad?1:0);
