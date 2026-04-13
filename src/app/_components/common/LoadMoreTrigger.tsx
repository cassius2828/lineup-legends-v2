"use client";

import { useEffect, useRef } from "react";
import { Spinner } from "../ui/Spinner";

interface LoadMoreTriggerProps {
  onLoadMore: () => void;
  loading: boolean;
  hasMore: boolean;
}

export function LoadMoreTrigger({
  onLoadMore,
  loading,
  hasMore,
}: LoadMoreTriggerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !hasMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !loading) onLoadMore();
      },
      { rootMargin: "200px" },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [onLoadMore, loading, hasMore]);

  if (!hasMore) return null;

  return (
    <div ref={ref} className="flex justify-center py-8">
      {loading && <Spinner size="md" />}
    </div>
  );
}
