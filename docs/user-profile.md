# User Profile

The user profile system lets users view and customize their public profile, browse lineup statistics, upload images, follow other users, and manage theme preferences.

## Pages

| Route | Purpose |
| --- | --- |
| `/profile/[userId]` | Public profile page showing banner, avatar, bio, follow stats, lineup stats, and lineups |
| `/profile/edit` | Edit profile page for updating username, bio, profile image, and banner image |
| `/profile/settings` | Settings page for theme preference (dark/light mode) |
| `/users/search` | Search for other users by name or username, with inline follow/unfollow |

## Profile Page (`/profile/[userId]`)

The profile page is divided into several sections:

### Banner & Avatar

- A full-width banner image spans the top of the page (defaults to a gradient when not set)
- The user's avatar overlaps the bottom of the banner
- When viewing your own profile, both the banner and avatar are clickable to upload a new image directly from the profile page (no need to visit the edit page)
- Uploads go through the `/api/upload` route to S3 and return a CloudFront CDN URL

### Profile Header

- Displays the user's name, username (prefixed with `@`), and bio
- Shows follower and following counts as clickable buttons that open a modal listing the respective users
- If viewing another user's profile while authenticated, a Follow / Unfollow button is shown
- If viewing your own profile, an "Edit Profile" link is shown instead

### Lineup Stats Cards

Four stat cards are displayed in a grid:

| Stat | Description |
| --- | --- |
| Total Lineups | Total number of lineups the user has created |
| Avg Rating | Average `avgRating` across all of the user's lineups |
| Highest Rated | The user's lineup with the highest `avgRating` (links to the rate page) |
| Featured | Count of featured lineups out of a maximum of 3 |

Stats are computed server-side using a MongoDB aggregation pipeline on the Lineup collection.

### Featured Lineups

Up to 3 featured lineups are displayed in a dedicated section with a star icon header. Each renders using the existing `LineupCard` component.

### Recent Lineups

The most recent 6 lineups are shown below the featured section, with a count of total lineups for context.

## Edit Profile Page (`/profile/edit`)

The edit page includes:

- A live preview card showing the current banner, avatar, username, and bio
- Clickable image upload fields for both the banner and profile image
- Each upload field shows an empty state with file type/size hints, a loading spinner during upload, and a hover overlay to change an existing image
- Username input (3-30 characters, validated for uniqueness server-side)
- Bio textarea (max 250 characters with live character count)
- Requires authentication (redirects to sign-in if not authenticated)
- On save, navigates to the user's profile page

## Settings Page (`/profile/settings`)

A simple settings page with:

- **Theme toggle**: Switch between dark and light mode using `next-themes`
- Back link to the user's profile page
- Requires authentication (uses `profile.getMe` for user data)

## User Search (`/users/search`)

- A search input with 300ms debounce queries users by name or username (minimum 1 character)
- Results display each user's avatar, name, username, and follower count
- An inline Follow / Unfollow button appears on each result (hidden for your own card)
- Clicking a result navigates to that user's profile
- Uses `follow.searchUsers` endpoint (max 30 results)

## Image Upload

Profile and banner images are uploaded via a Next.js API route:

| Detail | Value |
| --- | --- |
| Endpoint | `POST /api/upload` |
| Content type | `multipart/form-data` |
| Fields | `file` (the image), `type` (`"profile"` or `"banner"`) |
| Allowed types | JPEG, PNG, WebP, GIF |
| Max size | 5 MB |
| Storage | AWS S3 bucket at `profiles/{userId}/{type}-{timestamp}.{ext}` |
| Returns | CloudFront CDN URL |

The route requires authentication and rejects requests without a valid session.

## Follow System

The follow system is a simple toggle (no friend requests or approval flow).

### How It Works

1. A user clicks Follow on another user's profile or search result
2. The `follow.toggleFollow` mutation creates a `Follow` document (`follower` → `following`)
3. Both users' denormalized counts are atomically updated using `$inc`:
   - The current user's `followingCount` increments by 1
   - The target user's `followerCount` increments by 1
4. Clicking again (Unfollow) deletes the document and decrements both counts
5. Self-follow is prevented server-side

### Data Model

The follow relationship uses the existing `Follow` model in `src/server/models/follow.ts`:

- `follower` (ObjectId → User): the user who is following
- `following` (ObjectId → User): the user being followed
- Compound unique index on `(follower, following)` prevents duplicates

Counts are stored directly on the User model (`followerCount`, `followingCount`) for fast reads.

### tRPC Endpoints

| Endpoint | Type | Auth | Description |
| --- | --- | --- | --- |
| `follow.toggleFollow` | Mutation | Protected | Follow or unfollow a user (no self-follow) |
| `follow.isFollowing` | Query | Protected | Check if the current user follows a target user |
| `follow.getFollowers` | Query | Public | Paginated list of a user's followers |
| `follow.getFollowing` | Query | Public | Paginated list of users a user follows |
| `follow.searchUsers` | Query | Public | Search users by name or username (1-100 chars, max 30 results) |

Pagination uses cursor-based paging with a configurable limit (default 20, max 50).

## Profile Router Endpoints

| Endpoint | Type | Auth | Description |
| --- | --- | --- | --- |
| `profile.getById` | Query | Public | Full profile with lineups, stats, and featured lineups (Redis cached) |
| `profile.getMe` | Query | Protected | Current user's profile data including email (Redis cached) |
| `profile.update` | Mutation | Protected | Update username, bio, profile image, banner image, or social media |
| `profile.getFeaturedLineups` | Query | Public | Up to 3 featured lineups for a user |

The `getById` endpoint runs lineup queries and the stats aggregation in parallel for performance. Results are cached in Redis with a `user:{userId}` key that is invalidated on `profile.update`.

### Social Media

The `profile.update` mutation accepts an optional `socialMedia` object:

```typescript
{
  socialMedia?: {
    twitter?: string | null;
    instagram?: string | null;
    facebook?: string | null;
  }
}
```

## Navigation

Both the desktop and mobile navigation bars include a "Find Users" link (visible to authenticated users) that navigates to `/users/search`.

## File Structure

```
src/
├── app/
│   ├── api/upload/route.ts           # Image upload API route
│   ├── profile/
│   │   ├── [userId]/page.tsx         # Public profile page
│   │   ├── edit/page.tsx             # Edit profile page
│   │   └── settings/page.tsx         # Settings page (theme toggle)
│   └── users/search/page.tsx         # User search page
└── server/
    ├── api/routers/
    │   ├── follow.ts                 # Follow router (toggle, isFollowing, lists, search)
    │   └── profile.ts                # Profile router (getById, getMe, update, featured)
    ├── models/
    │   ├── user.ts                   # User model (includes followerCount, followingCount)
    │   └── follow.ts                 # Follow model (follower → following)
    └── s3.ts                         # S3 upload utility
```
