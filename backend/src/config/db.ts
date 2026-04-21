import mongoose from 'mongoose';
import fs from 'node:fs';
import { logger } from '../utils/logger';

const DEBUG_LOG_PATH =
  'h:\\Project-Work\\4.Projects\\Final-Year-Project-2026\\newUpdatePRoject\\debug-1eb43a.log';

function agentLog(payload: Record<string, unknown>) {
  // #region agent log
  try {
    fetch('http://127.0.0.1:7751/ingest/4bc5d103-f0ec-4d7a-a700-f6a66261b995', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '1eb43a' },
      body: JSON.stringify(payload),
    }).catch(() => {});
  } catch {
    // ignore
  }
  try {
    fs.appendFileSync(DEBUG_LOG_PATH, `${JSON.stringify(payload)}\n`, 'utf8');
  } catch {
    // ignore
  }
  // #endregion
}

export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGO_URI as string;

  agentLog({
    sessionId: '1eb43a',
    runId: 'pre-fix',
    hypothesisId: 'A',
    location: 'backend/src/config/db.ts:connectDB:preconnect',
    message: 'Mongo connect attempt',
    data: {
      hasMongoUri: Boolean(uri),
      mongoUriHostPort: (() => {
        if (!uri) return null;
        const m = uri.match(/^mongodb(?:\+srv)?:\/\/([^/]+)/i);
        return m?.[1] ?? null;
      })(),
    },
    timestamp: Date.now(),
  });

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    logger.info(`✅ MongoDB connected: ${mongoose.connection.host}`);

    agentLog({
      sessionId: '1eb43a',
      runId: 'pre-fix',
      hypothesisId: 'A',
      location: 'backend/src/config/db.ts:connectDB:connected',
      message: 'Mongo connected',
      data: { host: mongoose.connection.host, name: mongoose.connection.name },
      timestamp: Date.now(),
    });
  } catch (error) {
    const err = error as NodeJS.ErrnoException & { name?: string; code?: string | number };
    logger.error(`❌ MongoDB connection failed: ${err.message}`);

    agentLog({
      sessionId: '1eb43a',
      runId: 'pre-fix',
      hypothesisId: 'A',
      location: 'backend/src/config/db.ts:connectDB:catch',
      message: 'Mongo connect failed',
      data: { name: err.name ?? null, code: err.code ?? null, message: err.message },
      timestamp: Date.now(),
    });
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  logger.warn('⚠️  MongoDB disconnected. Retrying...');

  agentLog({
    sessionId: '1eb43a',
    runId: 'pre-fix',
    hypothesisId: 'A',
    location: 'backend/src/config/db.ts:mongoose.connection:on(disconnected)',
    message: 'Mongo disconnected event',
    data: {},
    timestamp: Date.now(),
  });
});
