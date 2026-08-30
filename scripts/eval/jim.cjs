// CATEGORY 8 — THE CLIENT VOICE. Jim's bank. (His directive 6, 29 Aug.)
//
// WRITTEN BEFORE ITS FLIP IS EVER DISCUSSED, deliberately. One engine: the
// client side inherits this brain eventually, and its exam exists first so that
// nobody can argue afterwards about what passing looked like.
//
// NOT RUN YET. Step 3 of the rollout is the client side and needs his explicit
// later word (standing, from the handover brief: DO NOT SKIP AHEAD). This file
// is built, checked into the suite for shape, and left alone until he says go.
//
// THE VOICE IS COMPLETELY DIFFERENT and that is the point. A trainer asks about
// other people; a client reports on themselves, badly, one-handed, often hours
// late, often with a photo and no words at all. Nothing here names a client,
// because a client naming a client is the one thing that must never route.
//
// EXPECTED TOOLS are the same toolbox — the point of one engine — but the ones
// a client can reach at all are far fewer, and `answer` is the honest landing
// place for most of what they say.
const JIM_BANK = [
// --- sloppy logging, the bread and butter of the client side ---
{id:'J1', cat:8, layer:'route', q:"chicken and rice for lunch",
 expect:{tool:'log_food', client:'SELF', confirm:false, askWhich:'none'},
 why:'The plainest possible log. Never a question, never a client.'},
{id:'J2', cat:8, layer:'route', q:"had a protein shake and 2 eggs",
 expect:{tool:'log_food', client:'SELF', confirm:false, askWhich:'none'},
 why:'Two items, one meal, no stated slot.'},
{id:'J3', cat:8, layer:'route', q:"omlette n coffee",
 expect:{tool:'log_food', client:'SELF', confirm:false, askWhich:'none'},
 why:'His corpus spells it omlette. Typos are the normal case, not the edge.'},
{id:'J4', cat:8, layer:'route', q:"scale said 198 this morning",
 expect:{tool:'log_food', client:'SELF', confirm:false, askWhich:'none'},
 knownGap:'The corpus records this as FAILING today: "scale said" is not taught, "weighed" works. Logged here so the brain is measured against the gap rather than around it.',
 why:'A weigh-in in words the app does not currently know.'},
{id:'J5', cat:8, layer:'route', q:"did legs today squats 315 for 5 5 3",
 expect:{tool:'log_food', client:'SELF', confirm:false, askWhich:'none'},
 why:'A workout, not a meal. log_food is the record-what-was-done tool in this toolbox.'},
// --- backdated, which is where the day rules bite ---
{id:'J6', cat:8, layer:'route', q:"I had two buffet muffins yesterday",
 expect:{tool:'log_food', client:'SELF', confirm:false, askWhich:'none'},
 why:'HIS STATED DAY OUTRANKS EVERYTHING. Verbatim from the corpus.'},
{id:'J7', cat:8, layer:'route', q:"forgot to log dinner on sunday, steak and potatoes",
 expect:{tool:'log_food', client:'SELF', confirm:false, askWhich:'none'},
 why:'Late, backdated, with the slot named.'},
// --- a photo with no words at all ---
{id:'J8', cat:8, layer:'photo', q:"",
 photo:true,
 expect:{tool:'log_food', client:'SELF', confirm:false, askWhich:'none'},
 why:'THE SACRED PATH. A photo with no text has always been a meal, and tphoto exists to keep it one. If the brain ever routes a wordless photo anywhere else, the client side does not flip.'},
{id:'J9', cat:8, layer:'photo', q:"progress photo",
 photo:true,
 expect:{tool:'ANY', client:'SELF', confirm:false, askWhich:'none'},
 why:'The one photo that is NOT a meal, and the only words that make it so.'},
// --- what a client must never be able to reach ---
{id:'J10', cat:8, layer:'route', q:"how's Kelly doing",
 expect:{tool:'answer', client:'', confirm:false, askWhich:'none'},
 clientMustNotReach:true,
 why:'A CLIENT ASKING ABOUT ANOTHER CLIENT. It must not route to a read on that person, whatever the words look like. This single question is why the client side is a separate flip.'},
{id:'J11', cat:8, layer:'route', q:"who else is on the programme",
 expect:{tool:'answer', client:'', confirm:false, askWhich:'none'},
 clientMustNotReach:true,
 why:'roster_answer from a client account is a privacy breach, not a routing miss.'},
{id:'J12', cat:8, layer:'route', q:"what did I eat yesterday",
 expect:{tool:['client_day','answer'], client:'SELF', confirm:false, askWhich:'none'},
 why:'Their OWN day. The same question a trainer asks about somebody else.'}
];
// SELF means the signed-in client, never a code the model chose. The runner
// binds it; a model that emits an actual client_code here has already failed.
module.exports={JIM_BANK};
