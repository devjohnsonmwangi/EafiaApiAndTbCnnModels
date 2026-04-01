import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum AuthLogAction {
  REGISTER = 'register',
  LOGIN = 'login',
  LOGOUT = 'logout',
  LOGIN_FAILED = 'login_failed',
  TOKEN_REFRESH = 'token_refresh',
  TOKEN_REFRESH_FAILED = 'token_refresh_failed',
  PASSWORD_CHANGE = 'password_change',
  PASSWORD_RESET = 'password_reset',
  ACCOUNT_DELETED = 'account_deleted',
  ACCOUNT_ACTIVATED = 'account_activated',
  ACCOUNT_DEACTIVATED = 'account_deactivated',
}

/**
 * AuthLog Entity - Tracks all authentication-related events
 * ✅ Soft deletes enabled via deletedAt column (though logs are typically immutable)
 */
@Entity('auth_logs')
@Index(['userId'])
@Index(['action'])
@Index(['ipAddress'])
@Index(['createdAt'])
@Index(['userId', 'action', 'createdAt'])
export class AuthLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: true })
  userId!: string | null; // NULL for failed login attempts with non-existent users

  @Column({ type: 'varchar', length: 255 })
  email!: string; // Email used in the auth action

  @Column({
    type: 'enum',
    enum: AuthLogAction,
  })
  action!: AuthLogAction;

  @Column({ type: 'varchar', nullable: true })
  ipAddress!: string | null; // IP address of the request

  @Column({ type: 'varchar', nullable: true })
  userAgent!: string | null; // Browser/client user agent

  @Column({ type: 'varchar', nullable: true })
  deviceInfo!: string | null; // Device type detected

  @Column({ type: 'text', nullable: true })
  details!: string | null; // Additional details (JSON)

  @Column({ type: 'varchar', nullable: true })
  tokenIssued!: string | null; // First 20 chars of token issued (for tracking)

  @Column({ type: 'boolean', default: true })
  success!: boolean; // Whether the action succeeded

  @Column({ type: 'varchar', nullable: true })
  errorMessage!: string | null; // Error details if failed

  @CreateDateColumn()
  createdAt!: Date;

  // Soft delete for compliance (though logs shouldn't be deleted)
  @Column({ type: 'timestamp', nullable: true })
  deletedAt!: Date | null;
}
