import config from '../config';
import logger from '../utils/logger';
import { systemctl, execOnHost } from '../utils/hostCommand';

export interface ServiceStatus {
  status: 'running' | 'stopped' | 'unknown';
  active: boolean;
  uptime?: number;
  pid?: number;
  memory?: number;
  description?: string;
}

export interface DashboardDataDump extends ServiceStatus {
  interfaces: string[];
}

/**
 * Get network interfaces (IPv4 only, excluding Docker/bridge interfaces)
 * Command: ip -4 -o addr show scope global 2>/dev/null | grep -Ev '\s(docker[0-9]*|br-[a-f0-9]+|virbr[0-9]*)\s' | awk '{print $4}' | cut -d/ -f1
 * Returns empty array on error or timeout (5 seconds)
 */
export async function getNetworkInterfaces(): Promise<string[]> {
  try {
    const command = `ip -4 -o addr show scope global 2>/dev/null | grep -Ev '\\s(docker[0-9]*|br-[a-f0-9]+|virbr[0-9]*)\\s' | awk '{print $4}' | cut -d/ -f1`;

    const { stdout } = await execOnHost(command, { timeout: 5000 });

    // Parse output: split by newlines, trim, filter empty strings
    const interfaces = stdout
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);

    return interfaces;
  } catch (error: any) {
    logger.error(`Error getting network interfaces: ${error.message}`);
    return [];
  }
}

/**
 * Get FreeRADIUS service status using systemctl
 */
export async function getServiceStatus(): Promise<ServiceStatus> {
  try {
    // Use systemctl via host command utility (works in Docker with --pid=host)
    const { stdout } = await systemctl(
      `show ${config.freeradius.serviceName} --no-page`,
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
    const { stdout, stderr } = await systemctl(
      `reload ${config.freeradius.serviceName}`,
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
    const { stdout, stderr } = await systemctl(
      `restart ${config.freeradius.serviceName}`,
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

/**
 * Get dashboard data dump (service status + network interfaces)
 * Runs both queries in parallel for better performance
 */
export async function getDashboardDataDump(): Promise<DashboardDataDump> {
  try {
    // Run both queries in parallel
    const [status, interfaces] = await Promise.all([
      getServiceStatus(),
      getNetworkInterfaces(),
    ]);

    return {
      ...status,
      interfaces,
    };
  } catch (error: any) {
    logger.error(`Error getting dashboard data dump: ${error.message}`);
    // Return minimal data on error
    return {
      status: 'unknown',
      active: false,
      interfaces: [],
    };
  }
}

export default {
  getServiceStatus,
  reloadService,
  restartService,
  getNetworkInterfaces,
  getDashboardDataDump,
};
