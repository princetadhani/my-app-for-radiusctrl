import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as Diff from 'diff';
import config from '../config';
import logger from '../utils/logger';

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
  status: 'success' | 'conflict';
  mtime?: number;
  disk_content?: string;
  message?: string;
  diff?: string;
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
 * Save file with conflict detection
 * Uses shadow buffer logic - compares mtime to detect external changes
 */
export async function saveFile(
  filePath: string,
  content: string,
  clientMtime: number | null,
  force: boolean = false
): Promise<SaveFileResponse> {
  try {
    // Check if file was modified externally
    if (!force && clientMtime !== null) {
      const stats = await fs.stat(filePath);

      if (stats.mtimeMs !== clientMtime) {
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

    // Write file directly (user should be in freerad group with write permissions)
    // If this fails due to permissions, the catch block will handle it
    await fs.writeFile(filePath, content, 'utf-8');
    const newStats = await fs.stat(filePath);

    logger.info(`File saved successfully: ${filePath}`);

    return {
      status: 'success',
      mtime: newStats.mtimeMs,
      message: 'File saved successfully',
    };
  } catch (error: any) {
    logger.error(`Error saving file ${filePath}: ${error.message}`);
    throw error;
  }
}
