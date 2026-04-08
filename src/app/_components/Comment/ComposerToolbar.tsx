"use client";

import { useRef, useState } from "react";
import { ImageIcon, X, Loader2 } from "lucide-react";
import Image from "next/image";
import { useImageUpload } from "~/hooks/useImageUpload";
import GifPicker from "./GifPicker";

export interface ComposerMedia {
  image?: string;
  gif?: string;
}

interface ComposerToolbarProps {
  media: ComposerMedia;
  onMediaChange: (media: ComposerMedia) => void;
}

export default function ComposerToolbar({
  media,
  onMediaChange,
}: ComposerToolbarProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { upload, isUploading } = useImageUpload();
  const [showGifPicker, setShowGifPicker] = useState(false);

  const hasAttachment = !!media.image || !!media.gif;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await upload(file);
    if (url) {
      onMediaChange({ image: url });
      setShowGifPicker(false);
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleGifSelect = (url: string) => {
    onMediaChange({ gif: url });
    setShowGifPicker(false);
  };

  const clearAttachment = () => {
    onMediaChange({});
    setShowGifPicker(false);
  };

  return (
    <div className="space-y-2">
      {/* Preview */}
      {hasAttachment && (
        <div className="relative inline-block">
          {media.image && (
            <Image
              src={media.image}
              alt="Attachment preview"
              width={200}
              height={150}
              className="max-h-[150px] w-auto rounded-lg object-cover"
              unoptimized
            />
          )}
          {media.gif && (
            <img
              src={media.gif}
              alt="GIF preview"
              className="max-h-[150px] w-auto rounded-lg object-cover"
            />
          )}
          <button
            type="button"
            onClick={clearAttachment}
            className="bg-surface-800 text-foreground/60 hover:text-foreground absolute -top-1.5 -right-1.5 rounded-full p-0.5 shadow-md transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Toolbar buttons */}
      <div className="flex items-center gap-1">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={isUploading}
          className="text-foreground/30 hover:bg-foreground/5 hover:text-foreground/60 rounded-md p-1.5 transition-colors disabled:opacity-40"
          aria-label="Attach image"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImageIcon className="h-4 w-4" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setShowGifPicker((v) => !v)}
          className={`text-foreground/30 hover:bg-foreground/5 hover:text-foreground/60 rounded-md p-1.5 transition-colors ${
            showGifPicker ? "bg-foreground/5 text-foreground/60" : ""
          }`}
          aria-label="Add GIF"
        >
          <span className="text-xs leading-none font-bold">GIF</span>
        </button>
      </div>

      {/* GIF Picker */}
      {showGifPicker && (
        <GifPicker
          onSelect={handleGifSelect}
          onClose={() => setShowGifPicker(false)}
        />
      )}
    </div>
  );
}
