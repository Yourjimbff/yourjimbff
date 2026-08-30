# VERIFIED BACKUP AND RESTORE DRILL

Coordination note 4, 30 Aug. Prepared now, in the same shape as the revoke
handoff: everything a session can do is done; everything needing keys only he
holds is written as exact steps for him, alone, in its own block.

## WHAT A SESSION CAN DO TODAY — and what it cannot

A session can READ every table the anon key can select and write a snapshot to
disk. That is a **copy**, not a backup: it misses every table the public key
cannot read (`coach_notes`, `client_contacts`, `bookings`, `vip_calls`,
`coach_reposts`, `engine_moments`, `jv_handled`), it misses storage objects
(progress photos), and it cannot restore.

A session **cannot** take or restore a real backup. Point-in-time recovery and
the daily physical backups live behind the Supabase dashboard, which needs
credentials only he holds. So the drill below is his to run.

## THE RESTORE DRILL — his hands, once

The point is not to have backups. It is to have **proven** they restore. An
untested backup is a rumour.

1. Supabase dashboard, project `frxptalfyutukmnsvysg` → **Database → Backups**.
   Confirm daily backups are ON and note the retention window and the newest
   backup's timestamp.
2. Confirm **Point-in-Time Recovery** status. If it is off, that is the single
   most valuable thing to turn on — 26 tables are currently deletable with the
   key that ships in the page, and PITR is what turns that from a catastrophe
   into an afternoon.
3. **The drill.** Create a new throwaway Supabase project and restore the most
   recent backup into it. Not the live one — never the live one.
4. In the restored copy, confirm three things exist and match: a `food_logs`
   row count, one `coach_notes` row (the table the anon key cannot even read),
   and one progress photo in storage.
5. Delete the throwaway project.
6. Tell the lane the date it was proven. That date goes in the successor brief,
   and the drill repeats monthly.

Step 4 is the part that matters. A backup that restores the tables but not
storage is a backup that loses every progress photo, and nobody finds out until
the day it counts.

## WHY THIS SITS BESIDE THE REVOKE

The revoke closes the hole. The backup is what covers the window before it
closes, and the window is open now. If only one of the two happens this week,
**the backup is the one that cannot wait** — the revoke prevents a loss, the
backup survives one.
