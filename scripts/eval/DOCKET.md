# THE RULINGS DOCKET

His directive 2, 29 Aug: every gate-vs-brain disagreement that is **genuinely
ambiguous** comes here as a one-line question for a one-word ruling. His ruling
becomes the expected outcome, permanently. Nobody guesses his intent on his
behalf — including the graders.

A disagreement only belongs here if both answers are defensible. A plain miss is
a bug and gets fixed, not docketed.

---

## RULED

### R1 — "clear the audio tape"
**The disagreement:** the gate clears the audio recorder. The brain answered
`stop` — "wipe the audio flight recorder clean" — reading it as halting
something in progress. Found in his own live shadow tape, 29 Aug.

**Ruling (Coordination's lean under default-forward, 29 Aug — his to veto within
a day):** the gate is right. He coined that phrase to clear the tape and has
only ever used it that way. **Expected outcome = clear the tape (`audio_report`).**

**Status:** the gate already does this, so nothing ships to change behaviour. It
is recorded so the expected outcome is fixed and no future run re-litigates it.

---

## OPEN — awaiting one word each

### D1 — Does booking a call with a client need his confirmation?
Brain says yes (`confirm:true`), the bank says no. Booking touches his own diary,
but the call is *with* that person. **Both defensible.**
*Coordination's lean:* **no confirm** — it is his diary, and a confirm on every
booking is friction on the commonest write he makes. One word: `confirm` or
`no confirm`.

### D2 — "who has calls tomorrow" — whose tool is that?
`day_board` (his agenda), `calendar` (his week), or `roster_answer` (across
people). The toolbox as written cannot separate them and the brain has picked
`day_board` every run.
*Coordination's lean:* **day_board**, and the tool description gets widened from
"today" to his agenda on any day. One word: `day_board`, `calendar`, or `roster`.

### D3 — "wassup with kelly g" — a read, or a status line?
Run 1 and 2 answered `roster_answer`; run 3 answered `debrief` after the tool
descriptions were sharpened. It now passes, but the ambiguity is real: a casual
"wassup with X" might mean the one-line status rather than the full read.
*Coordination's lean:* **debrief** — it is one named person, and he can stop
reading after the first line. One word: `debrief` or `status`.

### D4 — Two Ellies, one hit
`_jvFindClientIn('Ellie')` returns ONE hit (`ellieg1`) although Ellie Giovanetti
and Ellie H are both on the roster. Hold-out H7 expects it to ask. This is a
question about the **resolver**, not the brain.
*Coordination's lean:* **the resolver should ask** — the exact-name discipline
says one hit resolves and more than one asks, and there are plainly two Ellies.
Flagged as a probable resolver bug rather than an eval expectation. One word:
`ask` or `leave it`.

---

## HOW A DISAGREEMENT GETS HERE
1. A run produces a failure where the brain's `why` line is a defensible reading.
2. It is written up as one line, with both answers and the brain's own reason.
3. It goes to him through Coordination with a lean attached.
4. His word becomes the `expect` in the bank, with the ruling id in a comment.
