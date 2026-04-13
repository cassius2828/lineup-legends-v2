"use client";

import { useParams } from "next/navigation";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import type { SortOption } from "~/lib/constants";
import { useViewModeStore } from "~/stores/viewMode";
import { useLineupFilters } from "~/hooks/useLineupFilters";

export function useProfilePage() {
  const params = useParams();
  const userId = params.userId as string;
  const utils = api.useUtils();

  const { data: profile, isLoading } = api.profile.getById.useQuery({
    userId,
  });
  const { data: session } = api.profile.getMe.useQuery(undefined, {
    retry: false,
  });
  const { data: followStatus } = api.follow.isFollowing.useQuery(
    { targetUserId: userId },
    { enabled: !!session && session.id !== userId },
  );

  const toggleFollow = api.follow.toggleFollow.useMutation({
    onSuccess: () => {
      void utils.follow.isFollowing.invalidate({ targetUserId: userId });
      void utils.profile.getById.invalidate({ userId });
    },
  });

  const updateProfile = api.profile.update.useMutation({
    onSuccess: () => {
      void utils.profile.getById.invalidate({ userId });
      void utils.profile.getMe.invalidate();
    },
  });

  const isOwnProfile = session?.id === userId;
  const [sort, setSort] = useState<SortOption>("newest");
  const { view, setView } = useViewModeStore();
  const { filters, setFilters, filterParams, activeFilterCount } =
    useLineupFilters();

  const {
    data: lineupsData,
    isLoading: lineupsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = api.lineup.getLineupsByUser.useInfiniteQuery(
    { userId, sort, ...filterParams },
    {
      getNextPageParam: (lastPage) =>
        lastPage.hasMore ? lastPage.cursor : undefined,
    },
  );

  const lineups = lineupsData?.pages.flatMap((p) => p.lineups) ?? [];

  const handleFetchNextPage = useCallback(() => {
    void fetchNextPage();
  }, [fetchNextPage]);

  const [followListType, setFollowListType] = useState<
    "followers" | "following" | null
  >(null);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const handleImageUpload = useCallback(
    async (file: File, type: "profile" | "banner") => {
      const setter =
        type === "profile" ? setUploadingProfile : setUploadingBanner;
      setter(true);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", type);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = (await res.json()) as { error?: string };
          throw new Error(err.error ?? "Upload failed");
        }

        const { url } = (await res.json()) as { url: string };

        if (type === "profile") {
          updateProfile.mutate({ profileImg: url });
        } else {
          updateProfile.mutate({ bannerImg: url });
        }
      } catch (error) {
        console.error("Upload error:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to upload image",
        );
      } finally {
        setter(false);
      }
    },
    [updateProfile],
  );

  return {
    userId,
    profile,
    isLoading,
    session,
    followStatus,
    toggleFollow,
    isOwnProfile,
    sort,
    setSort,
    view,
    setView,
    filters,
    setFilters,
    activeFilterCount,
    lineups,
    lineupsLoading,
    handleFetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    followListType,
    setFollowListType,
    uploadingProfile,
    uploadingBanner,
    handleImageUpload,
  };
}
