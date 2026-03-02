import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { TaskPriority } from '../../common/enums/task-priority.enum.js';

const TASK_TYPES = ['email', 'report'] as const;

export class CreateTaskDto {
  @ApiProperty({ example: 'report', enum: TASK_TYPES })
  @IsIn(TASK_TYPES, {
    message: `type must be one of: ${TASK_TYPES.join(', ')}`,
  })
  type: string;

  @ApiPropertyOptional({ enum: TaskPriority, default: TaskPriority.NORMAL })
  @IsEnum(TaskPriority, {
    message: 'priority must be one of: high, normal, low',
  })
  @IsOptional()
  priority?: TaskPriority;

  @ApiProperty({
    example: { to: 'toshmat@inbox.uz', subject: 'Hisobot tayyor' },
  })
  @IsObject({ message: 'payload must be a JSON object' })
  @IsNotEmpty({ message: 'payload must not be empty' })
  payload: Record<string, unknown>;

  @ApiProperty({ example: 'send-report-42' })
  @IsString({ message: 'idempotencyKey must be a string' })
  @IsNotEmpty({ message: 'idempotencyKey is required' })
  @MaxLength(255, { message: 'idempotencyKey must not exceed 255 characters' })
  idempotencyKey: string;

  @ApiPropertyOptional({
    example: '2026-03-05T10:30:00Z',
    description: 'ISO 8601 format. Leave empty to run immediately',
  })
  @IsDateString({}, { message: 'scheduledAt must be a valid ISO 8601 date' })
  @IsOptional()
  scheduledAt?: string;
}
