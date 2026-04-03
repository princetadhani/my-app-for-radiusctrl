'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Trash2, Download, FileText, Activity, PanelLeftClose, PanelLeft } from 'lucide-react';
import { StatusHeader } from '@/components/status-header';
import { Button } from '@/components/ui/button';
import { generateMockLogs, type LogEntry } from '@/lib/api';

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isStreaming, setIsStreaming] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isConsoleOpen, setIsConsoleOpen] = useState(true);
  const consoleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial load
    setLogs(generateMockLogs());

    // Auto-add new logs if streaming
    const interval = setInterval(() => {
      if (isStreaming) {
        const newLog: LogEntry = {
          timestamp: new Date().toISOString().replace('T', ' ').split('.')[0],
          level: ['INFO', 'DEBUG', 'WARN', 'ERROR'][Math.floor(Math.random() * 4)] as LogEntry['level'],
          message: [
            'Processing authentication request',
            'EAP session established',
            'SQL query executed successfully',
            'LDAP bind completed',
            'Access-Accept sent to client',
            'Packet received from NAS',
          ][Math.floor(Math.random() * 6)],
        };
        setLogs(prev => [...prev, newLog]);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isStreaming]);

  useEffect(() => {
    // Auto-scroll to bottom
    if (consoleRef.current && isStreaming) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [logs, isStreaming]);

  const handleClear = () => {
    setLogs([]);
  };

  const handleDownload = () => {
    const logText = logs
      .map(log => `${log.timestamp} [${log.level}] ${log.message}`)
      .join('\n');
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `radius-logs-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getLevelClass = (level: LogEntry['level']) => {
    switch (level) {
      case 'INFO':
        return 'text-neon-blue';
      case 'DEBUG':
        return 'text-muted-foreground';
      case 'WARN':
        return 'text-neon-amber';
      case 'ERROR':
        return 'text-neon-red';
      default:
        return 'text-foreground';
    }
  };

  const getLevelCount = (level: LogEntry['level']) => {
    return logs.filter(log => log.level === level).length;
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <StatusHeader currentFile="logs/radius.log" />

      {/* Main Content - 3 Panel IDE Layout */}
      <div className="flex-1 flex pt-12 overflow-hidden">
        {/* Sidebar - Log Info */}
        <motion.div
          initial={{ x: -280, opacity: 0 }}
          animate={{
            x: 0,
            opacity: 1,
            width: isSidebarCollapsed ? 48 : 256
          }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="h-full glass-panel border-r border-border overflow-hidden"
        >
          {/* Toggle Button */}
          <div className="h-12 border-b border-border flex items-center justify-between px-2">
            {!isSidebarCollapsed && (
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                Log Info
              </h3>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="h-8 w-8 hover:bg-secondary"
              title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isSidebarCollapsed ? (
                <PanelLeft className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Sidebar Content */}
          <AnimatePresence>
            {!isSidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="p-4 space-y-6 overflow-y-auto"
                style={{ height: 'calc(100% - 48px)' }}
              >
                {/* Stream Status */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Status
                  </h4>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-neon-green animate-pulse-green' : 'bg-muted'}`} />
                    <span className="text-sm">{isStreaming ? 'Streaming' : 'Paused'}</span>
                  </div>
                </div>

                {/* Log Statistics */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Statistics
                  </h4>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Total Entries</span>
                      <span className="font-mono font-medium">{logs.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-neon-blue" />
                        INFO
                      </span>
                      <span className="font-mono font-medium">{getLevelCount('INFO')}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-muted" />
                        DEBUG
                      </span>
                      <span className="font-mono font-medium">{getLevelCount('DEBUG')}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-neon-amber" />
                        WARN
                      </span>
                      <span className="font-mono font-medium">{getLevelCount('WARN')}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-neon-red" />
                        ERROR
                      </span>
                      <span className="font-mono font-medium">{getLevelCount('ERROR')}</span>
                    </div>
                  </div>
                </div>

                {/* Log File Info */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    File
                  </h4>
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-primary mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-mono text-foreground truncate">radius.log</div>
                      <div className="text-[10px] text-muted-foreground">/var/log/radius/</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Center Panel - Log Viewer */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden bg-card">
            {/* Toolbar */}
            <div className="h-10 border-b border-border flex items-center justify-between px-4 bg-secondary/30">
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono text-foreground">Log Viewer</span>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Activity className="w-3 h-3" />
                  <span>{logs.length} lines</span>
                </div>
              </div>
            </div>

            {/* Log Content */}
            <div
              ref={consoleRef}
              className="h-[calc(100%-40px)] p-4 font-mono text-xs overflow-y-auto"
            >
              {logs.length === 0 ? (
                <div className="text-muted-foreground">No logs available</div>
              ) : (
                logs.map((log, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.15 }}
                    className="mb-1 flex items-start gap-2"
                  >
                    <span className="text-muted-foreground/50 select-none w-10 text-right">{index + 1}</span>
                    <span className="text-muted-foreground">{log.timestamp}</span>
                    {' '}
                    <span className={`font-semibold ${getLevelClass(log.level)}`}>
                      [{log.level}]
                    </span>
                    {' '}
                    <span className="text-foreground">{log.message}</span>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Bottom Console - Controls */}
          <div className="relative">
            <div className="h-10 border-t border-border glass-panel flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsStreaming(!isStreaming)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded bg-secondary hover:bg-secondary/80 text-xs transition-colors"
                >
                  {isStreaming ? (
                    <>
                      <Pause className="w-3 h-3" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3" />
                      <span>Stream</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleClear}
                  className="flex items-center gap-2 px-3 py-1.5 rounded bg-secondary hover:bg-secondary/80 text-xs transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-3 py-1.5 rounded bg-secondary hover:bg-secondary/80 text-xs transition-colors"
                >
                  <Download className="w-3 h-3" />
                  <span>Download</span>
                </button>
              </div>
              <div className="text-xs text-muted-foreground">
                FreeRADIUS Log Stream
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

