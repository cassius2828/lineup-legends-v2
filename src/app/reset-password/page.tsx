"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { AuthPageShell } from "~/app/_components/auth/AuthPageShell";
import PrimaryLoadingButton from "~/app/_components/ui/PrimaryLoadingButton";
import PasswordInput from "~/app/_components/ui/PasswordInput";
import PasswordRequirements from "~/app/_components/ui/PasswordRequirements";
import { validatePassword } from "~/lib/password-validation";
import { postJson } from "~/lib/post-json";

type FatalReason = "missing_token" | "invalid_or_expired_token";

function InvalidLinkCard({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
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
      <h2 className="text-foreground mb-2 text-lg font-semibold">{title}</h2>
      <p className="text-foreground/50 mb-6 text-sm">{message}</p>
      <Link
        href="/forgot-password"
        className="text-gold hover:text-gold-light text-sm transition-colors"
      >
        Request a new reset link
      </Link>
    </div>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fatal, setFatal] = useState<FatalReason | null>(
    token ? null : "missing_token",
  );
  const [inlineError, setInlineError] = useState<string | null>(null);

  const validation = validatePassword(password);
  const passwordsMatch = password === confirmPassword && confirmPassword !== "";
  const canSubmit = validation.isValid && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !token) return;

    setIsSubmitting(true);
    setInlineError(null);

    try {
      const result = await postJson<{ message?: string }>(
        "/api/auth/reset-password",
        { token, password },
      );

      if (!result.ok) {
        if (result.status >= 500) {
          setInlineError(
            result.error ?? "Something went wrong. Please try again.",
          );
          return;
        }
        if (result.code === "INVALID_OR_EXPIRED_TOKEN") {
          setFatal("invalid_or_expired_token");
          setInlineError(null);
          return;
        }
        setInlineError(
          result.error ?? "Could not update your password. Try again.",
        );
        return;
      }

      setSuccess(true);
    } catch {
      setInlineError("Network error. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthPageShell
      brandTitleSize="lg"
      subtitle={
        success
          ? "You're all set"
          : fatal
            ? "Reset link problem"
            : "Choose a new password"
      }
    >
      <div className="border-foreground/10 bg-foreground/[0.03] rounded-xl border p-6 backdrop-blur-sm sm:p-8">
        {success ? (
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
        ) : fatal === "missing_token" ? (
          <InvalidLinkCard
            title="Invalid link"
            message="Invalid reset link. Please request a new one."
          />
        ) : fatal === "invalid_or_expired_token" ? (
          <InvalidLinkCard
            title="Link invalid or expired"
            message="This password reset link is no longer valid. Request a new reset link."
          />
        ) : (
          <>
            {inlineError ? (
              <div
                role="alert"
                className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-sm text-red-400"
              >
                {inlineError}
              </div>
            ) : null}

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
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
                  className="border-foreground/20 bg-foreground/5 text-foreground placeholder-foreground/30 focus:border-gold focus:ring-gold w-full rounded-lg border px-4 py-3 transition-colors focus:ring-1 focus:outline-none disabled:opacity-50"
                />
                {confirmPassword && !passwordsMatch && (
                  <p className="mt-2 text-xs text-red-400">
                    Passwords do not match
                  </p>
                )}
              </div>

              <PrimaryLoadingButton
                type="submit"
                disabled={!canSubmit}
                isLoading={isSubmitting}
                loadingLabel="Resetting…"
              >
                Reset Password
              </PrimaryLoadingButton>
            </form>
          </>
        )}
      </div>

      {!success ? (
        <p className="text-foreground/40 mt-6 text-center text-sm">
          <Link
            href="/sign-in"
            className="text-gold hover:text-gold-light transition-colors"
          >
            Back to sign in
          </Link>
        </p>
      ) : null}
    </AuthPageShell>
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
