import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../modules/users/user.entity';
import { Patient } from '../modules/patients/patient.entity';
import { XRay } from '../modules/xrays/xray.entity';
import { DiagnosisResult } from '../modules/diagnosis-results/diagnosis-result.entity';
import { AuthLog } from '../modules/auth/auth-log.entity';
import { SystemLog } from '../modules/logging/system-log.entity';
import { Notification } from '../modules/notifications/notification.entity';
import { FollowUpAppointment } from '../modules/follow-ups/follow-up-appointment.entity';
import { MedicalReport } from '../modules/medical-reports/medical-report.entity';

export const typeOrmConfig = (): TypeOrmModuleOptions => {
  const isProduction = process.env.NODE_ENV === 'production';

  const entities = [
    User,
    Patient,
    XRay,
    DiagnosisResult,
    AuthLog,
    SystemLog,
    Notification,
    FollowUpAppointment,
    MedicalReport,
  ];

  // If DATABASE_URL is provided, use it directly; otherwise use individual credentials
  if (process.env.DATABASE_URL) {
    // Use DATABASE_URL for connection (e.g., Neon serverless)
    return {
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities,
      migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
      migrationsRun: true,
      synchronize: !isProduction,
      logging: !isProduction,
      maxQueryExecutionTime: 1000,
      dropSchema: false,
      logger: 'file',
      // Neon requires SSL - using verify-full for maximum security
      ssl: { rejectUnauthorized: true },
      // Connection pool settings to prevent concurrent query issues
      extra: {
        max: 20,
        min: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      },
    };
  }

  // Use individual credentials for local development
  return {
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'eafia_tb_detection',
    entities,
    migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
    migrationsRun: true,
    synchronize: !isProduction,
    logging: !isProduction,
    maxQueryExecutionTime: 1000,
    dropSchema: false,
    logger: 'file',
    ssl: isProduction ? { rejectUnauthorized: false } : false,
    // Connection pool settings to prevent concurrent query issues
    extra: {
      max: 20,
      min: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    },
  };
};
