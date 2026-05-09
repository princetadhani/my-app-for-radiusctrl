import { promises as fs } from 'fs';
import path from 'path';
import config from '../config';
import logger from '../utils/logger';
import { getSafePath, sanitizeFileName } from '../utils/security';
import { validateConfiguration } from './validationService';

const DICTIONARY_DIR = path.join(config.freeradius.baseDir, 'dictionary.d');
const MAIN_DICTIONARY_PATH = path.join(config.freeradius.baseDir, 'dictionary');

const DICTIONARY_TEMPLATE = `#  FreeRADIUS Vendor Dictionary
#  Vendor: Wibhu
#
#  COLUMN FORMAT
#  ---------------------------------------------------------------------------------
#  Keyword        Name/Attribute              Attribute-ID     Data-Type
#  ---------------------------------------------------------------------------------
#  VENDOR         <Vendor-Name>                <Vendor-ID>
#  BEGIN-VENDOR   <Vendor-Name>
#  ATTRIBUTE      <Attribute-Name>             <Attribute-ID>   <Data-Type>
#  END-VENDOR     <Vendor-Name>
#  ---------------------------------------------------------------------------------
#
#  FIELD DESCRIPTION
#  Keyword        : Type of dictionary entry (VENDOR / ATTRIBUTE / BEGIN-VENDOR / END-VENDOR)
#  Name           : Vendor or Attribute name used inside FreeRADIUS configuration
#  Attribute-ID   : Numeric identifier used inside RADIUS packets
#  Data-Type      : Value format (string, integer, ipaddr, etc.)
#
#  Example Usage in FreeRADIUS authorize file:
#  Wibhu-User-ROLE := "free"
#

#VENDOR          Wibhu                   16901

#BEGIN-VENDOR    Wibhu

# ATTRIBUTE      Attribute-Name             Attribute-ID    Data-Type    # <- Column names do not uncomment this

#ATTRIBUTE       Wibhu-Pankaj-tmp            4               string
#ATTRIBUTE       Wibhu-User-BW-DL            5               integer
#ATTRIBUTE       Wibhu-User-BW-UL            6               integer
#ATTRIBUTE       Wibhu-User-ROLE             7               string


#END-VENDOR      Wibhu

`;

/**
 * List all custom dictionary files in dictionary.d
 */
export async function listDictionaryFiles(): Promise<string[]> {
  try {
    await fs.mkdir(DICTIONARY_DIR, { recursive: true });
    const files = await fs.readdir(DICTIONARY_DIR);

    // Only return files that start with 'dictionary.'
    const dictFiles = files.filter(f => f.startsWith('dictionary.'));

    logger.info(`listDictionaryFiles: found ${dictFiles.length} files`);
    return dictFiles;
  } catch (error: any) {
    logger.error(`Error listing dictionary files: ${error.message}`);
    throw error;
  }
}

/**
 * Validate dictionary name
 * Must start with 'dictionary.' and contain only lowercase letters and numbers (no hyphens, no underscores)
 */
function validateDictionaryName(name: string): { valid: boolean; error?: string } {
  if (!name.startsWith('dictionary.')) {
    return { valid: false, error: 'Dictionary name must start with "dictionary."' };
  }

  const suffix = name.substring(11); // Remove 'dictionary.' prefix

  if (suffix.length === 0) {
    return { valid: false, error: 'Dictionary name must have content after "dictionary."' };
  }

  // ONLY lowercase letters and numbers (no hyphens, no underscores)
  if (!/^[a-z0-9]+$/.test(suffix)) {
    return { valid: false, error: 'Dictionary name can only contain lowercase letters and numbers' };
  }

  if (name.length < 12 || name.length > 64) {
    return { valid: false, error: 'Dictionary name length must be between 12-64 characters' };
  }

  // Reserved names
  const reserved = ['dictionary.freeradius', 'dictionary.rfc2865', 'dictionary.rfc2866'];
  if (reserved.includes(name)) {
    return { valid: false, error: 'Reserved dictionary name' };
  }

  return { valid: true };
}

/**
 * Create custom dictionary file with validation and auto-include
 */
