import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as Diff from 'diff';
import config from '../config';
import logger from '../utils/logger';
import { validateConfiguration } from './validationService';
import { reloadService } from './serviceStatusService';

const execAsync = promisify(exec);

export interface FileNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  children?: FileNode[];
}

export interface FileContentResponse {
  content: string;
  mtime: number;
}

export interface SaveFileResponse {
  status: 'success' | 'conflict' | 'validation_failed';
  mtime?: number;
  disk_content?: string;
  message?: string;
  diff?: string;
  validationOutput?: string;
  validationError?: string;
}

/**
 * Build file tree from directory
 */
export async function buildFileTree(dirPath: string): Promise<FileNode[]> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const nodes: FileNode[] = [];

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        const children = await buildFileTree(fullPath);
        nodes.push({
          name: entry.name,
          type: 'directory',
          path: fullPath,
          children,
        });
      } else {
        nodes.push({
          name: entry.name,
          type: 'file',
          path: fullPath,
        });
      }
    }

    return nodes.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === 'directory' ? -1 : 1;
    });
  } catch (error: any) {
    logger.error(`Error building file tree: ${error.message}`);
    throw error;
  }
}

/**
 * Get file content with modification time
 */
export async function getFileContent(filePath: string): Promise<FileContentResponse> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const stats = await fs.stat(filePath);

    return {
      content,
      mtime: stats.mtimeMs,
    };
  } catch (error: any) {
    logger.error(`Error reading file ${filePath}: ${error.message}`);
    throw error;
  }
}

/**
 * Save file with conflict detection, validation, and service reload
 * Uses shadow buffer logic - compares mtime to detect external changes
 * Validates configuration before saving
 * Reloads service if validation passes
 * Preserves original file ownership and permissions
 */
export async function saveFile(
  filePath: string,
  content: string,
  clientMtime: number | null,
  force: boolean = false
): Promise<SaveFileResponse> {
  try {
    // Get original file stats for permission preservation
    const originalStats = await fs.stat(filePath);

    // Check if file was modified externally
    if (!force && clientMtime !== null) {
      if (originalStats.mtimeMs !== clientMtime) {
        // File was modified externally - conflict detected
        const diskContent = await fs.readFile(filePath, 'utf-8');
        const diff = Diff.createTwoFilesPatch(
          'Disk Version',
          'Your Changes',
          diskContent,
          content,
          '',
          ''
        );

        return {
          status: 'conflict',
          disk_content: diskContent,
          diff,
          message: 'File was modified externally',
        };
      }
    }

    // Step 1: Save the original file content for rollback
    const originalContent = await fs.readFile(filePath, 'utf-8');

    // Step 2: Write new file content
    await fs.writeFile(filePath, content, 'utf-8');

    // Preserve original ownership and permissions
    try {
      await fs.chown(filePath, originalStats.uid, originalStats.gid);
      await fs.chmod(filePath, originalStats.mode);
    } catch (chownError: any) {
      logger.warn(`Could not preserve ownership for ${filePath}: ${chownError.message}`);
    }

    // Step 3: Validate configuration
    logger.info(`Validating configuration after saving ${filePath}...`);
    const validation = await validateConfiguration(config.freeradius.baseDir);

    if (!validation.success) {
      // Validation failed - rollback the file
      logger.warn(`Validation failed after saving ${filePath}, rolling back...`);
      await fs.writeFile(filePath, originalContent, 'utf-8');

      // Restore ownership and permissions again
      try {
        await fs.chown(filePath, originalStats.uid, originalStats.gid);
        await fs.chmod(filePath, originalStats.mode);
      } catch (chownError: any) {
        logger.warn(`Could not preserve ownership during rollback for ${filePath}: ${chownError.message}`);
      }

      // Get the new mtime after rollback so frontend can sync
      const rolledBackStats = await fs.stat(filePath);

      logger.info(`File rolled back to original content: ${filePath}`);

      return {
        status: 'validation_failed',
        message: 'Configuration validation failed',
        validationOutput: validation.output,
        validationError: validation.error,
        mtime: rolledBackStats.mtimeMs, // Return new mtime after rollback
      };
    }

    // Step 4: Validation passed - reload service
    logger.info('Configuration validation passed, reloading service...');
    const reloadResult = await reloadService();

    if (!reloadResult.success) {
      logger.warn(`Service reload failed: ${reloadResult.message}`);
      // Don't rollback - config is valid, just reload failed
    } else {
      logger.info('Service reloaded successfully');
    }

    const newStats = await fs.stat(filePath);

    logger.info(`File saved, validated, and service reloaded: ${filePath} (mode: ${originalStats.mode.toString(8)})`);

    return {
      status: 'success',
      mtime: newStats.mtimeMs,
      message: 'File saved, validated, and service reloaded successfully',
    };
  } catch (error: any) {
    logger.error(`Error saving file ${filePath}: ${error.message}`);
    throw error;
  }
}
