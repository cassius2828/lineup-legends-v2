"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  MessageSquare,
  Video,
  Menu,
  X,
  ChevronLeft,
  AlertTriangle,
  Shield,
  ClipboardList,
} from "lucide-react";

const navItems = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Players",
    href: "/admin/players",
    icon: Users,
  },
  {
    label: "Requested Players",
    href: "/admin/requested",
    icon: UserPlus,
  },
  {
    label: "Feedback",
    href: "/admin/feedback",
    icon: MessageSquare,
  },
  {
    label: "Flagged Content",
    href: "/admin/flagged",
    icon: AlertTriangle,
  },
  {
    label: "User Management",
    href: "/admin/users",
    icon: Shield,
  },
  {
    label: "Player Audit Log",
    href: "/admin/audit-log",
    icon: ClipboardList,
  },
  {
    label: "Videos",
    href: "/getting-technical",
    icon: Video,
  },
];

const SIDEBAR_ID = "admin-sidebar";

export function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    if (!mobileOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMobile();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [mobileOpen, closeMobile]);

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-foreground/10 border-b p-6">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="bg-gold flex h-9 w-9 items-center justify-center rounded-lg">
            <LayoutDashboard className="h-5 w-5 text-black" />
          </div>
          <div>
            <h2 className="font-stencil text-foreground text-lg font-bold tracking-wide uppercase">
              Admin
            </h2>
            <p className="text-foreground/40 text-xs">Lineup Legends</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav aria-label="Admin navigation" className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMobile}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                active
                  ? "bg-gold/15 text-gold"
                  : "text-foreground/60 hover:bg-foreground/5 hover:text-foreground/90"
              }`}
            >
              <item.icon
                className={`h-4.5 w-4.5 ${active ? "text-gold" : ""}`}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Back to site */}
      <div className="border-foreground/10 border-t p-4">
        <Link
          href="/"
          className="text-foreground/40 hover:text-foreground/70 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to site
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        type="button"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-expanded={mobileOpen}
        aria-controls={SIDEBAR_ID}
        aria-label={mobileOpen ? "Close admin menu" : "Open admin menu"}
        className="bg-foreground/10 fixed top-4 left-4 z-50 rounded-lg p-2 backdrop-blur-sm md:hidden"
      >
        {mobileOpen ? (
          <X className="text-foreground h-5 w-5" />
        ) : (
          <Menu className="text-foreground h-5 w-5" />
        )}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - mobile */}
      <aside
        id={SIDEBAR_ID}
        aria-hidden={!mobileOpen}
        className={`border-foreground/10 bg-background fixed top-0 left-0 z-40 h-full w-64 border-r transition-transform md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Sidebar - desktop */}
      <aside className="border-foreground/10 bg-background fixed top-0 left-0 hidden h-full w-64 border-r md:block">
        {sidebarContent}
      </aside>
    </>
  );
}
