import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { UserRole } from '../users/user.entity';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(255)
  password!: string;

  @IsEnum(UserRole)
  role: UserRole = UserRole.PHYSICIAN;

  @IsString()
  license?: string;

  @IsString()
  specialization?: string;

  @IsString()
  phone?: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

export class AuthResponseDto {
  id!: string;
  email!: string;
  firstName!: string;
  lastName!: string;
  role!: UserRole;
  accessToken!: string;
  refreshToken!: string;
  expiresIn!: string;
}

export class RefreshTokenDto {
  @IsString()
  refreshToken!: string;
}
