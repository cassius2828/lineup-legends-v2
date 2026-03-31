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
    );
}