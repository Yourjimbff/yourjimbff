-- ROTATE THE TWO BURNED TRAINER CODES  —  DO NOT RUN UNTIL YUSUF SAYS GO
-- ============================================================================
-- thegoat and yourjimbff1 were both used in plaintext test curls during the
-- trainer-door build and verification work (Aug 2026). thegoat stays live,
-- unrotated, by Yusuf's own explicit ruling (10 Aug 2026) — he accepts the
-- exposure knowingly. This file exists so the rotation is one paste away
-- whenever he changes his mind, not a research task at that point.
--
-- Replace YOUR_NEW_CODE with the real new code before running a line. Run one
-- line at a time — each account's rotation is independent of the other.
-- ============================================================================

-- thegoat -> new code (Yusuf's own primary trainer login)
-- UPDATE clients SET code = 'YOUR_NEW_CODE' WHERE code = 'thegoat';

-- yourjimbff1 -> new code (the hidden test/audit account)
-- UPDATE clients SET code = 'YOUR_NEW_CODE' WHERE code = 'yourjimbff1';

-- AFTER RUNNING: the old code stops working immediately. Any device still
-- signed in under it needs to sign in again with the new code the next time
-- it's used — sessions are long-lived (30 days) and don't expire themselves
-- just because the row changed.
