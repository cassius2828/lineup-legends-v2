"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

type AuthMode = "credentials" | "google";

const ERROR_MESSAGES: Record<string, string> = {
  OAuthSignin: "Could not start Google sign-in. Please try again.",
  OAuthCallback: "Google sign-in failed. Please try again.",
  OAuthAccountNotLinked:
    "This email is already associated with another sign-in method.",
  CredentialsSignin: "Invalid email/username or password.",
  SessionRequired: "Please sign in to access this page.",
  Default: "Something went wrong. Please try again.",
};

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const errorType = searchParams.get("error");

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState<AuthMode | null>(null);
  const [error, setError] = useState<string | null>(
    errorType ? (ERROR_MESSAGES[errorType] ?? ERROR_MESSAGES.Default!) : null,
  );

  const handleGoogleSignIn = async () => {
    setIsLoading("google");
    setError(null);
    try {
      await signIn("google", { callbackUrl });
    } catch {
      setError(ERROR_MESSAGES.Default!);
      setIsLoading(null);
    }
  };

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setIsLoading("credentials");
    setError(null);

    try {
      const result = await signIn("credentials", {
        identifier: identifier.trim(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(ERROR_MESSAGES.CredentialsSignin!);
        setIsLoading(null);
      } else {
        window.location.href = callbackUrl;
      }
    } catch {
      setError(ERROR_MESSAGES.Default!);
      setIsLoading(null);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface-950 px-4">
      {/* Background accents */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gold/[0.03] blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[300px] w-[400px] rounded-full bg-gold/[0.02] blur-3xl" />
      </div>

      {/* Corner accents (matching hero section) */}
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
              <span className="text-foreground transition-colors group-hover:text-foreground/90">
                Legends
              </span>
            </h1>
          </Link>
          <p className="mt-3 text-foreground/50">
            Sign in to build your dream lineup
          </p>
        </div>

        {/* Sign-in card */}
        <div className="rounded-xl border border-foreground/10 bg-foreground/[0.03] p-6 backdrop-blur-sm sm:p-8">
          {/* Error message */}
          {error && (
            <div
              role="alert"
              className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
            >
              {error}
            </div>
          )}

          {/* Google sign-in */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading !== null}
            className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-lg border border-foreground/20 bg-foreground/5 px-4 py-3 text-sm font-medium text-foreground transition-all hover:border-gold/40 hover:bg-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading === "google" ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-foreground/20 border-t-gold" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            Continue with Google
          </button>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-foreground/10" />
            <span className="text-xs uppercase tracking-wider text-foreground/30">
              or
            </span>
            <div className="h-px flex-1 bg-foreground/10" />
          </div>

          {/* Credentials form */}
          <form onSubmit={handleCredentialsSignIn} className="space-y-4">
            <div>
              <label
                htmlFor="identifier"
                className="mb-2 block text-sm font-medium text-foreground/70"
              >
                Email or Username
              </label>
              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="you@example.com"
                autoComplete="username"
                required
                disabled={isLoading !== null}
                className="w-full rounded-lg border border-foreground/20 bg-foreground/5 px-4 py-3 text-foreground placeholder-foreground/30 transition-colors focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold disabled:opacity-50"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-foreground/70"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                disabled={isLoading !== null}
                className="w-full rounded-lg border border-foreground/20 bg-foreground/5 px-4 py-3 text-foreground placeholder-foreground/30 transition-colors focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading !== null}
              className="border-gold bg-gold/10 hover:bg-gold hover:glow-gold-sm w-full cursor-pointer rounded-lg border-2 px-4 py-3 text-sm font-semibold text-foreground transition-all hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-950 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading === "credentials" ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/20 border-t-current" />
                  Signing in…
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-foreground/40">
          New here? Use{" "}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="text-gold hover:text-gold-light cursor-pointer transition-colors"
          >
            Google sign-in
          </button>{" "}
          to create your account.
        </p>
      </div>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-surface-950">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-foreground/20 border-t-gold" />
        </main>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
