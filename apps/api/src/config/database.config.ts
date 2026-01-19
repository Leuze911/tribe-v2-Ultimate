import { registerAs } from '@nestjs/config';

export default registerAs('database', () => {
  if (!process.env.DATABASE_PASSWORD) {
    throw new Error('DATABASE_PASSWORD environment variable is required');
  }

  return {
    type: 'postgres' as const,
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME || 'tribe',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.NODE_ENV === 'development',
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  };
});
