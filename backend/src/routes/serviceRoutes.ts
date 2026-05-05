import express from 'express';
import * as serviceStatusService from '../services/serviceStatusService';
import logger from '../utils/logger';

const router = express.Router();

/**
 * GET /api/service/status
 * Get FreeRADIUS service status
 */
router.get('/status', async (req, res, next) => {
  try {
    const status = await serviceStatusService.getServiceStatus();
    res.json(status);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/service/reload
 * Reload FreeRADIUS service
 */
router.post('/reload', async (req, res, next) => {
  try {
    const result = await serviceStatusService.reloadService();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/service/restart
 * Restart FreeRADIUS service
 */
router.post('/restart', async (req, res, next) => {
  try {
    const result = await serviceStatusService.restartService();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
