import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthLog } from '../auth/auth-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AuthLog])],
  exports: [TypeOrmModule],
})
export class AuthLoggingModule {}
