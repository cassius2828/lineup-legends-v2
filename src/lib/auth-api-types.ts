import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/types";

/** POST /api/auth/send-mfa-code — success when requesting passkey options */
export type SendMfaPasskeyOptionsResponse = {
  options: PublicKeyCredentialRequestOptionsJSON;
};

/** POST /api/auth/verify-mfa */
export type VerifyMfaRequestBody =
  | { method: "totp" | "email"; code: string }
  | { method: "passkey"; passkeyResponse: AuthenticationResponseJSON };
