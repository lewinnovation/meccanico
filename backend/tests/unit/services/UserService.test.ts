import { UserService, CreateUserDto, UpdateProfileDto } from '../../../src/services/UserService';
import { User, UserRole } from '../../../src/models/User';
import { Job } from '../../../src/models/Job';
import { Template } from '../../../src/models/Template';
import { AuditLog } from '../../../src/models/AuditLog';
import { NotFoundError, ConflictError, BadRequestError, UnauthorizedError } from '../../../src/middleware/errorHandler';
import { generatePassword } from '../../../src/utils/passwordGenerator';
import { EmailService } from '../../../src/services/EmailService';
import { CommunicationTemplateService } from '../../../src/services/CommunicationTemplateService';
import { SettingsService } from '../../../src/services/SettingsService';
import { CommunicationTemplateType, CommunicationTemplateAction } from '../../../src/models/CommunicationTemplate';
import * as bcrypt from 'bcryptjs';

// Mock dependencies
jest.mock('../../../src/utils/passwordGenerator');
jest.mock('../../../src/services/EmailService');
jest.mock('../../../src/services/CommunicationTemplateService');
jest.mock('../../../src/services/SettingsService');
jest.mock('../../../src/config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
    query: jest.fn(),
  },
}));

const mockGeneratePassword = generatePassword as jest.Mock;
const MockEmailService = EmailService as jest.MockedClass<typeof EmailService>;
const MockCommunicationTemplateService = CommunicationTemplateService as jest.MockedClass<typeof CommunicationTemplateService>;
const MockSettingsService = SettingsService as jest.MockedClass<typeof SettingsService>;

