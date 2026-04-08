"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Grid } from "@giphy/react-components";
import { GiphyFetch } from "@giphy/js-fetch-api";
import type { IGif } from "@giphy/js-types";
import { Search, X } from "lucide-react";
import { env } from "~/env";

const gf = new GiphyFetch(env.NEXT_PUBLIC_GIPHY_API_KEY);

interface GifPickerProps {
  onSelect: (url: string) => void;
  onClose: () => void;
}

export default function GifPicker({ onSelect, onClose }: GifPickerProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [width, setWidth] = useState(320);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const fetchGifs = useCallback(
    (offset: number) =>
      debouncedSearch
        ? gf.search(debouncedSearch, { offset, limit: 10 })
        : gf.trending({ offset, limit: 10 }),
    [debouncedSearch],
  );

  const handleGifClick = useCallback(
    (gif: IGif, e: React.SyntheticEvent) => {
      e.preventDefault();
      const url = gif.images.fixed_height.url ?? gif.images.original.url;
      onSelect(url);
    },
    [onSelect],
  );

  return (
    <div className="border-foreground/10 bg-surface-800 flex max-h-[300px] flex-col overflow-hidden rounded-xl border">
      <div className="border-foreground/10 flex items-center gap-2 border-b px-3 py-2">
        <Search className="text-foreground/40 h-4 w-4 shrink-0" />
        <input
          ref={inputRef}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search GIFs..."
          className="text-foreground placeholder:text-foreground/30 flex-1 bg-transparent text-sm focus:outline-none"
        />
        <button
          type="button"
          onClick={onClose}
          className="text-foreground/40 hover:text-foreground rounded-full p-0.5 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div ref={containerRef} className="overflow-y-auto p-2">
        <Grid
          key={debouncedSearch}
          width={width - 16}
          columns={3}
          gutter={4}
          fetchGifs={fetchGifs}
          onGifClick={handleGifClick}
          noLink
          hideAttribution
          noResultsMessage={
            <p className="text-foreground/40 py-6 text-center text-sm">
              No GIFs found
            </p>
          }
        />
      </div>
      <div className="border-foreground/10 border-t px-3 py-1.5 text-center">
        <span className="text-foreground/30 text-[10px]">Powered by GIPHY</span>
      </div>
    </div>
  );
}
