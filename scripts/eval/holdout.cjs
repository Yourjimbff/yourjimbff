// THE HOLD-OUT TEN (his directive 3, 29 Aug).
//
// THE REPAIR LOOP NEVER SEES THESE. They are not read when a failure is being
// diagnosed, no prompt is written against them, and no tool description is
// tuned to make one pass. They run on SCORING runs only.
//
// WHY THEY EXIST: if the visible bank climbs and these do not move with it, the
// brain is learning the exam rather than the job, and the visible score is a
// lie. They are the only defence against that, and they only work if the
// discipline holds — so the discipline is written here, at the top, where
// anybody tempted to peek has to read it first.
//
// Written 29 Aug, before run 4, against the same live roster. Sentences are
// deliberately NOT paraphrases of the visible bank: different verbs, different
// people, different shapes.
const HOLDOUT = [
{id:'H1', cat:1, layer:'route', q:"where is Dave James at",
 expect:{tool:'debrief', client:'davej1', confirm:false, askWhich:'none'},
 why:'Plain read, a client the visible bank never mentions.'},
{id:'H2', cat:1, layer:'route', q:"what did Titus do on Monday",
 expect:{tool:'client_day', client:'titust1', confirm:false, askWhich:'none'},
 why:'One day, one client, a named weekday.'},
{id:'H3', cat:2, layer:'route', q:"lemme see shannon quick",
 expect:{tool:['debrief','client_day'], client:'shannong1', confirm:false, askWhich:'none'},
 why:'Sloppy, clipped, a name the loop has never been tuned on.'},
{id:'H4', cat:2, layer:'route', q:"hows raul been holdin up",
 expect:{tool:'debrief', client:'raulf1', confirm:false, askWhich:'none'},
 why:'Dropped apostrophe and dropped g, on an untouched name.'},
{id:'H5', cat:3, layer:'route', q:"and his weight?",
 ctx:{turns:[{who:'him', text:'how is Dave James doing'},{who:'you', text:'Here is Dave.'}]},
 expect:{tool:['debrief','client_day'], client:'davej1', confirm:false, askWhich:'none'},
 why:'Bare follow-up, inherited subject, a client the loop never saw.'},
{id:'H6', cat:3, layer:'route', q:"put her in for Friday",
 ctx:{turns:[{who:'him', text:"how's Shannon Giles"},{who:'you', text:'Ready.'}]},
 expect:{tool:'book', client:'shannong1', confirm:false, askWhich:'none'},
 why:'A pronoun and a booking verb the visible bank does not use.'},
// CORRECTED 30 Aug, and the correction matters more than the question. This was
// written expecting the resolver to ask between two Ellies, and reported upward
// as a probable resolver bug. It is not a bug. ellieh1 is active:false and sits
// in the hidden set — 11 clients do — and _jvResolveOne excludes hidden clients
// before it counts anything. So "Ellie" means Ellie Giovanetti, unambiguously,
// because the other Ellie left.
//
// Making the resolver ask here would be a real regression: every departed client
// whose first name collides with an active one would start producing a "which
// one?" prompt, forever, on his commonest operation. The hold-out now asserts
// the CORRECT behaviour, and its twin below guards the property directly.
{id:'H7', cat:5, layer:'route', q:"what's Ellie's weight",
 expect:{tool:'ANY', client:'ellieg1', confirm:false, askWhich:'none'},
 why:'One ACTIVE Ellie. A hidden, inactive namesake must never make a live client ambiguous.'},
{id:'H8', cat:5, layer:'route', q:"wipe Dante's food log for yesterday",
 expect:{tool:'ANY', client:'danteb1', confirm:true, askWhich:'none'},
 why:'Destructive, named client, untouched name. confirm is the whole test.'},
{id:'H9', cat:5, layer:'route', q:"how much does Bekim squat",
 expect:{tool:'ANY', client:'bekim1', confirm:false, askWhich:'none'},
 noAssertedFact:true,
 why:'It cannot know. It must route, never answer, and never say the data is absent.'},
{id:'H11', cat:5, layer:'route', q:"debrief Anthony Delgado",
 expect:{tool:'debrief', client:'anthonyd1', confirm:false, askWhich:'none'},
 why:'THE TWIN OF H7, from the other side: three Anthonys are ACTIVE, so a first name alone must ask — but a full name must still resolve straight through without one.'},
{id:'H10', cat:6, layer:'route', q:"who is furthest behind",
 expect:{tool:'roster_answer', client:'', confirm:false, askWhich:'none'},
 why:'Roster-wide, phrased unlike any visible question.'}
];
module.exports={HOLDOUT};
