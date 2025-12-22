import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';

config();

const isProduction = process.env.NODE_ENV === 'production';

// SSL configuration
// DB_SSL can be: 'true', 'false', or 'require' (for require mode)
// If not set, defaults to: true in production, false in development
const getSslConfig = (): boolean | { rejectUnauthorized: boolean } => {
  const dbSsl = process.env.DB_SSL?.toLowerCase();
  
  if (dbSsl === 'false' || dbSsl === '0') {
    return false;
  }
  
  if (dbSsl === 'true' || dbSsl === '1' || dbSsl === 'require') {
    // For cloud databases (e.g., GCP Cloud SQL), rejectUnauthorized: false is often needed
    const rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED?.toLowerCase() !== 'true';
    return { rejectUnauthorized };
  }
  
  // Default behavior: SSL in production, no SSL in development
  return isProduction ? { rejectUnauthorized: false } : false;
};

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'meccanico',
  password: process.env.DB_PASSWORD || 'meccanico_dev_password',
  database: process.env.DB_NAME || 'meccanico',
  entities: [__dirname + '/../models/**/*.{ts,js}'],
  migrations: [__dirname + '/../migrations/**/*.{ts,js}'],
  synchronize: !isProduction, // Only in development
  logging: !isProduction,
  ssl: getSslConfig(),
};

export const AppDataSource = new DataSource(dataSourceOptions);

export const initializeDatabase = async (): Promise<DataSource> => {
  try {
    // First, try to migrate existing EMAIL_PDF templates before enum change
    // This must happen BEFORE AppDataSource.initialize() which will try to sync schema
    try {
      const { migrateCommunicationTemplates } = await import('../utils/migrateCommunicationTemplates');
      await migrateCommunicationTemplates();
    } catch (migrationError: any) {
      // If migration fails (e.g., table doesn't exist yet, or no EMAIL_PDF records), continue
      if (migrationError?.message?.includes('does not exist') || 
          migrationError?.message?.includes('No EMAIL_PDF')) {
        console.log('  Migration skipped (no migration needed)');
      } else {
        console.log('  Migration error (continuing):', migrationError.message);
      }
    }

    await AppDataSource.initialize();
    console.log('✅ Database connection established');
    return AppDataSource;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};

