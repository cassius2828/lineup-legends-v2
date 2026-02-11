# Proposal: Lineup popularity via ratings only (remove lineup upvote/downvote)

## Summary

Use **average rating** and **rating count** as the sole signals of lineup popularity. Remove upvote/downvote for lineups. Keep Reddit-style upvote/downvote for **comments and threads** so discussion stays driven by public opinion.

## Rationale

- **Redundancy**: Lineups already have a 1–10 rating system. A separate upvote/downvote adds a second, overlapping “do you like this?” signal and dilutes meaning.
- **Richer signal**: `avgRating` + `ratingCount` tells users both _how good_ a lineup is and _how many people_ weighed in. A lineup with 4.8 avg and 50 ratings is more informative than a single net vote count.
- **Clear mental model**: “Rate this lineup” is one action; “upvote or downvote” alongside “rate” is confusing and encourages quick thumbs without thoughtful rating.
- **Comments stay Reddit-style**: For comments and thread replies, upvote/downvote remains valuable—quick expression of agreement/disagreement and surfacing the best discussion. No rating scale is needed there.

## Current state

| Entity      | Current signals                                    | Proposed signals                |
| ----------- | -------------------------------------------------- | ------------------------------- |
| **Lineup**  | `totalVotes` (up/down), `avgRating`, `ratingCount` | `avgRating`, `ratingCount` only |
| **Comment** | `totalVotes` (up/down)                             | **Unchanged** (keep up/down)    |
| **Thread**  | `totalVotes` (up/down)                             | **Unchanged** (keep up/down)    |

## Desired UX

- **Lineup cards (grid/list)**  
  Show **avg rating** (e.g. `4.2`) and **rating count** (e.g. `12 ratings`). No up/down buttons or vote count.
- **Sort options for lineups**  
  Replace “Most votes” with “Most rated” (sort by `ratingCount` desc) and keep “Highest rated” (sort by `avgRating` desc). Keep “Newest” / “Oldest” as-is.
- **Lineup detail / rate page**  
  Continue to show `avgRating` and allow rating; remove any vote UI.
- **Comments / threads**  
  No change: keep upvote/downvote and `totalVotes` for comments and thread replies.

## Implementation steps

### 1. Backend – tRPC router (`src/server/api/routers/lineup.ts`)

- [ ] **Remove lineup vote procedures**
  - Remove `lineupVote` mutation (upvote/downvote on lineup).
  - Remove `getUserVote` query (current user’s vote on a lineup).
- [ ] **Remove “most-votes” sort**
  - In `getByCurrentUser`, `getByUserId`, and `getAll` (and any other procedures that list lineups), remove the `"most-votes"` sort option and its `case "most-votes":` branch (sort by `totalVotes`).
  - Add **“most-rated”** (or keep “most-votes” label but implement as “most-rated”): sort by `ratingCount` descending (and optionally `avgRating` as tiebreaker).
- [ ] **Lineup delete**
  - Keep deleting related **ratings** when a lineup is deleted.
  - Either remove deletion of lineup **votes** (if no longer needed) or leave a one-off cleanup that deletes by `lineup` (not `lineupId`) to match `LineupVote` schema; then remove this once the vote collection is dropped.

### 2. Backend – Lineup model (`src/server/models/lineup.ts`)

- [ ] **Drop `totalVotes` from lineup**
  - Remove `totalVotes` from `Lineup` / `LineupDoc` interfaces and from `LineupSchema`.
  - Remove index on `totalVotes` (e.g. `LineupSchema.index({ totalVotes: -1 })`).
  - Ensure `avgRating`, `ratingCount`, and `ratingSum` remain (and any indexes that use them).

### 3. Backend – Lineup votes (remove)

- [ ] **Stop using lineup vote model**
  - Remove or deprecate `LineupVoteModel` usage from the lineup router and any other callers (e.g. delete flow).
  - Optionally keep `src/server/models/lineupVote.ts` until after migration, then delete it.
