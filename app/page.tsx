'use client';

import { useState, useEffect } from 'react';
import { StatusHeader } from '@/components/status-header';
import { FileTree } from '@/components/file-tree';
import { EditorPanel } from '@/components/editor-panel';
import { DeployConsole } from '@/components/deploy-console';
import { CommandPalette } from '@/components/command-palette';
import { ConflictDialog } from '@/components/conflict-dialog';
import { getFileTree, getSocket, type FileNode } from '@/lib/api';
import { toast } from 'sonner';

export default function Home() {
  const [activeFile, setActiveFile] = useState<string>('');
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [conflictDialog, setConflictDialog] = useState<{
    isOpen: boolean;
    diskContent: string;
    localContent: string;
  }>({
    isOpen: false,
    diskContent: '',
    localContent: '',
  });

  // Load file tree on mount
  useEffect(() => {
    const loadFileTree = async () => {
      try {
        const tree = await getFileTree();
        setFileTree(tree);

        // Set default active file to first file in tree
        const findFirstFile = (nodes: FileNode[]): string | null => {
          for (const node of nodes) {
            if (node.type === 'file') return node.path;
            if (node.children) {
              const found = findFirstFile(node.children);
              if (found) return found;
            }
          }
          return null;
        };

        const firstFile = findFirstFile(tree);
        if (firstFile) setActiveFile(firstFile);
      } catch (error) {
        console.error('Error loading file tree:', error);
        toast.error('Failed to load file tree');
      }
    };

    loadFileTree();
  }, []);

  // Setup WebSocket listeners
  useEffect(() => {
    const socket = getSocket();

    socket.on('file:changed', (data: { path: string; message: string }) => {
      toast.warning(data.message, {
        action: {
          label: 'Refresh',
          onClick: () => window.location.reload(),
        },
      });
    });

    socket.on('file:added', (data: { path: string; message: string }) => {
      toast.info(data.message);
    });

    socket.on('file:deleted', (data: { path: string; message: string }) => {
      toast.error(data.message);
    });

    return () => {
      socket.off('file:changed');
      socket.off('file:added');
      socket.off('file:deleted');
    };
  }, []);

  const handleConflict = (diskContent: string, localContent: string) => {
    setConflictDialog({
      isOpen: true,
      diskContent,
      localContent,
    });
  };

  const handleForceOverwrite = () => {
    // In a real app, this would trigger a force save
    console.log('Force overwrite');
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <StatusHeader currentFile={activeFile} />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden" style={{ paddingTop: '3rem' }}>
        {/* Sidebar */}
        <FileTree
          nodes={fileTree}
          activeFile={activeFile}
          onFileSelect={setActiveFile}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Editor Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Editor Panel */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <EditorPanel filePath={activeFile} onConflict={handleConflict} />
          </div>

          {/* Deploy Console */}
          <DeployConsole />
        </div>
      </div>

      {/* Command Palette */}
      <CommandPalette onFileSelect={setActiveFile} />

      {/* Conflict Dialog */}
      <ConflictDialog
        isOpen={conflictDialog.isOpen}
        onClose={() => setConflictDialog(prev => ({ ...prev, isOpen: false }))}
        onForceOverwrite={handleForceOverwrite}
        diskContent={conflictDialog.diskContent}
        localContent={conflictDialog.localContent}
        filePath={activeFile}
      />
    </div>
  );
}
