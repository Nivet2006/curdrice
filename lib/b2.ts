import { S3Client } from '@aws-sdk/client-s3';

const b2Endpoint = process.env.B2_ENDPOINT || '';
const b2Region = process.env.B2_REGION || '';
const b2AccessKeyId = process.env.B2_KEY_ID || '';
const b2SecretAccessKey = process.env.B2_APPLICATION_KEY || '';

if (!b2Endpoint || !b2AccessKeyId || !b2SecretAccessKey) {
  console.warn('[B2 Client] Backblaze configuration is incomplete. Ensure B2_ENDPOINT, B2_KEY_ID, and B2_APPLICATION_KEY are set.');
}

export const b2Client = new S3Client({
  endpoint: b2Endpoint,
  region: b2Region || 'us-west-004',
  credentials: {
    accessKeyId: b2AccessKeyId,
    secretAccessKey: b2SecretAccessKey,
  },
  forcePathStyle: true,
});

export const B2_BUCKET_NAME = process.env.B2_BUCKET_NAME || 'iic-reports';

// Separate bucket and client configuration for images
const b2ImagesEndpoint = process.env.B2_IMAGES_ENDPOINT || b2Endpoint;
const b2ImagesRegion = process.env.B2_IMAGES_REGION || b2Region;
const b2ImagesAccessKeyId = b2AccessKeyId;
const b2ImagesSecretAccessKey = b2SecretAccessKey;

export const b2ImagesClient = new S3Client({
  endpoint: b2ImagesEndpoint,
  region: b2ImagesRegion || 'us-west-004',
  credentials: {
    accessKeyId: b2ImagesAccessKeyId,
    secretAccessKey: b2ImagesSecretAccessKey,
  },
  forcePathStyle: true,
});

export const B2_IMAGES_BUCKET_NAME = process.env.B2_IMAGES_BUCKET_NAME || B2_BUCKET_NAME;
