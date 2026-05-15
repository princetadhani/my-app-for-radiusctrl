import type { FileNode } from './api';

/**
 * ========================================
 * FILE TREE SIDEBAR ALLOWLIST CONFIGURATION
 * ========================================
 *
 * This configuration controls which files and directories appear in the
 * file tree sidebar for the FreeRADIUS 3.0 configuration.
 *
 * IMPORTANT:
 * - This ONLY affects the file tree sidebar visibility
 * - The Command Palette (Cmd/Ctrl + K) shows ALL files regardless of this list
 * - All files remain accessible via Command Palette or direct URL
 *
 * TO ADD MORE FILES/DIRECTORIES:
 * Simply add the name to the appropriate array below and the sidebar will update automatically.
 */
export const FILE_TREE_ALLOWLIST = {
  /**
   * Allowed directory names at the root level of 3.0/
   * Only these directories will be visible in the file tree sidebar.
   * All contents within these directories will be shown (nested filtering not applied).
   */
  directories: [
    'mods-available',
    'mods-config',
    'mods-enabled',
    'sites-available',
    'sites-enabled',
    'dictionary.d',
    'users.d',
  ] as const,

  /**
   * Allowed file names at the root level of 3.0/
   * Only these files will be visible in the file tree sidebar.
   */
  files: [
    'clients.conf',
    'dictionary',
    'radiusd.conf',
    'users',
  ] as const,
};

/**
 * Filter file tree nodes based on the allowlist configuration
 *
 * This function recursively filters the file tree to show only allowed
 * directories and files at the root level (3.0/), while preserving
 * all children within allowed directories.
 *
 * The order of items in the sidebar follows the order defined in the allowlist.
 *
 * @param nodes - The file tree nodes to filter
 * @param isRootLevel - Whether we're at the root level (3.0/)
 * @returns Filtered file tree nodes
 */
export function filterFileTreeForSidebar(
  nodes: FileNode[],
  isRootLevel: boolean = true
): FileNode[] {
  if (!isRootLevel) {
    // Not at root level - include all nodes and their children
    return nodes.map(node => ({
      ...node,
      children: node.children ? filterFileTreeForSidebar(node.children, false) : undefined,
    }));
  }

  // At root level - filter based on allowlist
  const filtered = nodes
    .filter(node => {
      if (node.type === 'directory') {
        return FILE_TREE_ALLOWLIST.directories.includes(node.name as any);
      } else {
        return FILE_TREE_ALLOWLIST.files.includes(node.name as any);
      }
    })
    .map(node => ({
      ...node,
      // For allowed directories, include all their children without filtering
      children: node.children ? filterFileTreeForSidebar(node.children, false) : undefined,
    }));

  // Sort according to the order in the allowlist
  // Directories first (in allowlist order), then files (in allowlist order)
  return filtered.sort((a, b) => {
    if (a.type === 'directory' && b.type === 'directory') {
      const indexA = FILE_TREE_ALLOWLIST.directories.indexOf(a.name as any);
      const indexB = FILE_TREE_ALLOWLIST.directories.indexOf(b.name as any);
      return indexA - indexB;
    } else if (a.type === 'file' && b.type === 'file') {
      const indexA = FILE_TREE_ALLOWLIST.files.indexOf(a.name as any);
      const indexB = FILE_TREE_ALLOWLIST.files.indexOf(b.name as any);
      return indexA - indexB;
    } else {
      // Directories before files
      return a.type === 'directory' ? -1 : 1;
    }
  });
}

/**
 * Helper function to check if a path should be visible in the sidebar
 * Useful for validating file selections or actions
 * 
 * @param path - The file path to check
 * @returns true if the path is allowed in the sidebar, false otherwise
 */
export function isPathAllowedInSidebar(path: string): boolean {
  const segments = path.split('/');

  // Find the 3.0 directory index
  const rootIndex = segments.findIndex(seg => seg === '3.0');
  if (rootIndex === -1) return true; // Not in 3.0 directory, allow it

  // Check the item directly under 3.0/
  const itemUnder30 = segments[rootIndex + 1];
  if (!itemUnder30) return true; // Root of 3.0

  // Check if it's an allowed directory or file
  const isAllowedDir = FILE_TREE_ALLOWLIST.directories.includes(itemUnder30 as any);
  const isAllowedFile = FILE_TREE_ALLOWLIST.files.includes(itemUnder30 as any);

  return isAllowedDir || isAllowedFile;
}
