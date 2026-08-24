-- A PROGRAM CAN HAVE NUMBERED WEEKS (Yusuf, ruling, 25 Aug 2026).
--
-- One nullable column. That is the whole change.
--
-- WHY NULLABLE MATTERS: NULL means "this day is the same every week", which is
-- exactly what every program written before today is. Nothing is backfilled,
-- nothing is rewritten, and no existing program behaves differently after this
-- runs. A program only becomes multi-week when rows are inserted WITH a week.
--
-- WHERE WEEK ONE STARTS is deliberately NOT a column. It lives in
-- programs.description as [wk1:YYYY-MM-DD], the same shape [restSteps:N]
-- already uses there, so an eight-week program needs one migration rather than
-- two. If that ever wants to be a real column it can be promoted later without
-- touching this one.
--
-- Safe to run twice.

ALTER TABLE program_workouts ADD COLUMN IF NOT EXISTS week_index INT;
