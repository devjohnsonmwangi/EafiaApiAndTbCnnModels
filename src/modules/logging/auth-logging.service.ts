import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { AuthLog, AuthLogAction } from '../auth/auth-log.entity';

/**
 * AuthLoggingService - Handles all authentication-related logging
 * Tracks logins, registrations, token refreshes, and failures
 */
@Injectable()
export class AuthLoggingService {
  constructor(
    @InjectRepository(AuthLog)
    private authLogRepository: Repository<AuthLog>,
  ) {}

  async logAuthAction(
    action: AuthLogAction,
    email: string,
    userId: string | null = null,
    ipAddress: string | null = null,
    userAgent: string | null = null,
    success: boolean = true,
    errorMessage: string | null = null,
    tokenIssued: string | null = null,
  ): Promise<AuthLog> {
    const authLog = this.authLogRepository.create({
      action,
      email,
      userId,
      ipAddress,
      userAgent,
      success,
      errorMessage,
      tokenIssued,
      deviceInfo: this.extractDeviceInfo(userAgent),
    });

    return await this.authLogRepository.save(authLog);
  }

  async getLoginHistory(
    userId: string,
    limit: number = 10,
  ): Promise<AuthLog[]> {
    return await this.authLogRepository.find({
      where: {
        userId,
        action: AuthLogAction.LOGIN,
        deletedAt: IsNull(),
      },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getFailedLoginAttempts(
    email: string,
    minutes: number = 30,
  ): Promise<AuthLog[]> {
    const timeAgo = new Date(Date.now() - minutes * 60 * 1000);

    return await this.authLogRepository
      .createQueryBuilder('log')
      .where('log.email = :email', { email })
      .andWhere('log.action = :action', { action: AuthLogAction.LOGIN_FAILED })
      .andWhere('log.success = :success', { success: false })
      .andWhere('log.createdAt > :timeAgo', { timeAgo })
      .andWhere('log.deletedAt IS NULL')
      .orderBy('log.createdAt', 'DESC')
      .getMany();
  }

  async getAllAuthLogs(
    userId?: string,
    limit: number = 100,
  ): Promise<AuthLog[]> {
    const query = this.authLogRepository
      .createQueryBuilder('log')
      .where('log.deletedAt IS NULL');

    if (userId !== null && userId !== undefined) {
      query.andWhere('log.userId = :userId', { userId });
    }

    return await query.orderBy('log.createdAt', 'DESC').take(limit).getMany();
  }

  private extractDeviceInfo(userAgent: string | null): string | null {
    if (userAgent === null || userAgent === undefined) return null;

    // Simple device detection
    if (userAgent.includes('Mobile')) return 'Mobile';
    if (userAgent.includes('Tablet')) return 'Tablet';
    if (userAgent.includes('iPad')) return 'iPad';
    if (userAgent.includes('iPhone')) return 'iPhone';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Macintosh')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';

    return 'Unknown';
  }
}
