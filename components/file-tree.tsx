'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Folder, FileText, Shield, Users, KeyRound, PanelLeftClose, PanelLeft } from 'lucide-react';
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
            color: isExpanded ? '#7aa2f7' : '#7aa2f799' // Blue - Folders
          }}
        />
      );
    }

    // File icons with FreeRADIUS-specific color coding
    // Users - Amber
    if (node.icon === 'users' || node.path?.toLowerCase().includes('user')) {
      return <Users className="w-3.5 h-3.5" style={{ color: '#ff9e64' }} />;
    }

    // Clients - Violet
    if (node.icon === 'shield' || node.path?.toLowerCase().includes('client')) {
      return <Shield className="w-3.5 h-3.5" style={{ color: '#c084fc' }} />;
    }

    // Certificates - Green (EAP, TLS, certs, keys, etc.)
    if (
      node.path?.toLowerCase().includes('eap') ||
      node.path?.toLowerCase().includes('tls') ||
      node.path?.toLowerCase().includes('cert') ||
      node.path?.toLowerCase().includes('key') ||
      node.path?.toLowerCase().includes('ca') ||
      node.path?.toLowerCase().includes('pem') ||
      node.path?.toLowerCase().includes('crl')
    ) {
      return <KeyRound className="w-3.5 h-3.5" style={{ color: '#9ece6a' }} />;
    }

    // Default config files - Purple
    return <FileText className="w-3.5 h-3.5" style={{ color: '#bb9af7' }} />;
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
            ? '#7aa2f720' // Blue background for active
            : 'transparent',
          color: isActive
            ? '#7aa2f7' // Blue text for active
            : isDirectory
              ? '#c9d1d9' // Light gray for directories
              : '#8b949e', // Muted gray for files
          borderLeft: isActive ? '2px solid #7aa2f7' : '2px solid transparent',
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
              ? '#161b2280' // Darker hover for directories
              : '#161b2250'; // Lighter hover for files
            e.currentTarget.style.color = '#c9d1d9'; // Light text on hover
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = isDirectory
              ? '#c9d1d9'
              : '#8b949e';
          }
        }}
      >
        {node.type === 'directory' && (
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.15 }}
          >
            <ChevronRight className="w-3 h-3" style={{ color: '#6e7681' }} />
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

