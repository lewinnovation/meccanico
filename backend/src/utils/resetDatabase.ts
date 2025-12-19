import { AppDataSource } from '../config/database';

/**
 * Reset the database by dropping all tables and recreating them
 * WARNING: This will delete all data!
 */
export async function resetDatabase(): Promise<void> {
  console.log('🔄 Resetting database...');

  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Drop all tables
    console.log('  Dropping all tables...');
    await AppDataSource.dropDatabase();

    // Synchronize schema (recreate tables)
    console.log('  Recreating database schema...');
    await AppDataSource.synchronize(true);

    console.log('✅ Database reset completed');
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    throw error;
  }
}

/**
 * Run reset if called directly
 */
if (require.main === module) {
  resetDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Reset failed:', error);
      process.exit(1);
    });
}


