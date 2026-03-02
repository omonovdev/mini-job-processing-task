import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { Task } from '../tasks/entities/task.entity.js';
import { TaskPriority } from '../common/enums/task-priority.enum.js';
import { safeCatch, safeIgnore } from '../common/utils/index.js';

const PRIORITY_MAP: Record<TaskPriority, number> = {
  [TaskPriority.HIGH]: 1,
  [TaskPriority.NORMAL]: 5,
  [TaskPriority.LOW]: 10,
};

@Injectable()
export class JobsProducer {
  private readonly logger = new Logger(JobsProducer.name);

  constructor(@InjectQueue('tasks') private readonly tasksQueue: Queue) {}

  async addJob(task: Task): Promise<void> {
    const delay = task.scheduledAt
      ? Math.max(0, new Date(task.scheduledAt).getTime() - Date.now())
      : 0;

    await safeCatch(
      () =>
        this.tasksQueue.add(
          'process',
          { taskId: task.id },
          {
            jobId: task.id,
            priority: PRIORITY_MAP[task.priority] ?? 5,
            delay,
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
            removeOnComplete: true,
            removeOnFail: false,
          },
        ),
      this.logger,
      `Failed to queue job for task ${task.id}`,
    );

    this.logger.log(
      `Job queued for task ${task.id} (priority=${task.priority}, delay=${delay}ms)`,
    );
  }

  async removeJob(taskId: string): Promise<void> {
    await safeIgnore(
      async () => {
        const job = await this.tasksQueue.getJob(taskId);
        if (job) {
          await job.remove();
          this.logger.log(`Job removed for task ${taskId}`);
        }
      },
      this.logger,
      `Failed to remove job for task ${taskId}`,
    );
  }
}
