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
import { User } from '../users/user.entity';
import { XRay } from '../xrays/xray.entity';
import { DiagnosisResult } from '../diagnosis-results/diagnosis-result.entity';

@Entity('patients')
@Index(['physicianId'])
@Index(['email'])
@Index(['createdAt'])
export class Patient {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  firstName!: string;

  @Column({ type: 'varchar', length: 255 })
  lastName!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 20 })
  phone!: string;

  @Column({ type: 'date' })
  dateOfBirth!: Date;

  @Column({
    type: 'enum',
    enum: ['Male', 'Female', 'Other'],
    default: 'Male',
  })
  gender!: string;

  @Column({ type: 'text', nullable: true })
  medicalHistory!: string | null; // JSON or text describing past medical conditions

  @Column({ type: 'text', nullable: true })
  allergies!: string | null;

  @Column({ type: 'text', nullable: true })
  medications!: string | null; // Current medications

  @Column({ type: 'varchar', length: 255, nullable: true })
  address!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  state!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  postalCode!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country!: string | null;

  @Column({ type: 'uuid' })
  physicianId!: string; // ID of the physician who registered this patient

  // TB Status Fields
  @Column({
    type: 'enum',
    enum: ['negative', 'positive', 'suspected', 'unknown'],
    default: 'unknown',
    nullable: false,
  })
  tbStatus!: string; // TB diagnosis status for the patient

  @Column({ type: 'boolean', default: false })
  notificationSent!: boolean; // Whether TB-positive notification has been sent

  @Column({ type: 'varchar', length: 255, nullable: true })
  lastTBTestDate!: string | null; // Date of last TB test

  @Column({ type: 'boolean', default: false })
  requiresFollowUp!: boolean; // Whether follow-up appointments are needed

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt!: Date | null;

  // Relations

  @ManyToOne(() => User, (user) => user.patients, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'physicianId' })
  physician!: User;

  @OneToMany(() => XRay, (xray) => xray.patient)
  xrays!: XRay[];

  @OneToMany(() => DiagnosisResult, (result) => result.patient)
  diagnosisResults!: DiagnosisResult[];
}
