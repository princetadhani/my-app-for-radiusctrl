'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, Play, Trash2 } from 'lucide-react';
import { deployConfiguration, type DeployOutput } from '@/lib/api';

interface AnimatedLine {
  fullText: string;
  displayedText: string;
  type: DeployOutput['type'];
  isComplete: boolean;
}

export function DeployConsole() {
  const [isOpen, setIsOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [lines, setLines] = useState<AnimatedLine[]>([]);
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

  const animateText = async (text: string, type: DeployOutput['type'], lineIndex: number) => {
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

  const handleDeploy = async () => {
    setIsOpen(true);
    setIsValidating(true);
    setIsRunning(true);
    setLines([]);

    // Simulate validation phase (minimum 800ms)
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsValidating(false);

    const deployOutputs = await deployConfiguration();

    for (let i = 0; i < deployOutputs.length; i++) {
      // Wait for the delay
      if (deployOutputs[i].delay > 0) {
        await new Promise(resolve => setTimeout(resolve, deployOutputs[i].delay));
      }

      // Add new line
      setLines(prev => [...prev, {
        fullText: deployOutputs[i].text,
        displayedText: '',
        type: deployOutputs[i].type,
        isComplete: false,
      }]);

      // Animate the text character by character
      await animateText(deployOutputs[i].text, deployOutputs[i].type, i);
    }

    setIsRunning(false);
  };

  const handleClear = () => {
    setLines([]);
  };

  const getOutputClass = (type: DeployOutput['type']) => {
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
            DEPLOY CONSOLE
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

          {/* Deploy/Apply Button */}
          <button
            onClick={handleDeploy}
            disabled={isRunning}
            className="relative flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all bg-neon-green/20 hover:bg-neon-green/30 border border-neon-green/40 text-neon-green neon-glow-green disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
          >
            {/* Animated background shimmer */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-neon-green/10 to-transparent" />

            <Play className={`h-3 w-3 relative z-10 ${isRunning ? 'animate-pulse' : ''}`} />
            <span className="relative z-10">
              {isValidating ? 'Validating...' : isRunning ? 'Deploying...' : 'Apply & Deploy'}
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
}