describe('UserService', () => {
  let userService: UserService;
  let mockUserRepository: any;
  let mockJobRepository: any;
  let mockTemplateRepository: any;
  let mockAuditLogRepository: any;
  let mockEmailService: any;
  let mockTemplateService: any;
  let mockSettingsService: any;

  const mockUser: Partial<User> = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    role: UserRole.MECHANIC,
    isActive: true,
    passwordHash: 'hashedPassword',
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock repositories
    mockUserRepository = {
      findOne: jest.fn(),
      create: jest.fn((data) => ({ ...data, id: 'new-user-id' })),
      save: jest.fn((data) => Promise.resolve({ ...data, id: data.id || 'new-user-id' })),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    mockJobRepository = {
      count: jest.fn(),
    };

    mockTemplateRepository = {
      count: jest.fn(),
    };

    mockAuditLogRepository = {
      count: jest.fn(),
    };

    // Mock EmailService
    mockEmailService = {
      sendEmail: jest.fn().mockResolvedValue(undefined),
    };
    MockEmailService.mockImplementation(() => mockEmailService);

    // Mock CommunicationTemplateService
    mockTemplateService = {
      findByActionAndType: jest.fn(),
    };
    MockCommunicationTemplateService.mockImplementation(() => mockTemplateService);

    // Mock SettingsService
    mockSettingsService = {
      findByKey: jest.fn().mockResolvedValue({ value: 'Test Shop' }),
    };
    MockSettingsService.mockImplementation(() => mockSettingsService);

    // Mock AppDataSource.getRepository
    const { AppDataSource } = require('../../../src/config/database');
    AppDataSource.getRepository.mockImplementation((entity: any) => {
      if (entity.name === 'User') return mockUserRepository;
      if (entity.name === 'Job') return mockJobRepository;
      if (entity.name === 'Template') return mockTemplateRepository;
      if (entity.name === 'AuditLog') return mockAuditLogRepository;
      return mockUserRepository;
    });

    userService = new UserService();
  });

  describe('createUser', () => {
    const createDto: CreateUserDto = {
      email: 'newuser@example.com',
      name: 'New User',
      role: UserRole.MECHANIC,
    };

    it('should create user with generated password', async () => {
      mockUserRepository.findOne.mockResolvedValue(null); // No existing user
      mockGeneratePassword.mockReturnValue('GeneratedPassword123!');
      mockTemplateService.findByActionAndType.mockResolvedValue({
        id: 'template-1',
        subject: 'Welcome {user_name}',
        body: 'Your password is {password}',
      });

      const result = await userService.createUser(createDto, 'admin-1');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: createDto.email },
      });
      expect(mockGeneratePassword).toHaveBeenCalled();
      expect(mockUserRepository.create).toHaveBeenCalled();
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(result.email).toBe(createDto.email);
      expect(result.name).toBe(createDto.name);
      expect(result.role).toBe(createDto.role);
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw ConflictError if email already exists', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await expect(userService.createUser(createDto, 'admin-1'))
        .rejects
        .toThrow(ConflictError);
    });

    it('should send email with new account template', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockGeneratePassword.mockReturnValue('GeneratedPassword123!');
      mockTemplateService.findByActionAndType.mockResolvedValue({
        id: 'template-1',
        subject: 'Welcome {user_name}',
        body: 'Your password is {password}',
      });

      await userService.createUser(createDto, 'admin-1');

      expect(mockTemplateService.findByActionAndType).toHaveBeenCalledWith(
        CommunicationTemplateAction.EMAIL_NEW_ACCOUNT,
        CommunicationTemplateType.EMAIL
      );
      expect(mockEmailService.sendEmail).toHaveBeenCalled();
    });

    it('should not fail if email sending fails', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockGeneratePassword.mockReturnValue('GeneratedPassword123!');
      mockTemplateService.findByActionAndType.mockResolvedValue({
        id: 'template-1',
        subject: 'Welcome',
        body: 'Body',
      });
      mockEmailService.sendEmail.mockRejectedValue(new Error('Email failed'));

      const result = await userService.createUser(createDto, 'admin-1');

      expect(result).toBeDefined();
      expect(mockUserRepository.save).toHaveBeenCalled();
    });
  });

  describe('suspendUser', () => {
    it('should suspend user successfully', async () => {
      const user = { ...mockUser, isActive: true };
      mockUserRepository.findOne.mockResolvedValue(user);
      mockTemplateService.findByActionAndType.mockResolvedValue({
        id: 'template-1',
        subject: 'Account Suspended',
        body: 'Your account has been suspended',
      });

      const result = await userService.suspendUser('user-1', 'admin-1');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
      expect(user.isActive).toBe(false);
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(result.isActive).toBe(false);
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw BadRequestError if trying to suspend self', async () => {
      await expect(userService.suspendUser('admin-1', 'admin-1'))
        .rejects
        .toThrow(BadRequestError);
    });

    it('should throw NotFoundError if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(userService.suspendUser('nonexistent', 'admin-1'))
        .rejects
        .toThrow(NotFoundError);
    });

    it('should throw BadRequestError if user already suspended', async () => {
      const user = { ...mockUser, isActive: false };
      mockUserRepository.findOne.mockResolvedValue(user);

      await expect(userService.suspendUser('user-1', 'admin-1'))
        .rejects
        .toThrow(BadRequestError);
    });

    it('should send email with account suspended template', async () => {
      const user = { ...mockUser, isActive: true };
      mockUserRepository.findOne.mockResolvedValue(user);
      mockTemplateService.findByActionAndType.mockResolvedValue({
        id: 'template-1',
        subject: 'Account Suspended',
        body: 'Your account has been suspended',
      });

      await userService.suspendUser('user-1', 'admin-1');

      expect(mockTemplateService.findByActionAndType).toHaveBeenCalledWith(
        CommunicationTemplateAction.EMAIL_ACCOUNT_SUSPENDED,
        CommunicationTemplateType.EMAIL
      );
      expect(mockEmailService.sendEmail).toHaveBeenCalled();
    });
  });

  describe('activateUser', () => {
    it('should activate user successfully', async () => {
      const user = { ...mockUser, isActive: false };
      mockUserRepository.findOne.mockResolvedValue(user);

      const result = await userService.activateUser('user-1', 'admin-1');

      expect(user.isActive).toBe(true);
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(result.isActive).toBe(true);
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw NotFoundError if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(userService.activateUser('nonexistent', 'admin-1'))
        .rejects
        .toThrow(NotFoundError);
    });

    it('should throw BadRequestError if user already active', async () => {
      const user = { ...mockUser, isActive: true };
      mockUserRepository.findOne.mockResolvedValue(user);

      await expect(userService.activateUser('user-1', 'admin-1'))
        .rejects
        .toThrow(BadRequestError);
    });
  });

  describe('resetPassword', () => {
    it('should reset password and send email', async () => {
      const user = { ...mockUser };
      mockUserRepository.findOne.mockResolvedValue(user);
      mockGeneratePassword.mockReturnValue('NewPassword123!');
      mockTemplateService.findByActionAndType.mockResolvedValue({
        id: 'template-1',
        subject: 'Password Reset',
        body: 'Your new password is {password}',
      });

      await userService.resetPassword('user-1', 'admin-1');

      expect(mockGeneratePassword).toHaveBeenCalled();
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(mockTemplateService.findByActionAndType).toHaveBeenCalledWith(
        CommunicationTemplateAction.EMAIL_PASSWORD_RESET,
        CommunicationTemplateType.EMAIL
      );
      expect(mockEmailService.sendEmail).toHaveBeenCalled();
    });

    it('should throw NotFoundError if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(userService.resetPassword('nonexistent', 'admin-1'))
        .rejects
        .toThrow(NotFoundError);
    });
  });

  describe('canDeleteUser', () => {
    it('should return canDelete true if user has no activity', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockAuditLogRepository.count.mockResolvedValue(0);
      mockJobRepository.count.mockResolvedValue(0);
      mockTemplateRepository.count.mockResolvedValue(0);

      const result = await userService.canDeleteUser('user-1');

      expect(result.canDelete).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should return canDelete false if user has audit logs', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockAuditLogRepository.count.mockResolvedValue(5);

      const result = await userService.canDeleteUser('user-1');

      expect(result.canDelete).toBe(false);
      expect(result.reason).toContain('audit log');
    });

    it('should return canDelete false if user is assigned to jobs', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockAuditLogRepository.count.mockResolvedValue(0);
      mockJobRepository.count.mockResolvedValue(3);

      const result = await userService.canDeleteUser('user-1');

      expect(result.canDelete).toBe(false);
      expect(result.reason).toContain('assigned to');
    });

    it('should return canDelete false if user created templates', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockAuditLogRepository.count.mockResolvedValue(0);
      mockJobRepository.count.mockResolvedValue(0);
      mockTemplateRepository.count.mockResolvedValue(2);

      const result = await userService.canDeleteUser('user-1');

      expect(result.canDelete).toBe(false);
      expect(result.reason).toContain('created');
    });

    it('should throw NotFoundError if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(userService.canDeleteUser('nonexistent'))
        .rejects
        .toThrow(NotFoundError);
    });
  });

  describe('findAll', () => {
    it('should return all users without password hashes', async () => {
      const users = [
        { ...mockUser, id: 'user-1' },
        { ...mockUser, id: 'user-2', email: 'user2@example.com' },
      ];
      mockUserRepository.find.mockResolvedValue(users);

      const result = await userService.findAll();

      expect(result).toHaveLength(2);
      expect(result[0]).not.toHaveProperty('passwordHash');
      expect(result[1]).not.toHaveProperty('passwordHash');
      expect(mockUserRepository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findById', () => {
    it('should return user without password hash', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await userService.findById('user-1');

      expect(result).not.toHaveProperty('passwordHash');
      expect(result.id).toBe(mockUser.id);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
    });

    it('should throw NotFoundError if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(userService.findById('nonexistent'))
        .rejects
        .toThrow(NotFoundError);
    });
  });

  describe('updateProfile', () => {
    it('should update name only', async () => {
      const user = { ...mockUser };
      const mockQueryBuilder = {
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(user),
      };
      mockUserRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const updateData: UpdateProfileDto = { name: 'Updated Name' };

      const result = await userService.updateProfile('user-1', updateData);

      expect(user.name).toBe('Updated Name');
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should update password with valid current password', async () => {
      const originalHash = await bcrypt.hash('oldPassword', 10);
      const user = { ...mockUser, passwordHash: originalHash };
      const mockQueryBuilder = {
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(user),
      };
      mockUserRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const updateData: UpdateProfileDto = {
        currentPassword: 'oldPassword',
        newPassword: 'newPassword123',
      };

      const result = await userService.updateProfile('user-1', updateData);

      expect(mockUserRepository.save).toHaveBeenCalled();
      const savedUser = mockUserRepository.save.mock.calls[0][0];
      expect(savedUser.passwordHash).not.toBe(originalHash);
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw BadRequestError if newPassword provided without currentPassword', async () => {
      const user = { ...mockUser };
      const mockQueryBuilder = {
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(user),
      };
      mockUserRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const updateData: UpdateProfileDto = {
        newPassword: 'newPassword123',
      };

      await expect(userService.updateProfile('user-1', updateData))
        .rejects
        .toThrow(BadRequestError);
    });

    it('should throw UnauthorizedError if current password is incorrect', async () => {
      const user = { ...mockUser, passwordHash: await bcrypt.hash('correctPassword', 10) };
      const mockQueryBuilder = {
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(user),
      };
      mockUserRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const updateData: UpdateProfileDto = {
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword123',
      };

      await expect(userService.updateProfile('user-1', updateData))
        .rejects
        .toThrow(UnauthorizedError);
    });

    it('should throw NotFoundError if user not found', async () => {
      const mockQueryBuilder = {
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      mockUserRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await expect(userService.updateProfile('nonexistent', { name: 'New Name' }))
        .rejects
        .toThrow(NotFoundError);
    });
  });
});
