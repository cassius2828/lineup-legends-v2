"use client";

import { useParams } from "next/navigation";
import { useProfileUpload } from "../_hooks/useProfileUpload";
import { ImageUploadOverlay } from "./ImageUploadOverlay";

export function ProfileAvatarUpload() {
  const { userId } = useParams<{ userId: string }>();
  const { handleUpload, uploading } = useProfileUpload(userId);

  return (
    <ImageUploadOverlay
      onUpload={(file) => void handleUpload(file, "profile")}
      isUploading={uploading.profile}
      type="profile"
    />
  );
}
