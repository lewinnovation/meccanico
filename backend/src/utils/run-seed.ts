import { DataSource } from 'typeorm';
import { runSeeder, useSeeding } from '@jorgebodega/typeorm-seeding';
import { MainSeeder } from './seeder';
import { AppDataSource, initializeDatabase } from '../config/database';

(async () => {
  try {
    console.log('🌱 Starting seeder runner...');
    
    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await initializeDatabase();
    }
    
    // Configure seeding with our datasource
    // Note: useSeeding configures the default data source for the seeding library
    await useSeeding({ dataSource: AppDataSource });
    
    // Run the main seeder
    await runSeeder(MainSeeder);
    
    console.log('✅ Seeding completed via runner');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
})();
