import Link from "next/link";

const ButtonColors = {
  gold: {
    bg: "bg-gold/20",
    text: "text-gold",
    hover: "hover:bg-gold/30",
  },
  green: {
    bg: "bg-green-500/20",
    text: "text-green-400",
    hover: "hover:bg-green-500/30",
  },
  red: {
    bg: "bg-red-500/20",
    text: "text-red-400",
    hover: "hover:bg-red-500/30",
  },
  blue: {
    bg: "bg-blue-500/20",
    text: "text-blue-400",
    hover: "hover:bg-blue-500/30",
  },
  purple: {
    bg: "bg-purple-500/20",
    text: "text-purple-400",
    hover: "hover:bg-purple-500/30",
  },
  orange: {
    bg: "bg-orange-500/20",
    text: "text-orange-400",
    hover: "hover:bg-orange-500/30",
  },
  pink: {
    bg: "bg-pink-500/20",
    text: "text-pink-400",
    hover: "hover:bg-pink-500/30",
  },
  gray: {
    bg: "bg-gray-500/20",
    text: "text-gray-400",
    hover: "hover:bg-gray-500/30",
  },
  black: {
    bg: "bg-black/20",
    text: "text-black",
    hover: "hover:bg-black/30",
  },
  white: {
    bg: "bg-white/20",
    text: "text-white",
    hover: "hover:bg-white/30",
  },
};

export const Button = ({
  handleClick,
  children,
  color = "white",
}: {
  handleClick: () => void;
  children: React.ReactNode;
  color?: keyof typeof ButtonColors;
}) => {
  return (
    <button
      onClick={handleClick}
      className={`${ButtonColors[color].bg} ${ButtonColors[color].text} ${ButtonColors[color].hover} cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition-colors`}
    >
      {children}
    </button>
  );
};
export const ButtonLink = ({
  href,
  children,
  color = "white",
}: {
  href: string;
  children: React.ReactNode;
  color?: keyof typeof ButtonColors;
}) => {
  return (
    <Link
      href={href}
      className={`${ButtonColors[color].bg} ${ButtonColors[color].text} ${ButtonColors[color].hover} cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition-colors`}
    >
      {children}
    </Link>
  );
};
