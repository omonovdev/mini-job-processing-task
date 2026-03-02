import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskPriority } from '../../common/enums/task-priority.enum.js';
import { TaskStatus } from '../../common/enums/task-status.enum.js';

export class TaskResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-5678-90ab-cdef-1234567890ab' })
  id: string;

  @ApiProperty({ example: 'f9e8d7c6-5432-10fe-dcba-0987654321fe' })
  userId: string;

  @ApiProperty({ example: 'report' })
  type: string;

  @ApiProperty({ enum: TaskPriority, example: 'normal' })
  priority: TaskPriority;

  @ApiProperty({
    example: { to: 'toshmat@inbox.uz', subject: 'Hisobot tayyor' },
  })
  payload: Record<string, unknown>;

  @ApiProperty({ enum: TaskStatus, example: 'COMPLETED' })
  status: TaskStatus;

  @ApiProperty({ example: 'send-report-42' })
  idempotencyKey: string;

  @ApiProperty({ example: 1 })
  attempts: number;

  @ApiPropertyOptional({ example: null })
  lastError: string | null;

  @ApiPropertyOptional({ example: null })
  scheduledAt: Date | null;

  @ApiPropertyOptional({ example: '2026-03-02T14:30:01.000Z' })
  startedAt: Date | null;

  @ApiPropertyOptional({ example: '2026-03-02T14:30:04.200Z' })
  completedAt: Date | null;

  @ApiProperty({ example: '2026-03-02T14:30:00.500Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-03-02T14:30:04.200Z' })
  updatedAt: Date;
}

export class PaginatedTasksResponseDto {
  @ApiProperty({ type: [TaskResponseDto] })
  data: TaskResponseDto[];

  @ApiProperty({ example: 3 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;
}
