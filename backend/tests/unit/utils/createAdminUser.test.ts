import { createAdminUser } from '../../../src/utils/createAdminUser';
import { UserRole } from '../../../src/models/User';
import { AppDataSource, initializeDatabase } from '../../../src/config/database';
import { hash as bcryptHash } from 'bcryptjs';

jest.mock('../../../src/config/database', () => ({
  initializeDatabase: jest.fn(),
  AppDataSource: {
    getRepository: jest.fn(),
    isInitialized: false,
    destroy: jest.fn(),
  },
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}));

const mockInitializeDatabase = initializeDatabase as jest.Mock;
const mockGetRepository = AppDataSource.getRepository as jest.Mock;
const mockHash = bcryptHash as jest.Mock;

describe('createAdminUser', () => {
  const originalEnv = process.env;
  type MockUserRepository = {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };

  let mockUserRepository: MockUserRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };

    mockUserRepository = {
      findOne: jest.fn(),
      create: jest.fn((data) => ({ id: 'user-id', ...data })),
      save: jest.fn((data) => Promise.resolve(data)),
    };

    mockGetRepository.mockReturnValue(mockUserRepository);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should throw a clear error when required env vars are missing', async () => {
    delete process.env.ADMIN_USER_EMAIL;
    delete process.env.ADMIN_USER_PASSWORD;

    await expect(createAdminUser()).rejects.toThrow(
      'Missing required environment variable'
    );
    expect(mockInitializeDatabase).not.toHaveBeenCalled();
  });

  it('should create a new admin user with a hashed password', async () => {
    process.env.ADMIN_USER_EMAIL = 'admin@example.com';
    process.env.ADMIN_USER_PASSWORD = 'SuperSecret123!';
    process.env.ADMIN_USER_NAME = 'Admin User';

    mockUserRepository.findOne.mockResolvedValue(null);
    mockHash.mockResolvedValue('hashed-password');

    const result = await createAdminUser();

    expect(mockInitializeDatabase).toHaveBeenCalled();
    expect(mockHash).toHaveBeenCalledWith('SuperSecret123!', 10);
    expect(mockUserRepository.create).toHaveBeenCalledWith({
      email: 'admin@example.com',
      name: 'Admin User',
      passwordHash: 'hashed-password',
      role: UserRole.ADMIN,
      isActive: true,
    });
    expect(mockUserRepository.save).toHaveBeenCalled();
    expect(result.created).toBe(true);
    expect(result.user.role).toBe(UserRole.ADMIN);
  });

  it('should update existing user to admin without resetting password', async () => {
    process.env.ADMIN_USER_EMAIL = 'admin@example.com';
    process.env.ADMIN_USER_PASSWORD = 'SuperSecret123!';

    const existingUser = {
      id: 'existing-user',
      email: 'admin@example.com',
      name: 'Existing User',
      role: UserRole.MECHANIC,
      isActive: false,
      passwordHash: 'existing-hash',
    };

    mockUserRepository.findOne.mockResolvedValue(existingUser);

    const result = await createAdminUser();

    expect(mockHash).not.toHaveBeenCalled();
    expect(mockUserRepository.save).toHaveBeenCalledWith({
      ...existingUser,
      role: UserRole.ADMIN,
      isActive: true,
    });
    expect(result.created).toBe(false);
    expect(result.updated).toBe(true);
    expect(result.user.passwordHash).toBe('existing-hash');
  });
});
