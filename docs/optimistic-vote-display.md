# Optimistic vote display pattern

Reference for implementing instant UI updates when users upvote/downvote, then syncing with the server. **Use this pattern for comments and thread replies only.** Lineups do not use upvote/downvote; lineup popularity is ratings-only.

## Where to use it

- **Comments / thread replies:** When you add or refine optimistic voting for `voteComment` and `voteThread`, follow this pattern. Lineup voting has been removed; lineups use ratings only (see [Lineup popularity: ratings only](./lineup-ratings-vs-votes-proposal.md)).

## Overview

1. **Client-side vote state:** A `Map<entityId, "upvote" | "downvote">` holds the current user’s vote per entity (e.g. per comment or thread reply).
2. **onMutate (optimistic update):** Cancel the list query, snapshot previous data, compute vote delta with `getVoteDelta`, update the list cache (new `totalVotes`), update the vote Map, return context for rollback.
3. **onError:** Restore list cache and remove the entity from the vote Map; show error toast.
4. **onSettled:** Invalidate the list query (and optionally the single-entity query) so the UI eventually matches the server.

The **vote delta** is computed with `getVoteDelta(newType, previousType)` from `~/lib/utils` so the same logic can be reused for comments and threads.

---

## 1. Query input and list query

Keep a stable `queryInput` for the list query so you can cancel/setData/invalidate with the same key.

```ts
// Example: use a stable queryInput for the list you're mutating (e.g. lineupId for comments)
const queryInput = { lineupId, userId: session?.user.id ?? "" };
const { data: comments } = api.lineup.getCommentsByLineup.useQuery(queryInput);
```

For comments/threads you’ll have something like `{ lineupId, ... }` or `{ threadId, ... }` as the list query input.
Use a stable `queryInput` that matches how you fetch the list (e.g. `{ lineupId }` for comments, `{ threadId }` for replies).
---

## 2. Client-side vote map

Track the current user’s vote per entity in a `Map`. This is the source of truth for “which button is active” in the UI. It is updated optimistically in `onMutate` and rolled back in `onError`.

```ts
const userVotes = new Map<string, "upvote" | "downvote">();
```

- **Comments/threads:** Key = comment id or thread id. If your list API returns the current user's vote per comment/thread, **hydrate** this map from the list response on load so the UI shows "you upvoted" without a click. Otherwise the map starts empty and is updated only after a vote.

---

## 3. Vote delta helper

Reuse the shared helper so toggle/switch behavior is consistent:

```ts
import { getVoteDelta } from "~/lib/utils";

// In onMutate:
const previousVote = userVotes.get(input.entityId) ?? null;
const voteDelta = getVoteDelta(input.type, previousVote);
```

- **New vote:** +1 (upvote) or -1 (downvote).
- **Same type again (toggle off):** -1 or +1.
- **Switch type:** +2 or -2.

Use `voteDelta` to update the list cache: `totalVotes: (entity.totalVotes ?? 0) + voteDelta`.

---

## 4. Mutation: onMutate (optimistic update)

1. **Cancel** the list query so a refetch doesn’t overwrite the optimistic update.
2. **Snapshot** the current list from the cache (for rollback).
3. **Read previous vote** from the vote map (e.g. `userVotes.get(input.lineupId)`).
4. **Compute delta:** `getVoteDelta(input.type, previousVote)`.
5. **Update list cache:** `setData(queryInput, (old) => ...)` — find the entity by id and set `totalVotes: current + voteDelta`.
6. **Update vote map:** e.g. `userVotes.set(input.lineupId, input.type)` (for toggle-off you might remove the key instead; the current lineup code sets the new type and the server handles toggle).
7. **Return context** for rollback: `{ previousLineups, previousVote, lineupId }` (or `previousComments`, `commentId`, etc.).

Example (lineup):

```ts
onMutate: async (input) => {
  await utils.lineup.getLineupsByOtherUsers.cancel(queryInput);
  const previousLineups =
    utils.lineup.getLineupsByOtherUsers.getData(queryInput);
  const previousVote = userVotes.get(input.lineupId) ?? null;
  const voteDelta = getVoteDelta(input.type, previousVote);

  utils.lineup.getLineupsByOtherUsers.setData(queryInput, (old) => {
    if (!old) return old;
    return old.map((lineup) => {
      if (getId(lineup) !== input.lineupId) return lineup;
      return {
        ...lineup,
        totalVotes: (lineup.totalVotes ?? 0) + voteDelta,
      } as (typeof old)[number];
    }) as typeof old;
  });

  userVotes.set(input.lineupId, input.type);
  return { previousLineups, previousVote, lineupId: input.lineupId };
},
```

