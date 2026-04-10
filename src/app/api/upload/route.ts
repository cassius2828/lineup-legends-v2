import { NextResponse } from "next/server";
import { fileTypeFromBuffer } from "file-type";
import { auth } from "~/server/auth";
import { uploadToS3 } from "~/server/s3";
import { env } from "~/env";

const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!type || !["profile", "banner", "comment"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Must be 'profile', 'banner', or 'comment'" },
        { status: 400 },
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const detected = await fileTypeFromBuffer(buffer);
    if (!detected || !ALLOWED_MIMES.includes(detected.mime)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF" },
        { status: 400 },
      );
    }

    const ext = detected.ext;
    const subPath =
      type === "comment"
        ? `comments/${session.user.id}/${Date.now()}.${ext}`
        : `profiles/${session.user.id}/${type}-${Date.now()}.${ext}`;

    const cdnUrl = new URL(env.NEXT_PUBLIC_CLOUDFRONT_URL);
    const bucketPrefix = cdnUrl.pathname.replace(/^\//, "");
    const s3Key = bucketPrefix ? `${bucketPrefix}/${subPath}` : subPath;

    await uploadToS3(buffer, s3Key, detected.mime);

    const publicUrl = `${env.NEXT_PUBLIC_CLOUDFRONT_URL}/${subPath}`;

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 },
    );
  }
}
