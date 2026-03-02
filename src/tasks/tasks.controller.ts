import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TasksService } from './tasks.service.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { ListTasksQueryDto } from './dto/list-tasks-query.dto.js';
import {
  PaginatedTasksResponseDto,
  TaskResponseDto,
} from './dto/task-response.dto.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Role } from '../common/enums/role.enum.js';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: 201, type: TaskResponseDto })
  @ApiResponse({ status: 409, description: 'Duplicate idempotency key' })
  async create(
    @Body() dto: CreateTaskDto,
    @CurrentUser('userId') userId: string,
  ): Promise<TaskResponseDto> {
    return this.tasksService.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List tasks with filtering and pagination' })
  @ApiResponse({ status: 200, type: PaginatedTasksResponseDto })
  async findAll(
    @Query() query: ListTasksQueryDto,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: Role,
  ): Promise<PaginatedTasksResponseDto> {
    return this.tasksService.findAll(query, userId, role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task by ID' })
  @ApiResponse({ status: 200, type: TaskResponseDto })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: Role,
  ): Promise<TaskResponseDto> {
    return this.tasksService.findOne(id, userId, role);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a pending task' })
  @ApiResponse({ status: 200, type: TaskResponseDto })
  @ApiResponse({ status: 409, description: 'Task is not in PENDING status' })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: Role,
  ): Promise<TaskResponseDto> {
    return this.tasksService.cancel(id, userId, role);
  }

  @Post(':id/reprocess')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Reprocess a failed task (Admin only)' })
  @ApiResponse({ status: 200, type: TaskResponseDto })
  @ApiResponse({ status: 409, description: 'Task is not in FAILED status' })
  async reprocess(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TaskResponseDto> {
    return this.tasksService.reprocess(id);
  }
}
