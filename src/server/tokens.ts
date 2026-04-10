import crypto from "crypto";

export function hashSha256Hex(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}
