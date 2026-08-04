-- ============================================================================
-- sales: link every fee to a client, and bring the client-card fees into the
-- sales table so there is one source of truth for revenue.
--
-- Read against the live database on 2026-08-03 before this was written, so the
-- row ids and client codes below are the real ones, not a guess.
--
-- State at that point:
--   * sales.client_code and sales.due_date ALREADY EXIST. No ALTER is needed.
--   * 14 sales rows, 12 already carrying client_code, totalling $18,897 paid.
--   * 80 clients, 21 with a fee on their card.
--   * 11 of those 21 already have a linked sale. Backfilling them would have
--     double-counted $18,097 — the app matches a sale to a client by code OR by
--     name (index.html, salesForClient), so the original and the backfilled row
--     would both have counted, on the card and in the headline.
--
-- Run sections 1 and 2. Section 3 is three individual decisions — read them.
-- Every statement is re-runnable; running the file twice changes nothing.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 1. Link the two orphan sales rows to their clients.
--
-- Both were missed by name matching because the sale and the client spell the
-- name differently. Done by explicit id so nothing fuzzy runs against live data.
--   id=1  "Ellie Huitron"  -> ellieh1  ("Ellie H",  no fee on card)
--   id=2  "Alrida"         -> alridag1 ("Alrida G", $1,500 on card — see 3c)
-- ---------------------------------------------------------------------------

UPDATE sales SET client_code = 'ellieh1'  WHERE id = 1 AND client_code IS NULL;
UPDATE sales SET client_code = 'alridag1' WHERE id = 2 AND client_code IS NULL;


-- ---------------------------------------------------------------------------
-- 2. Backfill the 9 clients who have a fee on their card and no sale at all.
--
-- One sale each, dated to started_at, total = paid: the card records money
-- received and carries no contracted total, so claiming a balance would invent
-- one. Anyone who actually owes more gets it set by editing the sale.
--
-- alridag1 is deliberately NOT in this list — she already has sale id=2. See 3c.
--
-- Expected: 9 rows, $18,100.
--   anthonyp1 $3,100   billm1   $2,000   blakeb1  $3,000
--   johnp1    $1,200   leandram1 $2,200  maishas1 $1,500
--   mymy1     $1,600   omar1    $2,000   tonia1   $1,500
--
-- Preview it first — this SELECT is the INSERT's own row list:
--
--   SELECT c.code, c.name, c.paid,
--          COALESCE(c.started_at::date, CURRENT_DATE) AS sale_date
--   FROM clients c
--   WHERE c.code IN ('anthonyp1','billm1','blakeb1','johnp1','leandram1',
--                    'maishas1','mymy1','omar1','tonia1')
--     AND c.paid IS NOT NULL AND c.paid > 0
--     AND NOT EXISTS (SELECT 1 FROM sales s WHERE s.client_code = c.code)
--   ORDER BY c.name;
--
-- Five of the nine started before July, so they land outside the rolling
-- 30-day window and move the all-time figure only.
-- ---------------------------------------------------------------------------

INSERT INTO sales (client_code, client_name, program, total_amount, paid_amount,
                   sale_date, created_at)
SELECT c.code, c.name, NULL, c.paid, c.paid,
       COALESCE(c.started_at::date, CURRENT_DATE), now()
FROM clients c
WHERE c.code IN ('anthonyp1','billm1','blakeb1','johnp1','leandram1',
                 'maishas1','mymy1','omar1','tonia1')
  AND c.paid IS NOT NULL AND c.paid > 0
  AND NOT EXISTS (SELECT 1 FROM sales s WHERE s.client_code = c.code);


-- ---------------------------------------------------------------------------
-- 3. Three that need your call. Nothing below runs unless you uncomment it.
--
-- These are the only clients where the card and the sales table disagree.
-- The other 9 linked clients match to the dollar.
-- ---------------------------------------------------------------------------

-- 3a. Ali Mohammed (alim1) — card says $2,500 received, sale id=4 says $1,300
--     of a $2,600 total. $1,200 of received money is not in sales.
--     If the card is right, this corrects the sale and leaves $100 owed:
--
-- UPDATE sales SET paid_amount = 2500 WHERE id = 4;


-- 3b. Usam M (usamm1) — two sale rows two days apart:
--       id=5   2026-06-13   $750 paid of $1,500
--       id=13  2026-06-15   $1,500 paid of $1,500
--     The card says $1,500. If id=5 was the deposit and id=13 the same deal
--     paid off, then id=5 is a duplicate inflating revenue by $750 today:
--
-- DELETE FROM sales WHERE id = 5;


-- 3c. Alrida G (alridag1) — sale id=2 says $750 paid of $1,500; her card says
--     $1,500 received. Section 1 links the sale to her, so she is already
--     counted at $750 and is excluded from the backfill.
--     If the card is right and she has paid in full:
--
-- UPDATE sales SET paid_amount = 1500 WHERE id = 2;


-- ---------------------------------------------------------------------------
-- After running, check the totals:
--
--   SELECT count(*) AS rows,
--          sum(paid_amount) AS collected,
--          sum(total_amount - paid_amount) AS outstanding,
--          count(*) FILTER (WHERE client_code IS NULL) AS still_unlinked
--   FROM sales;
--
-- Expect 23 rows, $36,997 collected, $4,550 outstanding, 0 unlinked
-- (before any of section 3). The outstanding is five balances:
--   Ellie $1,500 · Ali $1,300 · Alrida $750 · Usam $750 · George $250
-- ---------------------------------------------------------------------------
