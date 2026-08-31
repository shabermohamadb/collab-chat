import { Router } from 'express';
import authRoutes from './authRoutes.js';
import roomRoutes from './roomRoutes.js';
import messageRoutes from './messageRoutes.js';
import userRoutes from './userRoutes.js';
import uploadRoutes from './uploadRoutes.js';
import { getConfig } from '../utils/config.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'CollabSpace API',
  });
});

router.get('/config', (_req, res) => {
  const config = getConfig();
  res.json({
    appName: config.appName,
    appDescription: config.appDescription,
    version: config.version,
    maxMessageLength: config.maxMessageLength,
    features: config.features,
    allowedFileExtensions: config.allowedFileExtensions,
  });
});

router.use('/auth', authRoutes);
router.use('/rooms', roomRoutes);
router.use('/messages', messageRoutes);
router.use('/users', userRoutes);
router.use('/upload', uploadRoutes);

export default router;
