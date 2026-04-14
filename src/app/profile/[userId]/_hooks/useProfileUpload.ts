"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { api } from "~/trpc/react";

export function useProfileUpload(userId: string) {
  const utils = api.useUtils();

  const updateProfile = api.profile.update.useMutation({
    onSuccess: () => {
      void utils.profile.getById.invalidate({ userId });
      void utils.profile.getMe.invalidate();
    },
  });

  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const handleUpload = useCallback(
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
    handleUpload,
    uploading: { profile: uploadingProfile, banner: uploadingBanner },
  };
}
