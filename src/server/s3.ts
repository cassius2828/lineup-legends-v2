import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { env } from "~/env";

const globalForS3 = globalThis as unknown as {
  s3: S3Client | undefined;
};

function getS3Client(): S3Client {
  return (globalForS3.s3 ??= new S3Client({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
  }));
}

/**
 * Upload a file to S3 and return the public URL
 *
 * @param file - The file buffer to upload
 * @param key - The S3 object key (path/filename)
 * @param contentType - The MIME type of the file
 * @returns The public URL of the uploaded file
 */
export async function uploadToS3(
  file: Buffer,
  key: string,
  contentType: string,
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: env.BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: contentType,
  });

  await getS3Client().send(command);

  return `https://${env.BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
}

// Re-export common S3 commands for convenience
export { PutObjectCommand } from "@aws-sdk/client-s3";
