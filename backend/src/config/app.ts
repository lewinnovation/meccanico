import { config } from 'dotenv';

config();

export const appConfig = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'default-dev-secret',
    expiresIn: (process.env.JWT_EXPIRES_IN || '24h') as string | number, // 24 hours for development
    refreshExpiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as string | number,
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  
  pagination: {
    defaultLimit: 50,
    maxLimit: 100,
  },
};

