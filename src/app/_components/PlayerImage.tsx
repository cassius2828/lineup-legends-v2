"use client";

import { useState } from "react";

const FALLBACK_PLAYER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23374151' width='100' height='100'/%3E%3Ccircle cx='50' cy='38' r='16' fill='%236B7280'/%3E%3Cellipse cx='50' cy='80' rx='28' ry='20' fill='%236B7280'/%3E%3C/svg%3E";

interface PlayerImageProps {
  imgUrl: string | null | undefined;
  alt: string;
  className?: string;
}

export function PlayerImage({ imgUrl, alt, className }: PlayerImageProps) {
  const [errored, setErrored] = useState(false);

  const baseClassName = className ?? "absolute inset-0 h-full w-full object-cover";

  const src = !imgUrl || errored ? FALLBACK_PLAYER_IMAGE : imgUrl;

  return (
    <img
      src={src}
      alt={alt}
      className={baseClassName}
      draggable={false}
      onError={() => setErrored(true)}
    />
  );
}
