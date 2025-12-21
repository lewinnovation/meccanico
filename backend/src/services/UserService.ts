import * as bcrypt from 'bcryptjs';
import { AppDataSource } from '../config/database';
import { User, UserRole } from '../models/User';
import { Job } from '../models/Job';
import { Template } from '../models/Template';
import { AuditLog } from '../models/AuditLog';
import { NotFoundError, ConflictError, BadRequestError, UnauthorizedError } from '../middleware/errorHandler';
import { generatePassword } from '../utils/passwordGenerator';
import { EmailService } from './EmailService';
import { CommunicationTemplateService } from './CommunicationTemplateService';
import { CommunicationTemplateType, CommunicationTemplateAction } from '../models/CommunicationTemplate';
import { SettingsService } from './SettingsService';
import { buildUserTemplateVariables, renderTemplate } from '../utils/templateRenderer';

export interface CreateUserDto {
  email: string;
  name: string;
  role: UserRole;
}

export interface UpdateProfileDto {
  name?: string;
  currentPassword?: string;
  newPassword?: string;
}

export class UserService {
  private repository = AppDataSource.getRepository(User);
  private jobRepository = AppDataSource.getRepository(Job);
  private templateRepository = AppDataSource.getRepository(Template);
  private auditLogRepository = AppDataSource.getRepository(AuditLog);
  private emailService = new EmailService();
  private templateService = new CommunicationTemplateService();
  private settingsService = new SettingsService();

  /**
   * Create a new user (admin only)
   */
  async createUser(data: CreateUserDto, adminUserId: string): Promise<Omit<User, 'passwordHash'>> {
    // Check if email already exists
    const existing = await this.repository.findOne({
      where: { email: data.email },
    });

    if (existing) {
      throw new ConflictError('User with this email already exists');
    }

    // Generate random password
    const password = generatePassword();
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = this.repository.create({
      email: data.email,
      passwordHash,
      name: data.name,
      role: data.role,
      isActive: true,
    });

    await this.repository.save(user);

    // Send email with new account template
    try {
      const template = await this.templateService.findByActionAndType(
        CommunicationTemplateAction.EMAIL_NEW_ACCOUNT,
        CommunicationTemplateType.EMAIL
      );

      if (template) {
        const variables = await buildUserTemplateVariables(
          user.name,
          user.email,
          password,
          this.settingsService
        );

        const subject = template.subject
          ? renderTemplate(template.subject, variables)
          : `Welcome to ${variables.shop_name} - Your Account Details`;

        const body = renderTemplate(template.body, variables);

        await this.emailService.sendEmail(user.email, subject, body);
      }
    } catch (error) {
      console.error('Failed to send new account email:', error);
      // Don't fail user creation if email fails
    }

    // Return user without password hash
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword as Omit<User, 'passwordHash'>;
  }

  /**
   * Suspend a user (admin only)
   */
  async suspendUser(id: string, adminUserId: string): Promise<Omit<User, 'passwordHash'>> {
    if (id === adminUserId) {
      throw new BadRequestError('You cannot suspend yourself');
    }

    const user = await this.repository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (!user.isActive) {
      throw new BadRequestError('User is already suspended');
    }

    user.isActive = false;
    await this.repository.save(user);

    // Send email with account suspended template
    try {
      const template = await this.templateService.findByActionAndType(
        CommunicationTemplateAction.EMAIL_ACCOUNT_SUSPENDED,
        CommunicationTemplateType.EMAIL
      );

      if (template) {
        const variables = await buildUserTemplateVariables(
          user.name,
          user.email,
          null,
          this.settingsService
        );

        const subject = template.subject
          ? renderTemplate(template.subject, variables)
          : `Your Account Has Been Suspended - ${variables.shop_name}`;

        const body = renderTemplate(template.body, variables);

        await this.emailService.sendEmail(user.email, subject, body);
      }
    } catch (error) {
      console.error('Failed to send account suspended email:', error);
      // Don't fail suspension if email fails
    }

    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword as Omit<User, 'passwordHash'>;
  }

