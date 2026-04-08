export const UPLOAD_MAX_SIZE = 5 * 1024 * 1024; // 5MB
export const UPLOAD_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export async function uploadFile(file: File, type: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", type);

  const res = await fetch("/api/upload", { method: "POST", body: formData });
  const data = (await res.json()) as { url?: string; error?: string };

  if (!res.ok || !data.url) {
    throw new Error(data.error ?? "Upload failed");
  }

  return data.url;
}
