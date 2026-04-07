# Linear ticket: Create lineup validation bug

Use this in Linear (via MCP **create_issue** or manually).

---

## Title

Bug: Create lineup fails with "invalid_type" — expected object, received undefined

---

## Description

### Summary

When a user tries to create a lineup from the "Build your lineup" flow (`/lineups/new`), the app shows an alert with a Zod validation error: **invalid_type** — expected `object`, received `undefined`. The error path indicates a required field is missing.

### Steps to reproduce

1. Go to `/lineups/new` (Create Lineup page).
2. Select 5 players within the $15 budget (PG, SG, SF, PF, C).
3. Submit the lineup (e.g. complete selection and confirm).
4. Observe the browser alert with the validation error.

### Error details

- **Code:** `invalid_type`
- **Expected:** `object`
- **Received:** `undefined`
- **Message:** "Required"
- **Context:** The error is thrown during tRPC input validation when calling `lineup.create`.

### Root cause

The **lineup.create** tRPC procedure input schema does not match what the client sends:

- **Server expects:** Full player objects per position: `{ pg, sg, sf, pf, c }` where each value is a `playerSchema` object (`_id`, `firstName`, `lastName`, `imgUrl`, `value`).
- **Client sends:** Player IDs only: `{ pgId, sgId, sfId, pfId, cId }` (strings from `getId(selectedPlayers[i])`).

So on the server, `input.pg` (and the other positions) are `undefined`, which triggers Zod's "expected object, received undefined" for the first path.

### Affected code

- **Client:** `src/app/lineups/new/page.tsx` — `handleSubmit` calls `createLineup.mutate({ pgId, sgId, sfId, pfId, cId })`.
- **Server:** `src/server/api/routers/lineup.ts` — `create` procedure uses `.input(z.object({ pg: playerSchema, sg: playerSchema, ... }))`.

### Suggested fix

Align the API contract in one of two ways:

1. **Option A (recommended):** Change the server input schema to accept IDs: `{ pgId, sgId, sfId, pfId, cId }` (all `z.string()`). The handler already fetches players by ID and validates budget, so it can use these IDs directly.
2. **Option B:** Change the client to send full player objects in the shape of `playerSchema` for `pg`, `sg`, `sf`, `pf`, `c`.

---

## Labels (apply in Linear)

- **bug**
- **api** or **backend**
- **lineup** (or your equivalent feature label)
- **trpc** (if available)

---

## MCP usage

If using Linear MCP in Cursor, call **create_issue** with:

- **title:** (copy from Title above)
- **teamId:** (your Linear team ID)
- **description:** (copy the full Description section above)
- **labelIds:** (optional — IDs for bug, api, lineup, trpc in your workspace)
