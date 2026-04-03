import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import config from './config';
import logger from './utils/logger';
import fileRoutes from './routes/fileRoutes';
import logsRoutes from './routes/logsRoutes';
import coaRoutes from './routes/coaRoutes';
import serviceRoutes from './routes/serviceRoutes';
import { initializeFileWatcher } from './services/fileWatcher';
import { initializeLogStreamer } from './services/logStreamer';

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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/files', fileRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/coa', coaRoutes);
app.use('/api/service', serviceRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
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
