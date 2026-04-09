"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

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
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string; code?: string };
        if (data.code === "OAUTH_ONLY") {
          setState("oauth_only");
          return;
        }
        setError(data.error ?? "Something went wrong. Please try again.");
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
          <p className="text-foreground/50 mt-3">Reset your password</p>
        </div>

        {/* Card */}
        <div className="border-foreground/10 bg-foreground/[0.03] rounded-xl border p-6 backdrop-blur-sm sm:p-8">
          {state === "oauth_only" ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-amber-500/20 bg-amber-500/10">
                <svg
                  className="h-7 w-7 text-amber-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                  />
                </svg>
              </div>
              <h2 className="text-foreground mb-2 text-lg font-semibold">
                No password on this account
              </h2>
              <p className="text-foreground/50 mb-6 text-sm">
                This account was created with Google sign-in and doesn&apos;t
                have a password yet. Sign in with Google, then go to{" "}
                <span className="text-gold font-medium">Profile Settings</span>{" "}
                to create a password.
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
                <svg
                  className="text-gold h-7 w-7"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                  />
                </svg>
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
              {error && (
                <div
                  role="alert"
                  className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
                >
                  {error}
                </div>
              )}

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
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    disabled={state === "loading"}
                    className="border-foreground/20 bg-foreground/5 text-foreground placeholder-foreground/30 focus:border-gold focus:ring-gold w-full rounded-lg border px-4 py-3 transition-colors focus:ring-1 focus:outline-none disabled:opacity-50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={state === "loading"}
                  className="border-gold bg-gold/10 hover:bg-gold hover:glow-gold-sm text-foreground focus-visible:ring-gold/50 focus-visible:ring-offset-surface-950 w-full cursor-pointer rounded-lg border-2 px-4 py-3 text-sm font-semibold transition-all hover:text-black focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {state === "loading" ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/20 border-t-current" />
                      Sending…
                    </span>
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-foreground/40 mt-6 text-center text-sm">
          <Link
            href="/sign-in"
            className="text-gold hover:text-gold-light transition-colors"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
