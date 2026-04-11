"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import CredentialsForm from "./components/CredentialsForm";
import SignUpForm from "./components/SignUpForm";

export type LoadingProvider = "credentials" | "google";

const CONTACT_EMAIL = "cassius.reynolds.dev@gmail.com";

interface BanCheckResponse {
  status: string;
  reason?: string;
  bannedAt?: string;
  suspendedUntil?: string;
  suspensionCount?: number;
}

async function checkBanStatus(
  identifier: string,
): Promise<BanCheckResponse | null> {
  try {
    const res = await fetch("/api/auth/check-ban", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier }),
    });
    return (await res.json()) as BanCheckResponse;
  } catch {
    return null;
  }
}

function showBanToast(data: BanCheckResponse) {
  const isBanned = data.status === "banned";
  const reason = data.reason ?? "Violation of community guidelines";

  let details = "";
  if (isBanned) {
    const bannedDate = data.bannedAt
      ? format(new Date(data.bannedAt), "MMM d, yyyy")
      : "N/A";
    details = `Banned on ${bannedDate} (permanent).`;
  } else if (data.suspendedUntil) {
    const until = format(new Date(data.suspendedUntil), "MMM d, yyyy");
    const remaining = formatDistanceToNow(new Date(data.suspendedUntil));
    details = `Suspended until ${until} (${remaining} remaining).`;
  }

  const suspensions =
    data.suspensionCount && data.suspensionCount > 0
      ? ` This is suspension #${data.suspensionCount}.`
      : "";

  toast.error(`Account ${isBanned ? "Banned" : "Suspended"}: ${reason}`, {
    description: `${details}${suspensions} Contact ${CONTACT_EMAIL} to appeal.`,
    duration: 15000,
  });
}

const ERROR_MESSAGES: Record<string, string> = {
  OAuthSignin: "Could not start Google sign-in. Please try again.",
  OAuthCallback: "Google sign-in failed. Please try again.",
  OAuthAccountNotLinked:
    "This email is already associated with another sign-in method.",
  CredentialsSignin: "Invalid email/username or password.",
  SessionRequired: "Please sign in to access this page.",
  Default: "Something went wrong. Please try again.",
};

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
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
  );
}