  /**
   * Activate a user (admin only)
   */
  async activateUser(id: string, adminUserId: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.repository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.isActive) {
      throw new BadRequestError('User is already active');
    }

    user.isActive = true;
    await this.repository.save(user);

    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword as Omit<User, 'passwordHash'>;
  }

  /**
   * Reset user password (admin only)
   */
  async resetPassword(id: string, adminUserId: string): Promise<void> {
    const user = await this.repository.findOne({
      where: { id },
      select: ['id', 'email', 'name', 'passwordHash'],
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Generate new random password
    const password = generatePassword();
    const passwordHash = await bcrypt.hash(password, 10);

    user.passwordHash = passwordHash;
    await this.repository.save(user);

    // Send email with password reset template
    try {
      const template = await this.templateService.findByActionAndType(
        CommunicationTemplateAction.EMAIL_PASSWORD_RESET,
        CommunicationTemplateType.EMAIL
      );

      if (template) {
        const variables = await buildUserTemplateVariables(
          user.name,
          user.email,
          password,
          this.settingsService
        );

        const subject = template.subject
          ? renderTemplate(template.subject, variables)
          : `Password Reset - ${variables.shop_name}`;

        const body = renderTemplate(template.body, variables);

        await this.emailService.sendEmail(user.email, subject, body);
      }
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      // Don't fail password reset if email fails
    }
  }

  /**
   * Check if a user can be deleted
   */
  async canDeleteUser(id: string): Promise<{ canDelete: boolean; reason?: string }> {
    const user = await this.repository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check for audit logs
    const auditLogCount = await this.auditLogRepository.count({
      where: { userId: id },
    });

    if (auditLogCount > 0) {
      return {
        canDelete: false,
        reason: `User has ${auditLogCount} audit log entry/entries. Users with activity cannot be deleted.`,
      };
    }

    // Check for assigned jobs
    const jobCount = await this.jobRepository.count({
      where: { assignedTo: id },
    });

    if (jobCount > 0) {
      return {
        canDelete: false,
        reason: `User is assigned to ${jobCount} job/jobs. Users with assigned jobs cannot be deleted.`,
      };
    }

    // Check for created templates
    const templateCount = await this.templateRepository.count({
      where: { createdBy: id },
    });

    if (templateCount > 0) {
      return {
        canDelete: false,
        reason: `User has created ${templateCount} template/templates. Users who have created templates cannot be deleted.`,
      };
    }

    return { canDelete: true };
  }

  /**
   * Get all users (without password hashes)
   */
  async findAll(): Promise<Omit<User, 'passwordHash'>[]> {
    const users = await this.repository.find({
      order: { createdAt: 'DESC' },
    });

    return users.map((user) => {
      const { passwordHash: _, ...userWithoutPassword } = user;
      return userWithoutPassword as Omit<User, 'passwordHash'>;
    });
  }

  /**
   * Get user by ID (without password hash)
   */
  async findById(id: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.repository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword as Omit<User, 'passwordHash'>;
  }

  /**
   * Update user's own profile (name and/or password)
   */
  async updateProfile(userId: string, data: UpdateProfileDto): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.repository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.id = :id', { id: userId })
      .getOne();

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Update name if provided
    if (data.name !== undefined) {
      user.name = data.name;
    }

    // Update password if provided
    if (data.newPassword) {
      if (!data.currentPassword) {
        throw new BadRequestError('Current password is required to change password');
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(data.currentPassword, user.passwordHash);
      if (!isPasswordValid) {
        throw new UnauthorizedError('Current password is incorrect');
      }

      // Hash and set new password
      user.passwordHash = await bcrypt.hash(data.newPassword, 10);
    }

    await this.repository.save(user);

    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword as Omit<User, 'passwordHash'>;
  }
}
