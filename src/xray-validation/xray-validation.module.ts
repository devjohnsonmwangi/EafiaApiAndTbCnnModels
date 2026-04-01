import { Module } from '@nestjs/common';
import { XrayValidationService } from './xray-validation.service';
import { XrayValidationController } from './xray-validation.controller';

@Module({
  providers: [XrayValidationService],
  controllers: [XrayValidationController],
  exports: [XrayValidationService],
})
export class XrayValidationModule {}
