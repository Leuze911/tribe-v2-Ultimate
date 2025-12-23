import { registerAs } from '@nestjs/config';

export default registerAs('minio', () => ({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000', 10),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'tribe_minio_access',
  secretKey: process.env.MINIO_SECRET_KEY || 'tribe_minio_secret_2024',
  bucketName: process.env.MINIO_BUCKET || 'tribe-photos',
}));
