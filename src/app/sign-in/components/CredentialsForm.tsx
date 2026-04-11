import Link from "next/link";
import PasswordInput from "~/app/_components/ui/PasswordInput";
import { Button } from "~/app/_components/ui/Button";
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
        <PasswordInput
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          required
          disabled={isLoading !== null}
          className="border-foreground/20 bg-foreground/5 text-foreground placeholder-foreground/30 focus:border-gold focus:ring-gold w-full rounded-lg border px-4 py-3 transition-colors focus:ring-1 focus:outline-none disabled:opacity-50"
        />
      </div>

      <Button
        type="submit"
        disabled={isLoading !== null}
        color="gold"
        variant="subtle"
        loading={isLoading === "credentials"}
        loadingText="Signing in…"
        className="border-gold hover:!bg-gold hover:glow-gold-sm focus-visible:ring-gold/50 focus-visible:ring-offset-surface-950 w-full border-2 px-4 py-3 font-semibold hover:!text-black focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        Sign In
      </Button>
    </form>
  );
}
