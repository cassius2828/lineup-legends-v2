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
| `/admin` | Dashboard overview with platform stats and recent activity |
| `/admin/players` | Search, filter, and manage the player database |
| `/admin/add-player` | Add a new player to the database |
| `/admin/edit-player/[playerId]` | Edit an existing player |
| `/admin/requested` | View player requests submitted by users |
| `/admin/requested/[id]` | Review a request and optionally quick-add the player |
| `/admin/feedback` | View, filter, and manage user feedback by status |

## Dashboard Stats

The main dashboard aggregates counts from across the platform:

- Total users (with new-this-week count)
- Total lineups
- Total players in the database
- Total ratings given
- Pending feedback
- Outstanding player requests

Recent signups and recent feedback are also surfaced for quick review.

## Feedback Management

Feedback items progress through three statuses: **New**, **Read**, and **Resolved**. The feedback page provides filter tabs for each status and allows admins to update the status of any item inline.

## Requested Players

When users request a player that doesn't exist in the database, admins can review the request along with all user-submitted value suggestions. A quick-add form on the request detail page lets admins create the player directly and then remove the fulfilled request.

## Layout

All admin pages share a sidebar layout with navigation links. The global site header and footer are hidden within the admin section to keep the interface focused.
