"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Users, Shield } from "lucide-react";
import { AdminPageHeader } from "../_components/AdminPageHeader";
import {
  AdminFilterTabs,
  AdminSpinner,
  AdminEmptyState,
  AdminErrorState,
  UserStatusBadges,
} from "../components/shared";

type FilterType = "all" | "banned" | "suspended";

export default function AdminUsersPage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isLoading, isError, refetch } = api.admin.getUsers.useQuery({
    query: debouncedQuery || undefined,
    filter,
    limit: 30,
  });

  return (
    <div>
      <AdminPageHeader
        title="User Management"
        description="Search, review, and manage user accounts"
      />

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
        <AdminFilterTabs
          options={["all", "banned", "suspended"] as const}
          value={filter}
          onChange={setFilter}
        />
      </div>

      {isLoading && <AdminSpinner />}

      {isError && (
        <AdminErrorState
          message="Failed to load users"
          onRetry={() => void refetch()}
        />
      )}

      {!isLoading && !isError && data?.items.length === 0 && (
        <AdminEmptyState icon={<Users />} message="No users found" />
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
                <UserStatusBadges
                  banned={user.banned}
                  suspendedUntil={user.suspendedUntil}
                />
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
