import 'reflect-metadata';
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';

import { appConfig } from './config/app';
import { initializeDatabase } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { RegisterRoutes } from './generated/routes';
import { seedDatabase } from './utils/seedData';

const app: Application = express();

// Middleware
app.use(helmet());
app.use(cors(appConfig.cors));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Register TSOA routes
RegisterRoutes(app);

// Swagger documentation
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const swaggerDocument = require('./generated/swagger.json');
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch {
  console.log('Swagger documentation not yet generated. Run: npm run tsoa:generate');
}

// Error handling
app.use(errorHandler);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ status: 'error', message: 'Not found' });
});

// Start server
async function bootstrap() {
  try {
    // Initialize database
    await initializeDatabase();

    // Run database seeding only if AUTO_SEED is enabled (default: true for development)
    if (process.env.AUTO_SEED !== 'false') {
      await seedDatabase();
    }

    // Start listening
    app.listen(appConfig.port, () => {
      console.log(`
╔════════════════════════════════════════════════════════════╗
║                      MECCANICO API                         ║
╠════════════════════════════════════════════════════════════╣
║  Status:      Running                                      ║
║  Port:        ${appConfig.port.toString().padEnd(44)}║
║  Environment: ${appConfig.env.padEnd(44)}║
║  API Docs:    http://localhost:${appConfig.port}/api/docs${' '.repeat(21)}║
╚════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();

export { app };

