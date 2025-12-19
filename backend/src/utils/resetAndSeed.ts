import { AppDataSource } from '../config/database';
import { resetDatabase } from './resetDatabase';
import { seedDatabase } from './seedData';

/**
 * Reset the database and seed it with fresh data
 * WARNING: This will delete all existing data!
 */
export async function resetAndSeed(): Promise<void> {
  console.log('🔄 Starting database reset and seed...\n');

  try {
    // Reset database
    await resetDatabase();
    console.log('');

    // Seed database
    await seedDatabase();
    console.log('');

    console.log('✅ Database reset and seed completed successfully!');
  } catch (error) {
    console.error('❌ Database reset and seed failed:', error);
    throw error;
  }
}

/**
 * Run reset and seed if called directly
 */
if (require.main === module) {
  resetAndSeed()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Reset and seed failed:', error);
      process.exit(1);
    });
}

