import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { XRaysService } from './xrays.service';
import { XRaysController } from './xrays.controller';
import { XRay } from './xray.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([XRay]), AuthModule],
  controllers: [XRaysController],
  providers: [XRaysService],
  exports: [XRaysService],
})
export class XRaysModule {}
