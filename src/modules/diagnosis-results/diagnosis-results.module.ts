import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiagnosisResultsService } from './diagnosis-results.service';
import { DiagnosisResultsController } from './diagnosis-results.controller';
import { DiagnosisResult } from './diagnosis-result.entity';
import { AuthModule } from '../auth/auth.module';
import { TbWorkflowModule } from '../tb-workflow/tb-workflow.module';
import { PatientsModule } from '../patients/patients.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DiagnosisResult]),
    AuthModule,
    TbWorkflowModule,
    PatientsModule,
  ],
  controllers: [DiagnosisResultsController],
  providers: [DiagnosisResultsService],
  exports: [DiagnosisResultsService],
})
export class DiagnosisResultsModule {}
