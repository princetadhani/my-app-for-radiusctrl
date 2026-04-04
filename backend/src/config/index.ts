import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  freeradius: {
    baseDir: process.env.FREERADIUS_BASE_DIR || '/etc/freeradius/3.0',
    logFile: process.env.FREERADIUS_LOG_FILE || '/var/log/freeradius/radius.log',
    coaDir: process.env.FREERADIUS_COA_DIR || '/etc/freeradius/3.0/coa',
    serviceName: process.env.FREERADIUS_SERVICE_NAME || 'freeradius',
  },
  websocket: {
    corsOrigin: process.env.WEBSOCKET_CORS_ORIGIN || 'http://localhost:3000',
  },
};

export default config;
