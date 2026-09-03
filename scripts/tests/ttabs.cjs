// ONE TAB IS ACTIVE. EVER. AND IT SURVIVES A REFRESH. (Yusuf, 3 Sep.)
//
// "sometimes it also has the feed pop up on CRM... it's like there's a layer
// underneath it. It needs to, when it's on CRM, the only page you must, must
// be there is on CRM."
//
// It was never a z-index problem. The load-time landing block activated tFeed
// by hand and de-activated exactly ONE other tab (tToday), so any other tab
// left active stayed active. .tab.active is display:block, so two tabs render
// stacked in normal flow — two pages on screen at once, which is what he was
// seeing and what no amount of layering could have fixed.
//
// "I would love it if I could get a refresh and read on CRM. It stays or
// persists on CRM. If I am on calendar and I refresh, it persists and stays on
// calendar." Nothing stored the tab at all before this.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(ok,label,extra)=>{ if(!ok) bad++;
  console.log((ok?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };

console.log('  the hand-rolled Feed landing is gone:');
t(!/_tt\.classList\.remove\('active'\); _tf\.classList\.add\('active'\)/.test(src),
  'nothing activates a tab while clearing only one other');
t(/_tabOnly\('Feed'\)/.test(src), 'the Feed landing goes through _tabOnly');

const fn = src.slice(src.indexOf('function _tabOnly'), src.indexOf('function _tabRemember('));
console.log('\n  _tabOnly clears every tab before it shows one:');
t(/_TAB_IDS\.forEach/.test(fn),                  'it iterates the whole tab list');
t(/e\.classList\.remove\('active'\)/.test(fn),   'clearing every tab');
t(/b\.classList\.remove\('active'\)/.test(fn),   'and every nav button');
t(fn.indexOf("_TAB_IDS.forEach") < fn.indexOf("el.classList.add('active')"),
  'the clear happens BEFORE the activate');
t(/if\(!el\) return false/.test(fn),             'a tab that does not exist is refused');

console.log('\n  switchTab uses the same one clear, so the two routes cannot disagree:');
const sw = src.slice(src.indexOf('function switchTab(t){'), src.indexOf('function switchTab(t){')+2600);
t(/_tabOnly\(t\)/.test(sw),      'switchTab calls _tabOnly');
t(/_tabRemember\(t\)/.test(sw),  'and remembers where he is');
t(!/'Today','Foodlog','Training','Ask','Profile','Clients','Follow','Feed','Program','Jarvis','Progress','CRM'\]\.forEach\(function\(x\)\{ var el=document/.test(sw),
  'the old inline clear list is gone — one list, not two');

console.log('\n  and the tab survives a reload:');
const rem = src.slice(src.indexOf('function _tabRemembered'), src.indexOf('function _tabRemembered')+900);
t(/localStorage\.setItem\('yjb_tab'/.test(src), 'the tab is stored on every switch');
t(/localStorage\.getItem\('yjb_tab'\)/.test(rem),'and read back at load');
t(/_TAB_IDS\.indexOf\(t\)<0/.test(rem),          'an unknown stored value is refused');
t(/if\(!el \|\| !bn\) return ''/.test(rem),      'a tab this account cannot reach is refused');
t(src.indexOf('var _want=_tabRemembered();') > 0, 'the remembered tab is restored at load');
t(/if\(_rem\)\{\s*switchTab\(_rem\);/.test(src),
  'and the BOOT LANDING honours it too — it runs later and used to overwrite it');
t(/if\(_want\)\{ _tabOnly\(_want\); \}[\s\S]{0,80}else if/.test(src),
  'and it wins over the first-run Feed landing');

console.log('\n  the search box carries nothing iOS treats specially:');
t(/inp\.type='text'/.test(src),   'plain text input, not type=search');
t(!/crmSearchTop\{[^}]*backdrop-filter/.test(src), 'no backdrop-filter on the input');

console.log(bad?('\n'+bad+' FAILED'):'\nall pass');
process.exit(bad?1:0);
