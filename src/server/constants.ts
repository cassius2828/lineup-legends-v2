/** Display name for WebAuthn RP, TOTP issuer, and branded copy */
export const APP_DISPLAY_NAME = "Lineup Legends";

export const BCRYPT_ROUNDS = 12;

/** Password reset link validity (must match email copy and token storage) */
export const PASSWORD_RESET_TTL_MS = 5 * 60 * 1000;

export const WEBAUTHN_CHALLENGE_TTL_SECONDS = 300;

/** Email / login MFA code stored in Redis */
export const MFA_CODE_TTL_SECONDS = 600;

/** After MFA verification, JWT callback clears pending flag */
export const MFA_VERIFIED_TTL_SECONDS = 60;

/** Email change confirmation link validity */
export const EMAIL_CONFIRMATION_TTL_MS = 24 * 60 * 60 * 1000;

export function redisMfaCodeKey(userId: string): string {
  return `mfa-code:${userId}`;
}

export function redisWebauthnChallengeKey(userId: string): string {
  return `webauthn-challenge:${userId}`;
}

export function redisMfaVerifiedKey(userId: string): string {
  return `mfa-verified:${userId}`;
}

export function redisUserProfileCacheKey(userId: string): string {
  return `user:${userId}`;
}