export async function createDictionaryFile(fileName: string): Promise<{ success: boolean; filePath: string }> {
  try {
    logger.info(`createDictionaryFile called: fileName=${fileName}`);

    // Ensure directory exists
    await fs.mkdir(DICTIONARY_DIR, { recursive: true });

    // Convert to lowercase
    const lowerName = fileName.toLowerCase();

    // Validate name
    const validation = validateDictionaryName(lowerName);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // SECURE: Use getSafePath to prevent directory traversal
    const filePath = getSafePath(DICTIONARY_DIR, lowerName);

    // Check if file already exists
    try {
      await fs.access(filePath);
      throw new Error('Dictionary file already exists');
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        throw err;
      }
    }

    // Write template content
    await fs.writeFile(filePath, DICTIONARY_TEMPLATE, 'utf-8');

    // Set ownership and permissions to match directory
    try {
      const dirStats = await fs.stat(DICTIONARY_DIR);
      await fs.chown(filePath, dirStats.uid, dirStats.gid);
      await fs.chmod(filePath, 0o664);
      logger.info(`Dictionary file created: ${filePath} (${dirStats.uid}:${dirStats.gid})`);
    } catch (chownError: any) {
      logger.warn(`Could not set ownership for ${filePath}: ${chownError.message}`);
    }

    // Auto-include in main dictionary
    await addToMainDictionary(lowerName);

    // Validate FreeRADIUS config
    const validationResult = await validateConfiguration(config.freeradius.baseDir);
    if (!validationResult.success) {
      // Rollback: delete file and remove from main dictionary
      await fs.unlink(filePath);
      await removeFromMainDictionary(lowerName);
      throw new Error('Dictionary causes FreeRADIUS config error: ' + validationResult.error);
    }

    return {
      success: true,
      filePath,
    };
  } catch (error: any) {
    logger.error(`Error creating dictionary file: ${error.message}`);
    throw error;
  }
}

/**
 * Add $INCLUDE statement to main dictionary file
 */
async function addToMainDictionary(dictionaryFileName: string): Promise<void> {
  try {
    const includeStatement = `$INCLUDE        ${DICTIONARY_DIR}/${dictionaryFileName}`;

    let content = await fs.readFile(MAIN_DICTIONARY_PATH, 'utf-8');

    // Check if already included
    if (content.includes(includeStatement)) {
      logger.info(`Dictionary ${dictionaryFileName} already included in main dictionary`);
      return;
    }

    // Add include at the end
    content += `\n${includeStatement}\n`;
    await fs.writeFile(MAIN_DICTIONARY_PATH, content, 'utf-8');

    logger.info(`Added ${dictionaryFileName} to main dictionary`);
  } catch (error: any) {
    logger.error(`Error adding to main dictionary: ${error.message}`);
    throw error;
  }
}

/**
 * Remove $INCLUDE statement from main dictionary file
 */
async function removeFromMainDictionary(dictionaryFileName: string): Promise<void> {
  try {
    const includeStatement = `$INCLUDE        ${DICTIONARY_DIR}/${dictionaryFileName}`;

    let content = await fs.readFile(MAIN_DICTIONARY_PATH, 'utf-8');

    // Remove the include line
    const lines = content.split('\n');
    const filteredLines = lines.filter(line => !line.includes(includeStatement));

    await fs.writeFile(MAIN_DICTIONARY_PATH, filteredLines.join('\n'), 'utf-8');

    logger.info(`Removed ${dictionaryFileName} from main dictionary`);
  } catch (error: any) {
    logger.error(`Error removing from main dictionary: ${error.message}`);
    throw error;
  }
}

/**
 * Get dictionary file content
 */
export async function getDictionaryFileContent(fileName: string): Promise<string> {
  try {
    // Validate name
    const validation = validateDictionaryName(fileName);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // SECURE: Use getSafePath to prevent directory traversal
    const filePath = getSafePath(DICTIONARY_DIR, fileName);
    const content = await fs.readFile(filePath, 'utf-8');

    logger.info(`getDictionaryFileContent: fileName=${fileName}, length=${content.length}`);
    return content;
  } catch (error: any) {
    logger.error(`Error reading dictionary file: ${error.message}`);
    throw error;
  }
}

/**
 * Delete dictionary file and remove from main dictionary
 */
export async function deleteDictionaryFile(fileName: string): Promise<void> {
  try {
    // Validate name
    const validation = validateDictionaryName(fileName);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // SECURE: Use getSafePath to prevent directory traversal
    const filePath = getSafePath(DICTIONARY_DIR, fileName);

    // Delete file
    await fs.unlink(filePath);

    // Remove from main dictionary
    await removeFromMainDictionary(fileName);

    logger.info(`Dictionary file deleted: ${filePath}`);
  } catch (error: any) {
    logger.error(`Error deleting dictionary file: ${error.message}`);
    throw error;
  }
}

export default {
  listDictionaryFiles,
  createDictionaryFile,
  getDictionaryFileContent,
  deleteDictionaryFile,
};

