// THREE SMALL RULINGS ON WHAT A FREE USER IS SHOWN (Yusuf, 13 Sep).
//
//   "remove 'your programme yusuf has not set you one yet'"
//   "calls should be an easy consultation booking link, schedule a free call
//    to discuss your fitness goals"
//   "they can further edit that in settings as well" (food exclusions)
//   "also please re icon the food nav tab icon / can just be an apple"
//
// The through-line: a card whose only content is an absence tells someone they
// are missing something. The free app is not a stripped copy of the coached
// one, so an empty programme draws nothing at all, and a plan without calls is
// an offer of a free consultation rather than a locked door.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };
function slice(a,b){ const i=src.indexOf(a); if(i<0) return ''; const j=src.indexOf(b,i); if(j<0) throw new Error('stale end anchor, this suite was reading the rest of the file: '+b); return src.slice(i,j); }

console.log('\n  NO PROGRAMME DRAWS NO CARD:');
const prog=slice('function _gpSecProgramme(){','function _gpSecCalls');
const prog2=slice('function _gpSecProgramme(){','function _gpSecCalls(){');
t(!/Yusuf has not set you one yet/.test(src), 'the sentence is gone from the whole file');
t(/if\(!cap \|\| !cap\.program\) return '';/.test(prog2), 'and an empty programme returns nothing at all');
t(/_gpFlatCard\('Your programme','Yusuf writes this\. It is read-only here\.', body\)/.test(prog2),
  'while a real programme still draws exactly as it did');

console.log('\n  A FREE CALL, NOT A LOCKED DOOR:');
const calls=slice('function _gpSecCalls(){','function _gpSecFood(){');
/* The only survivor of that sentence is the comment recording what it used to
   say, which is the point of the comment. */
t(!/_gpFlatCard\('Calls','Calls are not switched on/.test(src), '"not switched on for your plan" is no longer a card');
t((src.match(/Calls are not switched on for your plan/g)||[]).length===1,
  'it survives once, in the note saying what it used to be',
  (src.match(/Calls are not switched on for your plan/g)||[]).length);
t(/Schedule a free call to discuss your fitness goals\./.test(calls), 'his sentence is the card');
t(/Book a free consultation/.test(calls), 'and the link says what it does');
t(/callsEnabled\(cl\.code\)/.test(calls), 'someone who already has calls still gets their calls');
t(/'<div class="gpFlatV"><span class="gpLink" onclick="closeSettings\(\)/.test(calls),
  'and that door is untouched');

console.log('\n  A LINK WITH NOWHERE TO GO IS NOT DRAWN:');
/* The offer page is Yusuf's marketing site, not this app. Until the address is
   filled in, the card still makes the offer and there is simply nothing to
   tap - which is better than a control that does nothing when pressed. */
t(/var CONSULT_BOOK_URL = '';/.test(src), 'the address is one constant, at the top, and currently empty');
t(/CONSULT_BOOK_URL\s*\n?\s*\? '<div class="gpFlatV"><span class="gpLink" onclick="openConsultBooking\(\)"/.test(calls),
  'and the link only renders once it is set');
const open=slice('function openConsultBooking(){','// READ-ONLY AND IT SAYS SO');
t(/window\.open\(u, '_blank', 'noopener'\)/.test(open), 'it opens in a new tab, with noopener');
t(/location\.href=u/.test(open), 'and falls back to navigating if that is blocked');

console.log('\n  FOOD EXCLUSIONS, IN SETTINGS TOO:');
const food=slice('function _gpSecFood(){','function _gpSecAccount(){');
t(/h=fdPrefHtml\(\)/.test(food), 'it hosts the Food tab’s own renderer');
t(/id="fdPrefHost"/.test(food), 'under the id that renderer repaints into');
t(/if\(!h\) return '';/.test(food), 'and draws nothing if there is nothing to draw');
t((src.match(/id="fdPrefHost"/g)||[]).length===2,
  'exactly two hosts, and only one is ever on screen',
  (src.match(/id="fdPrefHost"/g)||[]).length);

console.log('\n  THE FOOD TAB IS AN APPLE:');
const nav=slice('<div class="bni" id="bnFood"','<div class="bni-lb">Food</div>');
t(!/circle cx="12" cy="12" r="8\.6"/.test(nav), 'the two circles are gone');
t(/M12 8\.1c-\.9-1\.1-2\.3-1\.6-3\.6-1/.test(nav), 'and it draws the apple');
t(/M12 8\.1c0-1\.9\.9-3\.3 2\.6-3\.8/.test(nav), 'stalk and all');
const ico=slice("  fruit:'<path d=","  choc:'");
t(ico.indexOf('M12 8.1c-.9-1.1-2.3-1.6-3.6-1')>-1,
  'the SAME path the builder already draws, so the tab and the builder are one hand');
t(/stroke-width="1\.9"/.test(nav), 'at the nav’s own weight, like every other tab');

console.log(bad? ('\n  '+bad+' FAILED\n') : '\n  all good\n');
process.exit(bad?1:0);
