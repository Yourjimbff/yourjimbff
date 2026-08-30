# THE ONE-DOOR INVENTORY

His order, 30 Aug: one path for anything he types — composer → brain → resolver
→ tools → one renderer. Everything parallel is **deleted**, not guarded. Listed
first, removed one per ship under frozen-week rules with full bank runs between.

Measured on v7.980.752, not remembered.

## THE ONE DOOR AS IT STANDS

```
4 composers (ovl / desk / mob / pane)
        -> jtSend(which)            one send, four buttons.        KEEP
        -> _jtTurn(t)               the top of the pipeline.       KEEP
        -> _jtSplit / _jtBatch      one message -> several items.  KEEP
        -> _jtRunItem(t)            the flip seam.                 KEEP
             live: brain -> resolver -> read dispatch
             else: _jtRunItemShadow -> _jtRunItemGates (the ladder)
        -> jtRenderAll              one renderer.                  KEEP
```

## THE PARALLEL PATHS, IN REMOVAL ORDER

**1. `_jtQuotedTurn` — the quoted-message path.** *(the one that failed)*
Its own model call, its own resolver call, its own renderer (`_jtDraftCardHtml`
+ the `sent you this` header). Reached from `_jtTurn` before the pipeline, so
nothing downstream sees the message. This is where Hayden was named.
**Capability that dies with it:** reading a forwarded client message and
drafting a reply. **Rebuild inside the door:** the brain already has
`text_draft` and the quoted-text laws; the chain can carry read-then-draft, as
X7 proves today (`debrief > text_draft`, confirm true).
**Blocker:** none. Category 9 must be re-run against the rebuilt path.

**2. `_jtRunItemShadow` — the pre-flip wrapper.** Dead weight the moment the
ladder goes. Only exists as the kill switch's destination.
**Removal condition:** after the ladder retires. Not before — it is the only
thing a kill currently returns him to.

**3. `_jtRunItemGates` — the ladder itself, 16 gates.** The big one. Every tool
parses the sentence itself inside it, which is why the flip is staged: making
each tool callable with a resolved client is the actual work.
**Removal:** one tool per ship, each moving into the dispatch map with its
canonical rewrite, each with a bank run. 2 of 19 done (`debrief`,
`day_board`).

**4. `_jvGateWouldClaim` — a MODEL of the ladder,** used only by shadow
reporting. Duplicates the ladder's conditions in a second place, which has
already caused one false report.
**Removal:** free, with the ladder. Delete with 3.

**5. `jimTurn` — the client side.** Not a parallel path for HIM (client
surfaces only) but it is a second engine, and Step 4 of his ladder folds it in.
**Removal:** gated on Category 8 + Category 9 12/12 and his explicit word.

## WHAT IS NOT A PARALLEL PATH

`jtSend`'s four `which` values are four composers on **one** function, not four
paths. `_jtSplit`/`_jtBatch` are inside the door. `jtRenderAll` is already the
single renderer; `_jtDraftCardHtml` is a card *within* it, and only
`_jtQuotedTurn` reaches it outside the pipeline — which item 1 removes.

## THE HONEST COUNT

**One path can be deleted now (item 1). Two are free once the ladder goes
(items 2, 4). The ladder itself is 17 remaining tool migrations.** Anyone
promising the one door in a single ship has not counted them.
