import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import config from '../config';
import logger from '../utils/logger';

const execAsync = promisify(exec);

export interface CoaRequest {
  type: 'coa' | 'disconnect';
  nasIp: string;
  nasSecret: string;
  attributes: string;
  fileName?: string;
}

export interface CoaResponse {
  success: boolean;
  output: string;
  fileName?: string;
}

/**
 * Create COA file in the COA directory
 * Files are created with freerad:freerad ownership to match FreeRADIUS files
 */
export async function createCoaFile(
  fileName: string,
  attributes: string
): Promise<{ success: boolean; filePath: string }> {
  try {
    // Ensure COA directory exists
    await fs.mkdir(config.freeradius.coaDir, { recursive: true });

    // Sanitize filename
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fullFileName = sanitizedName.endsWith('.txt')
      ? sanitizedName
      : `${sanitizedName}.txt`;

    const filePath = path.join(config.freeradius.coaDir, fullFileName);

    // Write attributes to file
    await fs.writeFile(filePath, attributes, 'utf-8');

    // Get COA directory stats to match ownership
    try {
      const dirStats = await fs.stat(config.freeradius.coaDir);

      // Set ownership to match COA directory (freerad:freerad)
      await fs.chown(filePath, dirStats.uid, dirStats.gid);

      // Set permissions: rw-rw-r-- (664)
      await fs.chmod(filePath, 0o664);

      logger.info(`COA file created: ${filePath} (${dirStats.uid}:${dirStats.gid})`);
    } catch (chownError: any) {
      // If chown fails, log warning but continue
      logger.warn(`Could not set ownership for ${filePath}: ${chownError.message}`);
    }

    return {
      success: true,
      filePath,
    };
  } catch (error: any) {
    logger.error(`Error creating COA file: ${error.message}`);
    throw error;
  }
}

/**
 * Execute COA/Disconnect command using radclient
 */
export async function executeCoaCommand(request: CoaRequest): Promise<CoaResponse> {
  try {
    let filePath: string;

    // Create COA file if not using existing one
    if (!request.fileName) {
      const timestamp = Date.now();
      const autoFileName = `coa_${timestamp}`;
      const result = await createCoaFile(autoFileName, request.attributes);
      filePath = result.filePath;
    } else {
      filePath = path.join(config.freeradius.coaDir, request.fileName);
    }

    // Build radclient command
    const commandType = request.type === 'disconnect' ? 'disconnect' : 'coa';
    const command = `sudo radclient -f ${filePath} -x -r 1 ${request.nasIp} ${commandType} ${request.nasSecret}`;

    logger.info(`Executing COA command: ${command}`);

    // Execute command with timeout
    const { stdout, stderr } = await execAsync(command, {
      timeout: 10000,
    });

    const output = stdout + stderr;
    const success = output.includes('CoA-ACK') || output.includes('Disconnect-ACK');

    logger.info(`COA command result: ${success ? 'SUCCESS' : 'FAILED'}`);

    return {
      success,
      output,
      fileName: path.basename(filePath),
    };
  } catch (error: any) {
    logger.error(`COA command error: ${error.message}`);

    return {
      success: false,
      output: error.stderr || error.stdout || error.message,
    };
  }
}

/**
 * List all COA files
 */
export async function listCoaFiles(): Promise<string[]> {
  try {
    await fs.mkdir(config.freeradius.coaDir, { recursive: true });
    const files = await fs.readdir(config.freeradius.coaDir);
    return files.filter(f => f.endsWith('.txt'));
  } catch (error: any) {
    logger.error(`Error listing COA files: ${error.message}`);
    return [];
  }
}

/**
 * Get COA file content
 */
export async function getCoaFileContent(fileName: string): Promise<string> {
  try {
    const filePath = path.join(config.freeradius.coaDir, fileName);
    return await fs.readFile(filePath, 'utf-8');
  } catch (error: any) {
    logger.error(`Error reading COA file: ${error.message}`);
    throw error;
  }
}

/**
 * Delete COA file
 */
export async function deleteCoaFile(fileName: string): Promise<void> {
  try {
    const filePath = path.join(config.freeradius.coaDir, fileName);
    await fs.unlink(filePath);
    logger.info(`COA file deleted: ${filePath}`);
  } catch (error: any) {
    logger.error(`Error deleting COA file: ${error.message}`);
    throw error;
  }
}

export default {
  createCoaFile,
  executeCoaCommand,
  listCoaFiles,
  getCoaFileContent,
  deleteCoaFile,
};
