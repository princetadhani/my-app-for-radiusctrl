'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileText, Zap } from 'lucide-react';
import type { FileNode } from '@/lib/api';

interface CoaCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  fileTree: FileNode[];
  onFileSelect: (path: string) => void;
  onCreateNew: () => void;
}

export function CoaCommandPalette({ isOpen, onClose, fileTree, onFileSelect, onCreateNew }: CoaCommandPaletteProps) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Flatten file tree to get all files
  const allFiles = fileTree.flatMap(node => {
    if (node.type === 'file') {
      return [{ path: node.path, label: node.name, icon: <FileText className="w-4 h-4" style={{ color: 'hsl(210, 100%, 60%)' }} /> }];
    }
    if (node.children) {
      return node.children
        .filter(child => child.type === 'file')
        .map(child => ({ path: child.path, label: child.name, icon: <FileText className="w-4 h-4" style={{ color: 'hsl(210, 100%, 60%)' }} /> }));
    }
    return [];
  });

  // Add "Create New" action
  const actions = [
    { type: 'action', label: 'Create New COA File', icon: <Zap className="w-4 h-4" style={{ color: 'hsl(145, 80%, 55%)' }} />, action: onCreateNew },
  ];

  const filteredResults = [
    ...allFiles.filter(f => f.label.toLowerCase().includes(search.toLowerCase())),
    ...actions.filter(a => a.label.toLowerCase().includes(search.toLowerCase())),
  ];

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredResults.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && filteredResults[selectedIndex]) {
        const result = filteredResults[selectedIndex];
        if ('path' in result) {
          onFileSelect(result.path);
        } else if ('action' in result) {
          result.action();
        }
        onClose();
        setSearch('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredResults, onFileSelect, onClose]);

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Reset when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            className="fixed inset-0 z-50"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
            onClick={onClose}
          />

          {/* Modal with animated gradient border */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="fixed top-1/4 left-1/2 -translate-x-1/2 w-full max-w-lg z-50"
          >
            {/* Animated gradient border glow */}
            <motion.div
              className="absolute -inset-0.5 rounded-xl opacity-75 blur-sm"
              style={{
                background: 'linear-gradient(45deg, #7aa2f7, #bb9af7, #9ece6a, #7aa2f7)',
                backgroundSize: '300% 300%',
              }}
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'linear',
              }}
            />

            {/* Dialog content */}
            <div
              className="relative rounded-xl shadow-2xl overflow-hidden"
              style={{
                backgroundColor: '#0d1117',
                border: '1px solid rgba(122, 162, 247, 0.3)',
              }}
            >
              {/* Search Input */}
              <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: 'hsl(225, 15%, 18%)' }}>
                <Search className="w-5 h-5" style={{ color: 'hsl(215, 15%, 55%)' }} />
                <input
                  type="text"
                  placeholder="Search COA files and actions..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="flex-1 bg-transparent outline-none"
                  style={{ color: 'hsl(210, 40%, 92%)', fontFamily: 'var(--font-inter)' }}
                  autoFocus
                />
                <kbd className="px-2 py-1 text-xs rounded" style={{ backgroundColor: 'hsl(225, 15%, 16%)', color: 'hsl(215, 15%, 55%)' }}>
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div className="max-h-96 overflow-y-auto">
                {filteredResults.length === 0 ? (
                  <div className="p-4 text-center text-sm" style={{ color: 'hsl(215, 15%, 55%)' }}>
                    No results found
                  </div>
                ) : (
                  filteredResults.map((result, index) => (
                    <div
                      key={'path' in result ? result.path : result.label}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${index === selectedIndex ? 'bg-primary/10' : 'hover:bg-secondary/50'
                        }`}
                      style={{
                        backgroundColor: index === selectedIndex ? 'rgba(122, 162, 247, 0.1)' : 'transparent',
                      }}
                      onMouseEnter={() => setSelectedIndex(index)}
                      onClick={() => {
                        if ('path' in result) {
                          onFileSelect(result.path);
                        } else if ('action' in result) {
                          result.action();
                        }
                        onClose();
                        setSearch('');
                      }}
                    >
                      {result.icon}
                      <span className="text-sm" style={{ color: 'hsl(210, 40%, 92%)' }}>
                        {result.label}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
