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
import { XRay } from '../xrays/xray.entity';

export enum DiseaseType {
  TUBERCULOSIS = 'tuberculosis',
  PNEUMONIA = 'pneumonia',
  LUNG_CANCER = 'lung_cancer',
  BONE_FRACTURE = 'bone_fracture',
}

export enum TBIntensity {
  NONE = 'none', // No TB detected
  MILD = 'mild', // Minimal lesions (early stage)
  MODERATE = 'moderate', // Clear lesions (developing TB)
  SEVERE = 'severe', // Extensive lesions (advanced TB)
  CRITICAL = 'critical', // Very extensive, life-threatening
}

export enum ConfidenceLevel {
  LOW = 'low', // 0-50%
  MODERATE = 'moderate', // 50-75%
  HIGH = 'high', // 75-90%
  VERY_HIGH = 'very_high', // 90-100%
}

export enum DiagnosisStatus {
  PENDING = 'pending', // Waiting for valid X-ray or initial diagnosis
  COMPLETED = 'completed', // TB diagnosis completed with results
  FAILED = 'failed', // X-ray validation failed, cannot process
  UPDATED = 'updated', // Re-diagnosis completed after X-ray update
}

@Entity('diagnosis_results')
@Index(['patientId'])
@Index(['xrayId'])
@Index(['diseaseType'])
@Index(['createdAt'])
export class DiagnosisResult {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  patientId!: string;

  @Column({ type: 'uuid' })
  xrayId!: string;

  @Column({
    type: 'enum',
    enum: DiseaseType,
    default: DiseaseType.TUBERCULOSIS,
  })
  diseaseType!: DiseaseType;

  @Column({ type: 'varchar', length: 50 })
  prediction!: string; // e.g., "TB_POSITIVE", "TB_NEGATIVE"

  @Column({ type: 'float' })
  confidenceScore!: number; // 0-1 scale

  @Column({
    type: 'enum',
    enum: ConfidenceLevel,
  })
  confidenceLevel!: ConfidenceLevel;

  // TB-Specific Intensity

  @Column({
    type: 'enum',
    enum: TBIntensity,
    default: TBIntensity.NONE,
  })
  tbIntensity!: TBIntensity;

  @Column({ type: 'text', nullable: true })
  affectedAreas!: string | null; // JSON-like description of affected lung areas

  @Column({ type: 'float', nullable: true })
  affectedPercentage!: number | null; // Percentage of lung affected (0-100)

  @Column({ type: 'text', nullable: true })
  heatmapBase64!: string | null; // Visual heatmap from model

  @Column({ type: 'text', nullable: true })
  clinicalFindings!: string | null; // Detailed clinical interpretation

  @Column({ type: 'text', nullable: true })
  recommendations!: string | null; // Recommendations for treatment

  @Column({ type: 'varchar', nullable: true })
  modelName!: string | null; // Which ML model generated this (e.g., "tb_classifier_v1")

  @Column({ type: 'integer', nullable: true })
  processingTimeMs!: number | null; // Time taken to process (in milliseconds)

  @Column({ type: 'varchar', nullable: true })
  deviceIpAddress!: string | null; // IP address that submitted the request

  @Column({
    type: 'enum',
    enum: DiagnosisStatus,
    default: DiagnosisStatus.PENDING,
  })
  status!: DiagnosisStatus; // Status of the diagnosis (pending, completed, failed, updated)

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt!: Date | null;

  // Relations

  @ManyToOne(() => Patient, (patient) => patient.diagnosisResults, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'patientId' })
  patient!: Patient;

  @ManyToOne(() => XRay, (xray) => xray.diagnosisResults, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'xrayId' })
  xray!: XRay;
}
