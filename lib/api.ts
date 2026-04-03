// Re-export all functions and types from apiClient
export * from './apiClient';
import type { LogEntry } from './apiClient';

export interface DeployOutput {
  text: string;
  type: 'cmd' | 'info' | 'success' | 'error' | 'final-success' | 'final-error';
  delay: number;
}

export const mockValidationSuccess: DeployOutput[] = [
  { text: "$ freeradius -C -d /tmp/raddb_staging/", type: "cmd", delay: 0 },
  { text: "Loading configuration files...", type: "info", delay: 400 },
  { text: "  including /tmp/raddb_staging/radiusd.conf", type: "info", delay: 600 },
  { text: "  including /tmp/raddb_staging/clients.conf", type: "info", delay: 800 },
  { text: "  including /tmp/raddb_staging/users", type: "info", delay: 1000 },
  { text: "Reading configuration files:", type: "info", delay: 1200 },
  { text: "  Module: eap ........... OK", type: "success", delay: 1800 },
  { text: "  Module: ldap .......... OK", type: "success", delay: 2200 },
  { text: "  Module: sql ........... OK", type: "success", delay: 2600 },
  { text: "Configuration appears to be OK", type: "success", delay: 3000 },
  { text: "$ systemctl reload freeradius", type: "cmd", delay: 3500 },
  { text: "Reloading FreeRADIUS service...", type: "info", delay: 3800 },
  { text: "✓ Deploy complete. Service reloaded successfully.", type: "final-success", delay: 4300 },
];

export const mockValidationError: DeployOutput[] = [
  { text: "$ freeradius -C -d /tmp/raddb_staging/", type: "cmd", delay: 0 },
  { text: "Loading configuration files...", type: "info", delay: 400 },
  { text: "  including /tmp/raddb_staging/radiusd.conf", type: "info", delay: 600 },
  { text: "ERROR: Syntax error in radiusd.conf line 23", type: "error", delay: 1200 },
  { text: "✗ Configuration validation failed. Deploy aborted.", type: "final-error", delay: 1800 },
];

// Mock delay helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function deployConfiguration(): Promise<DeployOutput[]> {
  await delay(100);
  // 90% success rate
  return Math.random() < 0.9 ? mockValidationSuccess : mockValidationError;
}

export function generateMockLogs(): LogEntry[] {
  const levels: LogEntry['level'][] = ['INFO', 'DEBUG', 'WARN', 'ERROR'];
  const messages = [
    'FreeRADIUS server ready to process requests',
    'Loading virtual server default',
    'Listening on authentication address * port 1812',
    'Received Access-Request from 192.168.1.100',
    'Sending Access-Accept',
    'EAP module loaded successfully',
    'SQL connection pool initialized',
    'LDAP bind successful',
    'Client authentication succeeded for user: john',
    'Packet processing complete',
  ];

  const logs: LogEntry[] = [];
  const now = new Date();

  for (let i = 0; i < 50; i++) {
    const timestamp = new Date(now.getTime() - (50 - i) * 1000);
    logs.push({
      timestamp: timestamp.toISOString().replace('T', ' ').split('.')[0],
      level: levels[Math.floor(Math.random() * levels.length)],
      message: messages[Math.floor(Math.random() * messages.length)],
    });
  }

  return logs;
}

