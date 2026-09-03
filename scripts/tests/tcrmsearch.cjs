// THE SEARCH BOX SURVIVES ITS OWN REPAINT (Yusuf, 3 Sep).
//
// "The search button does not work, which is really stupid. Why the fuck would
// we build a button and have a button we go? Yeah let's push this and then it
// doesn't fucking work."
//
// The filter was never wrong. Measured on the live phone renderer before the
// fix: typing C-a-r-l took the board from 42 rows to 1, _crm.q read "Carl", and
// the value was intact. What was wrong was that the INPUT NODE was destroyed
// and rebuilt on every single keystroke — node identity changed four times in
// four characters — because crmQuery calls crmPaint and crmPaint replaced the
// whole host with innerHTML, search box included.
//
// On a desktop the refocus hack underneath hid it. On iOS it cannot: detaching
// a focused input closes the keyboard, and a programmatic focus outside a user
// gesture does not reopen it. He types one letter and the keyboard is gone.
//
// So the box is now created once, lives in its own child of the host, and is
// never detached, never re-created, and never re-valued while he is typing.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(ok,label,extra)=>{ if(!ok) bad++;
  console.log((ok?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };

console.log('  the box is out of the wholesale-replaced string:');
t(!/<input class="crmSearch crmSearchTop"/.test(src), 'no search input is built into the paint string');
t(src.indexOf("h+='<!--CRMQ-->';")>0,                  'a sentinel marks where it goes');
t(/_crmPaintSplit\(host, h, people\.length\)/.test(src),'crmPaint paints through the splitter');

const fn = src.slice(src.indexOf('function _crmPaintSplit'), src.indexOf('function crmPaint(){'));
console.log('\n  and the splitter never throws the node away:');
t(/split\('<!--CRMQ-->'\)/.test(fn),        'it splits on the sentinel');
t(/parts\.length!==2/.test(fn),             'a pass with no box falls back to the old paint');
t(/crmA[\s\S]*crmQHold[\s\S]*crmB/.test(fn),'three children: before, the box, after');
t(/a\.innerHTML=parts\[0\]/.test(fn) && /b\.innerHTML=parts\[1\]/.test(fn),
                                            'only the before and after halves are rewritten');
t(/document\.createElement\('input'\)/.test(fn), 'the input is created, not re-parsed from HTML');
t(/if\(!inp\)\{/.test(fn),                  'and only when it is not already there');
t(/document\.activeElement!==inp/.test(fn), 'its value is never written while he is typing');

console.log('\n  a roster is names, not prose:');
['autocorrect','autocapitalize','spellcheck','autocomplete'].forEach(function(a){
  t(new RegExp("'"+a+"'").test(fn), a+' is off');
});

console.log('\n  and crmQuery stops fighting for the caret:');
const q = src.slice(src.indexOf('function crmQuery(v){'), src.indexOf('function crmQuery(v){')+900);
t(!/setSelectionRange/.test(q), 'no forced caret-to-end on every keystroke');
t(!/\.focus\(\)/.test(q),       'no refocus — focus was never lost');
t(/crmPaint\(\)/.test(q),       'it still repaints the board');

console.log(bad?('\n'+bad+' FAILED'):'\nall pass');
process.exit(bad?1:0);
