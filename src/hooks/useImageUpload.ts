import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  uploadFile,
  UPLOAD_MAX_SIZE,
  UPLOAD_ALLOWED_TYPES,
} from "~/lib/upload";

interface UseImageUploadReturn {
  upload: (file: File, type?: string) => Promise<string | null>;
  isUploading: boolean;
  reset: () => void;
}

export function useImageUpload(): UseImageUploadReturn {
  const [isUploading, setIsUploading] = useState(false);

  const upload = useCallback(
    async (file: File, type = "comment"): Promise<string | null> => {
      if (!UPLOAD_ALLOWED_TYPES.includes(file.type)) {
        toast.error("Invalid file type. Allowed: JPEG, PNG, WebP, GIF");
        return null;
      }
      if (file.size > UPLOAD_MAX_SIZE) {
        toast.error("File too large. Maximum size is 5MB");
        return null;
      }

      setIsUploading(true);
      try {
        return await uploadFile(file, type);
      } catch {
        toast.error("Upload failed");
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setIsUploading(false);
  }, []);

  return { upload, isUploading, reset };
}
