import crypto from "crypto";
import * as OTPAuth from "otpauth";
import { env } from "~/env";
import { APP_DISPLAY_NAME } from "~/server/constants";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AES_256_KEY_BYTES = 32;

const RP_ID_FALLBACK = "localhost";

function getEncryptionKey(): Buffer {
  const buf = Buffer.from(env.MFA_ENCRYPTION_KEY, "hex");
  if (buf.length !== AES_256_KEY_BYTES) {
    throw new Error(
      `MFA_ENCRYPTION_KEY must be ${AES_256_KEY_BYTES} bytes (${AES_256_KEY_BYTES * 2} hex characters)`,
    );
  }
  return buf;
}

/** WebAuthn relying party id from public app URL hostname */
export function getWebAuthnRpId(): string {
  try {
    const url = new URL(env.NEXT_PUBLIC_APP_URL);
    return url.hostname;
  } catch {
    return RP_ID_FALLBACK;
  }
}

/** Expected origin for WebAuthn (no trailing slash) */
export function getWebAuthnOrigin(): string {
  return env.NEXT_PUBLIC_APP_URL;
}

export function encryptSecret(plaintext: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  // Format: iv:tag:ciphertext (all hex)
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptSecret(ciphertext: string): string {
  const [ivHex, tagHex, encryptedHex] = ciphertext.split(":");
  if (!ivHex || !tagHex || !encryptedHex) {
    throw new Error("Invalid encrypted secret format");
  }
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final("utf8");
}

export function generateTotpSecret(email: string): {
  secret: string;
  otpauthUrl: string;
} {
  const totp = new OTPAuth.TOTP({
    issuer: APP_DISPLAY_NAME,
    label: email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: new OTPAuth.Secret({ size: 20 }),
  });

  return {
    secret: totp.secret.base32,
    otpauthUrl: totp.toString(),
  };
}

export function verifyTotpCode(secret: string, code: string): boolean {
  const totp = new OTPAuth.TOTP({
    issuer: APP_DISPLAY_NAME,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });

  // Allow 1 period of drift in each direction
  const delta = totp.validate({ token: code, window: 1 });
  return delta !== null;
}

export function generateMfaCode(): string {
  const code = crypto.randomInt(0, 1_000_000);
  return code.toString().padStart(6, "0");
}
