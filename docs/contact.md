# Contact & Feedback

The contact page (`/contact`) provides a central hub for users to request new players, submit app feedback, and find developer links. It also links to the Getting Technical page.

## Overview

The contact system provides:

- **Player request form** for users to submit requests for new players (anonymous or authenticated)
- **Feedback form** for anyone to share suggestions, bug reports, or general thoughts
- **Developer links** to GitHub, LinkedIn, and email for direct contact
- **Getting Technical** link to the technical documentation page with video content

## Routes

| Route                        | Description                                             | Auth Required |
| ---------------------------- | ------------------------------------------------------- | ------------- |
| `/contact`                   | Contact hub with all sections                           | No            |
| `/getting-technical`         | Technical documentation hub with topic grid and videos  | No            |
| `/getting-technical/[slug]`  | Individual topic page with optional YouTube embed       | No            |

## Page Sections

### 1. Request a Player

Allows users to request players that are missing from the database. Uses the `requestedPlayer.create` tRPC mutation.

**Fields:**

| Field            | Type   | Validation    | Description                 |
| ---------------- | ------ | ------------- | --------------------------- |
| `firstName`      | string | min 1, max 50 | Player's first name         |
| `lastName`       | string | min 1, max 50 | Player's last name          |
| `suggestedValue` | number | min 1, max 5  | Suggested cost tier ($1-$5) |
| `note`           | string | optional      | Additional context          |

**Behavior:**

- Works for both authenticated and unauthenticated users (anonymous requests are allowed)
- Debounced duplicate search (via `requestedPlayer.searchDuplicates`) shows potential matches using Fuse.js fuzzy matching as the user types
- `DuplicateHints` component displays up to 5 matches with match percentage
- Uses upsert logic: if a player with the same name already exists in requested players, the new suggestion is appended as a description
- Case-insensitive name matching prevents duplicate entries
- Success/error feedback via Sonner toast notifications

**tRPC Mutation:** `api.requestedPlayer.create` (publicProcedure)

### 2. App Feedback

Allows anyone to submit feedback about the app. Feedback is stored in the database and sent as an email notification.

**Fields:**

| Field     | Type   | Validation           | Description           |
| --------- | ------ | -------------------- | --------------------- |
| `name`    | string | min 1, max 100       | Submitter's name      |
| `email`   | string | optional             | Submitter's email (auto-filled from session if authenticated) |
| `subject` | string | min 1, max 200       | Feedback subject      |
| `message` | string | min 1, max 2000      | Feedback message body |

**Behavior:**

- No authentication required
- If the user is authenticated, the email field is auto-filled from the session
- Saves feedback to the `Feedback` MongoDB collection
- Sends an HTML email to `cassius.reynolds.dev@gmail.com` via Resend
- Email sending is non-blocking: if the email fails, the feedback is still saved
- Character count shown for the message field (max 2000)
- Success/error feedback via Sonner toast notifications
- Framer Motion animations on the form sections

**tRPC Mutation:** `api.feedback.create` (publicProcedure)

### 3. Connect (Developer Links)

Static section with links to the developer's profiles:

| Link     | URL                                           |
| -------- | --------------------------------------------- |
| GitHub   | https://github.com/cassius2828                |
| LinkedIn | https://www.linkedin.com/in/cassius-reynolds/ |
| Email    | mailto:cassius.reynolds.dev@gmail.com         |

Also includes a highlighted "Getting Technical" card that links to `/getting-technical`.

## Getting Technical Page

### Topic Hub (`/getting-technical`)

The Getting Technical page serves as a technical documentation hub with:

- **Topic grid** organized by category (features, backend, frontend)
- Each topic has a title, description, icon, status (`ready` or `coming-soon`), and optional video
- Category-colored badges for visual organization
- Topics are defined in `src/app/getting-technical/_data/topics.ts`
- Admin-only: "Add Standalone Video" form to add YouTube videos via `video.create`

### Topic Detail (`/getting-technical/[slug]`)

Individual topic pages with:

- Optional YouTube video embed
- Markdown-rendered content via `MarkdownContent` component
- Not-found state for invalid slugs

### Categories

