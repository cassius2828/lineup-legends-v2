import { formatDistanceToNow } from "date-fns";

export function formatRelativeTime(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function getDisplayName(user: {
  name?: string | null;
  username?: string | null;
}): string {
  return user.name ?? user.username ?? "Anonymous";
}

export function pluralize(
  count: number,
  singular: string,
  plural?: string,
): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}
