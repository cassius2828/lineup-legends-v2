import { validatePassword } from "~/lib/password-validation";
import PasswordInput from "~/app/_components/common/ui/PasswordInput";
import PasswordRequirements from "~/app/_components/common/ui/PasswordRequirements";
import { Button } from "~/app/_components/common/ui/Button";
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
  const passwordValid = validatePassword(password).isValid;

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
        <PasswordInput
          id="signup-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="new-password"
          required
          disabled={isLoading !== null}
          className="border-foreground/20 bg-foreground/5 text-foreground placeholder-foreground/30 focus:border-gold focus:ring-gold w-full rounded-lg border px-4 py-3 transition-colors focus:ring-1 focus:outline-none disabled:opacity-50"
        />
        <PasswordRequirements password={password} />
      </div>

      <Button
        type="submit"
        disabled={isLoading !== null || !passwordValid}
        color="gold"
        variant="subtle"
        loading={isLoading === "credentials"}
        loadingText="Creating account…"
        className="border-gold hover:!bg-gold hover:glow-gold-sm focus-visible:ring-gold/50 focus-visible:ring-offset-surface-950 w-full border-2 px-4 py-3 font-semibold hover:!text-black focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        Create Account
      </Button>
    </form>
  );
}
