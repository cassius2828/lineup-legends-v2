import { NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { uploadToS3 } from "~/server/s3";
import { env } from "~/env";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
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

    if (!type || !["profile", "banner"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Must be 'profile' or 'banner'" },
        { status: 400 },
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF" },
        { status: 400 },
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB" },
        { status: 400 },
      );
    }

    const ext = file.name.split(".").pop() ?? "jpg";
    const key = `profiles/${session.user.id}/${type}-${Date.now()}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadToS3(buffer, key, file.type);

    const cdnUrl = `${env.NEXT_PUBLIC_CLOUDFRONT_URL}/${key}`;

    return NextResponse.json({ url: cdnUrl });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 },
    );
  }
}
