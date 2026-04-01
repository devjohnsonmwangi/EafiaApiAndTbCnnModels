import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  /**
   * Transform user role to uppercase for API responses
   * Converts DB lowercase roles (admin) to API format (ADMIN)
   */
  transformUserRole(user: User): User {
    const upperRole = user.role.toUpperCase() as unknown as UserRole;
    user.role = upperRole;
    return user;
  }

  /**
   * Transform array of users to uppercase roles
   */
  transformUsersRoles(users: User[]): User[] {
    return users.map((user) => {
      user.role = user.role.toUpperCase() as unknown as UserRole;
      return user;
    });
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['patients'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    return user;
  }

  async getAllUsers(role?: UserRole): Promise<User[]> {
    const query = this.usersRepository.createQueryBuilder('user');

    if (role !== undefined) {
      query.where('user.role = :role', { role });
    }

    return query.orderBy('user.createdAt', 'DESC').getMany();
  }

  async deactivateUser(id: string, requestingUser?: User): Promise<User> {
    // Super admin can deactivate anyone, admin can deactivate physicians and other admins (but not super admin), physicians can't deactivate anyone
    if (requestingUser && requestingUser.role === UserRole.PHYSICIAN) {
      throw new ForbiddenException(
        'Physicians cannot deactivate user accounts',
      );
    }

    const user = await this.findById(id);

    if (
      requestingUser &&
      requestingUser.role === UserRole.ADMIN &&
      user.role === UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException('Admins cannot deactivate super admins');
    }

    user.isActive = false;

    return await this.usersRepository.save(user);
  }

  async activateUser(id: string, requestingUser?: User): Promise<User> {
    if (requestingUser && requestingUser.role === UserRole.PHYSICIAN) {
      throw new ForbiddenException('Physicians cannot activate user accounts');
    }

    const user = await this.findById(id);
    user.isActive = true;

    return await this.usersRepository.save(user);
  }

  async updateLastLoginIp(userId: string, ip: string): Promise<void> {
    await this.usersRepository.update(userId, { lastLoginIp: ip });
  }

  async deleteUser(id: string, requestingUser?: User): Promise<void> {
    if (requestingUser && requestingUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only super admins can delete users');
    }

    const user = await this.findById(id);
    user.deletedAt = new Date();

    await this.usersRepository.save(user);
  }
}
