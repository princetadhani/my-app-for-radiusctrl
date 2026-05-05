import path from 'path';
import { isIP } from 'net';

/**
 * Security Helper Functions
 * Based on Flask reference implementation
 */

/**
 * Resolves the absolute path and ensures it stays strictly within the base directory.
 * Prevents Directory Traversal (e.g., ../../../../etc/shadow)
 * 
 * @param baseDirectory - The base directory to restrict access to
 * @param userPath - The user-provided path (potentially unsafe)
 * @returns The safe absolute path
 * @throws Error if path traversal is detected or no path provided
 */
export function getSafePath(baseDirectory: string, userPath: string): string {
  if (!userPath) {
    throw new Error('No path provided.');
  }

  // Resolve to absolute paths
  const absoluteBase = path.resolve(baseDirectory);
  const fullPath = path.resolve(path.join(baseDirectory, userPath));

  // Ensure the resolved path is still within the base directory
  if (!fullPath.startsWith(absoluteBase)) {
    throw new Error('Access Denied: Path Traversal Detected.');
  }

  return fullPath;
}

/**
 * Validates an IP address (IPv4 or IPv6)
 * 
 * @param ipAddress - The IP address to validate
 * @returns true if valid, false otherwise
 */
export function isValidIpAddress(ipAddress: string): boolean {
  if (!ipAddress) {
    return false;
  }

  // Use Node.js built-in isIP function
  // Returns 4 for IPv4, 6 for IPv6, 0 for invalid
  return isIP(ipAddress) !== 0;
}

/**
 * Validates and sanitizes a filename
 * Removes or replaces dangerous characters
 * 
 * @param fileName - The filename to sanitize
 * @returns Sanitized filename
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName) {
    throw new Error('No filename provided.');
  }

  // Replace any character that's not alphanumeric, underscore, hyphen, or dot
  const sanitized = fileName.replace(/[^a-zA-Z0-9_.-]/g, '_');

  // Prevent hidden files
  if (sanitized.startsWith('.')) {
    return '_' + sanitized.substring(1);
  }

  return sanitized;
}

/**
 * Validates request type for COA commands
 * 
 * @param reqType - The request type (should be 'coa' or 'disconnect')
 * @returns true if valid, false otherwise
 */
export function isValidCoaRequestType(reqType: string): boolean {
  return reqType === 'coa' || reqType === 'disconnect';
}

export default {
  getSafePath,
  isValidIpAddress,
  sanitizeFileName,
  isValidCoaRequestType,
};
