// THE DAY PAGE WENT BLANK AND IT WAS ONE MISSING LINE (Yusuf, 4 Sep).
//
// Gabriel Elkhemit signed up at 9:32am, opened the app, tapped the x on the
// "Jim's back, and sharper" card, and the whole day disappeared. Yusuf signed in
// and got the same. What was left was the header, the week rotary, the Today
// pill and the bottom nav sitting over nothing.
//
// MEASURED on the served file, view-as on gabriele1 at 375px:
//   before the tap   22 day sections, 1 with .sel, 1 visible, 723 chars of text
//   after the tap    22 day sections, 0 with .sel, 0 VISIBLE, 200 chars
// and those 200 characters are his screenshot, character for character.
//
// The seam: one-day mode shows exactly one day by putting `sel` on one
// .tlDaySec. _tlShowOnly is the only thing that applies it. _tlDaySectionHtml
// builds a PLAIN section. So _tlPatchDay, which replaces the selected section
// with a freshly built one, silently removed the only visible day on the page
// and left every other section hidden. Nothing threw, so nothing repaired it.
//
// AND IT WAS NEVER THE DISMISS BUTTON. _tlPatchDay has thirteen callers -
// logging a meal, finishing a workout, a swipe, every card dismissal. Every one
// blanked the page in one-day mode.
//
// _tlEnsureSel is the floor written for exactly this failure when one-day mode
// shipped, and it was wired into renderDayTimeline and not into the patch path.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(ok,label,extra)=>{ if(!ok) bad++;
  console.log((ok?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };

const pd = src.slice(src.indexOf('function _tlPatchDay(ds){'),
                     src.indexOf('function _tlContainAhead(){'));

console.log('  the patched day is put back on screen:');
t(pd.length>200,                              '_tlPatchDay is findable');
t(/replaceChild\(holder\.firstChild, sec\)/.test(pd), 'it still swaps the rebuilt section in');
t(/_tlEnsureSel\(\)/.test(pd),                'and then re-establishes the visible day');
t(pd.indexOf('_tlEnsureSel()') > pd.indexOf('replaceChild'),
                                              'AFTER the swap, not before it');

console.log('\n  the floor itself still does its job:');
const es = src.slice(src.indexOf('function _tlEnsureSel(){'),
                     src.indexOf('function _tlEnsureSel(){')+1400);
t(/if\(!_tlOneDay\(\)\) return;/.test(es),     'it no-ops when the page is not in one-day mode');
t(/querySelector\('\.tlDaySec\.sel'\)/.test(es),'it returns early when a day is still selected');
t(/_tlShowOnly\(want\)/.test(es),             'otherwise it re-selects the remembered day');
t(/_tlSelDs/.test(es),                        'which is the one the week rotary is pointing at');

console.log('\n  and the builder is still not the thing that selects:');
const bld = src.slice(src.indexOf('function _tlDaySectionHtml(cur, ctx){'),
                      src.indexOf('function _tlDaySectionHtml(cur, ctx){')+900);
t(!/\bsel\b/.test(bld),                       'a freshly built section carries no sel of its own');
t(/_tlShowOnly/.test(src),                    'sel comes from _tlShowOnly and nowhere else');

console.log(bad? ('\n'+bad+' FAILED') : '\n  all pass');
process.exit(bad?1:0);
