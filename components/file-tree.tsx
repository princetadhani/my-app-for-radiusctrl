'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Folder, FolderOpen, FileText, Shield, Users, KeyRound, PanelLeftClose, PanelLeft, UsersRound, Plus, BookOpen } from 'lucide-react';
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
  onNewDictionary?: () => void;
}

function TreeNode({
  node,
  activeFile,
  onFileSelect,
  level = 0,
  onNewDictionary
}: {
  node: FileNode;
  activeFile?: string;
  onFileSelect: (path: string) => void;
  level?: number;
  onNewDictionary?: () => void;
}) {
  // Make users.d directory open by default, rest collapsed
  const isUsersDir = node.name === 'users.d';
  const [isExpanded, setIsExpanded] = useState(isUsersDir);
  const [isHovered, setIsHovered] = useState(false);

  const getIcon = () => {
    if (node.type === 'directory') {
      // Special icon for users.d directory - UsersRound (group of users) - No animation
      if (node.name === 'users.d') {
        return (
          <UsersRound
            className="w-3.5 h-3.5"
            style={{
              color: isExpanded ? '#7aa2f7' : '#7aa2f799' // Same blue as folders
            }}
          />
        );
      }

      // Special icon for dictionary.d directory - BookOpen - No animation
      if (node.name === 'dictionary.d') {
        return (
          <BookOpen
            className="w-3.5 h-3.5"
            style={{
              color: isExpanded ? '#7aa2f7' : '#7aa2f799' // Same blue as folders
            }}
          />
        );
      }

      // Regular folders - Animated FolderOpen/Folder icons
      return isExpanded ? (
        <FolderOpen
          className="w-3.5 h-3.5"
          style={{
            color: '#7aa2f7' // Blue when open
          }}
        />
      ) : (
        <Folder
          className="w-3.5 h-3.5"
          style={{
            color: '#7aa2f799' // Faded blue when closed
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
  const isUsersDirectory = node.name === 'users.d';
  const isDictionaryDirectory = node.name === 'dictionary.d';

  // Calculate padding based on depth
  const paddingLeft = isDirectory ? (level * 12) + 8 : (level * 12) + 20;

  return (
    <div>
      <motion.div
        className="flex items-center w-full rounded-sm cursor-pointer select-none transition-all duration-200 relative group"
        style={{
          paddingLeft: `${paddingLeft}px`,
          paddingTop: '4px',
          paddingBottom: '4px',
          paddingRight: isDictionaryDirectory ? '32px' : '8px', // Extra padding for + button
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
          setIsHovered(true);
          if (!isActive) {
            e.currentTarget.style.backgroundColor = isDirectory
              ? '#161b2280' // Darker hover for directories
              : '#161b2250'; // Lighter hover for files
            e.currentTarget.style.color = '#c9d1d9'; // Light text on hover
          }
        }}
        onMouseLeave={(e) => {
          setIsHovered(false);
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

        {/* + Button for dictionary.d directory */}
        {isDictionaryDirectory && onNewDictionary && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: isHovered ? 1 : 0,
              scale: isHovered ? 1 : 0.8
            }}
            transition={{ duration: 0.15 }}
            onClick={(e) => {
              e.stopPropagation();
              onNewDictionary();
            }}
            className="absolute right-2 p-1 rounded hover:bg-white/10 transition-colors"
            style={{
              color: '#7aa2f7',
            }}
            title="Create new dictionary file"
          >
            <Plus className="w-3.5 h-3.5" />
          </motion.button>
        )}
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
                onNewDictionary={onNewDictionary}
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
  onToggleCollapse,
  onNewDictionary
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
        cursor: isCollapsed ? 'pointer' : 'default',
      }}
      onClick={(e) => {
        // When collapsed, clicking empty space expands the sidebar
        if (isCollapsed && onToggleCollapse) {
          // Only trigger if clicking directly on the collapsed area, not on the button
          const target = e.target as HTMLElement;
          if (!target.closest('button')) {
            onToggleCollapse();
          }
        }
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
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            } as React.CSSProperties}
          >
            {nodes.map((node, index) => (
              <TreeNode
                key={node.path || index}
                node={node}
                activeFile={activeFile}
                onFileSelect={onFileSelect}
                onNewDictionary={onNewDictionary}
                level={level}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <div className="absolute top-2 right-2" style={{ pointerEvents: 'auto' }}>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleCollapse) {
              onToggleCollapse();
            }
          }}
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

