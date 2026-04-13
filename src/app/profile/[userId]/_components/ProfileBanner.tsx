"use client";

import { ImageUploadOverlay } from "./ImageUploadOverlay";

type ProfileBannerProps = {
  bannerImg?: string | null;
  isOwnProfile: boolean;
  onBannerUpload: (file: File) => void;
  uploadingBanner: boolean;
};

export function ProfileBanner({
  bannerImg,
  isOwnProfile,
  onBannerUpload,
  uploadingBanner,
}: ProfileBannerProps) {
  return (
    <div
      className="group relative h-48 bg-cover bg-center md:h-100"
      style={{
        backgroundImage: bannerImg
          ? `url(${bannerImg})`
          : "linear-gradient(135deg, #059669, #0891b2, #6366f1)",
      }}
    >
      {isOwnProfile && (
        <ImageUploadOverlay
          onUpload={onBannerUpload}
          isUploading={uploadingBanner}
          type="banner"
        />
      )}
    </div>
  );
}
