import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import config from './config';
import logger from './utils/logger';
import fileRoutes from './routes/fileRoutes';
import logsRoutes from './routes/logsRoutes';
import coaRoutes from './routes/coaRoutes';
import dictionaryRoutes from './routes/dictionaryRoutes';
import serviceRoutes from './routes/serviceRoutes';
import { initializeFileWatcher } from './services/fileWatcher';
import { initializeLogStreamer } from './services/logStreamer';

// Set umask to ensure new files get group write permissions
// 0o002 means: 666 - 002 = 664 (rw-rw-r--)
// This is important when creating new files in /etc/freeradius/3.0/
process.umask(0o002);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Middleware
app.use(cors({
  origin: '*',
  credentials: true,
}));

// Increase JSON body limit to 100MB to support very large configuration files (100k+ lines)
// e.g., clients.conf with 107k lines (~15MB) needs this higher limit
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb', parameterLimit: 200000 }));

// Request logging
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/files', fileRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/coa', coaRoutes);
app.use('/api/dictionary', dictionaryRoutes);
app.use('/api/service', serviceRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// WebSocket connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Initialize services
initializeFileWatcher(io);
initializeLogStreamer(io);

// Start server - bind to 0.0.0.0 to accept connections from all interfaces
server.listen(config.server.port, '0.0.0.0', () => {
  logger.info(`🚀 Server running on port ${config.server.port}`);
  logger.info(`📂 FreeRADIUS base dir: ${config.freeradius.baseDir}`);
  logger.info(`📝 Log file: ${config.freeradius.logFile}`);
  logger.info(`🔄 WebSocket CORS origin: ${config.websocket.corsOrigin}`);
});

export { io };
