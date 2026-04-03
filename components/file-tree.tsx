'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Folder, FileText, Shield, Users, PanelLeftClose, PanelLeft } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { FileNode } from '@/lib/mock-data';

interface FileTreeProps {
  nodes: FileNode[];
  activeFile?: string;
  onFileSelect: (path: string) => void;
  level?: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

function TreeNode({
  node,
  activeFile,
  onFileSelect,
  level = 0
}: {
  node: FileNode;
  activeFile?: string;
  onFileSelect: (path: string) => void;
  level?: number;
}) {
  const [isExpanded, setIsExpanded] = useState(level === 0);

  const getIcon = () => {
    if (node.type === 'directory') {
      return <Folder className="w-4 h-4 text-neon-blue" />;
    }
    if (node.icon === 'shield') {
      return <Shield className="w-4 h-4 text-neon-purple" />;
    }
    if (node.icon === 'users') {
      return <Users className="w-4 h-4 text-neon-amber" />;
    }
    return <FileText className="w-4 h-4 text-primary" />;
  };

  const isActive = node.type === 'file' && node.path === activeFile;

  return (
    <div>
      <motion.div
        className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-secondary/50 transition-colors ${isActive ? 'bg-primary/10 border-l-2 border-primary' : ''
          }`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={() => {
          if (node.type === 'directory') {
            setIsExpanded(!isExpanded);
          } else {
            onFileSelect(node.path);
          }
        }}
        whileHover={{ x: 2 }}
        transition={{ duration: 0.15 }}
      >
        {node.type === 'directory' && (
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight className="w-3 h-3 text-muted-foreground" />
          </motion.div>
        )}
        {node.type === 'file' && <div className="w-3" />}
        {getIcon()}
        <span className="text-sm text-foreground">{node.name}</span>
      </motion.div>

      <AnimatePresence>
        {node.type === 'directory' && isExpanded && node.children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            {node.children.map((child, index) => (
              <TreeNode
                key={child.path || `${node.path}-${index}`}
                node={child}
                activeFile={activeFile}
                onFileSelect={onFileSelect}
                level={level + 1}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FileTree({
  nodes,
  activeFile,
  onFileSelect,
  level = 0,
  isCollapsed = false,
  onToggleCollapse
}: FileTreeProps) {
  return (
    <motion.div
      initial={{ x: -280, opacity: 0 }}
      animate={{
        x: 0,
        opacity: 1,
        width: isCollapsed ? 48 : 256
      }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="h-full glass-panel border-r border-border overflow-hidden"
    >
      {/* Toggle Button */}
      <div className="h-12 border-b border-border flex items-center justify-between px-2">
        {!isCollapsed && (
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
            Files
          </h3>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="h-8 w-8 hover:bg-secondary"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <PanelLeft className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* File Tree Content */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="p-2 overflow-y-auto"
            style={{ height: 'calc(100% - 48px)' }}
          >
            {nodes.map((node, index) => (
              <TreeNode
                key={node.path || index}
                node={node}
                activeFile={activeFile}
                onFileSelect={onFileSelect}
                level={level}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

