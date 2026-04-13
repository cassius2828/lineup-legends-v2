import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Plus,
  UserPlus,
  Mail,
  ImageOff,
  Sparkles,
  AlertTriangle,
  Shield,
} from "lucide-react";

type QuickAction = {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  iconClass: string;
  iconWrap: string;
};

const ACTIONS: QuickAction[] = [
  {
    href: "/admin/add-player",
    title: "Add Player",
    description: "Add a new player to the database",
    icon: Plus,
    iconClass: "text-gold-300 h-5 w-5",
    iconWrap: "bg-gold-300/10 rounded-lg p-2",
  },
  {
    href: "/admin/requested",
    title: "Requested Players",
    description: "Review player requests from users",
    icon: UserPlus,
    iconClass: "h-5 w-5 text-rose-400",
    iconWrap: "rounded-lg bg-rose-400/10 p-2",
  },
  {
    href: "/admin/feedback",
    title: "Feedback",
    description: "Manage user feedback and messages",
    icon: Mail,
    iconClass: "h-5 w-5 text-amber-400",
    iconWrap: "rounded-lg bg-amber-400/10 p-2",
  },
  {
    href: "/admin/flagged",
    title: "Flagged Content",
    description: "Review profanity-flagged content",
    icon: AlertTriangle,
    iconClass: "h-5 w-5 text-red-400",
    iconWrap: "rounded-lg bg-red-400/10 p-2",
  },
  {
    href: "/admin/users",
    title: "User Management",
    description: "Manage users, bans, and suspensions",
    icon: Shield,
    iconClass: "h-5 w-5 text-blue-400",
    iconWrap: "rounded-lg bg-blue-400/10 p-2",
  },
  {
    href: "/test/player-images",
    title: "Test Player Images",
    description: "Check for broken player images",
    icon: ImageOff,
    iconClass: "h-5 w-5 text-red-400",
    iconWrap: "rounded-lg bg-red-400/10 p-2",
  },
  {
    href: "/admin/gamble-animations",
    title: "Gamble Animations",
    description: "Preview all gamble outcome animations",
    icon: Sparkles,
    iconClass: "h-5 w-5 text-green-400",
    iconWrap: "rounded-lg bg-green-400/10 p-2",
  },
];

export function AdminQuickActions() {
  return (
    <div className="mt-8">
      <h2 className="text-foreground mb-4 text-lg font-semibold">
        Quick Actions
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="border-foreground/10 bg-foreground/3 hover:bg-foreground/6 flex items-center gap-3 rounded-xl border p-4 transition-colors"
          >
            <div className={action.iconWrap}>
              <action.icon className={action.iconClass} />
            </div>
            <div>
              <p className="text-foreground text-sm font-medium">
                {action.title}
              </p>
              <p className="text-foreground/40 text-xs">{action.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
