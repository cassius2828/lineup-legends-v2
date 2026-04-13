"use client";

import Image from "next/image";

type ComposerUserAvatarProps = {
  src: string;
  alt: string;
  className?: string;
};

/** 36×36 avatar used beside comment composers (modal + lineup page). */
export function ComposerUserAvatar({
  src,
  alt,
  className = "h-9 w-9 shrink-0 rounded-full",
}: ComposerUserAvatarProps) {
  return (
    <Image src={src} alt={alt} width={36} height={36} className={className} />
  );
}
