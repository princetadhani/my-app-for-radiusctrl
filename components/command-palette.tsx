'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileText, Command as CommandIcon } from 'lucide-react';
import { getFileTree, type FileNode } from '@/lib/api';

interface CommandPaletteProps {
  onFileSelect: (path: string) => void;
}

interface SearchResult {
  type: 'file' | 'action';
  label: string;
  path?: string;
  icon?: React.ReactNode;
}

function flattenFiles(nodes: FileNode[], results: SearchResult[] = []): SearchResult[] {
  nodes.forEach(node => {
    if (node.type === 'file') {
      results.push({
        type: 'file',
        label: node.path,
        path: node.path,
        icon: <FileText className="w-4 h-4 text-primary" />,
      });
    }
    if (node.children) {
      flattenFiles(node.children, results);
    }
  });
  return results;
}

export function CommandPalette({ onFileSelect }: CommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [allFiles, setAllFiles] = useState<SearchResult[]>([]);

  // Load file tree on mount
  useEffect(() => {
    const loadFiles = async () => {
      try {
        const tree = await getFileTree();
        const files = flattenFiles(tree);
        setAllFiles(files);
      } catch (error) {
        console.error('Error loading files:', error);
      }
    };

    loadFiles();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
        setSearch('');
        setSelectedIndex(0);
      }

      if (!isOpen) return;

      if (e.key === 'Escape') {
        setIsOpen(false);
        setSearch('');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredResults.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filteredResults[selectedIndex];
        if (selected?.path) {
          onFileSelect(selected.path);
          setIsOpen(false);
          setSearch('');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, search, onFileSelect]);

  const actions: SearchResult[] = [
    { type: 'action', label: 'Deploy Configuration', icon: <CommandIcon className="w-4 h-4 text-neon-green" /> },
    { type: 'action', label: 'View Logs', icon: <CommandIcon className="w-4 h-4 text-neon-blue" /> },
    { type: 'action', label: 'CoA Manager', icon: <CommandIcon className="w-4 h-4 text-neon-purple" /> },
  ];

  const filteredResults = [
    ...allFiles.filter(f => f.label.toLowerCase().includes(search.toLowerCase())),
    ...actions.filter(a => a.label.toLowerCase().includes(search.toLowerCase())),
  ];

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

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
            onClick={() => setIsOpen(false)}
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
              <div className="flex items-center gap-3 p-4 border-b border-border">
                <Search className="w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search files and actions..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                  autoFocus
                />
              </div>

              {/* Results */}
              <div className="max-h-96 overflow-y-auto">
                {filteredResults.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    No results found
                  </div>
                ) : (
                  filteredResults.map((result, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${index === selectedIndex ? 'bg-primary/10' : 'hover:bg-secondary/50'
                        }`}
                      onClick={() => {
                        if (result.path) {
                          onFileSelect(result.path);
                          setIsOpen(false);
                          setSearch('');
                        }
                      }}
                    >
                      {result.icon}
                      <span className="text-sm text-foreground">{result.label}</span>
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

