import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../tasks/entities/task.entity.js';
import { TaskStatus } from '../common/enums/task-status.enum.js';
import { safeCatch } from '../common/utils/index.js';

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  constructor(
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
  ) {}

  async getMetrics() {
    return safeCatch(
      async () => {
        const totalTasks = await this.tasksRepository.count();

        const statusCounts = await this.tasksRepository
          .createQueryBuilder('task')
          .select('task.status', 'status')
          .addSelect('COUNT(*)::int', 'count')
          .groupBy('task.status')
          .getRawMany<{ status: TaskStatus; count: number }>();

        const byStatus = {
          PENDING: 0,
          PROCESSING: 0,
          COMPLETED: 0,
          FAILED: 0,
          CANCELLED: 0,
        };

        for (const row of statusCounts) {
          byStatus[row.status] = row.count;
        }

        const avgResult = await this.tasksRepository
          .createQueryBuilder('task')
          .select(
            'AVG(EXTRACT(EPOCH FROM (task.completed_at - task.started_at)) * 1000)',
            'avg',
          )
          .where('task.status = :status', { status: TaskStatus.COMPLETED })
          .andWhere('task.started_at IS NOT NULL')
          .andWhere('task.completed_at IS NOT NULL')
          .getRawOne<{ avg: string | null }>();

        const avgProcessingTimeMs = avgResult?.avg
          ? Math.round(parseFloat(avgResult.avg))
          : 0;

        return { totalTasks, byStatus, avgProcessingTimeMs };
      },
      this.logger,
      'Failed to fetch metrics',
    );
  }
}
