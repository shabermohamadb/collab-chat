import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { Server as SocketIOServer } from 'socket.io';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { setupWebSocket } from './websocket/socketHandler.js';
import { initSocketService } from './services/socketService.js';
import { logger } from './utils/logger.js';
import { getOrCreateAiUser } from './services/aiService.js';
import prisma from './models/prisma.js';

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// CORS configuration (enabling credentials for HttpOnly session cookies)
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, or same-origin)
      if (!origin) return callback(null, true);
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads
const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// Mount REST API routes
app.use('/api', apiRoutes);

// Static frontend serving if built (e.g. on Render unified deployment)
const frontendDistPath = path.resolve(process.cwd(), '../frontend/dist');
const altFrontendDistPath = path.resolve(process.cwd(), 'frontend/dist');
const distPath = fs.existsSync(frontendDistPath) ? frontendDistPath : (fs.existsSync(altFrontendDistPath) ? altFrontendDistPath : null);

if (distPath) {
  logger.info(`[SERVER] Serving frontend static build from ${distPath}`);
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // Friendly API status page when running without static frontend build
  app.get('/', (_req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>CollabSpace API Server</title>
        <style>
          body { font-family: system-ui, sans-serif; background: #09090b; color: #f4f4f5; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { background: #18181b; padding: 2rem; border-radius: 1rem; border: 1px solid #27272a; max-width: 480px; text-align: center; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
          h1 { color: #7b68ee; margin-top: 0; font-size: 1.5rem; }
          p { color: #a1a1aa; font-size: 0.9rem; line-height: 1.5; }
          a { display: inline-block; margin-top: 1rem; background: #7b68ee; color: white; padding: 0.6rem 1.2rem; border-radius: 0.5rem; text-decoration: none; font-weight: 600; font-size: 0.85rem; }
          a:hover { background: #6a56d6; }
          .endpoints { margin-top: 1.5rem; text-align: left; background: #09090b; padding: 0.75rem; border-radius: 0.5rem; font-family: monospace; font-size: 0.8rem; color: #9b89f5; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>⚡ CollabSpace Backend & Auth Server</h1>
          <p>Production API & Real OAuth service active on port ${PORT}.</p>
          <a href="${FRONTEND_URL}">Open CollabSpace Frontend (${FRONTEND_URL})</a>
          <div class="endpoints">
            <div>• GET /api/auth/google → Google OAuth 2.0</div>
            <div>• GET /api/auth/github → GitHub OAuth</div>
            <div>• GET /api/auth/me     → Authenticated User Session</div>
            <div>• WS  /socket.io      → Real-time Events with Session Handshake</div>
          </div>
        </div>
      </body>
      </html>
    `);
  });
}

// Global Error Handler
app.use(errorHandler);

// Initialize Socket.IO Server
const io = new SocketIOServer(server, {
  cors: {
    origin: (origin, callback) => callback(null, true),
    credentials: true,
  },
  pingTimeout: 30000,
  pingInterval: 10000,
});

initSocketService(io);
setupWebSocket(io);

// Server startup
const startServer = async () => {
  try {
    await getOrCreateAiUser();
    logger.info('🤖 AI System Participant initialized.');

    server.listen(PORT, () => {
      logger.info(`🚀 CollabSpace Backend Server running on http://localhost:${PORT}`);
      logger.info(`📡 WebSocket Server listening for authenticated real-time events.`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down server gracefully...');
  server.close(async () => {
    await prisma.$disconnect();
    logger.info('Server closed. Database disconnected.');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export { app, server };
export default app;