- [ ] **Exports**
  - Remove `LineupVoteModel` and related types from `src/server/models/index.ts` (and any `VoteModel` / `Vote` aliases for lineup votes).

### 4. Frontend – Lineup cards and lists

- [ ] **LineupCardStatsBar** (`src/app/_components/LineupCard/LineupCardStatsBar.tsx`)
  - Remove vote UI: up/down buttons and `totalVotes` display.
  - Keep rating display: `avgRating` and optionally “X ratings” (using `ratingCount`).
  - Remove props: `onVote`, `userVote`. Remove `canVote` if it only controlled voting (or repurpose for “can rate” if needed).
- [ ] **LineupCard** (`src/app/_components/LineupCard/LineupCard.tsx`)
  - Remove `onVote` and `userVote` props and any passing-through to the stats bar.
- [ ] **Explore / list pages** (`src/app/lineups/explore/page.tsx`, `src/app/lineups/page.tsx`)
  - Remove `lineupVote` mutation usage and any `getUserVote` usage.
  - Remove `userVotes` map and `handleVote`.
  - Update sort options: replace “Most Votes” with “Most rated” and use `ratingCount` (and ensure API supports the new sort).
  - Stop passing `onVote` / `userVote` into card components.

### 5. Types and helpers

- [ ] **Shared types** (`src/lib/types.ts`)
  - Remove or narrow lineup-related vote types if they are only used for lineup votes. Keep comment/thread vote types.
- [ ] **Utils/helpers** (`src/lib/utils.ts`, `src/lib/helpers.ts`)
  - `getVoteDelta` (and any lineup-specific vote helpers) can remain for **comment/thread** votes. Remove or guard any usage that is only for lineup votes.

### 6. Data migration (optional but recommended)

- [ ] **Backfill lineup aggregates** (if needed)
  - Lineups already have `avgRating` and `ratingCount` maintained by the rating flow; no backfill needed for those.
- [ ] **Drop lineup vote data**
  - After deployment, run a one-off script to delete all documents from the **LineupVote** collection (or drop the collection). Use `{ lineup: lineupId }` when deleting by lineup if you do it per-lineup.
  - Alternatively, leave the collection in place as legacy and only stop reading/writing; then drop in a later cleanup.

### 7. Documentation and tests

- [ ] Update **docs/lineups.md** (and any API docs): remove references to lineup voting; document that lineup popularity is expressed via `avgRating` and `ratingCount`; update sort options to “Highest rated” and “Most rated”.
- [ ] Update **docs/trpc-api.md** (if it lists `lineupVote` / `getUserVote`): remove those procedures and document any new/updated sort enums.
- [ ] Adjust or remove tests that cover lineup upvote/downvote; add or update tests for “most-rated” sort and for lineup cards showing only rating stats.

## Out of scope (unchanged)

- **Comment votes**: `voteComment`, comment `totalVotes`, CommentVote model — keep as-is.
- **Thread votes**: `voteThread`, thread `totalVotes`, ThreadVote model — keep as-is.
- **Rating system**: `rateLineup`, Rating model, lineup `avgRating` / `ratingCount` / `ratingSum` — keep and use as the only lineup popularity signal.

## Checklist summary

| Area          | Action                                                                                         |
| ------------- | ---------------------------------------------------------------------------------------------- |
| Router        | Remove `lineupVote`, `getUserVote`; replace “most-votes” with “most-rated” (by `ratingCount`). |
| Lineup model  | Remove `totalVotes` and its index.                                                             |
| LineupVote    | Stop using; remove from exports; optionally drop collection.                                   |
| LineupCard UI | Show only avg rating + rating count; remove vote controls and props.                           |
| Explore/lists | Remove vote mutation and user vote state; update sort to “Most rated”.                         |
| Types/helpers | Keep comment/thread vote logic; remove lineup-only vote usage.                                 |
| Docs/tests    | Update lineup and API docs; adjust tests.                                                      |

Once these steps are done, lineup popularity will be gauged only by **avgRating** and **ratingCount**, and comments/threads will retain Reddit-style upvote/downvote for discussion.
