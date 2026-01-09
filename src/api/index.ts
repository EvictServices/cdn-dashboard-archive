import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { initDatabase } from './db.js';
import apiKeysRouter from './routes/apiKeys.js';
import authRouter from './routes/auth.js';
import analyticsRouter from './routes/analytics.js';
import cdnRouter from './routes/cdn.js';
import filesRouter from './routes/files.js';
import settingsRouter from './routes/settings.js';
import { roleplayApiRouter, roleplayCdnRouter } from './routes/roleplay.js';
import { authenticateToken } from './middleware/auth.js';
import { logApiUsage } from './middleware/apiAnalytics.js';
import { logCdnAccess } from './middleware/cdnAnalytics.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.set('trust proxy', true);

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRouter);

app.use('/cdn', logCdnAccess, cdnRouter);
app.use('/api/cdn', logCdnAccess, cdnRouter);
app.use('/cdn/roleplay', logCdnAccess, roleplayCdnRouter);
app.use('/api/cdn/roleplay', logCdnAccess, roleplayCdnRouter);

app.use('/api/roleplay', logApiUsage, roleplayApiRouter);
app.use('/api/keys', authenticateToken, apiKeysRouter);
app.use('/api/analytics', authenticateToken, analyticsRouter);
app.use('/api/files', filesRouter);
app.use('/api/settings', settingsRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

async function start() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
