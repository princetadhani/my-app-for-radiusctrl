'use client';

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, Play, Trash2 } from 'lucide-react';
import { validateConfiguration, restartService } from '@/lib/api';
import { customToast } from '@/lib/custom-toast';

type LineType = 'cmd' | 'info' | 'success' | 'error' | 'final-success' | 'final-error';

interface AnimatedLine {
  fullText: string;
  displayedText: string;
  type: LineType;
  isComplete: boolean;
}

type ConsoleMode = 'deploy' | 'validation';

export interface DeployConsoleHandle {
  showValidationError: (output: string, error?: string) => void;
  resetToDeployMode: () => void;
}

export const DeployConsole = forwardRef<DeployConsoleHandle>((_props, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [lines, setLines] = useState<AnimatedLine[]>([]);
  const [mode, setMode] = useState<ConsoleMode>('deploy');
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
        animationRef.current = setTimeout(resolve, 15); // 15ms per character for smooth typing
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

  const handleDeploy = async () => {
    setMode('deploy');
    setIsOpen(true);
    setIsValidating(true);
    setIsRunning(true);
    setLines([]);

    try {
      // Step 1: Show command (matches backend actual command)
      await addLine('$ freeradius -CX /etc/freeradius/3.0', 'cmd', 0);
      await addLine('Validating configuration...', 'info', 400);

      // Step 2: Validate configuration
      setIsValidating(true);
      const validationResult = await validateConfiguration();
      setIsValidating(false);

      if (!validationResult.success) {
        // Validation failed - show detailed output
        await addLine('ERROR: Configuration validation failed', 'error', 200);

        // Show the actual error message from backend
        if (validationResult.error) {
          const errorLines = validationResult.error.split('\n').filter(line => line.trim());
          for (const line of errorLines) {
            await addLine(line.trim(), 'error', 100);
          }
        }

        // Also show key lines from full output if available
        if (validationResult.output && !validationResult.error) {
          const errorLines = validationResult.output
            .split('\n')
            .filter(line =>
              line.includes('Unknown') ||
              line.includes('Duplicate') ||
              line.includes('Failed') ||
              line.includes('ERROR') ||
              line.includes('Unable to') ||
              line.includes('Permission denied') ||
              line.includes('error:') ||
              line.includes('Parse error') ||
              line.includes('Errors reading') ||
              line.includes('Failed parsing configuration item') ||
              line.includes('Unknown name') ||
              line.includes('Instantiation failed') ||
              line.includes('Duplicate') ||
              line.includes('Error') ||
              line.includes('Invalid') ||
              line.includes('Failed')
            )
            .slice(0, 15); // Show first 15 error lines

          for (const line of errorLines) {
            await addLine(line.trim(), 'error', 100);
          }
        }

        await addLine('✗ Configuration validation failed. Deploy aborted.', 'final-error', 400);
        customToast.error('Configuration validation failed');
        setIsRunning(false);
        return;
      }

      // Parse validation output to show modules loading
      const outputLines = validationResult.output.split('\n').filter(line => line.trim());
      for (const line of outputLines.slice(0, 5)) {
        if (line.includes('including') || line.includes('Reading') || line.includes('Module')) {
          await addLine(`  ${line.trim()}`, 'info', 200);
        }
      }

      await addLine('Configuration appears to be OK', 'success', 400);

      // Step 3: Restart service
      await addLine('$ systemctl restart freeradius', 'cmd', 500);
      await addLine('Restarting FreeRADIUS service...', 'info', 300);

      const restartResult = await restartService();

      if (restartResult.success) {
        await addLine('✓ Deploy complete. Service restarted successfully.', 'final-success', 500);
        customToast.success('Configuration deployed successfully');
      } else {
        await addLine('✗ Failed to restart service: ' + restartResult.message, 'final-error', 300);
        customToast.error('Failed to restart service');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      await addLine('✗ Error: ' + errorMsg, 'final-error', 100);
      customToast.error('Deployment failed');
    } finally {
      setIsRunning(false);
    }
  };

  const handleClear = () => {
    setLines([]);
  };

  // Expose methods for external control
  useImperativeHandle(ref, () => ({
    showValidationError: async (output: string, error?: string) => {
      setMode('validation');
      setIsOpen(true);
      setIsRunning(true);
      setLines([]);

      try {
        // Show command
        await addLine('$ freeradius -CX /etc/freeradius/3.0', 'cmd', 0);
        await addLine('Validating configuration...', 'info', 400);
        await addLine('ERROR: Configuration validation failed', 'error', 200);

        // Show the actual error message
        if (error) {
          const errorLines = error.split('\n').filter(line => line.trim());
          for (const line of errorLines) {
            await addLine(line.trim(), 'error', 100);
          }
        }

        // Also show key lines from full output if available
        if (output && !error) {
          const errorLines = output
            .split('\n')
            .filter(line =>
              line.includes('Unknown') ||
              line.includes('Duplicate') ||
              line.includes('Failed') ||
              line.includes('ERROR') ||
              line.includes('Unable to') ||
              line.includes('Permission denied') ||
              line.includes('error:') ||
              line.includes('Parse error') ||
              line.includes('Errors reading') ||
              line.includes('Failed parsing configuration item') ||
              line.includes('Unknown name') ||
              line.includes('Instantiation failed') ||
              line.includes('Duplicate') ||
              line.includes('Error') ||
              line.includes('Invalid') ||
              line.includes('Failed')
            )
            .slice(0, 15);

          for (const line of errorLines) {
            await addLine(line.trim(), 'error', 100);
          }
        }

        await addLine('✗ Configuration validation failed. Changes were not saved.', 'final-error', 400);

        // Auto-minimize after 15 seconds
        setTimeout(() => {
          setIsOpen(false);
        }, 15000);
      } finally {
        setIsRunning(false);
      }
    },
    resetToDeployMode: () => {
      setMode('deploy');
    },
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
    <div className="border-t border-border">
      {/* Console Header/Toggle Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-card/50 border-b border-border">
        <div className="flex items-center gap-2">
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
            {mode === 'validation' ? 'CONFIG TEST CONSOLE' : 'DEPLOY CONSOLE'}
          </span>
          <div className={`h-1.5 w-1.5 rounded-full transition-colors ${isRunning ? 'bg-neon-green animate-pulse-green' : 'bg-muted'
            }`} />
        </div>

        <div className="flex items-center gap-2">
          {/* Clear Button */}
          <button
            onClick={handleClear}
            disabled={lines.length === 0}
            className="p-1.5 rounded hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Clear logs"
          >
            <Trash2 className="h-4 w-4" />
          </button>

          {/* Deploy/Apply Button - Hidden in validation mode */}
          {mode === 'deploy' && (
            <button
              onClick={handleDeploy}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all relative overflow-hidden group disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: !isRunning
                  ? 'linear-gradient(135deg, rgba(158, 206, 106, 0.2), rgba(158, 206, 106, 0.15))'
                  : 'rgba(139, 148, 158, 0.1)',
                border: !isRunning
                  ? '1px solid rgba(158, 206, 106, 0.4)'
                  : '1px solid rgba(139, 148, 158, 0.2)',
                color: !isRunning ? '#9ece6a' : '#8b949e',
                boxShadow: !isRunning ? '0 0 12px rgba(158, 206, 106, 0.3)' : 'none',
              }}
            >
              {/* Shimmer effect */}
              {!isRunning && (
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              )}
              <Play className={`h-3.5 w-3.5 relative z-10 ${isRunning ? 'animate-pulse' : ''}`} />
              <span className="relative z-10">
                {isValidating ? 'Validating...' : isRunning ? 'Deploying...' : 'Apply & Deploy'}
              </span>
            </button>
          )}
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
                    No deployment logs. Click Deploy to start.
                  </div>
                ) : (
                  lines.map((line, index) => (
                    <div
                      key={index}
                      className={getOutputClass(line.type)}
                    >
                      {line.displayedText}
                      {!line.isComplete && isRunning && (
                        <span className="inline-block w-2 h-3 bg-primary ml-0.5 animate-blink" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

DeployConsole.displayName = 'DeployConsole';
