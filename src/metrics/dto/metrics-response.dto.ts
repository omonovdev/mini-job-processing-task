import { ApiProperty } from '@nestjs/swagger';

export class StatusCountDto {
  @ApiProperty({ example: 5 })
  PENDING: number;

  @ApiProperty({ example: 2 })
  PROCESSING: number;

  @ApiProperty({ example: 18 })
  COMPLETED: number;

  @ApiProperty({ example: 3 })
  FAILED: number;

  @ApiProperty({ example: 1 })
  CANCELLED: number;
}

export class MetricsResponseDto {
  @ApiProperty({ example: 29 })
  totalTasks: number;

  @ApiProperty({ type: StatusCountDto })
  byStatus: StatusCountDto;

  @ApiProperty({ example: 3245, description: 'Average processing time in ms' })
  avgProcessingTimeMs: number;
}
