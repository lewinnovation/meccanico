/**
 * Migration script to update EMAIL_PDF templates to EMAIL_ESTIMATE and EMAIL_INVOICE
 * Run this before starting the server to migrate existing data
 * This must run BEFORE TypeORM synchronizes the schema
 */

import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

export async function migrateCommunicationTemplates(): Promise<void> {
  console.log('🔄 Migrating communication templates...');

  // Create a connection WITHOUT synchronize to avoid enum changes
  const migrationDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'meccanico',
    password: process.env.DB_PASSWORD || 'meccanico_dev_password',
    database: process.env.DB_NAME || 'meccanico',
    synchronize: false, // CRITICAL: Don't sync, we just need to update data
    logging: false,
  });

  try {
    await migrationDataSource.initialize();

    // Check if table exists
    const tableExists = await migrationDataSource.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'communication_templates'
      )`
    );

    if (!tableExists[0]?.exists) {
      console.log('  Table does not exist yet. Migration not needed.');
      await migrationDataSource.destroy();
      return;
    }

    // Check current column type
    const columnInfo = await migrationDataSource.query(`
      SELECT data_type, udt_name 
      FROM information_schema.columns 
      WHERE table_name = 'communication_templates' AND column_name = 'action'
    `);

    const isTextColumn = columnInfo[0]?.data_type === 'text' || columnInfo[0]?.udt_name === 'text';
    
    // Find all templates with EMAIL_PDF action
    // Cast to text to avoid enum validation issues if column is still enum
    const query = isTextColumn
      ? `SELECT * FROM communication_templates WHERE action = 'EMAIL_PDF'`
      : `SELECT * FROM communication_templates WHERE action::text = 'EMAIL_PDF'`;
    
    const oldTemplates = await migrationDataSource.query(query);

    if (oldTemplates.length === 0) {
      console.log('  No EMAIL_PDF templates found to migrate.');
      await migrationDataSource.destroy();
      return;
    }

    console.log(`  Found ${oldTemplates.length} template(s) with EMAIL_PDF action.`);

    // Step 1: Temporarily change column to text to allow any value
    console.log('  Step 1: Converting action column to text temporarily...');
    await migrationDataSource.query(`
      ALTER TABLE communication_templates 
      ALTER COLUMN action TYPE text USING action::text
    `);

    // Step 2: Update the values
    console.log('  Step 2: Updating template values...');
    for (const oldTemplate of oldTemplates) {
      // Determine if it's an estimate or invoice template based on name or content
      const isInvoice = oldTemplate.name?.toLowerCase().includes('invoice') ||
                       oldTemplate.subject?.toLowerCase().includes('invoice') ||
                       oldTemplate.body?.toLowerCase().includes('invoice');

      const newAction = isInvoice ? 'EMAIL_INVOICE' : 'EMAIL_ESTIMATE';
      const newName = isInvoice 
        ? (oldTemplate.name?.replace(/PDF/gi, 'Invoice').replace(/pdf/gi, 'Invoice') || 'Email Invoice')
        : (oldTemplate.name?.replace(/PDF/gi, 'Estimate').replace(/pdf/gi, 'Estimate') || 'Email Estimate');

      console.log(`  Migrating "${oldTemplate.name}" to ${newAction}...`);

      // Update using raw query (now that column is text)
      await migrationDataSource.query(
        `UPDATE communication_templates 
         SET action = $1, name = $2 
         WHERE id = $3`,
        [newAction, newName, oldTemplate.id]
      );
    }

    // Step 3: Check what other action values exist (besides EMAIL_PDF)
    // Cast to text to avoid enum validation
    const allActions = await migrationDataSource.query(`
      SELECT DISTINCT action::text as action FROM communication_templates
    `);
    const uniqueActions = new Set(allActions.map((r: any) => r.action).filter(Boolean));
    uniqueActions.delete('EMAIL_PDF');
    
    // Step 4: Create new enum with correct values (including existing ones)
    console.log('  Step 3: Creating new enum type...');
    
    // Drop old enum type if it exists (after we've converted to text)
    await migrationDataSource.query(`
      DROP TYPE IF EXISTS communication_templates_action_enum CASCADE
    `);
    
    // Build enum values list
    const enumValues = [
      'EMAIL_ESTIMATE',
      'EMAIL_INVOICE',
      'VEHICLE_READY',
      'VEHICLE_IN_PROGRESS',
      'VEHICLE_PENDING',
      'INVOICE_CREATED'
    ];
    
    // Add any other existing values that aren't EMAIL_PDF
    for (const action of uniqueActions) {
      if (action && typeof action === 'string' && !enumValues.includes(action)) {
        enumValues.push(action);
      }
    }
    
    await migrationDataSource.query(`
      CREATE TYPE communication_templates_action_enum AS ENUM(${enumValues.map(v => `'${v}'`).join(', ')})
    `);

    // Step 5: Convert column back to enum
    console.log('  Step 4: Converting action column back to enum...');
    await migrationDataSource.query(`
      ALTER TABLE communication_templates 
      ALTER COLUMN action TYPE communication_templates_action_enum 
      USING action::communication_templates_action_enum
    `);

    // Step 5: Recreate the unique index if it was dropped
    try {
      await migrationDataSource.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS "IDX_communication_templates_action_type" 
        ON communication_templates (action, type)
      `);
    } catch (indexError) {
      // Index might already exist
      console.log('  Index may already exist');
    }

    // Now remove EMAIL_PDF from enum if no longer used
    // Note: PostgreSQL doesn't support removing enum values directly
    // We'll need to recreate the enum, but that's handled by TypeORM synchronize
    // For now, we'll leave EMAIL_PDF in the enum but mark it as unused

    console.log(`  ✅ Migrated ${oldTemplates.length} template(s) successfully.`);
    await migrationDataSource.destroy();
  } catch (error) {
    console.error('  ❌ Migration failed:', error);
    if (migrationDataSource.isInitialized) {
      await migrationDataSource.destroy();
    }
    throw error;
  }
}

/**
 * Run migration if called directly
 */
if (require.main === module) {
  migrateCommunicationTemplates()
    .then(() => {
      console.log('✅ Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}
