import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/user.entity';
import { RegisterDto, LoginDto, AuthResponseDto } from './auth.dto';
import { AuthLoggingService } from '../logging/auth-logging.service';
import { AuthLogAction } from './auth-log.entity';

/**
 * Interface for the JWT Payload to ensure type safety
 */
interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly authLoggingService: AuthLoggingService,
  ) {}

  async register(
    registerDto: RegisterDto,
    clientIp: string,
  ): Promise<AuthResponseDto> {
    const {
      email,
      firstName,
      lastName,
      password,
      role,
      license,
      specialization,
      phone,
    } = registerDto;

    // Strict boolean check: comparison must be explicit
    const existingUser = await this.usersRepository.findOne({
      where: { email },
    });
    if (existingUser !== null) {
      await this.authLoggingService.logAuthAction(
        AuthLogAction.REGISTER,
        email,
        null,
        clientIp,
        null,
        false,
        'User with this email already exists',
      );
      throw new ConflictException('User with this email already exists');
    }

    const user = this.usersRepository.create({
      email,
      firstName,
      lastName,
      passwordHash: password,
      role: role ?? UserRole.PHYSICIAN,
      license,
      specialization,
      phone,
      lastLoginIp: clientIp,
    });

    const savedUser = await this.usersRepository.save(user);

    const { accessToken, refreshToken, expiresIn } =
      this.generateTokens(savedUser);

    // Log successful registration
    await this.authLoggingService.logAuthAction(
      AuthLogAction.REGISTER,
      email,
      savedUser.id,
      clientIp,
      null,
      true,
      null,
      accessToken.substring(0, 20),
    );

    return {
      id: savedUser.id,
      email: savedUser.email,
      firstName: savedUser.firstName,
      lastName: savedUser.lastName,
      role: savedUser.role.toUpperCase() as unknown as AuthResponseDto['role'],
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  async login(loginDto: LoginDto, clientIp: string): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    const user = await this.usersRepository.findOne({
      where: { email },
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'role',
        'passwordHash',
        'isActive',
      ],
    });

    if (user === null) {
      // Log failed login attempt
      await this.authLoggingService.logAuthAction(
        AuthLogAction.LOGIN_FAILED,
        email,
        null,
        clientIp,
        null,
        false,
        'User not found',
      );
      throw new UnauthorizedException('Please create an account to sign in');
    }

    if (user.isActive === false) {
      await this.authLoggingService.logAuthAction(
        AuthLogAction.LOGIN_FAILED,
        email,
        user.id,
        clientIp,
        null,
        false,
        'User account is disabled',
      );
      throw new UnauthorizedException('User account is disabled');
    }

    const isPasswordValid = await user.validatePassword(password);
    if (isPasswordValid === false) {
      await this.authLoggingService.logAuthAction(
        AuthLogAction.LOGIN_FAILED,
        email,
        user.id,
        clientIp,
        null,
        false,
        'Invalid password',
      );
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.usersRepository.update(user.id, {
      lastLoginIp: clientIp,
    });

    const { accessToken, refreshToken, expiresIn } = this.generateTokens(user);

    // Log successful login
    await this.authLoggingService.logAuthAction(
      AuthLogAction.LOGIN,
      email,
      user.id,
      clientIp,
      null,
      true,
      null,
      accessToken.substring(0, 20),
    );

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role.toUpperCase() as unknown as AuthResponseDto['role'],
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  async refreshToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; expiresIn: string }> {
    try {
      const secret =
        process.env.JWT_REFRESH_SECRET ??
        process.env.JWT_SECRET ??
        'your-super-secret-jwt-key-change-in-production-min-32-chars';

      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        refreshToken,
        {
          secret,
        },
      );

      const user = await this.usersRepository.findOne({
        where: { id: payload.sub },
      });

      if (user === null) {
        throw new UnauthorizedException('User not found');
      }

      const secret_access =
        process.env.JWT_SECRET ??
        'your-super-secret-jwt-key-change-in-production-min-32-chars';

      const newAccessToken = this.jwtService.sign(
        { sub: user.id, email: user.email, role: user.role },
        { secret: secret_access, expiresIn: '24h' },
      );

      await this.authLoggingService.logAuthAction(
        AuthLogAction.TOKEN_REFRESH,
        user.email,
        user.id,
        null,
        null,
        true,
        null,
        newAccessToken.substring(0, 20),
      );

      return {
        accessToken: newAccessToken,
        expiresIn: '24h',
      };
    } catch (error) {
      const errorPayload = (error as Record<string, unknown> | undefined)
        ?.payload;
      const email =
        typeof errorPayload === 'object' &&
        errorPayload !== null &&
        'email' in errorPayload
          ? String(errorPayload.email)
          : 'unknown';
      await this.authLoggingService.logAuthAction(
        AuthLogAction.TOKEN_REFRESH_FAILED,
        email,
        null,
        null,
        null,
        false,
        error instanceof Error ? error.message : 'Token refresh failed',
      );
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(
    userId: string,
    email: string,
    clientIp: string | null,
  ): Promise<void> {
    // Log logout action
    await this.authLoggingService.logAuthAction(
      AuthLogAction.LOGOUT,
      email,
      userId,
      clientIp,
      null,
      true,
      'User logged out successfully',
    );
  }

  private generateTokens(user: User): {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
  } {
    const secret =
      process.env.JWT_SECRET ??
      'your-super-secret-jwt-key-change-in-production-min-32-chars';
    const refreshSecret =
      process.env.JWT_REFRESH_SECRET ??
      process.env.JWT_SECRET ??
      'your-super-secret-jwt-key-change-in-production-min-32-chars';

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret,
      expiresIn: '24h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: '7d',
    });

    const expiration = process.env.JWT_EXPIRATION;
    return {
      accessToken,
      refreshToken,
      expiresIn:
        expiration !== undefined && expiration !== '' ? expiration : '24h',
    };
  }
}
