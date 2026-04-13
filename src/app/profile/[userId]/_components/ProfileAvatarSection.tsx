"use client";

import Image from "next/image";
import { ImageUploadOverlay } from "./ImageUploadOverlay";

type ProfileAvatarSectionProps = {
  profileImg?: string | null;
  image?: string | null;
  name?: string | null;
  isOwnProfile: boolean;
  onProfileUpload: (file: File) => void;
  uploadingProfile: boolean;
};

export function ProfileAvatarSection({
  profileImg,
  image,
  name,
  isOwnProfile,
  onProfileUpload,
  uploadingProfile,
}: ProfileAvatarSectionProps) {
  return (
    <div className="relative -mt-16 mb-4 flex justify-center md:justify-start">
      <div className="group border-surface-950 bg-surface-800 relative h-32 w-32 overflow-hidden rounded-full border-4">
        <Image
          width={128}
          height={128}
          src={profileImg ?? image ?? "/default-user.jpg"}
          alt={name ?? "User"}
          className="h-full w-full object-cover"
        />
        {isOwnProfile && (
          <ImageUploadOverlay
            onUpload={onProfileUpload}
            isUploading={uploadingProfile}
            type="profile"
          />
        )}
      </div>
    </div>
  );
}
