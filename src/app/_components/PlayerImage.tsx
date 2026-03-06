"use client";

import { useEffect, useState } from "react";

const FALLBACK_PLAYER_IMAGE = "/default-user.jpg";

interface PlayerImageProps {
  imgUrl: string | null | undefined;
  alt: string;
  className?: string;
}

export function PlayerImage({ imgUrl, alt, className }: PlayerImageProps) {
  const [realImageLoaded, setRealImageLoaded] = useState(false);

  useEffect(() => {
    setRealImageLoaded(false);
  }, [imgUrl]);

  const baseClassName = className ?? "absolute inset-0 h-full w-full object-cover";

  return (
    <>
      {/* Default image: always visible while the real image loads */}
      <img
        src={FALLBACK_PLAYER_IMAGE}
        alt=""
        aria-hidden
        className={baseClassName}
        draggable={false}
      />
      {/* Real image: fades in when loaded, stays hidden on error */}
      {imgUrl ? (
        <img
          src={imgUrl}
          alt={alt}
          className={`${baseClassName} transition-opacity duration-200 ${realImageLoaded ? "opacity-100" : "opacity-0"
            }`}
          draggable={false}
          onLoad={() => setRealImageLoaded(true)}
          onError={() => setRealImageLoaded(false)}
        />
      ) : null}
    </>
  );
}
