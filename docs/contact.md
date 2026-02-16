# Contact & Feedback

The contact page (`/contact`) provides a central hub for users to request new players, submit app feedback, and find developer links. It also links to the Getting Technical page (`/getting-technical`).

## Overview

The contact system provides:

- **Player request form** for users to submit requests for new players (requires authentication)
- **Feedback form** for anyone to share suggestions, bug reports, or general thoughts (no auth required)
- **Developer links** to GitHub, LinkedIn, and email for direct contact
- **Getting Technical** link to a future deep-dive into the app's engineering (currently a coming soon page)

## Routes

| Route                | Description                                  | Auth Required |
| -------------------- | -------------------------------------------- | ------------- |
| `/contact`           | Contact hub with all sections                | No            |
| `/getting-technical` | Coming soon page for technical documentation | No            |

## Page Sections

### 1. Request a Player

Allows authenticated users to request players that are missing from the database. Uses the existing `requestedPlayer.create` tRPC mutation.

**Fields:**

| Field            | Type   | Validation    | Description                 |
| ---------------- | ------ | ------------- | --------------------------- |
| `firstName`      | string | min 1, max 50 | Player's first name         |
| `lastName`       | string | min 1, max 50 | Player's last name          |
| `suggestedValue` | number | min 1, max 5  | Suggested cost tier ($1-$5) |

**Behavior:**

- If the user is not signed in, a prompt to sign in is displayed instead of the form
- Uses upsert logic: if a player with the same name already exists in requested players, the new suggestion is appended as a description
- Case-insensitive name matching prevents duplicate entries
- Success/error feedback via Sonner toast notifications

**tRPC Mutation:** `api.requestedPlayer.create` (protectedProcedure)

### 2. App Feedback

Allows anyone (authenticated or not) to submit feedback about the app. Feedback is stored in the database and sent as an email notification.

**Fields:**

| Field     | Type   | Validation           | Description           |
| --------- | ------ | -------------------- | --------------------- |
| `name`    | string | min 1, max 100       | Submitter's name      |
| `email`   | string | valid email, max 255 | Submitter's email     |
| `subject` | string | min 1, max 200       | Feedback subject      |
| `message` | string | min 1, max 2000      | Feedback message body |

**Behavior:**

- No authentication required
- Saves feedback to the `Feedback` MongoDB collection
- Sends an HTML email to `cassius.reynolds.dev@gmail.com` via Resend
- Email sending is non-blocking: if the email fails, the feedback is still saved
- Character count shown for the message field (max 2000)
- Success/error feedback via Sonner toast notifications

**tRPC Mutation:** `api.feedback.create` (publicProcedure)

### 3. Connect (Developer Links)

Static section with links to the developer's profiles:

| Link     | URL                                           |
| -------- | --------------------------------------------- |
| GitHub   | https://github.com/cassius2828                |
| LinkedIn | https://www.linkedin.com/in/cassius-reynolds/ |
| Email    | mailto:cassius.reynolds.dev@gmail.com         |

Also includes a highlighted "Getting Technical" card that links to `/getting-technical`.

## Data Model

### Feedback Schema

Located at `src/server/models/feedback.ts`:

```typescript
interface Feedback {
  id: string;
  name: string; // Submitter's name
  email: string; // Submitter's email
  subject: string; // Feedback subject
  message: string; // Feedback body (max 2000 chars)
  status: FeedbackStatus; // "new" | "read" | "resolved"
  createdAt: Date;
  updatedAt: Date;
}
```

**Status field:** Defaults to `"new"` and is designed for the future admin dashboard to track, mark, and manage feedback entries.

### Mongoose Schema Details

```typescript
const FeedbackSchema = new Schema<FeedbackDoc>(
  {
    name: { type: String, required: true, maxlength: 100 },
    email: { type: String, required: true, maxlength: 255 },
    subject: { type: String, required: true, maxlength: 200 },
    message: { type: String, required: true, maxlength: 2000 },
    status: {
      type: String,
      enum: ["new", "read", "resolved"],
      default: "new",
    },
  },
  { timestamps: true },
);
```

## API Endpoints

### Feedback Router (`src/server/api/routers/feedback.ts`)

#### `feedback.create` (Public)

Submit feedback. Saves to database and sends email notification.

**Input:**

```typescript
{
  name: string; // min 1, max 100
  email: string; // valid email, max 255
  subject: string; // min 1, max 200
  message: string; // min 1, max 2000
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

Retrieve all feedback entries, optionally filtered by status. Designed for the future admin dashboard.

**Input (optional):**

```typescript
{
  status?: "new" | "read" | "resolved";
}
```

**Returns:** Array of feedback entries sorted by `createdAt` descending.

#### `feedback.updateStatus` (Admin)

Update the status of a feedback entry. Designed for the future admin dashboard.

**Input:**

```typescript
{
  id: string;
  status: "new" | "read" | "resolved";
}
```

**Returns:**

```typescript
{
  id: string;
  status: string;
}
```

### Requested Player Router (existing)

The player request form uses the existing `requestedPlayer.create` mutation. See the admin section for details on the `RequestedPlayer` model.

## Email Integration

### Resend Setup

Email notifications use the [Resend](https://resend.com) service, configured in `src/server/email.ts`.

**Environment variable:**

```env
RESEND_API_KEY="re_xxxxx"
```

This variable is validated in `src/env.js` and must be set for the app to start.

### Email Format

Feedback emails are sent with:

- **From:** `Lineup Legends <onboarding@resend.dev>`
- **To:** `cassius.reynolds.dev@gmail.com`
- **Subject:** `[Lineup Legends Feedback] {user's subject}`
- **Reply-To:** The submitter's email address
- **Body:** Formatted HTML with the submitter's name, email, subject, and message

### Error Handling

Email sending is wrapped in a try/catch. If the email fails to send, the error is logged but the feedback is still saved to the database. This ensures feedback is never lost due to email service issues.

## Getting Technical Page

Route: `/getting-technical`

A coming soon placeholder page for future technical documentation about the app's architecture and engineering.

**Features:**

- Builder/wrench tool icon
- "Coming Soon" heading
- Description of planned content
- "Go Back" button (uses `router.back()`)
- "Go Home" button (links to `/`)
- Consistent dark theme with gold accents

## Navigation

The contact page is accessible from:

- **Desktop nav:** "Contact" link visible to all users (authenticated or not)
- **Mobile nav:** "Contact" link in the hamburger menu
- **Footer:** "Contact Us" link near the existing contact info section

## File Structure

```
src/
├── app/
│   ├── contact/
│   │   └── page.tsx              # Contact page (client component)
│   └── getting-technical/
│       └── page.tsx              # Coming soon page (client component)
├── server/
│   ├── email.ts                  # Resend email utility
│   ├── models/
│   │   └── feedback.ts           # Feedback Mongoose model
│   └── api/
│       └── routers/
│           └── feedback.ts       # Feedback tRPC router
```

## Future Considerations

1. **Admin dashboard integration:** The `feedback.getAll` and `feedback.updateStatus` endpoints are ready for a future admin feedback management page
2. **Rate limiting:** Consider adding rate limiting to the feedback form to prevent spam
3. **Custom Resend domain:** Replace `onboarding@resend.dev` with a custom domain sender for better deliverability
4. **Getting Technical content:** Build out the `/getting-technical` page with actual technical documentation about the app's architecture, features, and engineering decisions
5. **CAPTCHA:** Consider adding CAPTCHA to the feedback form since it's a public endpoint
