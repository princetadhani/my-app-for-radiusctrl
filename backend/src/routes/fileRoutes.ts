import express from 'express';
import * as fileService from '../services/fileService';
import * as validationService from '../services/validationService';
import config from '../config';
import logger from '../utils/logger';

const router = express.Router();

/**
 * GET /api/files/tree
 * Get file tree structure
 */
router.get('/tree', async (req, res, next) => {
  try {
    const tree = await fileService.buildFileTree(config.freeradius.baseDir);
    res.json({ tree });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/files/content
 * Get file content
 */
router.post('/content', async (req, res, next) => {
  try {
    const { path } = req.body;

    if (!path) {
      return res.status(400).json({ error: 'Path is required' });
    }

    const result = await fileService.getFileContent(path);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/files/save
 * Save file with validation and automatic service reload
 * If validation fails, file is rolled back to original content
 */
router.post('/save', async (req, res, next) => {
  try {
    const { path, content, mtime, force } = req.body;

    if (!path || content === undefined) {
      return res.status(400).json({ error: 'Path and content are required' });
    }

    const result = await fileService.saveFile(path, content, mtime || null, force || false);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/files/validate
 * Validate configuration without saving
 */
router.post('/validate', async (req, res, next) => {
  try {
    const result = await validationService.validateConfiguration(config.freeradius.baseDir);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
