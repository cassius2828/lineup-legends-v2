"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";

type FollowListModalProps = {
  userId: string;
  type: "followers" | "following";
  onClose: () => void;
};

export function FollowListModal({
  userId,
  type,
  onClose,
}: FollowListModalProps) {
  const { data: followers } = api.follow.getFollowers.useQuery(
    { userId },
    { enabled: type === "followers" },
  );
  const { data: following } = api.follow.getFollowing.useQuery(
    { userId },
    { enabled: type === "following" },
  );
  const router = useRouter();

  const items = type === "followers" ? followers?.items : following?.items;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-surface-900 w-full max-w-md rounded-2xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-foreground text-lg font-semibold capitalize">
            {type}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-foreground/60 hover:bg-foreground/10 hover:text-foreground rounded-lg p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-80 space-y-2 overflow-y-auto">
          {!items || items.length === 0 ? (
            <p className="text-foreground/50 py-8 text-center">No {type} yet</p>
          ) : (
            items.map((item) => {
              const user = item.user;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => {
                    onClose();
                    router.push(`/profile/${user._id}`);
                  }}
                  className="hover:bg-foreground/5 flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors"
                >
                  <div className="bg-surface-700 h-10 w-10 overflow-hidden rounded-full">
                    <Image
                      width={40}
                      height={40}
                      src={user.profileImg ?? user.image ?? "/default-user.jpg"}
                      alt={user.name ?? "User"}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground truncate font-medium">
                      {user.name}
                    </p>
                    {user.username && (
                      <p className="text-foreground/50 truncate text-sm">
                        @{user.username}
                      </p>
                    )}
                  </div>
                  <span className="text-foreground/40 text-xs">
                    {user.followerCount ?? 0} followers
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
