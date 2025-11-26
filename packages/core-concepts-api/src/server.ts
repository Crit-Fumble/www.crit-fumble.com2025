import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { apiKeyAuth } from './middleware/auth.js';
import { errorHandler } from './middleware/error-handler.js';
import { requestLogger } from './middleware/request-logger.js';

// Routes
import worldsRouter from './routes/worlds.js';
import creaturesRouter from './routes/creatures.js';
import sessionsRouter from './routes/sessions.js';
import sheetsRouter from './routes/sheets.js';
import historyRouter from './routes/history.js';
import boardsRouter from './routes/boards.js';
import campaignsRouter from './routes/campaigns.js';
import playersRouter from './routes/players.js';
import healthRouter from './routes/health.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Logging
app.use(requestLogger);

// Health check (no auth required)
app.use('/health', healthRouter);

// API routes (auth required)
app.use('/api/v1/worlds', apiKeyAuth, worldsRouter);
app.use('/api/v1/creatures', apiKeyAuth, creaturesRouter);
app.use('/api/v1/sessions', apiKeyAuth, sessionsRouter);
app.use('/api/v1/sheets', apiKeyAuth, sheetsRouter);
app.use('/api/v1/history', apiKeyAuth, historyRouter);
app.use('/api/v1/boards', apiKeyAuth, boardsRouter);
app.use('/api/v1/campaigns', apiKeyAuth, campaignsRouter);
app.use('/api/v1/players', apiKeyAuth, playersRouter);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`Core Concepts API running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
