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

export enum ReportType {
  DIAGNOSIS_REPORT = 'diagnosis_report', // TB diagnosis results
  TREATMENT_PLAN = 'treatment_plan', // Treatment recommendations
  FOLLOW_UP_SUMMARY = 'follow_up_summary', // Summary of follow-up progress
  MEDICAL_HISTORY = 'medical_history', // Patient's full medical history
  REFERRAL_LETTER = 'referral_letter', // Referral to specialist
  DISCHARGE_SUMMARY = 'discharge_summary', // End of treatment summary
}

export enum ReportStatus {
  DRAFT = 'draft',
  GENERATED = 'generated',
  REVIEWED = 'reviewed',
  APPROVED = 'approved',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

@Entity('medical_reports')
@Index(['patientId'])
@Index(['type'])
@Index(['status'])
@Index(['createdAt'])
@Index(['diagnosisResultId'])
export class MedicalReport {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  patientId!: string;

  @Column({ type: 'uuid', nullable: true })
  diagnosisResultId!: string | null; // Reference to diagnosis this report covers

  @Column({ type: 'uuid', nullable: true })
  generatedBy!: string | null; // User ID who generated the report

  @Column({ type: 'uuid', nullable: true })
  reviewedBy!: string | null; // User ID who reviewed/approved the report

  @Column({
    type: 'enum',
    enum: ReportType,
  })
  type!: ReportType;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  content!: string; // Full report content (HTML or plain text)

  @Column({ type: 'text', nullable: true })
  summary!: string | null; // Brief summary of the report

  @Column({
    type: 'enum',
    enum: ReportStatus,
    default: ReportStatus.DRAFT,
  })
  status!: ReportStatus;

  @Column({ type: 'text', nullable: true })
  pdfBase64!: string | null; // Generated PDF as Base64 for storage

  @Column({ type: 'text', nullable: true })
  pdfUrl!: string | null; // URL to access the PDF

  @Column({ type: 'varchar', length: 255, nullable: true })
  fileName!: string | null; // Original file name

  @Column({ type: 'integer', nullable: true })
  fileSizeBytes!: number | null; // Size of generated PDF

  // TB-Specific Fields
  @Column({ type: 'varchar', length: 50, nullable: true })
  tbDiagnosis!: string | null; // TB_POSITIVE, TB_NEGATIVE, TB_SUSPECTED

  @Column({ type: 'float', nullable: true })
  confidenceScore!: number | null; // Confidence of the diagnosis

  @Column({ type: 'text', nullable: true })
  treatmentRecommendations!: string | null; // Specific drug regimen

  @Column({ type: 'varchar', length: 100, nullable: true })
  durationMonths!: string | null; // Expected treatment duration

  @Column({ type: 'text', nullable: true })
  precautions!: string | null; // Safety precautions for patient

  @Column({ type: 'text', nullable: true })
  dietaryRecommendations!: string | null; // Dietary advice during treatment

  @Column({ type: 'boolean', default: false })
  sentToPatient!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  sentToPatientAt!: Date | null;

  @Column({ type: 'boolean', default: false })
  sentToPhysician!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  sentToPhysicianAt!: Date | null;

  @Column({ type: 'boolean', default: false })
  sentToRadiologist!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  sentToRadiologistAt!: Date | null;

  // Email tracking
  @Column({ type: 'text', nullable: true })
  recipientEmails!: string | null; // Comma-separated list of recipients

  @Column({ type: 'integer', default: 0 })
  emailsSent!: number;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt!: Date | null;

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
  @JoinColumn({ name: 'generatedBy' })
  author!: User | null;

  @ManyToOne(() => User, (_user) => {}, {
    onDelete: 'SET NULL',
    eager: true,
    nullable: true,
  })
  @JoinColumn({ name: 'reviewedBy' })
  reviewer!: User | null;

  @ManyToOne(() => DiagnosisResult, (_diagnosis) => {}, {
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'diagnosisResultId' })
  diagnosisResult!: DiagnosisResult | null;
}
