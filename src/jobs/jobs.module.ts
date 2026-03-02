import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { Task } from '../tasks/entities/task.entity.js';
import { MockModule } from '../mock/mock.module.js';
import { JobsProducer } from './jobs.producer.js';
import { JobsProcessor } from './jobs.processor.js';
import { RateLimiterService, REDIS_CLIENT } from './rate-limiter.service.js';

const redisProvider = {
  provide: REDIS_CLIENT,
  inject: [ConfigService],
  useFactory: (config: ConfigService) =>
    new Redis({
      host: config.get<string>('redis.host'),
      port: config.get<number>('redis.port'),
    }),
};

@Module({
  imports: [
    BullModule.registerQueue({ name: 'tasks' }),
    BullModule.registerQueue({ name: 'dead-letter' }),
    TypeOrmModule.forFeature([Task]),
    MockModule,
  ],
  providers: [redisProvider, JobsProducer, JobsProcessor, RateLimiterService],
  exports: [JobsProducer],
})
export class JobsModule {}
