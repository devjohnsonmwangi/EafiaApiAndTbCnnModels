import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TbWorkflowService } from './tb-workflow.service';
import { Notification } from '../notifications/notification.entity';
import { FollowUpAppointment } from '../follow-ups/follow-up-appointment.entity';
import { MedicalReport } from '../medical-reports/medical-report.entity';
import { Patient } from '../patients/patient.entity';
import { User } from '../users/user.entity';
import { DiagnosisResult } from '../diagnosis-results/diagnosis-result.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      FollowUpAppointment,
      MedicalReport,
      Patient,
      User,
      DiagnosisResult,
    ]),
  ],
  providers: [TbWorkflowService],
  exports: [TbWorkflowService],
})
export class TbWorkflowModule {}
