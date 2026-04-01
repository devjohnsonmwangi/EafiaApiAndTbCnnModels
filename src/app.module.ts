import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PatientsModule } from './modules/patients/patients.module';
import { XRaysModule } from './modules/xrays/xrays.module';
import { DiagnosisResultsModule } from './modules/diagnosis-results/diagnosis-results.module';
import { TbPredictionModule } from './tb-prediction/tb-prediction.module';
import { XrayValidationModule } from './xray-validation/xray-validation.module';
import { AuthLoggingModule } from './modules/logging/auth-logging.module';
import { SystemLoggingModule } from './modules/logging/system-logging.module';
import { typeOrmConfig } from './config/typeorm.config';
import { LoggerMiddleware } from './common/middleware/logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'production' ? '.env.production' : '.env',
    }),
    TypeOrmModule.forRoot(typeOrmConfig()),
    CacheModule.register({
      isGlobal: true,
      ttl: parseInt(process.env.CACHE_TTL || '3600'),
    }),
    AuthLoggingModule,
    SystemLoggingModule,
    AuthModule,
    UsersModule,
    PatientsModule,
    XRaysModule,
    DiagnosisResultsModule,
    TbPredictionModule,
    XrayValidationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
