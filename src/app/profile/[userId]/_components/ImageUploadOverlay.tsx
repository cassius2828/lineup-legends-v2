"use client";

import { useRef } from "react";
import { Camera, Loader2 } from "lucide-react";

type ImageUploadOverlayProps = {
  onUpload: (file: File) => void;
  isUploading: boolean;
  type: "profile" | "banner";
};

export function ImageUploadOverlay({
  onUpload,
  isUploading,
  type,
}: ImageUploadOverlayProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className={`absolute inset-0 flex items-center justify-center bg-black/0 transition-all hover:bg-black/40 ${
          type === "profile" ? "rounded-full" : ""
        }`}
        title={`Change ${type} image`}
      >
        <span className="rounded-full bg-black/60 p-2 opacity-0 transition-opacity group-hover:opacity-100">
          {isUploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          ) : (
            <Camera className="h-8 w-8 text-white" />
          )}
        </span>
      </button>
    </>
  );
}
