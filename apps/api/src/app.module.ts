import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { TerminusModule } from '@nestjs/terminus';
import { redisStore } from 'cache-manager-ioredis-yet';

// Config
import {
  databaseConfig,
  redisConfig,
  minioConfig,
  supabaseConfig,
} from './config';

// Feature Modules
import { LocationsModule } from './modules/locations/locations.module';
import { AuthModule } from './modules/auth/auth.module';
import { ChatModule } from './modules/chat/chat.module';
import { RewardsModule } from './modules/rewards/rewards.module';

// Infrastructure
import { UploadModule } from './common/upload/upload.module';
import { HealthController } from './common/health/health.controller';

// Middleware
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      load: [databaseConfig, redisConfig, minioConfig, supabaseConfig],
    }),

    // TypeORM PostgreSQL
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('database.host', 'localhost'),
        port: config.get('database.port', 5432),
        username: config.get('database.username', 'postgres'),
        password: config.get('database.password', 'tribe_super_secret_2024'),
        database: config.get('database.database', 'tribe'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: config.get('NODE_ENV') !== 'production', // Enable in development
        logging: config.get('NODE_ENV') === 'development',
        ssl: config.get('database.ssl', false),
      }),
    }),

    // Redis Cache
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        store: await redisStore({
          host: config.get('redis.host', 'localhost'),
          port: config.get('redis.port', 6379),
          password: config.get('redis.password', undefined),
          ttl: config.get('redis.ttl', 300) * 1000,
        }),
      }),
    }),

    // Rate Limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get('THROTTLE_TTL', 60000),
          limit: config.get('THROTTLE_LIMIT', 100),
        },
      ],
    }),

    // Health Checks
    TerminusModule,

    // Infrastructure
    UploadModule,

    // Feature Modules
    AuthModule,
    LocationsModule,
    ChatModule,
    RewardsModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorrelationIdMiddleware, LoggerMiddleware)
      .forRoutes('*');
  }
}
