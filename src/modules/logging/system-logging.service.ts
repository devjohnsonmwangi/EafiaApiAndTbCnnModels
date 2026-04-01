import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import {
  SystemLog,
  SystemLogLevel,
  SystemLogCategory,
} from './system-log.entity';

/**
 * SystemLoggingService - Centralized logging service for the entire application
 * Handles API logs, database logs, business logic logs, and errors
 */
@Injectable()
export class SystemLoggingService {
  constructor(
    @InjectRepository(SystemLog)
    private logRepository: Repository<SystemLog>,
  ) {}

  async log(
    level: SystemLogLevel,
    category: SystemLogCategory,
    message: string,
    options?: {
      details?: Record<string, unknown> | string;
      error?: Error;
      userId?: string;
      resourceId?: string;
      resourceType?: string;
      ipAddress?: string;
      responseTimeMs?: number;
      statusCode?: number;
    },
  ): Promise<SystemLog> {
    const logEntry = this.logRepository.create(
      SystemLog.create(level, category, message, options),
    );
    return await this.logRepository.save(logEntry);
  }

  async debug(
    category: SystemLogCategory,
    message: string,
    options?: Record<string, unknown>,
  ): Promise<SystemLog> {
    return this.log(SystemLogLevel.DEBUG, category, message, {
      details: options,
    });
  }

  async info(
    category: SystemLogCategory,
    message: string,
    options?: Record<string, unknown>,
  ): Promise<SystemLog> {
    return this.log(SystemLogLevel.INFO, category, message, {
      details: options,
    });
  }

  async warn(
    category: SystemLogCategory,
    message: string,
    options?: Record<string, unknown>,
  ): Promise<SystemLog> {
    return this.log(SystemLogLevel.WARN, category, message, {
      details: options,
    });
  }

  async error(
    category: SystemLogCategory,
    message: string,
    error?: Error,
    context?: Record<string, unknown>,
  ): Promise<SystemLog> {
    return this.log(SystemLogLevel.ERROR, category, message, {
      error,
      details: context,
    });
  }

  async critical(
    category: SystemLogCategory,
    message: string,
    error?: Error,
    context?: Record<string, unknown>,
  ): Promise<SystemLog> {
    return this.log(SystemLogLevel.CRITICAL, category, message, {
      error,
      details: context,
    });
  }

  async getLogsByCategory(
    category: SystemLogCategory,
    limit: number = 100,
  ): Promise<SystemLog[]> {
    return await this.logRepository.find({
      where: {
        category,
        deletedAt: IsNull(),
      },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getLogsByLevel(
    level: SystemLogLevel,
    limit: number = 100,
  ): Promise<SystemLog[]> {
    return await this.logRepository.find({
      where: {
        level,
        deletedAt: IsNull(),
      },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getErrorLogs(limit: number = 100): Promise<SystemLog[]> {
    return await this.logRepository.find({
      where: [
        { level: SystemLogLevel.ERROR, deletedAt: IsNull() },
        { level: SystemLogLevel.CRITICAL, deletedAt: IsNull() },
      ],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getResourceLogs(
    resourceId: string,
    resourceType?: string,
    limit: number = 50,
  ): Promise<SystemLog[]> {
    const query = this.logRepository
      .createQueryBuilder('log')
      .where('log.resourceId = :resourceId', { resourceId })
      .andWhere('log.deletedAt IS NULL');

    if (resourceType !== null && resourceType !== undefined) {
      query.andWhere('log.resourceType = :resourceType', { resourceType });
    }

    return await query.orderBy('log.createdAt', 'DESC').take(limit).getMany();
  }

  async getUserActivityLogs(
    userId: string,
    limit: number = 100,
  ): Promise<SystemLog[]> {
    return await this.logRepository.find({
      where: {
        userId,
        deletedAt: IsNull(),
      },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getLogs(options?: {
    level?: SystemLogLevel;
    category?: SystemLogCategory;
    limit?: number;
    offset?: number;
    search?: string;
  }): Promise<SystemLog[]> {
    const query = this.logRepository
      .createQueryBuilder('log')
      .where('log.deletedAt IS NULL');

    if (options?.level) {
      query.andWhere('log.level = :level', { level: options.level });
    }

    if (options?.category) {
      query.andWhere('log.category = :category', { category: options.category });
    }

    if (options?.search) {
      query.andWhere('log.message ILIKE :search', {
        search: `%${options.search}%`,
      });
    }

    return await query
      .orderBy('log.createdAt', 'DESC')
      .skip(options?.offset || 0)
      .take(options?.limit || 100)
      .getMany();
  }

  async getLogsCount(options?: {
    level?: SystemLogLevel;
    category?: SystemLogCategory;
    search?: string;
  }): Promise<number> {
    const query = this.logRepository
      .createQueryBuilder('log')
      .where('log.deletedAt IS NULL');

    if (options?.level) {
      query.andWhere('log.level = :level', { level: options.level });
    }

    if (options?.category) {
      query.andWhere('log.category = :category', { category: options.category });
    }

    if (options?.search) {
      query.andWhere('log.message ILIKE :search', {
        search: `%${options.search}%`,
      });
    }

    return await query.getCount();
  }
}
