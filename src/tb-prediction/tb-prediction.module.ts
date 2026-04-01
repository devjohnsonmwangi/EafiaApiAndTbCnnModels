import { Module } from '@nestjs/common';
import { TbPredictionService } from './tb-prediction.service';
import { TbPredictionController } from './tb-prediction.controller';
import { XrayValidationModule } from '../xray-validation/xray-validation.module';

@Module({
  imports: [XrayValidationModule],
  providers: [TbPredictionService],
  controllers: [TbPredictionController],
})
export class TbPredictionModule {}
