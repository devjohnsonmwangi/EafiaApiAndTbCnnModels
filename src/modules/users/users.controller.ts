import {
  Controller,
  Get,
  Param,
  Delete,
  Patch,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, User } from './user.entity';
import {
  ResponseFormatter,
  ApiResponse,
} from '../../common/utils/response.formatter';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  async getUserById(@Param('id') id: string): Promise<ApiResponse<User>> {
    try {
      const user = await this.usersService.findById(id);
      const transformedUser = this.usersService.transformUserRole(user);
      return ResponseFormatter.success(
        'User retrieved successfully',
        transformedUser,
        HttpStatus.OK,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'User not found';
      return ResponseFormatter.notFound(
        message,
      ) as unknown as ApiResponse<User>;
    }
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all users (Admin/SuperAdmin only)' })
  async getAllUsers(): Promise<ApiResponse<User[]>> {
    try {
      const users = await this.usersService.getAllUsers();
      const transformedUsers = this.usersService.transformUsersRoles(users);
      return ResponseFormatter.success(
        'Users retrieved successfully',
        transformedUsers,
        HttpStatus.OK,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to fetch users';
      return ResponseFormatter.internalError(message) as unknown as ApiResponse<
        User[]
      >;
    }
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Deactivate user account' })
  async deactivateUser(@Param('id') id: string): Promise<ApiResponse<User>> {
    try {
      const user = await this.usersService.deactivateUser(id);
      const transformedUser = this.usersService.transformUserRole(user);
      return ResponseFormatter.success(
        'User deactivated successfully',
        transformedUser,
        HttpStatus.OK,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to deactivate user';
      return ResponseFormatter.forbidden(
        message,
      ) as unknown as ApiResponse<User>;
    }
  }

  @Patch(':id/activate')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Activate user account' })
  async activateUser(@Param('id') id: string): Promise<ApiResponse<User>> {
    try {
      const user = await this.usersService.activateUser(id);
      const transformedUser = this.usersService.transformUserRole(user);
      return ResponseFormatter.success(
        'User activated successfully',
        transformedUser,
        HttpStatus.OK,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to activate user';
      return ResponseFormatter.forbidden(
        message,
      ) as unknown as ApiResponse<User>;
    }
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete user (SuperAdmin only)' })
  async deleteUser(
    @Param('id') id: string,
  ): Promise<ApiResponse<{ message: string }>> {
    try {
      await this.usersService.deleteUser(id);
      return ResponseFormatter.success(
        'User deleted successfully',
        { message: 'User deleted' },
        HttpStatus.OK,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to delete user';
      return ResponseFormatter.forbidden(message) as unknown as ApiResponse<{
        message: string;
      }>;
    }
  }
}
