import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Patient } from '../patients/patient.entity';
import { DiagnosisResult } from '../diagnosis-results/diagnosis-result.entity';

export enum XRayStatus {
  PENDING = 'pending', // Awaiting ML model analysis
  VALIDATING = 'validating', // X-ray validation in progress
  PROCESSING = 'processing', // ML model processing
  COMPLETED = 'completed', // Analysis complete
  FAILED = 'failed', // Processing failed
}

@Entity('xrays')
@Index(['patientId'])
@Index(['status'])
@Index(['createdAt'])
export class XRay {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  patientId!: string;

  @Column({ type: 'text' })
  imageBase64!: string; // Base64 encoded X-ray image

  @Column({ type: 'varchar', length: 255, nullable: true })
  fileName!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  fileType!: string | null; // e.g., "image/jpeg"

  @Column({ type: 'integer', nullable: true })
  fileSizeBytes!: number | null;

  @Column({
    type: 'enum',
    enum: XRayStatus,
    default: XRayStatus.PENDING,
  })
  status!: XRayStatus;

  @Column({ type: 'varchar', length: 50, nullable: true })
  xrayType!: string | null; // e.g., "chest", "ab dome", "lumbar spine"

  @Column({ type: 'text', nullable: true })
  notes!: string | null; // Physician notes about the X-ray

  @Column({ type: 'boolean', default: false })
  isValid!: boolean; // Whether the image passed X-ray validation

  @Column({ type: 'float', nullable: true })
  validationConfidence!: number | null; // Confidence score from X-ray validator (0-1)

  @Column({ type: 'text', nullable: true })
  validationError!: string | null; // Error message if validation failed

  @Column({ type: 'varchar', nullable: true })
  deviceIpAddress!: string | null; // IP address that submitted the X-ray

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt!: Date | null;

  // Relations

  @ManyToOne(() => Patient, (patient) => patient.xrays, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'patientId' })
  patient!: Patient;

  @OneToMany(() => DiagnosisResult, (result) => result.xray)
  diagnosisResults!: DiagnosisResult[];
}
