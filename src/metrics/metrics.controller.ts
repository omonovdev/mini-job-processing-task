import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { MetricsService } from './metrics.service.js';
import { MetricsResponseDto } from './dto/metrics-response.dto.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Role } from '../common/enums/role.enum.js';

@ApiTags('Metrics')
@ApiBearerAuth()
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get task processing metrics (Admin only)' })
  @ApiResponse({ status: 200, type: MetricsResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async getMetrics(): Promise<MetricsResponseDto> {
    return this.metricsService.getMetrics();
  }
}
