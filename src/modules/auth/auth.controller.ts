import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as ApiResponseDecorator,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  RegisterDto,
  LoginDto,
  AuthResponseDto,
  RefreshTokenDto,
} from './auth.dto';
import { AuthService } from './auth.service';
import { ClientIp } from '../../common/decorators';
import { JwtGuard } from '../../common/guards/jwt.guard';
import {
  ResponseFormatter,
  ApiResponse,
} from '../../common/utils/response.formatter';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponseDecorator({
    status: 201,
    description: 'User registered successfully',
    type: AuthResponseDto,
  })
  async register(
    @Body() registerDto: RegisterDto,
    @ClientIp() clientIp: string,
  ): Promise<ApiResponse<AuthResponseDto>> {
    try {
      const result = await this.authService.register(registerDto, clientIp);
      return ResponseFormatter.created('User registered successfully', result);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Registration failed';

      if (message.includes('already exists')) {
        return ResponseFormatter.conflict(
          message,
        ) as unknown as ApiResponse<AuthResponseDto>;
      }

      return ResponseFormatter.badRequest(
        message,
      ) as unknown as ApiResponse<AuthResponseDto>;
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  async login(
    @Body() loginDto: LoginDto,
    @ClientIp() clientIp: string,
  ): Promise<ApiResponse<AuthResponseDto>> {
    try {
      const result = await this.authService.login(loginDto, clientIp);
      return ResponseFormatter.success(
        'Login successful',
        result,
        HttpStatus.OK,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      return ResponseFormatter.unauthorized(
        message,
      ) as unknown as ApiResponse<AuthResponseDto>;
    }
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  async refreshToken(
    @Body() { refreshToken }: RefreshTokenDto,
  ): Promise<ApiResponse<{ accessToken: string; expiresIn: string }>> {
    try {
      const result = await this.authService.refreshToken(refreshToken);
      return ResponseFormatter.success(
        'Token refreshed successfully',
        result,
        HttpStatus.OK,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Token refresh failed';
      return ResponseFormatter.unauthorized(message) as unknown as ApiResponse<{
        accessToken: string;
        expiresIn: string;
      }>;
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Logout successful',
  })
  async logout(
    @Request() req: { user: { sub: string; email: string } },
    @ClientIp() clientIp: string,
  ): Promise<ApiResponse<null>> {
    try {
      const { sub, email } = req.user;
      await this.authService.logout(sub, email, clientIp);
      return ResponseFormatter.success(
        'Logout successful',
        null,
        HttpStatus.OK,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Logout failed';
      return ResponseFormatter.unauthorized(
        message,
      ) as unknown as ApiResponse<null>;
    }
  }
}
