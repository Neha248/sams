import mongoose from 'mongoose';
import { logger } from '../utils/logger';

export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGO_URI as string;

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      family: 4,
    });
    logger.info(`✅ MongoDB connected: ${mongoose.connection.host}`);
  } catch (error) {
    const err = error as NodeJS.ErrnoException & { name?: string; code?: string | number };
    logger.error(`❌ MongoDB connection failed: ${err.message}`);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  logger.warn('⚠️  MongoDB disconnected. Retrying...');
});
