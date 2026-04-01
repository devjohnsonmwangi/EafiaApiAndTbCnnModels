import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  OneToMany,
  Unique,
  Index,
} from 'typeorm';
import { hash, genSalt, compare } from 'bcryptjs';
import { Patient } from '../patients/patient.entity';

export enum UserRole {
  PHYSICIAN = 'physician',
  RADIOLOGIST = 'radiologist',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

@Entity('users')
@Unique(['email'])
@Index(['email'])
@Index(['role'])
@Index(['createdAt'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255 })
  firstName!: string;

  @Column({ type: 'varchar', length: 255 })
  lastName!: string;

  @Column({ type: 'varchar', select: false })
  passwordHash!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.PHYSICIAN,
  })
  role!: UserRole;

  @Column({ type: 'varchar', length: 50, nullable: true })
  license!: string | null; // Medical license number

  @Column({ type: 'varchar', length: 255, nullable: true })
  specialization!: string | null; // e.g., "Chest Radiologist"

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone!: string | null;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'varchar', nullable: true })
  lastLoginIp!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt!: Date | null;

  // Relations

  @OneToMany(() => Patient, (patient) => patient.physician)
  patients!: Patient[];

  @BeforeInsert()
  async hashPassword(): Promise<void> {
    if (this.passwordHash) {
      const salt = await genSalt(10);

      this.passwordHash = await hash(this.passwordHash, salt);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    const isValid = await compare(password, this.passwordHash);
    return isValid;
  }

  toJSON() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...self } = this;
    return self;
  }
}
