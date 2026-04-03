import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import config from '../config';
import logger from '../utils/logger';

const execAsync = promisify(exec);

export interface ValidationResult {
  success: boolean;
  output: string;
  error?: string;
}

export interface DeployResult {
  success: boolean;
  message: string;
  validationOutput?: string;
  error?: string;
}

/**
 * Copy directory recursively
 */
async function copyDirectory(src: string, dest: string): Promise<void> {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

/**
 * Validate FreeRADIUS configuration
 */
export async function validateConfiguration(configDir: string): Promise<ValidationResult> {
  try {
    logger.info(`Validating configuration in: ${configDir}`);

    // USE: freeradius -CX <path>
    // -C: Check configuration and exit
    // -X: Debug mode (shows detailed output)
    // Full path required (not -D flag)

    try {
      const { stdout, stderr } = await execAsync(
        `freeradius -CX ${configDir}`,
        { timeout: 30000 }
      );

      const output = stdout + stderr;

      // Check for the FINAL result message from FreeRADIUS
      // "Configuration appears to be OK" = success
      // "Errors reading" or "Failed parsing" (without OK) = failure

      const configOK = output.includes('Configuration appears to be OK');
      const hasParseError = output.includes('Parse error');
      const hasErrorsReading = output.includes('Errors reading');
      const hasFailedParsing = output.includes('Failed parsing configuration item');

      // Success if final message says OK, even if there are warnings (like EAP SSL)
      if (configOK && !hasParseError && !hasErrorsReading && !hasFailedParsing) {
        logger.info(`Validation result: SUCCESS`);
        return {
          success: true,
          output: 'Configuration appears to be OK',
        };
      }

      // Configuration has critical errors
      logger.warn(`Validation found errors in output`);

      // Extract only CRITICAL error lines (not warnings)
      const errorLines = output.split('\n').filter(line =>
        line.includes('Parse error') ||
        line.includes('Errors reading') ||
        line.includes('Failed parsing configuration item') ||
        line.includes('Unknown name')
      ).slice(0, 15);

      return {
        success: false,
        output: output,
        error: errorLines.join('\n') || 'Configuration has critical errors',
      };
    } catch (validationError: any) {
      // Command failed (non-zero exit code)
      const output = (validationError.stdout || '') + '\n' + (validationError.stderr || '');

      logger.error(`Validation FAILED: ${validationError.message}`);

      // Extract error lines
      const errorLines = output.split('\n').filter(line =>
        line.includes('Parse error') ||
        line.includes('Unknown') ||
        line.includes('Failed') ||
        line.includes('Error')
      ).slice(0, 15);

      return {
        success: false,
        output: output,
        error: errorLines.join('\n') || 'Configuration validation failed',
      };
    }
  } catch (error: any) {
    logger.error(`Validation error: ${error.message}`);
    logger.error(`Stdout: ${error.stdout}`);
    logger.error(`Stderr: ${error.stderr}`);

    // FreeRADIUS returns non-zero exit code on validation failure
    // But the output still contains useful information
    const output = (error.stdout || '') + '\n' + (error.stderr || '');

    if (output.trim()) {
      // We have output, parse it for errors
      const hasDuplicateError = output.includes('Duplicate');
      const hasFailedParsing = output.includes('Failed parsing');
      const hasInstantiationFailed = output.includes('Instantiation failed');
      const hasParseError = output.includes('Parse error');
      const hasErrorsReading = output.includes('Errors reading');

      return {
        success: false,
        output: output.trim(),
        error: hasDuplicateError || hasFailedParsing || hasInstantiationFailed || hasParseError || hasErrorsReading
          ? 'Configuration validation failed. See errors above.'
          : error.message,
      };
    }

    return {
      success: false,
      output: '',
      error: error.stderr || error.message || 'Validation failed with no output',
    };
  }
}

/**
 * Safe-Save Implementation with Atomic Copy & Validation
 * 1. Atomic Copy: Copy entire config to /tmp/radius_test/
 * 2. Apply Change: Write edited file to test directory
 * 3. Validate: Run freeradius -C on test directory
 * 4. Swap: If validation passes, copy file to live directory
 */
export async function safeSaveAndValidate(
  filePath: string,
  content: string
): Promise<DeployResult> {
  const testDir = '/tmp/radius_test';
  const baseDir = config.freeradius.baseDir;
  const relativePath = path.relative(baseDir, filePath);

  try {
    // Step 1: Atomic Copy - Copy entire config to test directory
    logger.info('Step 1: Copying configuration to test directory...');
    await fs.rm(testDir, { recursive: true, force: true });
    await copyDirectory(baseDir, testDir);

    // Step 2: Apply Change - Write edited file to test directory
    logger.info('Step 2: Applying changes to test directory...');
    const testFilePath = path.join(testDir, relativePath);
    await fs.writeFile(testFilePath, content, 'utf-8');

    // Step 3: Validate - Run freeradius -C
    logger.info('Step 3: Validating configuration...');
    const validation = await validateConfiguration(testDir);

    if (!validation.success) {
      logger.warn('Validation failed, changes not applied');
      return {
        success: false,
        message: 'Configuration validation failed',
        validationOutput: validation.output,
        error: validation.error,
      };
    }

    // Step 4: Swap - Copy validated file to live directory
    logger.info('Step 4: Deploying validated configuration...');
    await fs.writeFile(filePath, content, 'utf-8');

    // Cleanup test directory
    await fs.rm(testDir, { recursive: true, force: true });

    logger.info('Safe-save completed successfully');

    return {
      success: true,
      message: 'Configuration validated and deployed successfully',
      validationOutput: validation.output,
    };
  } catch (error: any) {
    logger.error(`Safe-save error: ${error.message}`);

    // Cleanup test directory on error
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch { }

    return {
      success: false,
      message: 'Failed to deploy configuration',
      error: error.message,
    };
  }
}

/**
 * Restart/Reload FreeRADIUS service
 */
export async function reloadService(): Promise<{ success: boolean; output: string }> {
  try {
    logger.info('Reloading FreeRADIUS service...');
    const { stdout, stderr } = await execAsync(
      `sudo systemctl reload ${config.freeradius.serviceName}`,
      { timeout: 10000 }
    );

    return {
      success: true,
      output: stdout + stderr,
    };
  } catch (error: any) {
    logger.error(`Service reload error: ${error.message}`);
    return {
      success: false,
      output: error.stderr || error.message,
    };
  }
}
