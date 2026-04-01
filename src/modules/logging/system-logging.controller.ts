import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SystemLoggingService } from './system-logging.service';
import {
  SystemLog,
  SystemLogLevel,
  SystemLogCategory,
} from './system-log.entity';
import { UserRole } from '../users/user.entity';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('System Logging')
@Controller('logs')
@UseGuards(JwtGuard, RolesGuard)
@ApiBearerAuth('access_token')
export class SystemLoggingController {
  constructor(private readonly systemLoggingService: SystemLoggingService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get system logs',
    description:
      'Retrieve system logs with optional filtering by level, category, and date range',
  })
  @ApiQuery({ name: 'level', enum: SystemLogLevel, required: false })
  @ApiQuery({ name: 'category', enum: SystemLogCategory, required: false })
  async getLogs(
    @Query('level') level?: SystemLogLevel,
    @Query('category') category?: SystemLogCategory,
    @Query('limit') limit: number = 100,
    @Query('offset') offset: number = 0,
    @Query('search') search?: string,
  ): Promise<{
    data: SystemLog[];
    total: number;
    limit: number;
    offset: number;
  }> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      const logs: SystemLog[] = await this.systemLoggingService.getLogs({
        level,
        category,
        limit: Math.min(limit, 500), // Cap at 500
        offset,
        search,
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      const total: number = await this.systemLoggingService.getLogsCount({
        level,
        category,
        search,
      });

      return {
        data: logs,
        total,
        limit: Math.min(limit, 500),
        offset,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new InternalServerErrorException(
        `Failed to retrieve logs: ${errorMessage}`,
      );
    }
  }

  @Get('/recent')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get recent system logs',
    description: 'Retrieve the most recent system logs (last 50)',
  })
  async getRecentLogs(): Promise<SystemLog[]> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      const logs: SystemLog[] = await this.systemLoggingService.getLogs({
        limit: 50,
        offset: 0,
      });
      return logs;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new InternalServerErrorException(
        `Failed to retrieve recent logs: ${errorMessage}`,
      );
    }
  }

  @Get('/errors')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get error logs',
    description: 'Retrieve all error and critical logs from the system',
  })
  async getErrorLogs(
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0,
  ): Promise<{
    data: SystemLog[];
    total: number;
    limit: number;
    offset: number;
  }> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      const logs: SystemLog[] = await this.systemLoggingService.getLogs({
        level: SystemLogLevel.ERROR,
        limit: Math.min(limit, 500),
        offset,
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      const total: number = await this.systemLoggingService.getLogsCount({
        level: SystemLogLevel.ERROR,
      });

      return {
        data: logs,
        total,
        limit: Math.min(limit, 500),
        offset,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new InternalServerErrorException(
        `Failed to retrieve error logs: ${errorMessage}`,
      );
    }
  }

  @Get('/audit')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get audit logs',
    description: 'Retrieve all audit and security related logs',
  })
  async getAuditLogs(
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0,
  ): Promise<{
    data: SystemLog[];
    total: number;
    limit: number;
    offset: number;
  }> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      const logs: SystemLog[] = await this.systemLoggingService.getLogs({
        category: SystemLogCategory.AUDIT,
        limit: Math.min(limit, 500),
        offset,
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      const total: number = await this.systemLoggingService.getLogsCount({
        category: SystemLogCategory.AUDIT,
      });

      return {
        data: logs,
        total,
        limit: Math.min(limit, 500),
        offset,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new InternalServerErrorException(
        `Failed to retrieve audit logs: ${errorMessage}`,
      );
    }
  }
}
