import Link from "next/link";
import type { LoadingProvider } from "../page";

export default function CredentialsForm({
  handleCredentialsSignIn,
  identifier,
  setIdentifier,
  password,
  setPassword,
  isLoading,
}: {
  handleCredentialsSignIn: (e: React.FormEvent) => void;
  identifier: string;
  setIdentifier: (identifier: string) => void;
  password: string;
  setPassword: (password: string) => void;
  isLoading: LoadingProvider | null;
}) {
  return (
    <form onSubmit={handleCredentialsSignIn} className="space-y-4">
      <div>
        <label
          htmlFor="identifier"
          className="text-foreground/70 mb-2 block text-sm font-medium"
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
          className="border-foreground/20 bg-foreground/5 text-foreground placeholder-foreground/30 focus:border-gold focus:ring-gold w-full rounded-lg border px-4 py-3 transition-colors focus:ring-1 focus:outline-none disabled:opacity-50"
        />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label
            htmlFor="password"
            className="text-foreground/70 text-sm font-medium"
          >
            Password
          </label>
          <Link
            href="/forgot-password"
            className="text-gold hover:text-gold-light text-xs transition-colors"
          >
            Forgot password?
          </Link>
        </div>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          required
          disabled={isLoading !== null}
          className="border-foreground/20 bg-foreground/5 text-foreground placeholder-foreground/30 focus:border-gold focus:ring-gold w-full rounded-lg border px-4 py-3 transition-colors focus:ring-1 focus:outline-none disabled:opacity-50"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading !== null}
        className="border-gold bg-gold/10 hover:bg-gold hover:glow-gold-sm text-foreground focus-visible:ring-gold/50 focus-visible:ring-offset-surface-950 w-full cursor-pointer rounded-lg border-2 px-4 py-3 text-sm font-semibold transition-all hover:text-black focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
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
  );
}
