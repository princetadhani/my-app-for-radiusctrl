import chokidar from 'chokidar';
import { Server } from 'socket.io';
import config from '../config';
import logger from '../utils/logger';

let watcher: chokidar.FSWatcher | null = null;

/**
 * Initialize file watcher with inotify-like behavior
 * Watches FreeRADIUS config directory and sends WebSocket notifications
 * when files are modified via SSH or external editors
 */
export function initializeFileWatcher(io: Server): void {
  if (watcher) {
    logger.warn('File watcher already initialized');
    return;
  }

  const watchPath = config.freeradius.baseDir;

  logger.info(`Initializing file watcher for: ${watchPath}`);

  watcher = chokidar.watch(watchPath, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 500,
      pollInterval: 100,
    },
    depth: 10,
  });

  watcher
    .on('change', (filePath) => {
      logger.info(`File changed externally: ${filePath}`);
      
      io.emit('file:changed', {
        path: filePath,
        timestamp: Date.now(),
        message: `File '${filePath}' was modified externally (possibly via SSH)`,
      });
    })
    .on('add', (filePath) => {
      logger.info(`File added: ${filePath}`);
      
      io.emit('file:added', {
        path: filePath,
        timestamp: Date.now(),
        message: `New file '${filePath}' was created`,
      });
    })
    .on('unlink', (filePath) => {
      logger.info(`File deleted: ${filePath}`);
      
      io.emit('file:deleted', {
        path: filePath,
        timestamp: Date.now(),
        message: `File '${filePath}' was deleted`,
      });
    })
    .on('error', (error) => {
      logger.error(`File watcher error: ${error.message}`);
    })
    .on('ready', () => {
      logger.info('File watcher ready and monitoring changes');
    });
}

/**
 * Stop file watcher
 */
export async function stopFileWatcher(): Promise<void> {
  if (watcher) {
    await watcher.close();
    watcher = null;
    logger.info('File watcher stopped');
  }
}

export default {
  initializeFileWatcher,
  stopFileWatcher,
};
