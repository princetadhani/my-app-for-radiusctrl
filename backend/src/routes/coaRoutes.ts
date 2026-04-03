import express from 'express';
import * as coaService from '../services/coaService';
import logger from '../utils/logger';

const router = express.Router();

/**
 * GET /api/coa/files
 * List all COA files
 */
router.get('/files', async (req, res, next) => {
  try {
    const files = await coaService.listCoaFiles();
    res.json({ files });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/coa/files/:fileName
 * Get COA file content
 */
router.get('/files/:fileName', async (req, res, next) => {
  try {
    const { fileName } = req.params;
    const content = await coaService.getCoaFileContent(fileName);
    res.json({ content });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/coa/create
 * Create COA file
 */
router.post('/create', async (req, res, next) => {
  try {
    const { fileName, attributes } = req.body;
    
    if (!fileName || !attributes) {
      return res.status(400).json({ error: 'fileName and attributes are required' });
    }

    const result = await coaService.createCoaFile(fileName, attributes);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/coa/execute
 * Execute COA/Disconnect command
 */
router.post('/execute', async (req, res, next) => {
  try {
    const { type, nasIp, nasSecret, attributes, fileName } = req.body;
    
    if (!type || !nasIp || !nasSecret || !attributes) {
      return res.status(400).json({ error: 'type, nasIp, nasSecret, and attributes are required' });
    }

    const result = await coaService.executeCoaCommand({
      type,
      nasIp,
      nasSecret,
      attributes,
      fileName,
    });
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/coa/files/:fileName
 * Delete COA file
 */
router.delete('/files/:fileName', async (req, res, next) => {
  try {
    const { fileName } = req.params;
    await coaService.deleteCoaFile(fileName);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
