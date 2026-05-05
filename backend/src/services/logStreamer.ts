import fs from 'fs';
import { Server } from 'socket.io';
import config from '../config';
import logger from '../utils/logger';

let logTail: any | null = null;

export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'DEBUG' | 'WARN' | 'ERROR';
  message: string;
}

/**
 * Parse log line to extract timestamp, level, and message
 */
function parseLogLine(line: string): LogEntry | null {
  // FreeRADIUS log format: Mon Jan 1 12:00:00 2024 : Info: Message here
  const regex = /^([A-Za-z]{3}\s+[A-Za-z]{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}\s+\d{4})\s*:\s*([^:]+):\s*(.+)$/;
  const match = line.match(regex);

  if (match) {
    const [, timestamp, levelStr, message] = match;

    let level: LogEntry['level'] = 'INFO';
    const levelLower = levelStr.trim().toLowerCase();

    if (levelLower.includes('error')) level = 'ERROR';
    else if (levelLower.includes('warn')) level = 'WARN';
    else if (levelLower.includes('debug')) level = 'DEBUG';
    else level = 'INFO';

    return {
      timestamp,
      level,
      message: message.trim(),
    };
  }

  // Fallback for non-standard format
  return {
    timestamp: new Date().toISOString().replace('T', ' ').split('.')[0],
    level: 'INFO',
    message: line,
  };
}

/**
 * Initialize log streamer with tail functionality
 * Watches log file and streams new entries via WebSocket
 */
export function initializeLogStreamer(io: Server): void {
  if (logTail) {
    logger.warn('Log streamer already initialized');
    return;
  }

  const logFile = config.freeradius.logFile;

  logger.info(`Initializing log streamer for: ${logFile}`);

  try {
    // Check if log file exists
    if (!fs.existsSync(logFile)) {
      logger.warn(`Log file does not exist: ${logFile}`);
      return;
    }

    // Import tail dynamically to avoid issues if not installed
    const Tail = require('tail').Tail;

    logTail = new Tail(logFile, {
      fromBeginning: false,
      follow: true,
      useWatchFile: true,
    });

    logTail.on('line', (line: string) => {
      const logEntry = parseLogLine(line);

      if (logEntry) {
        io.emit('log:newEntry', logEntry);
      }
    });

    logTail.on('error', (error: Error) => {
      logger.error(`Log tail error: ${error.message}`);
    });

    logger.info('Log streamer initialized successfully');
  } catch (error: any) {
    logger.error(`Failed to initialize log streamer: ${error.message}`);
  }
}

/**
 * Stop log streamer
 */
export function stopLogStreamer(): void {
  if (logTail) {
    logTail.unwatch();
    logTail = null;
    logger.info('Log streamer stopped');
  }
}

/**
 * Read entire log file or last N lines
 */
export async function readLogFile(lines?: number): Promise<LogEntry[]> {
  const logFile = config.freeradius.logFile;

  return new Promise((resolve, reject) => {
    try {
      const content = fs.readFileSync(logFile, 'utf-8');
      const allLines = content.split('\n').filter(line => line.trim());

      let selectedLines = allLines;
      if (lines && lines > 0) {
        selectedLines = allLines.slice(-lines);
      }

      const logEntries = selectedLines
        .map(parseLogLine)
        .filter((entry): entry is LogEntry => entry !== null);

      resolve(logEntries);
    } catch (error: any) {
      logger.error(`Error reading log file: ${error.message}`);
      reject(error);
    }
  });
}

export default {
  initializeLogStreamer,
  stopLogStreamer,
  readLogFile,
};
