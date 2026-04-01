import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientsService } from './patients.service';
import { PatientsController } from './patients.controller';
import { Patient } from './patient.entity';
import { XRay } from '../xrays/xray.entity';
import { DiagnosisResult } from '../diagnosis-results/diagnosis-result.entity';
import { AuthModule } from '../auth/auth.module';
import { SystemLoggingModule } from '../logging/system-logging.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Patient, XRay, DiagnosisResult]),
    AuthModule,
    SystemLoggingModule,
  ],
  controllers: [PatientsController],
  providers: [PatientsService],
  exports: [PatientsService],
})
export class PatientsModule {}
