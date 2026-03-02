import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Task } from './entities/task.entity.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { ListTasksQueryDto } from './dto/list-tasks-query.dto.js';
import { TaskStatus } from '../common/enums/task-status.enum.js';
import { Role } from '../common/enums/role.enum.js';
import { JobsProducer } from '../jobs/jobs.producer.js';
import {
  BusinessException,
  ErrorCode,
} from '../common/exceptions/business.exception.js';
import { paginate, safeCatch, PaginatedResult } from '../common/utils/index.js';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
    private readonly jobsProducer: JobsProducer,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateTaskDto, userId: string): Promise<Task> {
    const existing = await this.tasksRepository.findOne({
      where: { idempotencyKey: dto.idempotencyKey },
    });

    if (existing) {
      throw new BusinessException(ErrorCode.DUPLICATE_IDEMPOTENCY_KEY);
    }

    const saved = await this.dataSource.transaction(async (manager) => {
      const task = manager.create(Task, {
        userId,
        type: dto.type,
        priority: dto.priority,
        payload: dto.payload,
        idempotencyKey: dto.idempotencyKey,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
      });

      return manager.save(task);
    });

    await safeCatch(
      () => this.jobsProducer.addJob(saved),
      this.logger,
      `Task ${saved.id} saved but failed to queue`,
    );

    this.logger.log(`Task ${saved.id} created and queued`);
    return saved;
  }

  async findAll(
    query: ListTasksQueryDto,
    userId: string,
    role: Role,
  ): Promise<PaginatedResult<Task>> {
    const qb = this.tasksRepository.createQueryBuilder('task');

    if (role !== Role.ADMIN) {
      qb.andWhere('task.user_id = :userId', { userId });
    }

    if (query.status) {
      qb.andWhere('task.status = :status', { status: query.status });
    }

    if (query.type) {
      qb.andWhere('task.type = :type', { type: query.type });
    }

    if (query.from) {
      qb.andWhere('task.created_at >= :from', { from: new Date(query.from) });
    }

    if (query.to) {
      qb.andWhere('task.created_at <= :to', { to: new Date(query.to) });
    }

    qb.orderBy('task.created_at', 'DESC');

    return paginate(qb, { page: query.page, limit: query.limit });
  }

  async findOne(id: string, userId: string, role: Role): Promise<Task> {
    const task = await this.tasksRepository.findOne({ where: { id } });

    if (!task) {
      throw new BusinessException(ErrorCode.TASK_NOT_FOUND);
    }

    if (role !== Role.ADMIN && task.userId !== userId) {
      throw new BusinessException(ErrorCode.TASK_ACCESS_DENIED);
    }

    return task;
  }

  async cancel(id: string, userId: string, role: Role): Promise<Task> {
    const task = await this.findOne(id, userId, role);

    if (task.status !== TaskStatus.PENDING) {
      throw new BusinessException(ErrorCode.TASK_NOT_CANCELLABLE);
    }

    task.status = TaskStatus.CANCELLED;
    const saved = await this.tasksRepository.save(task);

    await this.jobsProducer.removeJob(task.id);
    this.logger.log(`Task ${id} cancelled`);

    return saved;
  }

  async reprocess(id: string): Promise<Task> {
    const task = await this.tasksRepository.findOne({ where: { id } });

    if (!task) {
      throw new BusinessException(ErrorCode.TASK_NOT_FOUND);
    }

    if (task.status !== TaskStatus.FAILED) {
      throw new BusinessException(ErrorCode.TASK_NOT_REPROCESSABLE);
    }

    task.status = TaskStatus.PENDING;
    task.attempts = 0;
    task.lastError = null;
    task.startedAt = null;
    task.completedAt = null;

    const saved = await this.tasksRepository.save(task);
    await this.jobsProducer.addJob(saved);
    this.logger.log(`Task ${id} requeued for processing`);

    return saved;
  }
}
