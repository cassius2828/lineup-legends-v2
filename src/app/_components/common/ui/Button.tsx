import Link from "next/link";

const ButtonColors = {
  gold: {
    subtle: "bg-gold/20 text-gold hover:bg-gold/30",
    solid: "bg-gold text-black hover:bg-gold-light",
  },
  green: {
    subtle: "bg-green-500/20 text-green-400 hover:bg-green-500/30",
    solid: "bg-green-500 text-white hover:bg-green-600",
  },
  red: {
    subtle: "bg-red-500/20 text-red-400 hover:bg-red-500/30",
    solid: "bg-red-500 text-white hover:bg-red-600",
  },
  blue: {
    subtle: "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30",
    solid: "bg-blue-500 text-white hover:bg-blue-600",
  },
  purple: {
    subtle: "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30",
    solid: "bg-purple-500 text-white hover:bg-purple-600",
  },
  orange: {
    subtle: "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30",
    solid: "bg-orange-500 text-white hover:bg-orange-600",
  },
  pink: {
    subtle: "bg-pink-500/20 text-pink-400 hover:bg-pink-500/30",
    solid: "bg-pink-500 text-white hover:bg-pink-600",
  },
  gray: {
    subtle: "bg-gray-500/20 text-gray-400 hover:bg-gray-500/30",
    solid: "bg-gray-500 text-white hover:bg-gray-600",
  },
  black: {
    subtle: "bg-black/20 text-black hover:bg-black/30",
    solid: "bg-black text-white hover:bg-gray-900",
  },
  white: {
    subtle: "bg-foreground/20 text-foreground hover:bg-foreground/30",
    solid: "bg-foreground text-background hover:bg-foreground/90",
  },
};

type ButtonColor = keyof typeof ButtonColors;
type ButtonVariant = "subtle" | "solid";

const baseClasses =
  "cursor-pointer rounded-lg px-2 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm font-medium transition-colors";
const disabledClasses = "disabled:cursor-not-allowed disabled:opacity-50";

function Spinner() {
  return (
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/20 border-t-current" />
  );
}

interface ButtonProps {
  onClick?: () => void;
  /** @deprecated Use onClick instead */
  handleClick?: () => void;
  children: React.ReactNode;
  color?: ButtonColor;
  variant?: ButtonVariant;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
  onMouseEnter?: () => void;
  loading?: boolean;
  loadingText?: string;
}

export const Button = ({
  onClick,
  handleClick,
  children,
  color = "white",
  variant = "subtle",
  disabled = false,
  type = "button",
  className,
  onMouseEnter,
  loading = false,
  loadingText,
}: ButtonProps) => {
  const handler = onClick ?? handleClick;

  return (
    <button
      type={type}
      onClick={handler}
      disabled={disabled || loading}
      onMouseEnter={onMouseEnter}
      className={`${ButtonColors[color][variant]} ${baseClasses} ${disabledClasses} ${className ?? ""} ${disabled ? "cursor-default!" : ""}`}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <Spinner />
          {loadingText ?? children}
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export const ButtonLink = ({
  href,
  children,
  color = "white",
  variant = "subtle",
  className,
}: {
  href: string;
  children: React.ReactNode;
  color?: ButtonColor;
  variant?: ButtonVariant;
  className?: string;
}) => {
  return (
    <Link
      href={href}
      className={`${ButtonColors[color][variant]} ${baseClasses} ${className ?? ""}`}
    >
      {children}
    </Link>
  );
};
