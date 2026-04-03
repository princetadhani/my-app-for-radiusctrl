'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, ChevronUp, ChevronDown, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    setIsRunning(true);
    setLines([]);

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
    <div className="relative">
      {/* Toggle Bar */}
      <div className="h-10 border-t border-border glass-panel flex items-center justify-between px-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Terminal className="w-4 h-4" />
          <span>Deploy Console</span>
          {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
        </button>

        <Button
          onClick={handleDeploy}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-1.5 h-auto rounded bg-neon-green/20 hover:bg-neon-green/30 border border-neon-green/40 text-neon-green font-medium text-sm transition-colors neon-glow-green"
        >
          <Play className="w-3 h-3" />
          <span>Apply & Deploy</span>
        </Button>
      </div>

      {/* Console Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 200 }}
            exit={{ height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-border"
          >
            <div
              ref={consoleRef}
              className="h-full bg-card p-4 font-mono text-xs overflow-y-auto"
            >
              {lines.length === 0 && !isRunning && (
                <div className="text-muted-foreground">
                  Ready to deploy. Click "Apply & Deploy" to validate and deploy configuration.
                </div>
              )}

              {lines.map((line, index) => (
                <div
                  key={index}
                  className={getOutputClass(line.type)}
                >
                  {line.displayedText}
                  {!line.isComplete && isRunning && (
                    <span className="inline-block w-2 h-3 bg-primary ml-0.5 animate-blink" />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

