'use client';

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, Send, Trash2, Plane } from 'lucide-react';

type LineType = 'cmd' | 'info' | 'success' | 'error' | 'final-success' | 'final-error';

interface AnimatedLine {
  fullText: string;
  displayedText: string;
  type: LineType;
  isComplete: boolean;
}

interface CoaConsoleProps {
  nasIp: string;
  nasSecret: string;
  requestType: 'coa' | 'disconnect';
  selectedFileName?: string;
  onNasIpChange: (value: string) => void;
  onNasSecretChange: (value: string) => void;
  onRequestTypeChange: (value: 'coa' | 'disconnect') => void;
  onSend: () => Promise<{ success: boolean; output: string }>;
  disabled?: boolean;
}

export interface CoaConsoleHandle {
  addLine: (text: string, type: LineType, delay?: number) => Promise<void>;
  clear: () => void;
  setRunning: (running: boolean) => void;
  open: () => void;
}

export const CoaConsole = forwardRef<CoaConsoleHandle, CoaConsoleProps>(
  ({ nasIp, nasSecret, requestType, selectedFileName, onNasIpChange, onNasSecretChange, onRequestTypeChange, onSend, disabled }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const [lines, setLines] = useState<AnimatedLine[]>([]);
    const [showPlaneAnimation, setShowPlaneAnimation] = useState(false);
    const [planeDestination, setPlaneDestination] = useState({ x: 0, y: 0 });
    const consoleRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
      if (consoleRef.current) {
        consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
      }
    }, [lines]);

    useEffect(() => {
      return () => {
        if (animationRef.current) {
          clearTimeout(animationRef.current);
        }
      };
    }, []);

    const animateText = async (text: string, type: LineType, lineIndex: number) => {
      const chars = text.split('');
      for (let i = 0; i <= chars.length; i++) {
        await new Promise(resolve => {
          animationRef.current = setTimeout(resolve, 12); // 12ms per character for smoother feel
        });

        setLines(prev => {
          const newLines = [...prev];
          if (newLines[lineIndex]) {
            newLines[lineIndex] = {
              ...newLines[lineIndex],
              displayedText: chars.slice(0, i).join(''),
              isComplete: i === chars.length,
            };
          }
          return newLines;
        });
      }
    };

    const addLine = async (text: string, type: LineType, delay = 0) => {
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      let lineIndex = 0;
      setLines(prev => {
        lineIndex = prev.length;
        return [...prev, {
          fullText: text,
          displayedText: '',
          type,
          isComplete: false,
        }];
      });

      // Small delay to ensure state update
      await new Promise(resolve => setTimeout(resolve, 50));
      await animateText(text, type, lineIndex);
    };

    const handleClear = () => {
      setLines([]);
    };

    const handleSend = async () => {
      setIsOpen(true);
      setIsRunning(true);

      // Trigger plane animation with random destination
      const randomX = Math.random() * window.innerWidth;
      const randomY = -Math.random() * 300 - 100; // Random height above screen
      setPlaneDestination({ x: randomX, y: randomY });
      setShowPlaneAnimation(true);
      setTimeout(() => setShowPlaneAnimation(false), 2500);

      try {
        const result = await onSend();
        // Lines are added by parent component through ref
      } catch (error) {
        await addLine('✗ Error: Failed to send COA request', 'final-error', 100);
      } finally {
        setIsRunning(false);
      }
    };

    useImperativeHandle(ref, () => ({
      addLine,
      clear: handleClear,
      setRunning: setIsRunning,
      open: () => setIsOpen(true),
    }));

    const getOutputClass = (type: LineType) => {
      switch (type) {
        case 'cmd':
          return 'text-neon-blue font-semibold';
        case 'info':
          return 'text-muted-foreground';
        case 'success':
          return 'text-neon-green';
        case 'error':
          return 'text-neon-red';
        case 'final-success':
          return 'text-neon-green font-semibold';
        case 'final-error':
          return 'text-neon-red font-semibold';
        default:
          return 'text-foreground';
      }
    };

    return (
      <div className="border-t border-border relative">
        {/* Plane Animation - Full Screen */}
        <AnimatePresence>
          {showPlaneAnimation && (
            <motion.div
              initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
              animate={{
                x: planeDestination.x,
                y: planeDestination.y,
                opacity: 0,
                scale: 2,
                rotate: -45,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2, ease: 'easeOut' }}
              className="fixed bottom-4 right-4 pointer-events-none z-50"
              style={{ color: '#9ece6a' }}
            >
              <Plane className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Console Header/Toggle Bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-card/50 border-b border-border">
          {/* Left Section */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-1 rounded hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
            >
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </button>
            <span className="text-xs font-mono font-semibold text-foreground">
              COA CONSOLE
            </span>
            <div className={`h-1.5 w-1.5 rounded-full transition-colors ${isRunning ? 'bg-neon-green animate-pulse-green' : 'bg-muted'
              }`} />

            {/* Selected File Indicator */}
            {selectedFileName && (
              <div className="flex items-center gap-2 px-2 py-0.5 rounded bg-neon-blue/10 border border-neon-blue/30">
                <span className="text-[10px] font-medium text-muted-foreground">File:</span>
                <span className="text-xs font-mono text-neon-blue">{selectedFileName}</span>
              </div>
            )}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2.5">
            {/* Request Type Toggle - Glassmorphic Radio Button */}
            <div
              className="flex items-center relative rounded-lg overflow-hidden"
              style={{
                background: 'rgba(13, 17, 23, 0.6)',
                backdropFilter: 'blur(12px)',
                boxShadow: 'inset 1px 1px 4px rgba(122, 162, 247, 0.15), inset -1px -1px 6px rgba(0, 0, 0, 0.3), 0 4px 12px rgba(0, 0, 0, 0.15)',
                border: '1px solid rgba(122, 162, 247, 0.2)',
              }}
            >
              {/* Hidden radio inputs for accessibility */}
              <input
                type="radio"
                name="request-type"
                id="radio-coa"
                checked={requestType === 'coa'}
                onChange={() => onRequestTypeChange('coa')}
                className="sr-only"
              />
              <input
                type="radio"
                name="request-type"
                id="radio-disconnect"
                checked={requestType === 'disconnect'}
                onChange={() => onRequestTypeChange('disconnect')}
                className="sr-only"
              />

              {/* Label buttons */}
              <label
                htmlFor="radio-coa"
                className="flex items-center justify-center min-w-[80px] px-3 py-1.5 text-xs font-semibold cursor-pointer relative z-10 transition-colors duration-300"
                style={{
                  color: requestType === 'coa' ? '#ffffff' : '#8b949e',
                }}
              >
                CoA
              </label>
              <label
                htmlFor="radio-disconnect"
                className="flex items-center justify-center min-w-[80px] px-3 py-1.5 text-xs font-semibold cursor-pointer relative z-10 transition-colors duration-300"
                style={{
                  color: requestType === 'disconnect' ? '#ffffff' : '#8b949e',
                }}
              >
                Disconnect
              </label>

              {/* Animated glider */}
              <div
                className="absolute top-0 bottom-0 rounded-lg z-0 transition-all duration-500"
                style={{
                  width: 'calc(50%)',
                  transform: requestType === 'coa' ? 'translateX(0%)' : 'translateX(100%)',
                  background: 'linear-gradient(135deg, rgba(122, 162, 247, 0.35), rgba(122, 162, 247, 0.25))',
                  boxShadow: '0 0 18px rgba(122, 162, 247, 0.4), 0 0 10px rgba(122, 162, 247, 0.3) inset',
                  transitionTimingFunction: 'cubic-bezier(0.37, 1.95, 0.66, 0.56)',
                }}
              />
            </div>

            {/* NAS IP - Styled */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border" style={{
              background: 'rgba(22, 27, 34, 0.8)',
              borderColor: 'rgba(122, 162, 247, 0.2)',
            }}>
              <span className="text-[10px] font-semibold text-muted-foreground whitespace-nowrap tracking-wide">NAS IP</span>
              <input
                type="text"
                value={nasIp}
                onChange={(e) => onNasIpChange(e.target.value)}
                placeholder="10.86.203.21"
                className="w-28 bg-transparent text-xs text-foreground focus:outline-none font-mono"
              />
            </div>

            {/* Secret - Styled */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border" style={{
              background: 'rgba(22, 27, 34, 0.8)',
              borderColor: 'rgba(122, 162, 247, 0.2)',
            }}>
              <span className="text-[10px] font-semibold text-muted-foreground whitespace-nowrap tracking-wide">SECRET</span>
              <input
                type="text"
                value={nasSecret}
                onChange={(e) => onNasSecretChange(e.target.value)}
                placeholder="prince"
                className="w-20 bg-transparent text-xs text-foreground focus:outline-none font-mono"
              />
            </div>

            {/* Clear Button */}
            <button
              onClick={handleClear}
              disabled={lines.length === 0}
              className="p-2 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: lines.length > 0 ? 'rgba(139, 148, 158, 0.1)' : 'rgba(139, 148, 158, 0.05)',
                border: '1px solid rgba(139, 148, 158, 0.2)',
                color: lines.length > 0 ? '#8b949e' : '#6e7681',
              }}
              title="Clear logs"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>

            {/* Send Button - Matching shape of New/Delete/Save */}
            <button
              onClick={handleSend}
              disabled={isRunning || disabled}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all relative overflow-hidden group disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: !isRunning && !disabled
                  ? 'linear-gradient(135deg, rgba(158, 206, 106, 0.2), rgba(158, 206, 106, 0.15))'
                  : 'rgba(139, 148, 158, 0.1)',
                border: !isRunning && !disabled
                  ? '1px solid rgba(158, 206, 106, 0.4)'
                  : '1px solid rgba(139, 148, 158, 0.2)',
                color: !isRunning && !disabled ? '#9ece6a' : '#8b949e',
                boxShadow: !isRunning && !disabled ? '0 0 12px rgba(158, 206, 106, 0.3)' : 'none',
              }}
            >
              {/* Shimmer effect */}
              {!isRunning && !disabled && (
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              )}
              <Send className={`h-3.5 w-3.5 relative z-10 ${isRunning ? 'animate-pulse' : ''}`} />
              <span className="relative z-10">
                {isRunning ? 'Sending...' : 'Send'}
              </span>
            </button>
          </div>
        </div>

        {/* Console Content */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 240 }}
              exit={{ height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div
                ref={consoleRef}
                className="h-full overflow-auto bg-background/50 p-3"
              >
                <div className="font-mono text-xs text-foreground space-y-1">
                  {lines.length === 0 && !isRunning ? (
                    <div className="text-muted-foreground italic">
                      No COA logs. Configure settings and click Send to start.
                    </div>
                  ) : (
                    lines.map((line, index) => {
                      // Highlight "CoA-ACK" and "CoA-NACK" in the text
                      const text = line.displayedText;
                      const hasCoAACK = text.includes('CoA-ACK') || text.includes('Coa-Ack');
                      const hasCoANACK = text.includes('CoA-NACK') || text.includes('Coa-Nack') || text.includes('CoA-NAK') || text.includes('Coa-Nak');

                      let displayContent;
                      if (hasCoANACK) {
                        // Highlight "CoA-NACK" in bold red (check NACK first since it's more specific)
                        const parts = text.split(/(CoA-NACK|Coa-Nack|CoA-NAK|Coa-Nak)/g);
                        displayContent = parts.map((part, i) => {
                          if (part === 'CoA-NACK' || part === 'Coa-Nack' || part === 'CoA-NAK' || part === 'Coa-Nak') {
                            return <span key={i} className="text-neon-red font-bold">{part}</span>;
                          }
                          return <span key={i}>{part}</span>;
                        });
                      } else if (hasCoAACK) {
                        // Highlight "CoA-ACK" in bold green
                        const parts = text.split(/(CoA-ACK|Coa-Ack)/g);
                        displayContent = parts.map((part, i) => {
                          if (part === 'CoA-ACK' || part === 'Coa-Ack') {
                            return <span key={i} className="text-neon-green font-bold">{part}</span>;
                          }
                          return <span key={i}>{part}</span>;
                        });
                      } else {
                        displayContent = text;
                      }

                      return (
                        <div
                          key={index}
                          className={getOutputClass(line.type)}
                        >
                          {displayContent}
                          {!line.isComplete && isRunning && (
                            <span className="inline-block w-2 h-3 bg-primary ml-0.5 animate-blink" />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div >
    );
  }
);

CoaConsole.displayName = 'CoaConsole';
