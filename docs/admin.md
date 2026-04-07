# Admin Dashboard

The admin dashboard provides a private interface for site administrators to manage content and monitor platform activity. Access is restricted to users with the `admin` flag on their account.

## Access Control

- Admin status is stored as a boolean on the User model
- The `adminProcedure` tRPC middleware rejects non-admin requests with a `FORBIDDEN` error
- The admin layout performs a server-side session check and redirects unauthorized users to `/unauthorized`
- Admin links in the navigation are only visible to admin users

## Pages

| Route | Purpose |
| --- | --- |
| `/admin` | Dashboard overview with platform stats, recent activity, and quick links |
| `/admin/players` | Search, filter, and manage the player database |
| `/admin/add-player` | Add a new player to the database |
| `/admin/edit-player/[playerId]` | Edit an existing player |
| `/admin/requested` | View player requests submitted by users |
| `/admin/requested/[id]` | Review a request and optionally quick-add the player |
| `/admin/feedback` | View, filter, and manage user feedback by status |
| `/admin/gamble-animations` | Preview and test gamble outcome animations |

## Dashboard Stats

The main dashboard (`/admin`) aggregates counts from across the platform using `admin.getStats` (cached in Redis for 5 minutes):

- Total users (with new-this-week and new-this-month counts)
- Total lineups
- Total players in the database
- Total ratings given
- Total comments
- Total follows
- Pending feedback (status: "new")
- Outstanding player requests

Recent signups and recent feedback are also surfaced for quick review.

### Quick Links

The dashboard includes quick navigation to:

- Add new player
- View requested players
- View feedback
- Test player images (`/test/player-images`)
- Gamble animations preview

## Player Management

### Player List (`/admin/players`)

- Full-text search across player names
- Filter by value tier ($1–$5)
- Results count display
- Links to edit individual players
- "Can't find a player?" section linking to the add player page

### Add Player (`/admin/add-player`)

- Form for first name, last name, value (1-5), and image URL
- Duplicate name check (case-insensitive) before creation
- Invalidates the Redis player cache on success

### Edit Player (`/admin/edit-player/[playerId]`)

- Pre-populated form with current player data
- Update first name, last name, value, and image URL
- Invalidates the Redis player cache on success

## Feedback Management

Feedback items progress through three statuses: **New**, **Read**, and **Resolved**. The feedback page (`/admin/feedback`) provides filter tabs for each status and allows admins to update the status of any item inline.

## Requested Players

When users request a player that doesn't exist in the database, admins can review the request along with all user-submitted value suggestions. A quick-add form on the request detail page lets admins create the player directly and then remove the fulfilled request.

### Request Detail (`/admin/requested/[id]`)

- Shows player name and all submitted descriptions/value suggestions
- Each suggestion shows the user who submitted it and their suggested value
- Quick-add form to create the player directly from the request

## Gamble Animations (`/admin/gamble-animations`)

A testing page for previewing the 7 gamble outcome tier animations:

- Select from: `jackpot`, `big_win`, `upgrade`, `neutral`, `downgrade`, `big_loss`, `disaster`
- Renders `GambleReveal` component with mock player data
- Replay button to re-trigger the animation
- Useful for testing the flip animation, suspense phase, confetti, and sound effects

## Layout

All admin pages share a sidebar layout (`AdminSidebar`) with navigation links. The global site header and footer are hidden within the admin section to keep the interface focused.

## API

### `admin.getStats` (Admin)

Aggregates counts across all collections in a single procedure. Results are cached in Redis (`admin:stats` key, 5-minute TTL) to avoid running 13 parallel queries on every page load.

**Returns:**

```typescript
{
  users: number;
  lineups: number;
  players: number;
  ratings: number;
  comments: number;
  follows: number;
  feedback: number;
  requestedPlayers: number;
  usersThisWeek: number;
  usersThisMonth: number;
  recentUsers: User[];
  recentFeedback: Feedback[];
}
```
