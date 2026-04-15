import { fileTypeFromBuffer } from "file-type";
import { env } from "~/env";
import { uploadToS3 } from "~/server/s3";

/** Matches `scripts/migrate-player-images.ts` — S3 key under the bucket prefix. */
const S3_PREFIX = "lineup-legends/media/images/players";

const FETCH_TIMEOUT_MS = 30_000;

function buildFileName(
  firstName: string,
  lastName: string,
  idHex: string,
): string {
  const first = firstName.toLowerCase().replace(/\s+/g, "_");
  const last = lastName.toLowerCase().replace(/\s+/g, "_");
  return `${first}_${last}_${idHex}.png`;
}

export function buildPlayerImageS3Key(
  firstName: string,
  lastName: string,
  idHex: string,
): string {
  return `${S3_PREFIX}/${buildFileName(firstName, lastName, idHex)}`;
}

/** True when `imgUrl` is already our canonical CloudFront player path. */
export function isPlayerImageOnOurCdn(imgUrl: string): boolean {
  return imgUrl.startsWith(
    `${env.NEXT_PUBLIC_CLOUDFRONT_URL}/media/images/players/`,
  );
}

/**
 * Downloads a remote player image, uploads to S3 at the canonical key, returns CDN URL.
 * No-op if `imgUrl` is already on our player CDN path.
 */
export async function syncPlayerImageToCdn(opts: {
  firstName: string;
  lastName: string;
  idHex: string;
  imgUrl: string;
}): Promise<{ imgUrl: string; migrated: boolean }> {
  if (isPlayerImageOnOurCdn(opts.imgUrl)) {
    return { imgUrl: opts.imgUrl, migrated: false };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let buffer: Buffer;
  try {
    const res = await fetch(opts.imgUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "LineupLegends-PlayerImageSync/1.0" },
      redirect: "follow",
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch image: HTTP ${res.status}`);
    }
    const ab = await res.arrayBuffer();
    buffer = Buffer.from(ab);
    if (buffer.length === 0) {
      throw new Error("Image response was empty");
    }
  } finally {
    clearTimeout(timeout);
  }

  const detected = await fileTypeFromBuffer(buffer);
  const contentType = detected?.mime ?? "image/png";

  const s3Key = buildPlayerImageS3Key(
    opts.firstName,
    opts.lastName,
    opts.idHex,
  );

  await uploadToS3(buffer, s3Key, contentType);

  const fileName = s3Key.split("/").pop()!;
  const publicUrl = `${env.NEXT_PUBLIC_CLOUDFRONT_URL}/media/images/players/${fileName}`;

  return { imgUrl: publicUrl, migrated: true };
}
