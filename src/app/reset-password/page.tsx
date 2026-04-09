"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { validatePassword } from "~/lib/password-validation";
import PasswordInput from "~/app/_components/ui/PasswordInput";
import PasswordRequirements from "~/app/_components/ui/PasswordRequirements";

type PageState = "form" | "loading" | "success" | "error";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [state, setState] = useState<PageState>(token ? "form" : "error");
  const [error, setError] = useState<string | null>(
    token ? null : "Invalid reset link. Please request a new one.",
  );

  const validation = validatePassword(password);
  const passwordsMatch = password === confirmPassword && confirmPassword !== "";
  const canSubmit = validation.isValid && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !token) return;

    setState("loading");
    setError(null);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Something went wrong. Please try again.");
        setState("error");
        return;
      }

      setState("success");
    } catch {
      setError("Something went wrong. Please try again.");
      setState("error");
    }
  };

  return (
    <main className="bg-surface-950 relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      {/* Background accents */}
      <div className="pointer-events-none absolute inset-0">
        <div className="bg-gold/[0.03] absolute top-0 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full blur-3xl" />
        <div className="bg-gold/[0.02] absolute bottom-0 left-0 h-[300px] w-[400px] rounded-full blur-3xl" />
      </div>

      {/* Corner accents */}
      <div className="from-gold/30 pointer-events-none absolute top-24 left-8 hidden h-32 w-px bg-gradient-to-b to-transparent sm:block" />
      <div className="from-gold/30 pointer-events-none absolute top-24 left-8 hidden h-px w-32 bg-gradient-to-r to-transparent sm:block" />
      <div className="from-gold/30 pointer-events-none absolute top-24 right-8 hidden h-32 w-px bg-gradient-to-b to-transparent sm:block" />
      <div className="from-gold/30 pointer-events-none absolute top-24 right-8 hidden h-px w-32 bg-gradient-to-l to-transparent sm:block" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo / Brand */}
        <div className="mb-10 text-center">
          <Link href="/" className="group inline-block">
            <h1 className="font-stencil text-4xl tracking-wider uppercase sm:text-5xl">
              <span className="text-gold group-hover:text-gold-light transition-colors">
                Lineup
              </span>{" "}
              <span className="text-foreground group-hover:text-foreground/90 transition-colors">
                Legends
              </span>
            </h1>
          </Link>
          <p className="text-foreground/50 mt-3">
            {state === "success" ? "You're all set" : "Choose a new password"}
          </p>
        </div>

        {/* Card */}
        <div className="border-foreground/10 bg-foreground/[0.03] rounded-xl border p-6 backdrop-blur-sm sm:p-8">
          {state === "success" ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-green-500/20 bg-green-500/10">
                <svg
                  className="h-7 w-7 text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
              </div>
              <h2 className="text-foreground mb-2 text-lg font-semibold">
                Password reset!
              </h2>
              <p className="text-foreground/50 mb-6 text-sm">
                Your password has been successfully updated. You can now sign in
                with your new password.
              </p>
              <Link
                href="/sign-in"
                className="border-gold bg-gold/10 hover:bg-gold hover:glow-gold-sm text-foreground focus-visible:ring-gold/50 focus-visible:ring-offset-surface-950 inline-block cursor-pointer rounded-lg border-2 px-8 py-3 text-sm font-semibold transition-all hover:text-black focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                Sign in
              </Link>
            </div>
          ) : state === "error" && !token ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10">
                <svg
                  className="h-7 w-7 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="text-foreground mb-2 text-lg font-semibold">
                Invalid link
              </h2>
              <p className="text-foreground/50 mb-6 text-sm">{error}</p>
              <Link
                href="/forgot-password"
                className="text-gold hover:text-gold-light text-sm transition-colors"
              >
                Request a new reset link
              </Link>
            </div>
          ) : (
            <>
              {error && state === "error" && (
                <div className="mb-6 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10">
                    <svg
                      className="h-7 w-7 text-red-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </div>
                  <h2 className="text-foreground mb-2 text-lg font-semibold">
                    Link expired
                  </h2>
                  <p className="text-foreground/50 mb-6 text-sm">{error}</p>
                  <Link
                    href="/forgot-password"
                    className="text-gold hover:text-gold-light text-sm transition-colors"
                  >
                    Request a new reset link
                  </Link>
                </div>
              )}

              {(state === "form" || state === "loading") && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="password"
                      className="text-foreground/70 mb-2 block text-sm font-medium"
                    >
                      New Password
                    </label>
                    <PasswordInput
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      required
                      disabled={state === "loading"}
                      className="border-foreground/20 bg-foreground/5 text-foreground placeholder-foreground/30 focus:border-gold focus:ring-gold w-full rounded-lg border px-4 py-3 transition-colors focus:ring-1 focus:outline-none disabled:opacity-50"
                    />
                    <PasswordRequirements password={password} />
                  </div>

                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="text-foreground/70 mb-2 block text-sm font-medium"
                    >
                      Confirm Password
                    </label>
                    <PasswordInput
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      required
                      disabled={state === "loading"}
                      className="border-foreground/20 bg-foreground/5 text-foreground placeholder-foreground/30 focus:border-gold focus:ring-gold w-full rounded-lg border px-4 py-3 transition-colors focus:ring-1 focus:outline-none disabled:opacity-50"
                    />
                    {confirmPassword && !passwordsMatch && (
                      <p className="mt-2 text-xs text-red-400">
                        Passwords do not match
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={!canSubmit || state === "loading"}
                    className="border-gold bg-gold/10 hover:bg-gold hover:glow-gold-sm text-foreground focus-visible:ring-gold/50 focus-visible:ring-offset-surface-950 w-full cursor-pointer rounded-lg border-2 px-4 py-3 text-sm font-semibold transition-all hover:text-black focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {state === "loading" ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/20 border-t-current" />
                        Resetting…
                      </span>
                    ) : (
                      "Reset Password"
                    )}
                  </button>
                </form>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {state !== "success" && (
          <p className="text-foreground/40 mt-6 text-center text-sm">
            <Link
              href="/sign-in"
              className="text-gold hover:text-gold-light transition-colors"
            >
              Back to sign in
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="bg-surface-950 flex min-h-screen items-center justify-center">
          <div className="border-foreground/20 border-t-gold h-10 w-10 animate-spin rounded-full border-4" />
        </main>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
