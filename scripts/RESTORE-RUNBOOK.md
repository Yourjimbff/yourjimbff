# THE RESTORE DRILL — runbook and evidence

Standing order, 30 Aug: lane-executed with evidence; only genuinely
key-blocked steps come back, and everything around them arrives done.

## DONE, WITH RECEIPTS

**A verified production census exists.** `scripts/snapshot.sh` counts every
table in `JV_CLIENT_TABLES` through PostgREST's `count=exact` — read-only, no
row data transferred — and the door covers the seven the public key cannot
read. First run: `scripts/eval/snapshots/snapshot-2026-08-30.txt`.

**20,826 rows across 34 client-keyed tables**, 20,188 public-key readable and
638 door-only. That number is the thing a restore gets compared against, and
it did not exist before today.

**The tool was wrong twice before it was right**, and both faults are recorded
in the snapshot rather than smoothed over: `client_notes` is *column*-
restricted so `select=*` reads as a revoked table, and `calendar_blocks` keys
on `owner_code` so a `client_code` count 400s and looks identical to a
refusal. It now tries three query shapes and only reports "unreadable" when
all three are refused. **A census that cannot tell "refused" from "asked
wrongly" is worse than no census** — it was reporting healthy tables as gone.

## THE ONE STEP THAT IS GENUINELY KEY-BLOCKED

Restoring a backup needs the Supabase **dashboard** or the **Management API**.
Establishing that, rather than assuming it:

```
psql        absent        supabase CLI  absent
pg_dump     absent        pg_restore    absent
SUPABASE_ACCESS_TOKEN / service key / connection string: not in env,
not on disk, not in the repo
```

The service key exists only as `process.env.SUPABASE_SERVICE_KEY` inside the
deployed Netlify functions. Nothing in this lane can read it, and it would not
be enough anyway — `service_role` cannot list or restore backups; that is the
management plane, which authenticates with a personal access token.

So this one step needs him, and it is one step:

> **Supabase dashboard → project `frxptalfyutukmnsvysg` → Settings → Access
> Tokens → generate a token, and paste it to the lane.** Everything after that
> — listing backups, restoring the latest into a scratch project, comparing it
> against the census above, and tearing the scratch project down — the lane
> does, with receipts.

If he would rather not issue a token at all, the alternative is that he runs
the four dashboard steps himself and the lane verifies the result against the
census. That is slower and puts him back in the chore, which is what the
standing order exists to stop.

## WHAT TO CHECK WHEN A RESTORE HAPPENS

Comparing row counts is necessary and not sufficient. Three checks, in order:

1. **Counts match the census**, table by table, not just in total.
2. **A door-only table came back.** `coach_notes` had 12 rows. If a restore
   brings back the public tables and misses the locked ones, a total can still
   look plausible.
3. **Storage came back.** `progress_photos` had 83 rows, but the images live in
   the `progress-photos` storage bucket and **a database restore does not
   include storage objects.** A restore that passes checks 1 and 2 and fails
   this one has lost every progress photo, and nobody finds out until a client
   asks to see their first photo.

Check 3 is the one most likely to be skipped and the most expensive to get
wrong.

## WHY THIS SITS AHEAD OF THE REVOKE

The revoke prevents a loss. The backup survives one. Twenty-six tables are
deletable today with the key that ships in the page, so the window is open
now — and an untested backup is a rumour, not a control.
