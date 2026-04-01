import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiagnosisResultsService } from './diagnosis-results.service';
import { DiagnosisResultsController } from './diagnosis-results.controller';
import { DiagnosisResult } from './diagnosis-result.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([DiagnosisResult]), AuthModule],
  controllers: [DiagnosisResultsController],
  providers: [DiagnosisResultsService],
  exports: [DiagnosisResultsService],
})
export class DiagnosisResultsModule {}