| Category  | Color  | Description                     |
| --------- | ------ | ------------------------------- |
| Features  | blue   | User-facing features            |
| Backend   | green  | Server-side architecture        |
| Frontend  | purple | Client-side implementation      |

## Data Model

### Feedback Schema

Located at `src/server/models/feedback.ts`:

```typescript
interface Feedback {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: FeedbackStatus; // "new" | "read" | "resolved"
  createdAt: Date;
  updatedAt: Date;
}
```

### Video Schema

Located at `src/server/models/video.ts`:

```typescript
interface Video {
  id: string;
  youtubeId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  duration: string;
  timestamps: VideoTimestamp[];
  addedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
```

## API Endpoints

### Feedback Router (`src/server/api/routers/feedback.ts`)

#### `feedback.create` (Public)

Submit feedback. Saves to database and sends email notification.

**Input:**

```typescript
{
  name: string;
  email?: string;   // optional; from session if authenticated
  subject: string;
  message: string;
}
```

**Returns:**

```typescript
{
  id: string;
  success: boolean;
}
```

#### `feedback.getAll` (Admin)

Retrieve all feedback entries, optionally filtered by status.

**Input (optional):**

```typescript
{
  status?: "new" | "read" | "resolved";
}
```

**Returns:** Array of feedback entries sorted by `createdAt` descending.

#### `feedback.updateStatus` (Admin)

Update the status of a feedback entry.

**Input:**

```typescript
{
  id: string;
  status: "new" | "read" | "resolved";
}
```

### Requested Player Router (`src/server/api/routers/requestedPlayer.ts`)

#### `requestedPlayer.searchDuplicates` (Public)

Fuzzy search against existing players using Fuse.js. Returns matches with `matchPercent >= 60`.

#### `requestedPlayer.create` (Public)

Create or append to a player request. Anonymous requests are supported (no `user` field when unauthenticated).

#### `requestedPlayer.getAll` (Public)

List all requests with description counts.

#### `requestedPlayer.getById` (Public)

Get a single request with populated user descriptions.

#### `requestedPlayer.delete` (Admin)

Delete a player request.

### Video Router (`src/server/api/routers/video.ts`)

#### `video.getAll` (Public)

Get all videos.

#### `video.create` (Admin)

Create a video from a YouTube URL. Extracts the YouTube ID, fetches metadata (title, thumbnail, duration), and checks for duplicates.

#### `video.delete` (Admin)

Delete a video by ID.

## Email Integration

### Resend Setup

Email notifications use the [Resend](https://resend.com) service, configured in `src/server/email.ts`.

**Environment variable:**

```env
RESEND_API_KEY="re_xxxxx"
```

### Email Format

Feedback emails are sent with:

- **From:** `Lineup Legends <onboarding@resend.dev>`
- **To:** `cassius.reynolds.dev@gmail.com`
- **Subject:** `[Lineup Legends Feedback] {user's subject}`
- **Reply-To:** The submitter's email address
- **Body:** Formatted HTML with the submitter's name, email, subject, and message

### Error Handling

Email sending is wrapped in a try/catch. If the email fails to send, the error is logged but the feedback is still saved to the database. This ensures feedback is never lost due to email service issues.

## Navigation

The contact page is accessible from:

- **Desktop nav:** "Contact" link visible to all users (authenticated or not)
- **Mobile nav:** "Contact" link in the hamburger menu

## File Structure

```
src/
├── app/
│   ├── contact/
│   │   └── page.tsx                      # Contact page (client component)
│   ├── getting-technical/
│   │   ├── page.tsx                      # Topic hub (client component)
│   │   ├── [slug]/page.tsx               # Individual topic page
│   │   └── _data/topics.ts              # Topic definitions and categories
├── server/
│   ├── email.ts                          # Resend email utility
│   ├── models/
│   │   ├── feedback.ts                   # Feedback Mongoose model
│   │   └── video.ts                      # Video Mongoose model
│   └── api/
│       └── routers/
│           ├── feedback.ts               # Feedback tRPC router
│           ├── requestedPlayer.ts        # Requested player tRPC router
│           └── video.ts                  # Video tRPC router
```
