import { config } from 'dotenv';
import * as bcrypt from 'bcryptjs';
import { AppDataSource, initializeDatabase } from '../config/database';
import { User, UserRole } from '../models/User';

config();

const getRequiredEnv = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const getOptionalEnv = (name: string): string | undefined => {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
};

const getDefaultAdminName = (email: string): string => {
  const localPart = email.split('@')[0]?.trim();
  return localPart ? localPart : 'Admin';
};

export interface AdminBootstrapResult {
  created: boolean;
  updated: boolean;
  user: User;
}

export async function createAdminUser(): Promise<AdminBootstrapResult> {
  const adminEmail = getRequiredEnv('ADMIN_USER_EMAIL');
  const adminPassword = getRequiredEnv('ADMIN_USER_PASSWORD');
  const adminName = getOptionalEnv('ADMIN_USER_NAME') ?? getDefaultAdminName(adminEmail);

  await initializeDatabase();

  try {
    const userRepository = AppDataSource.getRepository(User);
    const existingUser = await userRepository.findOne({
      where: { email: adminEmail },
    });

    if (existingUser) {
      let updated = false;

      if (existingUser.role !== UserRole.ADMIN) {
        existingUser.role = UserRole.ADMIN;
        updated = true;
      }

      if (!existingUser.isActive) {
        existingUser.isActive = true;
        updated = true;
      }

      if (updated) {
        await userRepository.save(existingUser);
      }

      return { created: false, updated, user: existingUser };
    }

    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const newUser = userRepository.create({
      email: adminEmail,
      name: adminName,
      passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
    });

    await userRepository.save(newUser);

    return { created: true, updated: false, user: newUser };
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

if (require.main === module) {
  createAdminUser()
    .then(({ created, updated, user }) => {
      if (created) {
        console.log(`✅ Admin user created: ${user.email}`);
      } else if (updated) {
        console.log(`✅ Admin user updated: ${user.email}`);
      } else {
        console.log(`✅ Admin user already up to date: ${user.email}`);
      }
      process.exit(0);
    })
    .catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`❌ Admin bootstrap failed: ${message}`);
      process.exit(1);
    });
}
