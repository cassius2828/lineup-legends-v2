"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { AlertTriangle, MailOpen } from "lucide-react";
import { useState } from "react";
import { AuthPageShell } from "~/app/_components/auth/AuthPageShell";
import FormInput from "~/app/_components/common/ui/FormInput";
import PrimaryLoadingButton from "~/app/_components/common/ui/PrimaryLoadingButton";
import { postJson } from "~/lib/post-json";

type PageState = "form" | "loading" | "success" | "oauth_only";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<PageState>("form");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setState("loading");
    setError(null);

    try {
      const result = await postJson<{ message?: string }>(
        "/api/auth/forgot-password",
        { email: email.trim() },
      );

      if (!result.ok) {
        if (result.code === "OAUTH_ONLY") {
          setState("oauth_only");
          return;
        }
        setError(result.error ?? "Something went wrong. Please try again.");
        setState("form");
        return;
      }

      setState("success");
    } catch {
      setError("Something went wrong. Please try again.");
      setState("form");
    }
  };

  return (
    <AuthPageShell subtitle="Reset your password">
      <div className="border-foreground/10 bg-foreground/[0.03] rounded-xl border p-6 backdrop-blur-sm sm:p-8">
        {state === "oauth_only" ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-amber-500/20 bg-amber-500/10">
              <AlertTriangle
                className="h-7 w-7 text-amber-400"
                strokeWidth={1.5}
              />
            </div>
            <h2 className="text-foreground mb-2 text-lg font-semibold">
              No password on this account
            </h2>
            <p className="text-foreground/50 mb-6 text-sm">
              This account was created with Google sign-in and doesn&apos;t have
              a password yet. Sign in with Google, then go to{" "}
              <span className="text-gold font-medium">Profile Settings</span> to
              create a password.
            </p>
            <button
              type="button"
              onClick={() =>
                signIn("google", { callbackUrl: "/profile/settings" })
              }
              className="border-gold bg-gold/10 hover:bg-gold hover:glow-gold-sm text-foreground cursor-pointer rounded-lg border-2 px-6 py-2.5 text-sm font-semibold transition-all hover:text-black"
            >
              Sign in with Google
            </button>
          </div>
        ) : state === "success" ? (
          <div className="text-center">
            <div className="bg-gold/10 border-gold/20 mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border">
              <MailOpen className="text-gold h-7 w-7" strokeWidth={1.5} />
            </div>
            <h2 className="text-foreground mb-2 text-lg font-semibold">
              Check your email
            </h2>
            <p className="text-foreground/50 mb-6 text-sm">
              If an account exists with that email, we&apos;ve sent a password
              reset link. The link expires in 5 minutes.
            </p>
            <Link
              href="/sign-in"
              className="text-gold hover:text-gold-light text-sm transition-colors"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            {error ? (
              <div
                role="alert"
                className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
              >
                {error}
              </div>
            ) : null}

            <p className="text-foreground/50 mb-6 text-sm">
              Enter the email address associated with your account and
              we&apos;ll send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="text-foreground/70 mb-2 block text-sm font-medium"
                >
                  Email
                </label>
                <FormInput
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  disabled={state === "loading"}
                />
              </div>

              <PrimaryLoadingButton
                isLoading={state === "loading"}
                loadingLabel="Sending…"
              >
                Send Reset Link
              </PrimaryLoadingButton>
            </form>
          </>
        )}
      </div>

      <p className="text-foreground/40 mt-6 text-center text-sm">
        <Link
          href="/sign-in"
          className="text-gold hover:text-gold-light transition-colors"
        >
          Back to sign in
        </Link>
      </p>
    </AuthPageShell>
  );
}
