import type { ButtonHTMLAttributes, ReactNode } from "react";

export default function PrimaryLoadingButton({
  children,
  isLoading,
  loadingLabel,
  className = "",
  type = "submit",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading: boolean;
  loadingLabel: ReactNode;
}) {
  return (
    <button
      type={type}
      disabled={isLoading || rest.disabled}
      className={`border-gold bg-gold/10 hover:bg-gold hover:glow-gold-sm text-foreground focus-visible:ring-gold/50 focus-visible:ring-offset-surface-950 w-full cursor-pointer rounded-lg border-2 px-4 py-3 text-sm font-semibold transition-all hover:text-black focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...rest}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/20 border-t-current" />
          {loadingLabel}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
