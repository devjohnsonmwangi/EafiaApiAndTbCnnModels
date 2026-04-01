import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FollowUpAppointment } from './follow-up-appointment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FollowUpAppointment])],
  exports: [TypeOrmModule],
})
export class FollowUpsModule {}
