'use client';

import { useState } from 'react';
import { StatusHeader } from '@/components/status-header';
import { FileTree } from '@/components/file-tree';
import { EditorPanel } from '@/components/editor-panel';
import { DeployConsole } from '@/components/deploy-console';
import { CommandPalette } from '@/components/command-palette';
import { ConflictDialog } from '@/components/conflict-dialog';
import { mockFileTree } from '@/lib/mock-data';

export default function Home() {
  const [activeFile, setActiveFile] = useState('/etc/freeradius/3.0/users');
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
          nodes={mockFileTree}
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
