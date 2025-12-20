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

    // Drop all tables using raw SQL to avoid constraint issues
    console.log('  Dropping all tables...');
    const queryRunner = AppDataSource.createQueryRunner();
    
    // Drop all tables in the correct order (respecting foreign keys)
    await queryRunner.query(`
      DO $$ DECLARE
        r RECORD;
      BEGIN
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
          EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
        END LOOP;
      END $$;
    `);
    
    // Drop all sequences
    await queryRunner.query(`
      DO $$ DECLARE
        r RECORD;
      BEGIN
        FOR r IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public') LOOP
          EXECUTE 'DROP SEQUENCE IF EXISTS ' || quote_ident(r.sequence_name) || ' CASCADE';
        END LOOP;
      END $$;
    `);
    
    // Drop all types (enums)
    await queryRunner.query(`
      DO $$ DECLARE
        r RECORD;
      BEGIN
        FOR r IN (SELECT typname FROM pg_type WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') AND typtype = 'e') LOOP
          EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
        END LOOP;
      END $$;
    `);
    
    await queryRunner.release();

    // Close connection to ensure clean state
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }

    // Reinitialize and synchronize schema (recreate tables)
    console.log('  Recreating database schema...');
    await AppDataSource.initialize();
    await AppDataSource.synchronize(true);

    console.log('✅ Database reset completed');
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    // Try to close connection even on error
    if (AppDataSource.isInitialized) {
      try {
        await AppDataSource.destroy();
      } catch (closeError) {
        // Ignore close errors
      }
    }
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
