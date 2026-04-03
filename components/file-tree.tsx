'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Folder, FileText, Shield, Users, PanelLeftClose, PanelLeft } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { FileNode } from '@/lib/api';

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
  // Start with all directories collapsed for cleaner initial view
  const [isExpanded, setIsExpanded] = useState(false);

  const getIcon = () => {
    if (node.type === 'directory') {
      return (
        <Folder
          className="w-3.5 h-3.5"
          style={{
            color: isExpanded
              ? 'hsl(210, 100%, 60%)'
              : 'hsl(210, 100%, 60%, 0.6)'
          }}
        />
      );
    }
    // File icons with color coding
    if (node.icon === 'users') {
      return <Users className="w-3.5 h-3.5" style={{ color: 'hsl(38, 95%, 60%)' }} />;
    }
    if (node.icon === 'shield') {
      return <Shield className="w-3.5 h-3.5" style={{ color: 'hsl(270, 80%, 65%)' }} />;
    }
    if (node.path?.includes('eap') || node.path?.includes('tls')) {
      return <FileText className="w-3.5 h-3.5" style={{ color: 'hsl(145, 80%, 55%)' }} />;
    }
    return <FileText className="w-3.5 h-3.5" style={{ color: 'hsl(210, 100%, 60%, 0.7)' }} />;
  };

  const isActive = node.type === 'file' && node.path === activeFile;
  const isDirectory = node.type === 'directory';

  // Calculate padding based on depth
  const paddingLeft = isDirectory ? (level * 12) + 8 : (level * 12) + 20;

  return (
    <div>
      <motion.div
        className="flex items-center w-full rounded-sm cursor-pointer select-none transition-all duration-200"
        style={{
          paddingLeft: `${paddingLeft}px`,
          paddingTop: '4px',
          paddingBottom: '4px',
          paddingRight: '8px',
          gap: '6px',
          backgroundColor: isActive
            ? 'hsl(210, 100%, 60%, 0.1)'
            : 'transparent',
          color: isActive
            ? 'hsl(210, 100%, 60%)'
            : isDirectory
              ? 'hsl(210, 20%, 70%)'
              : 'hsl(215, 15%, 55%)',
          borderLeft: isActive ? '2px solid hsl(210, 100%, 60%)' : '2px solid transparent',
          fontSize: isDirectory ? '12px' : '11px',
          fontFamily: isDirectory ? 'var(--font-inter)' : 'var(--font-jetbrains-mono)',
          fontWeight: isDirectory ? '500' : '400',
        }}
        onClick={() => {
          if (node.type === 'directory') {
            setIsExpanded(!isExpanded);
          } else {
            onFileSelect(node.path);
          }
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = isDirectory
              ? 'hsl(225, 15%, 16%, 0.5)'
              : 'hsl(225, 15%, 16%, 0.3)';
            e.currentTarget.style.color = 'hsl(210, 40%, 92%)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = isDirectory
              ? 'hsl(210, 20%, 70%)'
              : 'hsl(215, 15%, 55%)';
          }
        }}
      >
        {node.type === 'directory' && (
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.15 }}
          >
            <ChevronRight className="w-3 h-3" style={{ color: 'hsl(215, 15%, 55%)' }} />
          </motion.div>
        )}
        {getIcon()}
        <span className="truncate">{node.name}</span>
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
      className="h-full overflow-hidden border-r select-none relative"
      style={{
        backgroundColor: 'rgba(18, 23, 35, 0.6)',
        backdropFilter: 'blur(16px) saturate(1.2)',
        borderRightColor: 'hsl(225, 15%, 18%)',
      }}
    >
      {/* File Tree Content */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-y-auto py-2 h-full"
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

      {/* Floating Toggle Button */}
      <div className="absolute top-2 right-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="h-8 w-8 hover:bg-secondary/80 backdrop-blur-sm"
          style={{
            backgroundColor: 'rgba(18, 23, 35, 0.8)',
          }}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <PanelLeft className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </Button>
      </div>
    </motion.div>
  );
}

