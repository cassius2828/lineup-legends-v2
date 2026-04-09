import type { LoadingProvider } from "../page";

export default function SignUpForm({
  handleCredentialsSignUp,
  name,
  setName,
  email,
  setEmail,
  password,
  setPassword,
  isLoading,
}: {
  handleCredentialsSignUp: (e: React.FormEvent) => void;
  name: string;
  setName: (name: string) => void;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  isLoading: LoadingProvider | null;
}) {
  return (
    <form onSubmit={handleCredentialsSignUp} className="space-y-4">
      <div>
        <label
          htmlFor="signup-name"
          className="text-foreground/70 mb-2 block text-sm font-medium"
        >
          Name
        </label>
        <input
          id="signup-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          autoComplete="name"
          required
          disabled={isLoading !== null}
          className="border-foreground/20 bg-foreground/5 text-foreground placeholder-foreground/30 focus:border-gold focus:ring-gold w-full rounded-lg border px-4 py-3 transition-colors focus:ring-1 focus:outline-none disabled:opacity-50"
        />
      </div>

      <div>
        <label
          htmlFor="signup-email"
          className="text-foreground/70 mb-2 block text-sm font-medium"
        >
          Email
        </label>
        <input
          id="signup-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
          disabled={isLoading !== null}
          className="border-foreground/20 bg-foreground/5 text-foreground placeholder-foreground/30 focus:border-gold focus:ring-gold w-full rounded-lg border px-4 py-3 transition-colors focus:ring-1 focus:outline-none disabled:opacity-50"
        />
      </div>

      <div>
        <label
          htmlFor="signup-password"
          className="text-foreground/70 mb-2 block text-sm font-medium"
        >
          Password
        </label>
        <input
          id="signup-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="new-password"
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
            Creating account…
          </span>
        ) : (
          "Create Account"
        )}
      </button>
    </form>
  );
}
