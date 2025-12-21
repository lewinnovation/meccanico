import { AppDataSource } from '../config/database';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

/**
 * Reset the database by dropping all tables and recreating them
 * WARNING: This will delete all data!
 */
export async function resetDatabase(): Promise<void> {
  console.log('🔄 Resetting database...');

  // Create a temporary DataSource with synchronize disabled for dropping tables
  const tempDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'meccanico',
    password: process.env.DB_PASSWORD || 'meccanico_dev_password',
    database: process.env.DB_NAME || 'meccanico',
    synchronize: false, // Disable synchronize for this connection
    logging: false,
  });

  try {
    // Initialize temporary connection for dropping tables
    await tempDataSource.initialize();
    const queryRunner = tempDataSource.createQueryRunner();
    
    // Drop all tables using raw SQL to avoid constraint issues
    console.log('  Dropping all tables...');
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
    
    // Verify all tables are dropped - check multiple times to ensure they're gone
    let remainingTables = await queryRunner.query(`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    `);
    
    // Force drop any remaining tables
    if (remainingTables.length > 0) {
      console.log(`  ⚠️  Warning: ${remainingTables.length} tables still exist, forcing drop...`);
      for (const table of remainingTables) {
        try {
          await queryRunner.query(`DROP TABLE IF EXISTS ${table.tablename} CASCADE`);
        } catch (err) {
          // Ignore errors - table might already be dropped
        }
      }
      
      // Verify again after forced drop
      remainingTables = await queryRunner.query(`
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
      `);
      
      if (remainingTables.length > 0) {
        throw new Error(`Failed to drop ${remainingTables.length} tables: ${remainingTables.map((t: any) => t.tablename).join(', ')}`);
      }
    }
    
    console.log('  ✅ All tables dropped successfully');
    await queryRunner.release();
    
    // Close temporary connection
    await tempDataSource.destroy();

    // Close main connection if it was initialized to clear any schema cache
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }

    // Reinitialize main DataSource and synchronize schema (recreate tables)
    console.log('  Recreating database schema...');
    await AppDataSource.initialize();
    
    // Since we've verified all tables are dropped, synchronize will create them fresh
    // The AppDataSource has synchronize enabled in development, so it will automatically create tables
    // But we can also explicitly call synchronize to ensure it happens
    await AppDataSource.synchronize(false);

    console.log('✅ Database reset completed');
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    // Try to close connections even on error
    if (tempDataSource.isInitialized) {
      try {
        await tempDataSource.destroy();
      } catch (closeError) {
        // Ignore close errors
      }
    }
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
