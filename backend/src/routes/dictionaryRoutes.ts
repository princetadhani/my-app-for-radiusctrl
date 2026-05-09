import express from 'express';
import * as dictionaryService from '../services/dictionaryService';

const router = express.Router();

/**
 * GET /api/dictionary/files
 * List all custom dictionary files
 */
router.get('/files', async (req, res, next) => {
  try {
    const files = await dictionaryService.listDictionaryFiles();
    res.json({ files });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/dictionary/:fileName
 * Get dictionary file content
 */
router.get('/:fileName', async (req, res, next) => {
  try {
    const { fileName } = req.params;
    
    if (!fileName) {
      return res.status(400).json({ error: 'fileName is required' });
    }
    
    const content = await dictionaryService.getDictionaryFileContent(fileName);
    res.json({ content });
  } catch (error: any) {
    if (error.message && error.message.includes('Dictionary name')) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
});

/**
 * POST /api/dictionary/create
 * Create new custom dictionary file
 */
router.post('/create', async (req, res, next) => {
  try {
    const { fileName } = req.body;
    
    if (!fileName) {
      return res.status(400).json({ error: 'fileName is required' });
    }
    
    const result = await dictionaryService.createDictionaryFile(fileName);
    res.json(result);
  } catch (error: any) {
    // Return 400 for validation errors
    if (error.message && (
      error.message.includes('Dictionary name') ||
      error.message.includes('already exists') ||
      error.message.includes('Reserved') ||
      error.message.includes('FreeRADIUS config error')
    )) {
      return res.status(400).json({ error: error.message });
    }
    // Return 403 for security violations
    if (error.message && error.message.includes('Path Traversal')) {
      return res.status(403).json({ error: error.message });
    }
    next(error);
  }
});

/**
 * DELETE /api/dictionary/:fileName
 * Delete dictionary file and remove from main dictionary
 */
router.delete('/:fileName', async (req, res, next) => {
  try {
    const { fileName } = req.params;
    
    if (!fileName) {
      return res.status(400).json({ error: 'fileName is required' });
    }
    
    await dictionaryService.deleteDictionaryFile(fileName);
    res.json({ success: true });
  } catch (error: any) {
    if (error.message && error.message.includes('Dictionary name')) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
});

export default router;
