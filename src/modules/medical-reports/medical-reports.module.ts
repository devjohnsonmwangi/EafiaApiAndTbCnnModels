import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalReport } from './medical-report.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MedicalReport])],
  exports: [TypeOrmModule],
})
export class MedicalReportsModule {}
