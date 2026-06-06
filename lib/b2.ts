import { S3Client } from '@aws-sdk/client-s3';

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required env var: ${name}`);
  return val;
}

// General B2 client (for non-image buckets)
const b2Endpoint = requireEnv('B2_ENDPOINT');
const b2Region = process.env.B2_REGION || 'us-west-004';
const b2AccessKeyId = requireEnv('B2_KEY_ID');
const b2SecretAccessKey = requireEnv('B2_APPLICATION_KEY');

export const b2Client = new S3Client({
  endpoint: b2Endpoint,
  region: b2Region,
  credentials: {
    accessKeyId: b2AccessKeyId,
    secretAccessKey: b2SecretAccessKey,
  },
  forcePathStyle: true,
});

export const B2_BUCKET_NAME = requireEnv('B2_BUCKET_NAME');

// Dedicated images client — uses its OWN vars, no fallback to general client
const b2ImagesEndpoint = requireEnv('B2_IMAGES_ENDPOINT');
const b2ImagesRegion = process.env.B2_IMAGES_REGION || 'us-west-004';
const b2ImagesAccessKeyId = requireEnv('B2_IMAGES_KEY_ID');
const b2ImagesSecretAccessKey = requireEnv('B2_IMAGES_APPLICATION_KEY');

export const b2ImagesClient = new S3Client({
  endpoint: b2ImagesEndpoint,
  region: b2ImagesRegion,
  credentials: {
    accessKeyId: b2ImagesAccessKeyId,
    secretAccessKey: b2ImagesSecretAccessKey,
  },
  forcePathStyle: true,
});

export const B2_IMAGES_BUCKET_NAME = requireEnv('B2_IMAGES_BUCKET_NAME');

