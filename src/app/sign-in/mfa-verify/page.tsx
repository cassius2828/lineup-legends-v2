"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { startAuthentication } from "@simplewebauthn/browser";
import { AuthPageShell } from "~/app/_components/auth/AuthPageShell";
import OtpCodeInput from "~/app/_components/ui/OtpCodeInput";
import PrimaryLoadingButton from "~/app/_components/ui/PrimaryLoadingButton";
import type {
  SendMfaPasskeyOptionsResponse,
  VerifyMfaRequestBody,
} from "~/lib/auth-api-types";
import { postJson } from "~/lib/post-json";

type MfaMethod = "totp" | "email" | "passkey";

const METHOD_LABELS: Record<MfaMethod, string> = {
  totp: "Authenticator App",
  email: "Email",
  passkey: "Passkey",
};

export default function MfaVerifyPage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();

  const methods = (session?.user?.mfaMethods ?? []) as MfaMethod[];
  const [activeMethod, setActiveMethod] = useState<MfaMethod>(
    methods[0] ?? "totp",
  );
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codeSent, setCodeSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const shouldRedirectHome =
    session?.user != null && session.user.mfaPending === false;

  useEffect(() => {
    if (shouldRedirectHome) {
      router.replace("/");
    }
  }, [shouldRedirectHome, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSendCode = useCallback(async (method: "email") => {
    setIsSending(true);
    setError(null);
    try {
      const result = await postJson<{ success?: boolean }>(
        "/api/auth/send-mfa-code",
        { method },
      );
      if (!result.ok) {
        setError(result.error ?? "Failed to send code");
      } else {
        setCodeSent(true);
        setCooldown(60);
      }
    } catch {
      setError("Failed to send code");
    } finally {
      setIsSending(false);
    }
  }, []);

  useEffect(() => {
    if (activeMethod === "email" && !codeSent && !isSending && session?.user) {
      void handleSendCode("email");
    }
  }, [activeMethod, codeSent, isSending, session?.user, handleSendCode]);

  const handleVerify = useCallback(async () => {
    if (activeMethod !== "passkey" && !code.trim()) {
      setError("Please enter a verification code");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (activeMethod === "passkey") {
        const optionsResult = await postJson<SendMfaPasskeyOptionsResponse>(
          "/api/auth/send-mfa-code",
          { method: "passkey" },
        );

        if (!optionsResult.ok) {
          setError(optionsResult.error ?? "Failed to get passkey options");
          setIsLoading(false);
          return;
        }

        const { options } = optionsResult.data;
        const credential = await startAuthentication(options);

        const verifyResult = await postJson<unknown>("/api/auth/verify-mfa", {
          method: "passkey",
          passkeyResponse: credential,
        } satisfies VerifyMfaRequestBody);

        if (!verifyResult.ok) {
          setError(verifyResult.error ?? "Passkey verification failed");
          setIsLoading(false);
          return;
        }
      } else {
        const body: VerifyMfaRequestBody =
          activeMethod === "totp"
            ? { method: "totp", code }
            : { method: "email", code };

        const verifyResult = await postJson("/api/auth/verify-mfa", body);

        if (!verifyResult.ok) {
          setError(verifyResult.error ?? "Invalid verification code");
          setIsLoading(false);
          return;
        }
      }

      await updateSession({ mfaVerified: true });
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setIsLoading(false);
    }
  }, [activeMethod, code, router, updateSession]);

  if (!session) {
    return (
      <main className="bg-surface-950 flex min-h-screen items-center justify-center">
        <div className="border-foreground/20 border-t-gold h-10 w-10 animate-spin rounded-full border-4" />
      </main>
    );
  }

  if (shouldRedirectHome) {
    return (
      <main className="bg-surface-950 flex min-h-screen items-center justify-center">
        <div className="border-foreground/20 border-t-gold h-10 w-10 animate-spin rounded-full border-4" />
      </main>
    );
  }

  return (
    <AuthPageShell
      brandTitleSize="md"
      subtitle="Two-factor authentication required"
    >
      <div className="border-foreground/10 bg-foreground/[0.03] rounded-xl border p-6 backdrop-blur-sm sm:p-8">
        <div className="mb-6">
          <h2 className="text-foreground text-lg font-semibold">
            Verify Your Identity
          </h2>
          <p className="text-foreground/50 mt-1 text-sm">
            Choose a verification method to continue
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {methods.length > 1 && (
          <div className="border-foreground/10 bg-surface-800 mb-6 flex gap-1 rounded-lg border p-1">
            {methods.map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => {
                  setActiveMethod(method);
                  setCode("");
                  setError(null);
                  setCodeSent(false);
                }}
                className={`flex-1 rounded-md px-3 py-2 text-xs font-medium transition-all ${
                  activeMethod === method
                    ? "bg-foreground/10 text-foreground shadow-sm"
                    : "text-foreground/50 hover:text-foreground/70"
                }`}
              >
                {METHOD_LABELS[method]}
              </button>
            ))}
          </div>
        )}

        {activeMethod === "passkey" ? (
          <div className="space-y-4">
            <p className="text-foreground/60 text-sm">
              Use your registered passkey to verify your identity.
            </p>
            <PrimaryLoadingButton
              type="button"
              onClick={handleVerify}
              isLoading={isLoading}
              loadingLabel="Verifying..."
            >
              Use Passkey
            </PrimaryLoadingButton>
          </div>
        ) : (
          <div className="space-y-4">
            {activeMethod === "totp" && (
              <p className="text-foreground/60 text-sm">
                Enter the 6-digit code from your authenticator app.
              </p>
            )}

            {activeMethod === "email" && (
              <div className="space-y-3">
                <p className="text-foreground/60 text-sm">
                  {codeSent
                    ? "A verification code has been sent to your email."
                    : "Sending a verification code to your email..."}
                </p>
              </div>
            )}

            <div>
              <OtpCodeInput
                variant="large"
                value={code}
                onChange={setCode}
                placeholder="000000"
                autoFocus={activeMethod === "totp"}
              />
            </div>

            <PrimaryLoadingButton
              type="button"
              onClick={handleVerify}
              disabled={code.length !== 6}
              isLoading={isLoading}
              loadingLabel="Verifying..."
            >
              Verify
            </PrimaryLoadingButton>

            {activeMethod === "email" && codeSent && (
              <button
                type="button"
                onClick={() => handleSendCode("email")}
                disabled={isSending || cooldown > 0}
                className="text-foreground/50 hover:text-foreground/70 w-full text-center text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSending
                  ? "Resending..."
                  : cooldown > 0
                    ? `Resend code in ${cooldown}s`
                    : "Resend code"}
              </button>
            )}
          </div>
        )}

        <div className="border-foreground/10 mt-6 border-t pt-4">
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/sign-in" })}
            className="text-foreground/40 hover:text-foreground/60 w-full text-center text-sm transition-colors"
          >
            Sign out and try a different account
          </button>
        </div>
      </div>
    </AuthPageShell>
  );
}