function safePath(url: string | null): string {
  if (
    !url ||
    !url.startsWith("/") ||
    url.startsWith("//") ||
    url.startsWith("/\\")
  ) {
    return "/";
  }
  return url;
}

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = safePath(searchParams.get("callbackUrl"));
  const errorType = searchParams.get("error");
  const isSignUp = searchParams.get("mode") === "signup";

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [isLoading, setIsLoading] = useState<LoadingProvider | null>(null);

  const isBanError = errorType === "banned" || errorType === "suspended";
  const [error, setError] = useState<string | null>(
    errorType && !isBanError
      ? (ERROR_MESSAGES[errorType] ?? "Something went wrong. Please try again.")
      : null,
  );

  useEffect(() => {
    if (!isBanError) return;

    const storedEmail = sessionStorage.getItem("ll_signin_email");
    if (storedEmail) {
      sessionStorage.removeItem("ll_signin_email");
      void checkBanStatus(storedEmail).then((data) => {
        if (data && (data.status === "banned" || data.status === "suspended")) {
          showBanToast(data);
        } else {
          showBanToast({ status: errorType ?? "banned" });
        }
      });
    } else {
      showBanToast({ status: errorType ?? "banned" });
    }
  }, [isBanError, errorType]);

  const handleGoogleSignIn = async () => {
    setIsLoading("google");
    setError(null);
    try {
      await signIn("google", { callbackUrl });
    } catch {
      setError("Something went wrong. Please try again.");
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
      const trimmedId = identifier.trim();
      const banData = await checkBanStatus(trimmedId);
      if (
        banData &&
        (banData.status === "banned" || banData.status === "suspended")
      ) {
        showBanToast(banData);
        setIsLoading(null);
        return;
      }

      sessionStorage.setItem("ll_signin_email", trimmedId);
      const result = await signIn("credentials", {
        identifier: identifier.trim(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(
          ERROR_MESSAGES.CredentialsSignin ??
            "Invalid email/username or password.",
        );
        setIsLoading(null);
      } else {
        const sessionRes = await fetch("/api/auth/session");
        const sessionData = (await sessionRes.json()) as {
          user?: { mfaPending?: boolean };
        };

        if (sessionData?.user?.mfaPending) {
          window.location.href = "/sign-in/mfa-verify";
        } else {
          window.location.href = callbackUrl;
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setIsLoading(null);
    }
  };

  const handleCredentialsSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpName.trim() || !signUpEmail.trim() || !signUpPassword) {
      setError("Please fill in all fields.");
      return;
    }

    setIsLoading("credentials");
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: signUpName.trim(),
          email: signUpEmail.trim(),
          password: signUpPassword,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Failed to create account.");
        setIsLoading(null);
        return;
      }

      const result = await signIn("credentials", {
        identifier: signUpEmail.trim(),
        password: signUpPassword,
        redirect: false,
      });

      if (result?.error) {
        setError(
          "Account created but sign-in failed. Please sign in manually.",
        );
        setIsLoading(null);
      } else {
        window.location.href = callbackUrl;
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setIsLoading(null);
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
            {isSignUp
              ? "Create your account and start building"
              : "Sign in to build your dream lineup"}
          </p>
        </div>

        {/* Auth card */}
        <div className="border-foreground/10 bg-foreground/[0.03] rounded-xl border p-6 backdrop-blur-sm sm:p-8">
          {/* Error message */}
          {error && (
            <div
              role="alert"
              className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
            >
              {error}
            </div>
          )}

          {/* Google button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading !== null}
            className={`focus-visible:ring-gold/50 focus-visible:ring-offset-surface-950 flex w-full cursor-pointer items-center justify-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
              isSignUp
                ? "border-gold bg-gold/10 hover:bg-gold text-foreground border-2 hover:text-black"
                : "border-foreground/20 bg-foreground/5 text-foreground hover:border-gold/40 hover:bg-foreground/10 border"
            }`}
          >
            {isLoading === "google" ? (
              <div className="border-foreground/20 border-t-gold h-5 w-5 animate-spin rounded-full border-2" />
            ) : (
              <GoogleIcon />
            )}
            {isSignUp ? "Sign up with Google" : "Continue with Google"}
          </button>

          {isSignUp ? (
            <>
              {/* Divider */}
              <div className="my-6 flex items-center gap-4">
                <div className="bg-foreground/10 h-px flex-1" />
                <span className="text-foreground/30 text-xs tracking-wider uppercase">
                  or
                </span>
                <div className="bg-foreground/10 h-px flex-1" />
              </div>

              {/* Sign-up credentials form */}
              <SignUpForm
                handleCredentialsSignUp={handleCredentialsSignUp}
                name={signUpName}
                setName={setSignUpName}
                email={signUpEmail}
                setEmail={setSignUpEmail}
                password={signUpPassword}
                setPassword={setSignUpPassword}
                isLoading={isLoading}
              />
            </>
          ) : (
            <>
              {/* Divider */}
              <div className="my-6 flex items-center gap-4">
                <div className="bg-foreground/10 h-px flex-1" />
                <span className="text-foreground/30 text-xs tracking-wider uppercase">
                  or
                </span>
                <div className="bg-foreground/10 h-px flex-1" />
              </div>

              {/* Credentials form */}
              <CredentialsForm
                handleCredentialsSignIn={handleCredentialsSignIn}
                identifier={identifier}
                setIdentifier={setIdentifier}
                password={password}
                setPassword={setPassword}
                isLoading={isLoading}
              />
            </>
          )}
        </div>

        {/* Footer — cross-link between modes */}
        <p className="text-foreground/40 mt-6 text-center text-sm">
          {isSignUp ? (
            <>
              Already have an account?{" "}
              <Link
                href="/sign-in"
                className="text-gold hover:text-gold-light transition-colors"
              >
                Sign in
              </Link>
            </>
          ) : (
            <>
              Don&apos;t have an account?{" "}
              <Link
                href="/sign-in?mode=signup"
                className="text-gold hover:text-gold-light transition-colors"
              >
                Sign up
              </Link>
            </>
          )}
        </p>
      </div>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <main className="bg-surface-950 flex min-h-screen items-center justify-center">
          <div className="border-foreground/20 border-t-gold h-10 w-10 animate-spin rounded-full border-4" />
        </main>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
