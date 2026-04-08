import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
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
  status: 'success' | 'validation_failed';
  mtime?: number;
  message?: string;
  validationOutput?: string;
  validationError?: string;
}

export interface CreateUserResponse {
  status: 'success' | 'exists' | 'validation_failed';
  message: string;
  validationOutput?: string;
  validationError?: string;
}

/**
 * Build file tree from directory
 * Handles symlinks properly - symlinked directories are treated as directories
 */
export async function buildFileTree(dirPath: string): Promise<FileNode[]> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const nodes: FileNode[] = [];

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      // Check if it's a directory or a symlink pointing to a directory
      let isDir = entry.isDirectory();

      // If it's a symlink, check what it points to
      if (entry.isSymbolicLink()) {
        try {
          const stats = await fs.stat(fullPath); // stat() follows symlinks
          isDir = stats.isDirectory();
        } catch (error) {
          // Broken symlink - skip it
          logger.warn(`Skipping broken symlink: ${fullPath}`);
          continue;
        }
      }

      if (isDir) {
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
 * Save file with validation and service reload
 * Validates configuration before saving
 * Reloads service if validation passes
 * Preserves original file ownership and permissions
 *
 * mtime is tracked for validation rollback purposes:
 * - If validation fails, file is rolled back to original content
 * - New mtime after rollback is returned to frontend
 * - This prevents false positive conflicts on the next save attempt
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

/**
 * Create new user file with validation and rollback
 *
 * Workflow:
 * 1. Validate filename (lowercase, no spaces, no extension)
 * 2. Check if user already exists
 * 3. Create user file in users.d/
 * 4. Update authorize file with $INCLUDE
 * 5. Validate with freeradius -XC
 * 6. Rollback if validation fails
 */
export async function createNewUser(rawFilename: string): Promise<CreateUserResponse> {
  let userFilePath: string | null = null;
  let authorizeFilePath: string | null = null;
  let authorizeBackup: string | null = null;

  try {
    // Step 1: Validate and sanitize filename
    logger.info(`Creating new user: ${rawFilename}`);

    // Remove extension if provided
    let filename = rawFilename.split('.')[0];

    // Check for spaces
    if (/\s/.test(filename)) {
      return {
        status: 'validation_failed',
        message: 'Filename cannot contain spaces',
      };
    }

    // Convert to lowercase
    filename = filename.toLowerCase();

    // Validate it's alphanumeric (allow numbers)
    if (!/^[a-z0-9]+$/.test(filename)) {
      return {
        status: 'validation_failed',
        message: 'Filename must contain only letters and numbers',
      };
    }

    // Step 2: Check if user already exists
    const usersDir = path.join(config.freeradius.baseDir, 'mods-config/files/users.d');
    userFilePath = path.join(usersDir, filename);

    try {
      await fs.access(userFilePath);
      // File exists
      logger.warn(`User already exists: ${filename}`);
      return {
        status: 'exists',
        message: 'User already exists',
      };
    } catch {
      // File doesn't exist - good, we can create it
    }

    // Step 3: Create user file
    logger.info(`Creating user file: ${userFilePath}`);

    // Ensure users.d directory exists
    try {
      await fs.mkdir(usersDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore error
    }

    // Create empty user file with proper permissions
    await fs.writeFile(userFilePath, '', 'utf-8');

    // Set proper permissions (664 - rw-rw-r--)
    await fs.chmod(userFilePath, 0o664);

    // Step 4: Update authorize file
    authorizeFilePath = path.join(config.freeradius.baseDir, 'mods-config/files/authorize');

    logger.info(`Updating authorize file: ${authorizeFilePath}`);

    // Backup authorize file
    const authorizeContent = await fs.readFile(authorizeFilePath, 'utf-8');
    authorizeBackup = authorizeContent;

    // Append $INCLUDE line
    const includeStatement = `$INCLUDE users.d/${filename}\n`;
    const newAuthorizeContent = authorizeContent + includeStatement;

    await fs.writeFile(authorizeFilePath, newAuthorizeContent, 'utf-8');

    // Step 5: Validate configuration
    logger.info('Validating configuration with freeradius -XC...');

    const validation = await validateConfiguration(config.freeradius.baseDir);

    if (!validation.success) {
      // Validation failed - ROLLBACK
      logger.warn('Validation failed, rolling back changes...');

      // Rollback: Delete user file
      if (userFilePath) {
        try {
          await fs.unlink(userFilePath);
          logger.info(`Rolled back: Deleted user file ${userFilePath}`);
        } catch (error: any) {
          logger.error(`Failed to delete user file during rollback: ${error.message}`);
        }
      }

      // Rollback: Restore authorize file
      if (authorizeFilePath && authorizeBackup) {
        try {
          await fs.writeFile(authorizeFilePath, authorizeBackup, 'utf-8');
          logger.info(`Rolled back: Restored authorize file`);
        } catch (error: any) {
          logger.error(`Failed to restore authorize file during rollback: ${error.message}`);
        }
      }

      return {
        status: 'validation_failed',
        message: 'Configuration validation failed. Changes were rolled back.',
        validationOutput: validation.output,
        validationError: validation.error,
      };
    }

    // Success!
    logger.info(`User created successfully: ${filename}`);

    return {
      status: 'success',
      message: `User "${filename}" created successfully`,
    };

  } catch (error: any) {
    logger.error(`Error creating user: ${error.message}`);

    // Emergency rollback
    if (userFilePath) {
      try {
        await fs.unlink(userFilePath);
      } catch { }
    }

    if (authorizeFilePath && authorizeBackup) {
      try {
        await fs.writeFile(authorizeFilePath, authorizeBackup, 'utf-8');
      } catch { }
    }

    throw error;
  }
}
