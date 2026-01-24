import { env } from "~/env";

/**
 * Generate a full CloudFront CDN URL for landing page assets
 * @param path - The asset path relative to the landing folder (e.g., "jordan-vs-lebron.png")
 * @returns The full CloudFront URL
 */
export const cdnUrl = (path: string) =>
  `${env.NEXT_PUBLIC_CLOUDFRONT_URL}/media/images/landing/${path}`;

