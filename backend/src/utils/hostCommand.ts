/**
 * Host Command Utility
 * 
 * Executes commands on the host system from within a Docker container
 * Uses nsenter to access the host's PID namespace
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import logger from './logger';

const execAsync = promisify(exec);

/**
 * Check if running inside Docker container
 */
function isInsideDocker(): boolean {
  try {
    // Check for .dockerenv file or cgroup
    const fs = require('fs');
    return fs.existsSync('/.dockerenv') ||
      fs.readFileSync('/proc/1/cgroup', 'utf8').includes('docker');
  } catch {
    return false;
  }
}

/**
 * Execute command on host system
 * If inside Docker with --pid=host, use nsenter to access host's namespace
 * Otherwise, execute command directly
 */
export async function execOnHost(command: string, options: any = {}): Promise<{ stdout: string; stderr: string }> {
  const inDocker = isInsideDocker();

  let finalCommand: string;

  if (inDocker) {
    // Inside Docker with --pid=host
    // Use nsenter to enter host's namespaces and execute command
    // PID 1 on host is the init process (systemd)
    finalCommand = `nsenter --target 1 --mount --uts --ipc --net --pid -- ${command}`;
    logger.info(`Executing on host via nsenter: ${command}`);
  } else {
    // Running directly on host
    finalCommand = command;
    logger.info(`Executing directly: ${command}`);
  }

  const result = await execAsync(finalCommand, options);
  return {
    stdout: result.stdout.toString(),
    stderr: result.stderr.toString(),
  };
}

/**
 * Execute systemctl command on host
 */
export async function systemctl(args: string, options: any = {}): Promise<{ stdout: string; stderr: string }> {
  const command = `sudo systemctl ${args}`;
  return await execOnHost(command, options);
}

/**
 * Execute freeradius command on host
 */
export async function freeradius(args: string, options: any = {}): Promise<{ stdout: string; stderr: string }> {
  const command = `sudo freeradius ${args}`;
  return await execOnHost(command, options);
}

/**
 * Execute radclient command on host
 */
export async function radclient(args: string, options: any = {}): Promise<{ stdout: string; stderr: string }> {
  const command = `sudo radclient ${args}`;
  return await execOnHost(command, options);
}

export default {
  execOnHost,
  systemctl,
  freeradius,
  radclient,
};
