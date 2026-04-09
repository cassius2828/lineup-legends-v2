"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { startAuthentication } from "@simplewebauthn/browser";

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

  const handleSendCode = useCallback(async (method: "email") => {
    setIsSending(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/send-mfa-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Failed to send code");
      } else {
        setCodeSent(true);
      }
    } catch {
      setError("Failed to send code");
    } finally {
      setIsSending(false);
    }
  }, []);

  const handleVerify = useCallback(async () => {
    if (activeMethod !== "passkey" && !code.trim()) {
      setError("Please enter a verification code");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (activeMethod === "passkey") {
        // Get authentication options first
        const optionsRes = await fetch("/api/auth/send-mfa-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ method: "passkey" }),
        });

        if (!optionsRes.ok) {
          const data = (await optionsRes.json()) as { error?: string };
          setError(data.error ?? "Failed to get passkey options");
          setIsLoading(false);
          return;
        }

        const { options } = (await optionsRes.json()) as {
          options: Parameters<typeof startAuthentication>[0];
        };
        const credential = await startAuthentication(options);

        const verifyRes = await fetch("/api/auth/verify-mfa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            method: "passkey",
            passkeyResponse: credential,
          }),
        });

        if (!verifyRes.ok) {
          const data = (await verifyRes.json()) as { error?: string };
          setError(data.error ?? "Passkey verification failed");
          setIsLoading(false);
          return;
        }
      } else {
        const verifyRes = await fetch("/api/auth/verify-mfa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ method: activeMethod, code }),
        });

        if (!verifyRes.ok) {
          const data = (await verifyRes.json()) as { error?: string };
          setError(data.error ?? "Invalid verification code");
          setIsLoading(false);
          return;
        }
      }

      // Clear mfaPending from session
      await updateSession();
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setIsLoading(false);
    }
  }, [activeMethod, code, router, updateSession]);

  // If no MFA pending, redirect home
  if (session && !session.user?.mfaPending) {
    router.push("/");
    return null;
  }

  if (!session) {
    return (
      <main className="bg-surface-950 flex min-h-screen items-center justify-center">
        <div className="border-foreground/20 border-t-gold h-10 w-10 animate-spin rounded-full border-4" />
      </main>
    );
  }

  return (
    <main className="bg-surface-950 relative flex min-h-screen items-center justify-center px-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="bg-gold/[0.03] absolute top-0 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="group inline-block">
            <h1 className="font-stencil text-3xl tracking-wider uppercase">
              <span className="text-gold">Lineup</span>{" "}
              <span className="text-foreground">Legends</span>
            </h1>
          </Link>
          <p className="text-foreground/50 mt-3">
            Two-factor authentication required
          </p>
        </div>

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

          {/* Method tabs */}
          {methods.length > 1 && (
            <div className="border-foreground/10 bg-surface-800 mb-6 flex gap-1 rounded-lg border p-1">
              {methods.map((method) => (
                <button
                  key={method}
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

          {/* Verification input */}
          {activeMethod === "passkey" ? (
            <div className="space-y-4">
              <p className="text-foreground/60 text-sm">
                Use your registered passkey to verify your identity.
              </p>
              <button
                onClick={handleVerify}
                disabled={isLoading}
                className="bg-gold hover:bg-gold-light w-full rounded-lg py-3 font-semibold text-black transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/20 border-t-current" />
                    Verifying...
                  </span>
                ) : (
                  "Use Passkey"
                )}
              </button>
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
                      : "Click below to receive a verification code via email."}
                  </p>
                  {!codeSent && (
                    <button
                      onClick={() => handleSendCode(activeMethod)}
                      disabled={isSending}
                      className="border-gold text-gold hover:bg-gold/10 w-full rounded-lg border py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {isSending ? "Sending..." : "Send Code"}
                    </button>
                  )}
                </div>
              )}

              <div>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="000000"
                  className="border-foreground/20 bg-foreground/5 text-foreground placeholder-foreground/30 focus:border-gold focus:ring-gold w-full rounded-lg border px-4 py-3 text-center text-2xl tracking-[0.5em] transition-colors focus:ring-1 focus:outline-none"
                  autoFocus={activeMethod === "totp"}
                />
              </div>

              <button
                onClick={handleVerify}
                disabled={isLoading || code.length !== 6}
                className="bg-gold hover:bg-gold-light w-full rounded-lg py-3 font-semibold text-black transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/20 border-t-current" />
                    Verifying...
                  </span>
                ) : (
                  "Verify"
                )}
              </button>

              {activeMethod === "email" && codeSent && (
                <button
                  onClick={() => handleSendCode(activeMethod)}
                  disabled={isSending}
                  className="text-foreground/50 hover:text-foreground/70 w-full text-center text-sm transition-colors"
                >
                  {isSending ? "Resending..." : "Resend code"}
                </button>
              )}
            </div>
          )}

          <div className="border-foreground/10 mt-6 border-t pt-4">
            <button
              onClick={() => signOut({ callbackUrl: "/sign-in" })}
              className="text-foreground/40 hover:text-foreground/60 w-full text-center text-sm transition-colors"
            >
              Sign out and try a different account
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
