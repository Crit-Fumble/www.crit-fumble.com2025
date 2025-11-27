
import { Router } from 'express';
import prisma from '../services/db.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      database: 'connected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/ready', async (_req, res) => {
  // Readiness check for Kubernetes/DO App Platform
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).send('OK');
  } catch {
    res.status(503).send('NOT READY');
  }
});

router.get('/live', (_req, res) => {
  // Liveness check
  res.status(200).send('OK');
});

export default router;