For comments/threads, replace:

- `getLineupsByOtherUsers` → your list procedure (e.g. comments by lineup, or replies by thread).
- `lineupId` → `commentId` or `threadId`.
- `totalVotes` on the right entity (comment or thread doc).
- `getId(lineup)` → your stable id for each item.

---

## 5. Mutation: onError (rollback)

Restore the list cache from the snapshot and remove the optimistic vote so the UI and map are back in sync with the server.

```ts
onError: (_err, _input, ctx) => {
  if (!ctx) return;
  utils.lineup.getLineupsByOtherUsers.setData(queryInput, ctx.previousLineups);
  userVotes.delete(ctx.lineupId);
  (toast as { error: (message: string) => void }).error("Error voting on lineup");
},
```

For comments/threads: set the list data from `ctx.previousComments` (or similar), delete `ctx.commentId` / `ctx.threadId` from the vote map, and show an appropriate error message.

---

## 6. Mutation: onSuccess (optional)

Optional: invalidate the single-entity query so detail views stay in sync.

```ts
onSuccess: (lineup) => {
  void utils.lineup.getLineupById.invalidate({
    id: lineup?._id?.toString() ?? "",
  });
},
```

For comments/threads you might invalidate the parent lineup or thread query if a detail view shows vote counts.

---

## 7. Mutation: onSettled (refetch)

Always refetch the list so the UI eventually matches the server (handles toggles, concurrent tabs, etc.).

```ts
onSettled: async (_data, _error, vars) => {
  await utils.lineup.getLineupsByOtherUsers.invalidate(queryInput);
  if (vars?.lineupId) {
    await utils.lineup.getLineupById.invalidate({ id: vars.lineupId });
  }
},
```

For comments/threads: invalidate the list query (and optionally the parent entity).

---

## 8. Handler and UI

- **Guard pending state** so the user can’t fire multiple mutations in flight: `if (voteMutation.isPending) return;`
- **Pass to the card/list item:**
  - `onVote={(id, type) => voteMutation.mutate({ lineupId: id, type })}` (or `commentId`/`threadId`).
  - `userVote={userVotes.get(getId(lineup))}` (or comment/thread id).

The vote UI (e.g. up/down buttons and total count) should:

- Use `userVote` to show which button is active (e.g. highlight up or down).
- Use `entity.totalVotes` from the list data (updated optimistically in the cache).

---

## Checklist for adding optimistic votes to comments/threads

| Step | Action                                                                                                                                                                                                          |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Define `queryInput` for the **list** query (comments or thread replies).                                                                                                                                        |
| 2    | Add a `userVotes` Map (e.g. `Map<string, "upvote" \| "downvote">`) keyed by comment id or thread id.                                                                                                            |
| 3    | Optionally hydrate `userVotes` from the list response if the API returns the current user’s vote per item.                                                                                                      |
| 4    | In `onMutate`: cancel list query, snapshot list, get `previousVote` from map, compute `voteDelta` with `getVoteDelta`, update list cache (`totalVotes` on the right item), update map, return rollback context. |
| 5    | In `onError`: restore list from context, remove id from map, show toast.                                                                                                                                        |
| 6    | In `onSettled`: invalidate list query (and parent if needed).                                                                                                                                                   |
| 7    | Use `voteMutation.mutate({ commentId, type })` (or threadId) and `userVote={userVotes.get(id)}` in the comment/thread UI.                                                                                       |
| 8    | Ensure the list query returns `totalVotes` (and optionally current user vote) for each comment/thread so the cache shape matches.                                                                               |

---

## File reference

- **Pattern implementation:** Apply this pattern in the page or component that lists comments or thread replies (e.g. lineup detail page). Lineup explore no longer has vote UI; see [lineup-ratings-vs-votes-proposal.md](./lineup-ratings-vs-votes-proposal.md).
- **Vote delta:** `src/lib/utils.ts` — `getVoteDelta(newType, existingType)`.
- **Vote UI:** For comments/threads, use up/down buttons and total display similar to what LineupCardStatsBar used for lineup votes before lineup voting was removed (see [lineup-ratings-vs-votes-proposal.md](./lineup-ratings-vs-votes-proposal.md)).

Use this same flow for comment and thread reply voting: same delta logic, same cancel → setData → rollback on error → invalidate on settled pattern, with the list query and entity id adjusted to comments/threads.
