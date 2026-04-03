'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { DiffEditor } from '@monaco-editor/react';

interface ConflictDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onForceOverwrite: () => void;
  diskContent: string;
  localContent: string;
  filePath: string;
}

export function ConflictDialog({
  isOpen,
  onClose,
  onForceOverwrite,
  diskContent,
  localContent,
  filePath,
}: ConflictDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/90 backdrop-blur-md z-50"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-4 md:inset-12 z-50 flex items-center justify-center"
          >
            <div className="glass-panel-strong border-2 border-neon-amber/40 rounded-lg shadow-2xl w-full h-full flex flex-col neon-glow-amber">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-neon-amber/40">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-neon-amber" />
                  <div>
                    <h2 className="text-lg font-semibold text-neon-amber">Merge Conflict Detected</h2>
                    <p className="text-sm text-muted-foreground">
                      File was modified on disk: {filePath}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-secondary rounded transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Diff Editor */}
              <div className="flex-1 p-4">
                <div className="h-full border border-border rounded overflow-hidden">
                  <DiffEditor
                    original={diskContent}
                    modified={localContent}
                    language="ini"
                    theme="vs-dark"
                    options={{
                      readOnly: true,
                      renderSideBySide: true,
                      minimap: { enabled: false },
                      fontSize: 13,
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                    }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between p-4 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  <span className="text-neon-red">Left:</span> Version on disk (newer) •{' '}
                  <span className="text-neon-green">Right:</span> Your local changes
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      onForceOverwrite();
                      onClose();
                    }}
                    className="px-4 py-2 rounded bg-neon-amber/20 hover:bg-neon-amber/30 border border-neon-amber/40 text-neon-amber font-medium transition-colors neon-glow-amber"
                  >
                    Force Overwrite
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

