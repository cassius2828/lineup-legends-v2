"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Users, Ban, Clock, Shield } from "lucide-react";

type FilterType = "all" | "banned" | "suspended";

export default function AdminUsersPage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isLoading } = api.admin.getUsers.useQuery({
    query: debouncedQuery || undefined,
    filter,
    limit: 30,
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-foreground text-3xl font-bold">User Management</h1>
        <p className="text-foreground/50 mt-1">
          Search, review, and manage user accounts
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <svg
            className="text-foreground/40 absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, or username..."
            className="border-foreground/10 bg-foreground/5 text-foreground placeholder-foreground/40 focus:border-gold focus:ring-gold w-full rounded-xl border py-3 pr-4 pl-12 focus:ring-1 focus:outline-none"
          />
        </div>
        <div className="border-foreground/10 bg-surface-800 inline-flex gap-1 rounded-lg border p-1">
          {(["all", "banned", "suspended"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-2 text-sm font-medium capitalize transition-all ${
                filter === f
                  ? "bg-foreground/10 text-foreground shadow-sm"
                  : "text-foreground/50 hover:text-foreground/70"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="border-foreground/20 border-t-gold h-8 w-8 animate-spin rounded-full border-2" />
        </div>
      )}

      {!isLoading && data?.items.length === 0 && (
        <div className="border-foreground/10 bg-foreground/3 rounded-xl border p-12 text-center">
          <Users className="text-foreground/20 mx-auto mb-3 h-10 w-10" />
          <p className="text-foreground/50">No users found</p>
        </div>
      )}

      <div className="space-y-2">
        {data?.items.map((user) => (
          <Link
            key={user.id}
            href={`/admin/users/${user.id}`}
            className="border-foreground/10 bg-foreground/3 hover:bg-foreground/5 flex items-center gap-4 rounded-xl border p-4 transition-colors"
          >
            <Image
              src={user.image ?? user.profileImg ?? "/default-user.jpg"}
              alt={user.name}
              width={40}
              height={40}
              className="rounded-full"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-foreground truncate font-medium">
                  {user.name}
                </p>
                {user.admin && (
                  <Shield className="text-gold h-4 w-4 shrink-0" />
                )}
                {user.banned && (
                  <span className="flex items-center gap-1 rounded bg-red-500/10 px-2 py-0.5 text-xs text-red-400">
                    <Ban className="h-3 w-3" />
                    Banned
                  </span>
                )}
                {!user.banned &&
                  user.suspendedUntil &&
                  new Date(user.suspendedUntil) > new Date() && (
                    <span className="flex items-center gap-1 rounded bg-orange-500/10 px-2 py-0.5 text-xs text-orange-400">
                      <Clock className="h-3 w-3" />
                      Suspended
                    </span>
                  )}
              </div>
              <p className="text-foreground/40 truncate text-sm">
                {user.username ? `@${user.username} · ` : ""}
                {user.email}
              </p>
            </div>
            <span className="text-foreground/30 shrink-0 text-xs">
              Joined{" "}
              {formatDistanceToNow(new Date(user.createdAt), {
                addSuffix: true,
              })}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
