'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Trash2, Download, FileText, Activity, PanelLeftClose, PanelLeft, ArrowDown, Search, X, RotateCcw, ChevronUp, ChevronDown } from 'lucide-react';
import { StatusHeader } from '@/components/status-header';
import { Button } from '@/components/ui/button';
import { readLogs, getSocket, type LogEntry } from '@/lib/api';
import { customToast } from '@/lib/custom-toast';

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const consoleRef = useRef<HTMLDivElement>(null);

  // Ensure component is mounted before rendering interactive elements
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load initial logs and scroll to bottom
  useEffect(() => {
    const loadLogs = async () => {
      try {
        const initialLogs = await readLogs(100);
        setLogs(initialLogs);
        // Scroll to bottom after logs are loaded
        setTimeout(() => {
          if (consoleRef.current) {
            consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
          }
        }, 100);
      } catch (error) {
        console.error('Error loading logs:', error);
        customToast.error('Failed to load logs');
      }
    };

    loadLogs();
  }, []);

  // Setup WebSocket listener for live log streaming
  useEffect(() => {
    const socket = getSocket();

    socket.on('log:newEntry', (logEntry: LogEntry) => {
      if (isStreaming) {
        setLogs(prev => [...prev, logEntry]);
      }
    });

    return () => {
      socket.off('log:newEntry');
    };
  }, [isStreaming]);

  // Auto-scroll to bottom when streaming
  useEffect(() => {
    if (consoleRef.current && isStreaming) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [logs, isStreaming]);

  // Detect scroll position to show/hide "Jump to Bottom" button
  useEffect(() => {
    const handleScroll = () => {
      if (consoleRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = consoleRef.current;
        // Show button if user is scrolled up more than 100px from bottom
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        setShowScrollToBottom(!isNearBottom);
      }
    };

    const consoleElement = consoleRef.current;
    if (consoleElement) {
      consoleElement.addEventListener('scroll', handleScroll);
      return () => consoleElement.removeEventListener('scroll', handleScroll);
    }
  }, []);

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

  const scrollToBottom = () => {
    if (consoleRef.current) {
      consoleRef.current.scrollTo({
        top: consoleRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      setLogs([]);
      const freshLogs = await readLogs(100);
      setLogs(freshLogs);
      customToast.success('Logs refreshed successfully');

      // Scroll to bottom after refresh
      setTimeout(() => {
        if (consoleRef.current) {
          consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
        }
      }, 100);
    } catch (error) {
      console.error('Error refreshing logs:', error);
      customToast.error('Failed to refresh logs');
    } finally {
      setIsRefreshing(false);
    }
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

  // Filter logs based on search query with useMemo for performance
  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) {
      return logs;
    }

    const query = searchQuery.toLowerCase();
    return logs.filter(log => {
      const fullText = `${log.timestamp} [${log.level}] ${log.message}`.toLowerCase();
      return fullText.includes(query);
    });
  }, [logs, searchQuery]);

  // Get all match positions in filtered logs
  const matchPositions = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const positions: Array<{ logIndex: number; matchNumber: number; charIndex: number }> = [];
    const query = searchQuery.toLowerCase();

    filteredLogs.forEach((log, logIndex) => {
      const fullText = `${log.timestamp} [${log.level}] ${log.message}`.toLowerCase();
      let startIndex = 0;
      let matchNumber = 0;
      let charIndex = fullText.indexOf(query, startIndex);

      while (charIndex !== -1) {
        positions.push({ logIndex, matchNumber, charIndex });
        matchNumber++;
        startIndex = charIndex + query.length;
        charIndex = fullText.indexOf(query, startIndex);
      }
    });

    return positions;
  }, [filteredLogs, searchQuery]);

  // Highlight matching text with different colors for current vs other matches
  const highlightText = (text: string, globalMatchesInText: number[]) => {
    if (!searchQuery.trim() || !text) return text;

    const query = searchQuery.toLowerCase();
    const lowerText = text.toLowerCase();
    const parts: Array<{ text: string; isCurrent: boolean; isMatch: boolean }> = [];

    let lastIndex = 0;
    let matchNumber = 0;

    let index = lowerText.indexOf(query);
    while (index !== -1) {
      // Add non-matching text before this match
      if (index > lastIndex) {
        parts.push({
          text: text.substring(lastIndex, index),
          isCurrent: false,
          isMatch: false
        });
      }

      // Check if this match is the current one
      const isCurrent = globalMatchesInText[matchNumber] === currentMatchIndex;

      // Add the matching text
      parts.push({
        text: text.substring(index, index + query.length),
        isCurrent,
        isMatch: true
      });

      lastIndex = index + query.length;
      matchNumber++;
      index = lowerText.indexOf(query, lastIndex);
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({
        text: text.substring(lastIndex),
        isCurrent: false,
        isMatch: false
      });
    }

    return (
      <>
        {parts.map((part, i) => {
          if (!part.isMatch) return <span key={i}>{part.text}</span>;

          if (part.isCurrent) {
            // Current match - BRIGHT ORANGE highlighting with high contrast
            return (
              <span
                key={i}
                style={{
                  backgroundColor: '#ff6600',
                  color: '#000000',
                  fontWeight: '800',
                  padding: '3px 6px',
                  borderRadius: '4px',
                  boxShadow: '0 0 12px rgba(255, 102, 0, 0.8), 0 0 24px rgba(255, 102, 0, 0.4)',
                  border: '1px solid #ff8800',
                  display: 'inline-block'
                }}
              >
                {part.text}
              </span>
            );
          } else {
            // Other matches - subtle gold highlighting
            return (
              <span
                key={i}
                style={{
                  backgroundColor: 'rgba(255, 215, 0, 0.3)',
                  color: '#ffd700',
                  padding: '2px 4px',
                  borderRadius: '3px',
                  fontWeight: '500'
                }}
              >
                {part.text}
              </span>
            );
          }
        })}
      </>
    );
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setCurrentMatchIndex(0);
  };

  const handleNextMatch = () => {
    if (matchPositions.length === 0) return;
    setCurrentMatchIndex((prev) => (prev + 1) % matchPositions.length);
  };

  const handlePreviousMatch = () => {
    if (matchPositions.length === 0) return;
    setCurrentMatchIndex((prev) => (prev - 1 + matchPositions.length) % matchPositions.length);
  };

  // Auto-scroll to current match
  useEffect(() => {
    if (matchPositions.length === 0 || !consoleRef.current) return;

    // Find the log element for the current match
    const currentMatch = matchPositions[currentMatchIndex];
    if (!currentMatch) return;

    // Scroll to the log line containing the current match
    // Using a timeout to ensure DOM is updated
    setTimeout(() => {
      if (consoleRef.current) {
        const logElements = consoleRef.current.querySelectorAll('.log-line');
        const targetElement = logElements[currentMatch.logIndex] as HTMLElement;

        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }
    }, 100);
  }, [currentMatchIndex, matchPositions]);

  const getLevelCount = (level: LogEntry['level']) => {
    return filteredLogs.filter(log => log.level === level).length;
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
                    Statistics {searchQuery && <span className="text-amber-500">(Filtered)</span>}
                  </h4>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {searchQuery ? 'Showing' : 'Total Entries'}
                      </span>
                      <span className="font-mono font-medium">
                        {searchQuery ? `${filteredLogs.length} / ${logs.length}` : logs.length}
                      </span>
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
                  <span>{filteredLogs.length} / {logs.length} lines</span>
                </div>
                {searchQuery && matchPositions.length > 0 && (
                  <motion.div
                    className="flex items-center gap-1.5 text-xs"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <span className="text-orange-500 font-semibold">
                      {currentMatchIndex + 1} / {matchPositions.length}
                    </span>
                    <span className="text-muted-foreground">
                      {matchPositions.length === 1 ? 'match' : 'matches'}
                    </span>
                  </motion.div>
                )}
              </div>

              {/* Search and Controls */}
              <div className="flex items-center gap-2">
                {/* Search Bar */}
                <motion.div
                  className="relative"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentMatchIndex(0);
                    }}
                    placeholder="Search logs..."
                    className="w-56 pl-8 pr-8 py-1.5 rounded-lg text-xs bg-secondary/50 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                    style={{
                      fontFamily: 'var(--font-jetbrains-mono), monospace',
                    }}
                  />
                  {searchQuery && (
                    <motion.button
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      onClick={handleClearSearch}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      title="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </motion.button>
                  )}
                </motion.div>

                {/* Match Navigation Buttons */}
                {searchQuery && matchPositions.length > 0 && (
                  <motion.div
                    className="flex items-center border border-border rounded overflow-hidden"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.button
                      onClick={handlePreviousMatch}
                      whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                      whileTap={{ scale: 0.95 }}
                      className="p-1 text-muted-foreground hover:text-foreground transition-colors border-r border-border"
                      title={`Previous match (${currentMatchIndex} / ${matchPositions.length})`}
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </motion.button>
                    <motion.button
                      onClick={handleNextMatch}
                      whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                      whileTap={{ scale: 0.95 }}
                      className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                      title={`Next match (${currentMatchIndex + 2} / ${matchPositions.length})`}
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </motion.button>
                  </motion.div>
                )}

                {/* Refresh Button */}
                {isMounted && (
                  <motion.button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`p-1.5 rounded hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-all ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    title="Refresh logs"
                  >
                    <RotateCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </motion.button>
                )}
              </div>
            </div>

            {/* Log Content */}
            <div
              ref={consoleRef}
              className="h-[calc(100%-40px)] p-4 font-mono text-xs overflow-y-auto"
            >
              {logs.length === 0 ? (
                <div className="text-muted-foreground">No logs available</div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-muted-foreground">
                  No logs match search: <span className="text-amber-500 font-medium">{searchQuery}</span>
                </div>
              ) : (
                filteredLogs.map((log, logIndex) => {
                  // Get all global match indices for this log
                  const matchesInThisLog = matchPositions
                    .map((pos, globalIdx) => pos.logIndex === logIndex ? globalIdx : -1)
                    .filter(idx => idx !== -1);

                  return (
                    <motion.div
                      key={logIndex}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.15 }}
                      className="mb-1 flex items-start gap-2 log-line"
                    >
                      <span className="text-muted-foreground/50 select-none w-10 text-right">{logIndex + 1}</span>
                      <span className="text-muted-foreground">{highlightText(log.timestamp, matchesInThisLog)}</span>
                      {' '}
                      <span className={`font-semibold ${getLevelClass(log.level)}`}>
                        [{highlightText(log.level, matchesInThisLog)}]
                      </span>
                      {' '}
                      <span className="text-foreground">{highlightText(log.message, matchesInThisLog)}</span>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Floating "Jump to Bottom" Button */}
            <AnimatePresence>
              {showScrollToBottom && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  onClick={scrollToBottom}
                  className="absolute bottom-16 right-6 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all shadow-lg z-10 group"
                  style={{
                    background: 'linear-gradient(135deg, rgba(122, 162, 247, 0.9), rgba(187, 154, 247, 0.9))',
                    border: '1px solid rgba(122, 162, 247, 0.5)',
                    color: '#ffffff',
                    boxShadow: '0 4px 12px rgba(122, 162, 247, 0.4)',
                  }}
                  title="Jump to bottom"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                  <span>Bottom</span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Console - Controls */}
          <div className="relative">
            <div className="flex items-center justify-between px-4 py-2 bg-card/50 border-b border-border">
              <div className="flex items-center gap-3">
                {/* Stream/Pause Button */}
                <button
                  onClick={() => setIsStreaming(!isStreaming)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all relative overflow-hidden group"
                  style={{
                    background: isStreaming
                      ? 'linear-gradient(135deg, rgba(158, 206, 106, 0.2), rgba(158, 206, 106, 0.15))'
                      : 'linear-gradient(135deg, rgba(122, 162, 247, 0.15), rgba(187, 154, 247, 0.15))',
                    border: isStreaming
                      ? '1px solid rgba(158, 206, 106, 0.4)'
                      : '1px solid rgba(122, 162, 247, 0.3)',
                    color: isStreaming ? '#9ece6a' : '#7aa2f7',
                    boxShadow: isStreaming ? '0 0 12px rgba(158, 206, 106, 0.3)' : 'none',
                  }}
                >
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  {isStreaming ? (
                    <>
                      <Pause className="w-3.5 h-3.5 relative z-10" />
                      <span className="relative z-10">Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 relative z-10" />
                      <span className="relative z-10">Stream</span>
                    </>
                  )}
                </button>

                {/* Clear Button */}
                {isMounted && (
                  <button
                    onClick={handleClear}
                    disabled={logs.length === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all relative overflow-hidden group disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: logs.length > 0 ? 'rgba(237, 135, 150, 0.15)' : 'rgba(139, 148, 158, 0.1)',
                      border: logs.length > 0 ? '1px solid rgba(237, 135, 150, 0.3)' : '1px solid rgba(139, 148, 158, 0.2)',
                      color: logs.length > 0 ? '#ed8796' : '#8b949e',
                    }}
                  >
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <Trash2 className="w-3.5 h-3.5 relative z-10" />
                    <span className="relative z-10">Clear</span>
                  </button>
                )}

                {/* Download Button */}
                {isMounted && (
                  <button
                    onClick={handleDownload}
                    disabled={logs.length === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all relative overflow-hidden group disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: logs.length > 0
                        ? 'linear-gradient(135deg, rgba(122, 162, 247, 0.15), rgba(187, 154, 247, 0.15))'
                        : 'rgba(139, 148, 158, 0.1)',
                      border: logs.length > 0
                        ? '1px solid rgba(122, 162, 247, 0.3)'
                        : '1px solid rgba(139, 148, 158, 0.2)',
                      color: logs.length > 0 ? '#7aa2f7' : '#8b949e',
                    }}
                  >
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <Download className="w-3.5 h-3.5 relative z-10" />
                    <span className="relative z-10">Download</span>
                  </button>
                )}
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

