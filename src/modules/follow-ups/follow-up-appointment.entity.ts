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

export enum FollowUpType {
  CLINICAL_CONSULTATION = 'clinical_consultation', // Physician appointment
  TREATMENT_PLANNING = 'treatment_planning', // Treatment discussion meeting
  FOLLOW_UP_XRAY = 'follow_up_xray', // Repeat X-ray imaging
  LAB_TESTS = 'lab_tests', // Blood tests, sputum tests
  MEDICATION_REVIEW = 'medication_review', // Check medication compliance
  SPECIALIST_REFERRAL = 'specialist_referral', // Refer to TB specialist
}

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  RESCHEDULED = 'rescheduled',
  NO_SHOW = 'no_show',
}

@Entity('follow_up_appointments')
@Index(['patientId'])
@Index(['appointmentDate'])
@Index(['status'])
@Index(['type'])
@Index(['createdAt'])
export class FollowUpAppointment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  patientId!: string;

  @Column({ type: 'uuid', nullable: true })
  physicianId!: string | null; // Assigned physician

  @Column({ type: 'uuid', nullable: true })
  diagnosisResultId!: string | null; // Reference to diagnosis that created this follow-up

  @Column({
    type: 'enum',
    enum: FollowUpType,
  })
  type!: FollowUpType;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'timestamp' })
  appointmentDate!: Date;

  @Column({ type: 'integer', nullable: true })
  durationMinutes!: number | null; // Expected duration in minutes

  @Column({ type: 'varchar', length: 255, nullable: true })
  location!: string | null; // Physical location or virtual meeting link

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.SCHEDULED,
  })
  status!: AppointmentStatus;

  @Column({ type: 'text', nullable: true })
  notes!: string | null; // Additional notes for the appointment

  @Column({ type: 'text', nullable: true })
  completionNotes!: string | null; // Notes about what was done when completed

  @Column({ type: 'boolean', default: false })
  isUrgent!: boolean; // Mark as urgent if TB is severe

  @Column({ type: 'integer', default: 0 })
  sequenceNumber!: number; // Order in series of follow-ups (1st, 2nd, 3rd, etc.)

  @Column({ type: 'varchar', length: 255, nullable: true })
  reminderSentEmail!: string | null; // Email of who reminder was sent to

  @Column({ type: 'boolean', default: false })
  reminderSent!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  reminderSentAt!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  completedAt!: Date | null;

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
    onDelete: 'SET NULL',
    eager: true,
    nullable: true,
  })
  @JoinColumn({ name: 'physicianId' })
  physician!: User | null;

  @ManyToOne(() => DiagnosisResult, (_diagnosis) => {}, {
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'diagnosisResultId' })
  diagnosisResult!: DiagnosisResult | null;
}
