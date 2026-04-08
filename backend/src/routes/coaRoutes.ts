import express from 'express';
import * as coaService from '../services/coaService';
import * as fileService from '../services/fileService';
import config from '../config';

const router = express.Router();

/**
 * GET /api/coa/tree
 * Get COA directory file tree structure
 */
router.get('/tree', async (req, res, next) => {
  try {
    const tree = await fileService.buildFileTree(config.freeradius.coaDir);
    res.json({ tree });
  } catch (error) {
    next(error);
  }
});

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

    if (!fileName) {
      return res.status(400).json({ error: 'fileName is required' });
    }

    const content = await coaService.getCoaFileContent(fileName);
    res.json({ content });
  } catch (error: any) {
    // Return 403 for security violations (path traversal)
    if (error.message && error.message.includes('Path Traversal')) {
      return res.status(403).json({ error: error.message });
    }
    next(error);
  }
});

/**
 * POST /api/coa/create
 * Create COA file
 * If attributes is empty, a default template will be used
 */
router.post('/create', async (req, res, next) => {
  try {
    const { fileName, attributes } = req.body;

    if (!fileName) {
      return res.status(400).json({ error: 'fileName is required' });
    }

    // attributes can be empty string (will use default template)
    // If undefined, use empty string
    const fileAttributes = attributes !== undefined ? attributes : '';

    const result = await coaService.createCoaFile(fileName, fileAttributes);
    res.json(result);
  } catch (error: any) {
    // Return 403 for security violations (path traversal)
    if (error.message && error.message.includes('Path Traversal')) {
      return res.status(403).json({ error: error.message });
    }
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
  } catch (error: any) {
    // Return appropriate status codes for different error types
    if (error.message) {
      if (error.message.includes('Invalid NAS IP') || error.message.includes('Invalid request type')) {
        return res.status(400).json({ error: error.message });
      }
      if (error.message.includes('Path Traversal')) {
        return res.status(403).json({ error: error.message });
      }
    }
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

    if (!fileName) {
      return res.status(400).json({ error: 'fileName is required' });
    }

    await coaService.deleteCoaFile(fileName);
    res.json({ success: true });
  } catch (error: any) {
    // Return 403 for security violations (path traversal)
    if (error.message && error.message.includes('Path Traversal')) {
      return res.status(403).json({ error: error.message });
    }
    next(error);
  }
});

export default router;
