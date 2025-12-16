import * as bcrypt from 'bcryptjs';
import { AppDataSource } from '../config/database';
import { User, UserRole } from '../models/User';
import { generateTokens } from '../middleware/auth';
import { UnauthorizedError, ConflictError, NotFoundError } from '../middleware/errorHandler';

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

export interface AuthResponse {
  user: Omit<User, 'passwordHash'>;
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  private repository = AppDataSource.getRepository(User);

  async login(data: LoginDto): Promise<AuthResponse> {
    const user = await this.repository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email: data.email })
      .andWhere('user.isActive = :isActive', { isActive: true })
      .getOne();

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
    
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Update last login
    user.lastLoginAt = new Date();
    await this.repository.save(user);

    const tokens = generateTokens(user);

    // Remove password hash from response
    const { passwordHash, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword as Omit<User, 'passwordHash'>,
      ...tokens,
    };
  }

  async register(data: RegisterDto): Promise<AuthResponse> {
    // Check if email already exists
    const existing = await this.repository.findOne({
      where: { email: data.email },
    });

    if (existing) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = this.repository.create({
      email: data.email,
      passwordHash,
      name: data.name,
      role: data.role || UserRole.MECHANIC,
    });

    await this.repository.save(user);

    const tokens = generateTokens(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      } as Omit<User, 'passwordHash'>,
      ...tokens,
    };
  }

  async getCurrentUser(userId: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.repository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  async refreshTokens(userId: string): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.repository.findOne({
      where: { id: userId, isActive: true },
    });

    if (!user) {
      throw new UnauthorizedError('User not found or inactive');
    }

    return generateTokens(user);
  }
}

