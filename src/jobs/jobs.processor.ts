import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DelayedError, Job, Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { Task } from '../tasks/entities/task.entity.js';
import { TaskStatus } from '../common/enums/task-status.enum.js';
import { MockService } from '../mock/mock.service.js';
import { RateLimiterService } from './rate-limiter.service.js';
import { extractErrorMessage } from '../common/utils/index.js';

@Processor('tasks', { concurrency: 5 })
export class JobsProcessor extends WorkerHost {
  private readonly logger = new Logger(JobsProcessor.name);

  constructor(
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
    private readonly mockService: MockService,
    private readonly rateLimiterService: RateLimiterService,
    @InjectQueue('dead-letter') private readonly dlq: Queue,
  ) {
    super();
  }

  async process(job: Job<{ taskId: string }>): Promise<void> {
    const { taskId } = job.data;
    this.logger.log(
      `Processing task ${taskId} (attempt ${job.attemptsMade + 1})`,
    );

    const task = await this.tasksRepository.findOne({ where: { id: taskId } });
    if (!task) {
      this.logger.warn(`Task ${taskId} not found, skipping`);
      return;
    }

    if (task.status === TaskStatus.CANCELLED) {
      this.logger.log(`Task ${taskId} was cancelled, skipping`);
      return;
    }

    const allowed = await this.rateLimiterService.isAllowed(task.type);
    if (!allowed) {
      const delayMs = await this.rateLimiterService.getDelayMs(task.type);
      this.logger.warn(
        `Rate limited for type "${task.type}", delaying ${delayMs}ms`,
      );
      await job.moveToDelayed(Date.now() + delayMs, job.token);
      throw new DelayedError();
    }

    task.status = TaskStatus.PROCESSING;
    task.startedAt = new Date();
    task.attempts = job.attemptsMade + 1;
    await this.tasksRepository.save(task);

    try {
      await this.mockService.processTask(task.payload);

      task.status = TaskStatus.COMPLETED;
      task.completedAt = new Date();
      await this.tasksRepository.save(task);

      this.logger.log(`Task ${taskId} completed successfully`);
    } catch (error) {
      task.lastError = extractErrorMessage(error);

      const isLastAttempt = job.attemptsMade + 1 >= (job.opts.attempts ?? 3);
      if (isLastAttempt) {
        task.status = TaskStatus.FAILED;
        await this.tasksRepository.save(task);
        await this.moveToDeadLetter(task);
      } else {
        await this.tasksRepository.save(task);
      }

      this.logger.error(`Task ${taskId} failed: ${task.lastError}`);
      throw error;
    }
  }

  private async moveToDeadLetter(task: Task): Promise<void> {
    try {
      await this.dlq.add('failed', {
        taskId: task.id,
        type: task.type,
        lastError: task.lastError,
        attempts: task.attempts,
        failedAt: new Date().toISOString(),
      });
      this.logger.warn(`Task ${task.id} moved to dead-letter queue`);
    } catch (error) {
      this.logger.error(
        `Failed to move task ${task.id} to DLQ: ${extractErrorMessage(error)}`,
      );
    }
  }
}
