import express from 'express';
import * as logStreamer from '../services/logStreamer';
import logger from '../utils/logger';

const router = express.Router();

/**
 * GET /api/logs/read
 * Read log file (optionally last N lines)
 */
router.get('/read', async (req, res, next) => {
  try {
    const lines = req.query.lines ? parseInt(req.query.lines as string, 10) : undefined;
    const logs = await logStreamer.readLogFile(lines);
    res.json({ logs });
  } catch (error) {
    next(error);
  }
});

export default router;
