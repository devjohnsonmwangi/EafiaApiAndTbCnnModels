import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemLog } from './system-log.entity';
import { SystemLoggingService } from './system-logging.service';
import { SystemLoggingController } from './system-logging.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SystemLog])],
  providers: [SystemLoggingService],
  controllers: [SystemLoggingController],
  exports: [SystemLoggingService],
})
export class SystemLoggingModule {}
