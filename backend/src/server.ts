import http from 'node:http';
import path from 'node:path';
import dotenv from 'dotenv';
import app from './app';
import { connectDB } from './config/db';
import { logger } from './utils/logger';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const PORT = Number(process.env.PORT) || 5000;

const start = async () => {
  await connectDB();
  const listenOnPort = async (port: number) => {
    const server = http.createServer(app);

    return new Promise<{ server: http.Server; activePort: number }>((resolve, reject) => {
      const onListening = () => {
        server.off('error', onError);
        const address = server.address();
        const activePort =
          typeof address === 'object' && address ? Number(address.port) : port;
        resolve({ server, activePort });
      };
      const onError = (error: NodeJS.ErrnoException) => {
        server.off('listening', onListening);
        reject(error);
      };

      server.once('listening', onListening);
      server.once('error', onError);
      server.listen(port);
    });
  };

  let server: http.Server;
  let activePort: number;
  try {
    ({ server, activePort } = await listenOnPort(PORT));
  } catch (err) {
    const error = err as NodeJS.ErrnoException;
    if (error.code === 'EADDRINUSE') {
      ({ server, activePort } = await listenOnPort(0));
      logger.warn(`Port ${PORT} is already in use. Started on fallback port ${activePort}.`);
    } else {
      throw err;
    }
  }

  logger.info(`🚀 SAMS Backend running on http://localhost:${activePort}`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV}`);

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      logger.info('Process terminated.');
      process.exit(0);
    });
  });
};

start().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
