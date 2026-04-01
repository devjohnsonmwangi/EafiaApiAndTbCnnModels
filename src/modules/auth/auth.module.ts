import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from '../users/user.entity';
import { AuthLog } from './auth-log.entity';
import { AuthLoggingService } from '../logging/auth-logging.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, AuthLog]),
    JwtModule.register({
      secret:
        process.env.JWT_SECRET ??
        'your-super-secret-jwt-key-change-in-production-min-32-chars',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthLoggingService],
  exports: [AuthService, AuthLoggingService, JwtModule],
})
export class AuthModule {}
