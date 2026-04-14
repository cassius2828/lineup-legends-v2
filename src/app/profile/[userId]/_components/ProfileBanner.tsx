import { ProfileBannerUpload } from "./ProfileBannerUpload";

type ProfileBannerProps = {
  bannerImg?: string | null;
  isOwnProfile: boolean;
};

export function ProfileBanner({ bannerImg, isOwnProfile }: ProfileBannerProps) {
  return (
    <div
      className="group relative h-48 bg-cover bg-center md:h-100"
      style={{
        backgroundImage: bannerImg
          ? `url(${bannerImg})`
          : "linear-gradient(135deg, #059669, #0891b2, #6366f1)",
      }}
    >
      {isOwnProfile && <ProfileBannerUpload />}
    </div>
  );
}
