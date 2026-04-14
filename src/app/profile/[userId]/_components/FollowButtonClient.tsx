"use client";

import { useSession } from "next-auth/react";
import { Button } from "~/app/_components/common/ui/Button";
import { api } from "~/trpc/react";

export function FollowButtonClient({ userId }: { userId: string }) {
  const { data: session } = useSession();
  const utils = api.useUtils();

  const { data: followStatus } = api.follow.isFollowing.useQuery(
    { targetUserId: userId },
    { enabled: !!session && session.user.id !== userId },
  );

  const toggleFollow = api.follow.toggleFollow.useMutation({
    onSuccess: () => {
      void utils.follow.isFollowing.invalidate({ targetUserId: userId });
      void utils.profile.getById.invalidate({ userId });
    },
  });

  if (!session) return null;

  return (
    <Button
      onClick={() => toggleFollow.mutate({ targetUserId: userId })}
      color={followStatus?.following ? "white" : "gold"}
      variant={followStatus?.following ? "subtle" : "solid"}
      loading={toggleFollow.isPending}
      loadingText="..."
      className="px-5 py-2.5"
    >
      {followStatus?.following ? "Unfollow" : "Follow"}
    </Button>
  );
}
