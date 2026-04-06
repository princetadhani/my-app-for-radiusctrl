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
