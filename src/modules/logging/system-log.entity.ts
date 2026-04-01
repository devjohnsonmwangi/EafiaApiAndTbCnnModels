import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  UpdateDateColumn,
} from 'typeorm';

export enum SystemLogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export enum SystemLogCategory {
  // Infrastructure
  DATABASE = 'database',
  API = 'api',
  CACHE = 'cache',
  STORAGE = 'storage',

  // Business Logic
  USER_MANAGEMENT = 'user_management',
  PATIENT_MANAGEMENT = 'patient_management',
  XRAY_PROCESSING = 'xray_processing',
  ML_INFERENCE = 'ml_inference',
  DIAGNOSIS = 'diagnosis',

  // Security & Compliance
  SECURITY = 'security',
  AUDIT = 'audit',
  DATA_PRIVACY = 'data_privacy',

  // System Health
  PERFORMANCE = 'performance',
  HEALTH_CHECK = 'health_check',
  BACKUP = 'backup',
}

/**
 * SystemLog Entity - Centralized logging for the application
 * ✅ Soft deletes enabled for compliance
 */
@Entity('system_logs')
@Index(['level'])
@Index(['category'])
@Index(['userId'])
@Index(['createdAt'])
@Index(['level', 'category', 'createdAt'])
export class SystemLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: SystemLogLevel,
  })
  level!: SystemLogLevel;

  @Column({
    type: 'enum',
    enum: SystemLogCategory,
  })
  category!: SystemLogCategory;

  @Column({ type: 'varchar', length: 500 })
  message!: string;

  @Column({ type: 'text', nullable: true })
  details!: string | null; // JSON or detailed info

  @Column({ type: 'text', nullable: true })
  error!: string | null; // Error stack trace if applicable

  @Column({ type: 'uuid', nullable: true })
  userId!: string | null; // User who triggered this log

  @Column({ type: 'uuid', nullable: true })
  resourceId!: string | null; // Resource (patient/xray/result) affected

  @Column({ type: 'varchar', length: 50, nullable: true })
  resourceType!: string | null; // Type of resource ('patient', 'xray', 'diagnosis', etc.)

  @Column({ type: 'varchar', nullable: true })
  ipAddress!: string | null; // IP address if applicable

  @Column({ type: 'integer', nullable: true })
  responseTimeMs!: number | null; // Response time for API calls

  @Column({ type: 'integer', nullable: true })
  statusCode!: number | null; // HTTP status code if API

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt!: Date | null;

  // Helper method for creating log entry
  static create(
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
  ): Partial<SystemLog> {
    return {
      level,
      category,
      message,
      details:
        typeof options?.details === 'string'
          ? options.details
          : JSON.stringify(options?.details ?? {}),
      error: options?.error?.stack,
      userId: options?.userId,
      resourceId: options?.resourceId,
      resourceType: options?.resourceType,
      ipAddress: options?.ipAddress,
      responseTimeMs: options?.responseTimeMs,
      statusCode: options?.statusCode,
    };
  }
}
