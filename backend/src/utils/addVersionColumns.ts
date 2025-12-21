import { AppDataSource } from '../config/database';

/**
 * Add version columns to all tables that support optimistic locking
 * This migration is safe to run multiple times (idempotent)
 */
export async function addVersionColumns(): Promise<void> {
  console.log('🔄 Adding version columns for optimistic locking...');

  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const queryRunner = AppDataSource.createQueryRunner();
    
    // List of tables that need version columns
    const tables = [
      'jobs',
      'customers',
      'vehicles',
      'invoices',
      'line_items',
      'inventory',
      'services',
      'labour',
      'templates',
      'payment_methods',
      'communication_templates',
    ];

    for (const table of tables) {
      // Check if version column already exists
      const columnExists = await queryRunner.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = $1 
          AND column_name = 'version'
        )
      `, [table]);

      if (!columnExists[0]?.exists) {
        console.log(`  Adding version column to ${table}...`);
        
        // Check if table has existing rows
        const rowCount = await queryRunner.query(`SELECT COUNT(*) as count FROM ${table}`);
        const hasData = parseInt(rowCount[0]?.count || '0', 10) > 0;
        
        if (hasData) {
          // Add column as nullable first, set default values, then make NOT NULL
          await queryRunner.query(`
            ALTER TABLE ${table} 
            ADD COLUMN version INTEGER DEFAULT 0
          `);
          await queryRunner.query(`
            UPDATE ${table} 
            SET version = 0 
            WHERE version IS NULL
          `);
          await queryRunner.query(`
            ALTER TABLE ${table} 
            ALTER COLUMN version SET NOT NULL
          `);
        } else {
          // Table is empty, can add as NOT NULL directly
          await queryRunner.query(`
            ALTER TABLE ${table} 
            ADD COLUMN version INTEGER NOT NULL DEFAULT 0
          `);
        }
        
        console.log(`  ✅ Added version column to ${table}`);
      } else {
        console.log(`  ⏭️  Version column already exists in ${table}`);
      }
    }

    await queryRunner.release();
    console.log('✅ Version columns migration completed');
  } catch (error) {
    console.error('❌ Version columns migration failed:', error);
    throw error;
  }
}

/**
 * Run migration if called directly
 */
if (require.main === module) {
  addVersionColumns()
    .then(() => {
      if (AppDataSource.isInitialized) {
        return AppDataSource.destroy();
      }
    })
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Migration failed:', error);
      if (AppDataSource.isInitialized) {
        AppDataSource.destroy().finally(() => process.exit(1));
      } else {
        process.exit(1);
      }
    });
}
