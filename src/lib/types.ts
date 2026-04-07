type ObjectIdLike = string | { toString(): string };

export function getId(
  obj: { id?: string; _id?: ObjectIdLike } | null | undefined,
): string {
  if (!obj) return "";
  if (obj.id) return obj.id;
  if (obj._id) {
    return typeof obj._id === "string" ? obj._id : obj._id.toString();
  }
  return "";
}
