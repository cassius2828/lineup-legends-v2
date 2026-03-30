"use client";

import Image from "next/image";
import { useState, useCallback } from "react";

const FALLBACK_PLAYER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23374151' width='100' height='100'/%3E%3Ccircle cx='50' cy='38' r='16' fill='%236B7280'/%3E%3Cellipse cx='50' cy='80' rx='28' ry='20' fill='%236B7280'/%3E%3C/svg%3E";

const MAX_RETRIES = 3;

interface PlayerImageProps {
  imgUrl: string | null | undefined;
  alt: string;
  className?: string;
}

export function PlayerImage({ imgUrl, alt, className }: PlayerImageProps) {
  const [retryCount, setRetryCount] = useState(0);
  const [failed, setFailed] = useState(false);

  const handleError = useCallback(() => {
    if (retryCount < MAX_RETRIES) {
      setTimeout(() => setRetryCount((c) => c + 1), 500 * (retryCount + 1));
    } else {
      setFailed(true);
    }
  }, [retryCount]);

  const showFallback = !imgUrl || failed;
  const baseClassName =
    className ?? "absolute inset-0 h-full w-full object-cover";

  if (showFallback) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={FALLBACK_PLAYER_IMAGE} alt={alt} className={baseClassName} draggable={false} />;
  }

  const src = retryCount > 0 ? `${imgUrl}?retry=${retryCount}` : imgUrl;

  return (
    <Image
      key={retryCount}
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 640px) 80px, 120px"
      className={baseClassName}
      draggable={false}
      onError={handleError}
    />
  );
}
