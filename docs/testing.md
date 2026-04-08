# Testing

Lineup Legends v2 uses **Jest** for unit tests and **Playwright** for E2E smoke tests.

## Unit Tests (Jest)

Unit tests cover pure functions, utilities, Mongoose model validation, Zod schemas, and server helpers.

### Running

```bash
npm test              # Run all unit tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report
```

### Configuration

- **Config**: `jest.config.cjs`
- **TypeScript**: `tsconfig.jest.json` (extends root, sets `module: commonjs` for Jest)
- **Environment**: Node (no JSDOM)
- **Path aliases**: `~/*` mapped to `src/*`
- **Test discovery**: `**/__tests__/**/*.test.ts`

### What is tested

| Area               | Files                               | What is covered                                                                                                         |
| ------------------ | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Lib utilities      | `src/lib/__tests__/`                | `getId`, `cn`, `getVoteDelta`, `getDisplayName`, `pluralize`, `getPaginationRange`, `getRatingColor`                    |
| Gamble logic       | `src/server/api/routers/__tests__/` | `selectWeightedValue`, `getOutcomeTier`, `calculateStreakChange`, `shouldResetDailyGambles`, odds matrix validation     |
| Mongoose models    | `src/server/models/__tests__/`      | Schema validation, required fields, defaults, virtuals, timestamps for all 11 models                                    |
| Zod output schemas | `src/server/api/schemas/__tests__/` | `mongoId` preprocessor, `populated` helper, `playerOutput`, `userSummaryOutput`, `commentOutput`, `lineupPlayersOutput` |
| Zod input schemas  | `src/server/api/schemas/__tests__/` | `commentBodySchema`, `threadBodySchema`, `playerSchema`, `lineupSortSchema`, `voteTypeSchema`                           |
| Server helpers     | `src/server/lib/__tests__/`         | `assertOwnership`, `assertFound`, `objectIdFromDate`                                                                    |
| Services           | `src/server/services/__tests__/`    | `buildLineupSort`                                                                                                       |

### Coverage

Coverage is tracked for `src/lib/`, `src/server/api/schemas/`, `src/server/models/`, `src/server/services/`, `src/server/lib/`, and `lineup-utils.ts`. Run `npm run test:coverage` to generate an HTML report in `coverage/`.

## E2E Smoke Tests (Playwright)

E2E tests verify that critical pages load and key flows work in a real browser (Chromium).

### Running

```bash
npm run test:e2e      # Run full E2E suite (headless)
npm run test:e2e:ui   # Playwright UI mode (for debugging)
npm run e2e:seed      # Seed the E2E test user independently
```

### Configuration

- **Config**: `playwright.config.ts`
- **Test directory**: `e2e/` (excluded from Jest and `tsconfig.json`)
- **Browser**: Chromium only
- **Web server**: Auto-starts `npm run dev` if not already running
- **Retries**: 1 (for flake tolerance)

### Test user

A dedicated test user (`e2e-test@lineuplegends.dev`) is seeded via `e2e/seed-test-user.ts` before each test run. The script uses MongoDB `findOneAndUpdate` with `upsert: true`, making it fully idempotent.

Playwright's `storageState` pattern is used: the `auth.setup.ts` file logs in once through the credentials form and saves the session to `e2e/.auth/user.json`. All authenticated tests reuse this saved session.

### What is tested

**Public pages** (`e2e/smoke.spec.ts`):

- Homepage loads with nav
- Sign-in page shows credentials form and Google button
- Explore lineups page loads
- Players page loads
- Contact page has form fields
- Privacy and Terms pages load
- Unauthorized page shows restricted message

**Authenticated flows** (`e2e/auth.spec.ts`):

- My Lineups page loads (not redirected to sign-in)
- Create Lineup page loads
- Nav shows correct links for non-admin user

### Idempotency

All tests are read-only -- they navigate and assert visible content without creating or deleting data. The test user seed uses upsert. The saved auth state is gitignored and regenerated each run.

## Pre-commit Hooks

Husky runs the following checks before each commit:

1. **`tsc --noEmit`** -- full TypeScript type check
2. **`lint-staged`** -- runs `prettier --write` on staged files (auto-formats)

Commit messages are validated by **commitlint** (conventional commit format) via the `commit-msg` hook.
