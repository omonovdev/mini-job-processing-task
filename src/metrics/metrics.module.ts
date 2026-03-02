import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from '../tasks/entities/task.entity.js';
import { MetricsController } from './metrics.controller.js';
import { MetricsService } from './metrics.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Task])],
  controllers: [MetricsController],
  providers: [MetricsService],
})
export class MetricsModule {}
