import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TaskStatus } from '../../common/enums/task-status.enum.js';

export class ListTasksQueryDto {
  @ApiPropertyOptional({ enum: TaskStatus })
  @IsEnum(TaskStatus, {
    message:
      'status must be one of: PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED',
  })
  @IsOptional()
  status?: TaskStatus;

  @ApiPropertyOptional({ example: 'report' })
  @IsString({ message: 'type must be a string' })
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ example: '2026-02-01T00:00:00Z' })
  @IsDateString({}, { message: 'from must be a valid ISO 8601 date' })
  @IsOptional()
  from?: string;

  @ApiPropertyOptional({ example: '2026-03-01T23:59:59Z' })
  @IsDateString({}, { message: 'to must be a valid ISO 8601 date' })
  @IsOptional()
  to?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @Type(() => Number)
  @Min(1, { message: 'page must be at least 1' })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @Min(1, { message: 'limit must be at least 1' })
  @Max(100, { message: 'limit must not exceed 100' })
  @IsOptional()
  limit?: number = 20;
}
