import { exec } from 'child_process';
import { promisify } from 'util';
import config from '../config';
import logger from '../utils/logger';

const execAsync = promisify(exec);

export interface ServiceStatus {
  status: 'running' | 'stopped' | 'unknown';
  active: boolean;
  uptime?: number;
  pid?: number;
  memory?: number;
  description?: string;
}

/**
 * Get FreeRADIUS service status using systemctl
 */
export async function getServiceStatus(): Promise<ServiceStatus> {
  try {
    // Use sudo systemctl (configured in sudoers for passwordless access)
    const { stdout } = await execAsync(
      `sudo systemctl show ${config.freeradius.serviceName} --no-page`,
      { timeout: 5000 }
    );

    const lines = stdout.split('\n');
    const props: Record<string, string> = {};

    lines.forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        props[key.trim()] = valueParts.join('=').trim();
      }
    });

    const activeState = props['ActiveState'] || 'unknown';
    const subState = props['SubState'] || '';
    const mainPID = parseInt(props['MainPID'] || '0', 10);
    const memoryUsage = parseInt(props['MemoryCurrent'] || '0', 10);
    const execMainStartTimestamp = parseInt(props['ExecMainStartTimestamp'] || '0', 10);

    let status: 'running' | 'stopped' | 'unknown' = 'unknown';
    if (activeState === 'active' && subState === 'running') {
      status = 'running';
    } else if (activeState === 'inactive' || activeState === 'failed') {
      status = 'stopped';
    }

    const uptime = execMainStartTimestamp > 0
      ? Math.floor((Date.now() * 1000 - execMainStartTimestamp) / 1000000)
      : undefined;

    return {
      status,
      active: activeState === 'active',
      uptime,
      pid: mainPID > 0 ? mainPID : undefined,
      memory: memoryUsage > 0 ? memoryUsage : undefined,
      description: props['Description'],
    };
  } catch (error: any) {
    logger.error(`Error getting service status: ${error.message}`);
    return {
      status: 'unknown',
      active: false,
    };
  }
}

/**
 * Reload FreeRADIUS service
 */
export async function reloadService(): Promise<{ success: boolean; message: string }> {
  try {
    logger.info('Reloading FreeRADIUS service...');
    const { stdout, stderr } = await execAsync(
      `sudo systemctl reload ${config.freeradius.serviceName}`,
      { timeout: 10000 }
    );

    logger.info('Service reload completed');

    return {
      success: true,
      message: 'Service reloaded successfully',
    };
  } catch (error: any) {
    logger.error(`Service reload error: ${error.message}`);
    return {
      success: false,
      message: error.message,
    };
  }
}

/**
 * Restart FreeRADIUS service
 */
export async function restartService(): Promise<{ success: boolean; message: string }> {
  try {
    logger.info('Restarting FreeRADIUS service...');
    const { stdout, stderr } = await execAsync(
      `sudo systemctl restart ${config.freeradius.serviceName}`,
      { timeout: 30000 }
    );

    logger.info('Service restart completed');

    return {
      success: true,
      message: 'Service restarted successfully',
    };
  } catch (error: any) {
    logger.error(`Service restart error: ${error.message}`);
    return {
      success: false,
      message: error.message,
    };
  }
}

export default {
  getServiceStatus,
  reloadService,
  restartService,
};
