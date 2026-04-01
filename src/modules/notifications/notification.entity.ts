import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Patient } from '../patients/patient.entity';
import { User } from '../users/user.entity';
import { DiagnosisResult } from '../diagnosis-results/diagnosis-result.entity';

export enum NotificationType {
  TB_POSITIVE_ALERT = 'tb_positive_alert',
  TB_NEGATIVE_ALERT = 'tb_negative_alert',
  APPOINTMENT_REMINDER = 'appointment_reminder',
  FOLLOW_UP_REQUIRED = 'follow_up_required',
  REPORT_READY = 'report_ready',
  XRAY_VALIDATION_FAILED = 'xray_validation_failed',
}

export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  IN_APP = 'in_app',
  PUSH = 'push',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  READ = 'read',
}

@Entity('notifications')
@Index(['patientId'])
@Index(['recipientId'])
@Index(['type'])
@Index(['status'])
@Index(['createdAt'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  patientId!: string;

  @Column({ type: 'uuid' })
  recipientId!: string; // User who receives the notification (physician or radiologist)

  @Column({ type: 'uuid', nullable: true })
  diagnosisResultId!: string | null; // Reference to the diagnosis that triggered this notification

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type!: NotificationType;

  @Column({
    type: 'enum',
    enum: NotificationChannel,
    default: NotificationChannel.EMAIL,
  })
  channel!: NotificationChannel;

  @Column({ type: 'varchar', length: 255 })
  subject!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'text', nullable: true })
  details!: string | null; // JSON-formatted additional details

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status!: NotificationStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  recipientEmail!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  recipientPhone!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  sentAt!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  readAt!: Date | null;

  @Column({ type: 'text', nullable: true })
  failureReason!: string | null; // Reason if notification failed to send

  @Column({ type: 'integer', default: 0 })
  retryCount!: number; // How many times we've tried to send this

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt!: Date | null;

  // Relations

  @ManyToOne(() => Patient, (_patient) => {}, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'patientId' })
  patient!: Patient;

  @ManyToOne(() => User, (_user) => {}, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'recipientId' })
  recipient!: User;

  @ManyToOne(() => DiagnosisResult, (_diagnosis) => {}, {
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'diagnosisResultId' })
  diagnosisResult!: DiagnosisResult | null;
}
