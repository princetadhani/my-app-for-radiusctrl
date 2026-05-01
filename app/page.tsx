'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { StatusHeader } from '@/components/status-header';
import { FileTree } from '@/components/file-tree';
import { EditorPanel } from '@/components/editor-panel';
import { DeployConsole, type DeployConsoleHandle } from '@/components/deploy-console';
import { CommandPalette } from '@/components/command-palette';
import { NewUserDialog } from '@/components/new-user-dialog';
import { getFileTree, getSocket, type FileNode } from '@/lib/api';
import { toast } from 'sonner';
import { customToast } from '@/lib/custom-toast';
import { TriangleAlert, FilePlus, Trash2, X } from 'lucide-react';

export default function Home() {
  const [activeFile, setActiveFile] = useState<string>('');
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isNewUserDialogOpen, setIsNewUserDialogOpen] = useState(false);
  const deployConsoleRef = useRef<DeployConsoleHandle>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Load file tree on mount
  useEffect(() => {
    const loadFileTree = async () => {
      try {
        const tree = await getFileTree();
        setFileTree(tree);

        // Do NOT auto-load any file - let the user select one
        // This allows the empty state with animations to show
      } catch (error) {
        console.error('Error loading file tree:', error);
        customToast.error('Failed to load file tree');
      }
    };

    loadFileTree();
  }, []);

  // Setup WebSocket listeners for file watcher events
  useEffect(() => {
    const socket = getSocket();

    socket.on('file:changed', (data: { path: string; message: string }) => {
      // Extract filename from path
      const fileName = data.path.split('/').pop() || data.path;

      toast.custom(
        (t) => (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => toast.dismiss(t)}
              style={{
                position: 'absolute',
                right: '-10px',
                top: '-10px',
                background: 'hsl(225, 25%, 12%)',
                border: '1px solid hsl(225, 15%, 18%)',
                borderRadius: '0.375rem',
                width: '20px',
                height: '20px',
                color: 'hsl(210, 40%, 92%)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0.8,
                transition: 'opacity 0.2s',
                zIndex: 10,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.8')}
            >
              <X size={12} />
            </button>
            <div
              style={{
                background: 'hsl(225, 25%, 12%, 0.95)',
                border: '1px solid hsl(38, 95%, 60%, 0.6)',
                borderRadius: '0.5rem',
                padding: '0.875rem 1rem',
                color: 'hsl(210, 40%, 92%)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                boxShadow: '0 0 12px hsl(38, 95%, 60%, 0.3), 0 0 4px hsl(38, 95%, 60%, 0.2)',
                fontSize: '0.875rem',
                minWidth: '356px',
                maxWidth: '356px',
              }}
            >
              <TriangleAlert size={18} style={{ color: 'hsl(38, 95%, 60%)', flexShrink: 0 }} />
              <span>
                <strong style={{ color: 'hsl(38, 95%, 60%)', fontWeight: 600 }}>{fileName}</strong> edited via SSH.
              </span>
            </div>
          </div>
        ),
        { duration: 8000 }
      );
    });

    socket.on('file:added', (data: { path: string; message: string }) => {
      // Extract filename from path
      const fileName = data.path.split('/').pop() || data.path;

      // Reload file tree to show new file in command palette
      getFileTree().then(setFileTree).catch(console.error);

      toast.custom(
        (t) => (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => toast.dismiss(t)}
              style={{
                position: 'absolute',
                right: '-10px',
                top: '-10px',
                background: 'hsl(225, 25%, 12%)',
                border: '1px solid hsl(225, 15%, 18%)',
                borderRadius: '0.375rem',
                width: '20px',
                height: '20px',
                color: 'hsl(210, 40%, 92%)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0.8,
                transition: 'opacity 0.2s',
                zIndex: 10,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.8')}
            >
              <X size={12} />
            </button>
            <div
              style={{
                background: 'hsl(225, 25%, 12%, 0.95)',
                border: '1px solid hsl(210, 100%, 60%, 0.6)',
                borderRadius: '0.5rem',
                padding: '0.875rem 1rem',
                color: 'hsl(210, 40%, 92%)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                boxShadow: '0 0 12px hsl(210, 100%, 60%, 0.3), 0 0 4px hsl(210, 100%, 60%, 0.2)',
                fontSize: '0.875rem',
                minWidth: '356px',
                maxWidth: '356px',
              }}
            >
              <FilePlus size={18} style={{ color: 'hsl(210, 100%, 60%)', flexShrink: 0 }} />
              <span>
                <strong style={{ color: 'hsl(210, 100%, 60%)', fontWeight: 600 }}>{fileName}</strong> created via SSH.
              </span>
            </div>
          </div>
        ),
        { duration: 8000 }
      );
    });

    socket.on('file:deleted', (data: { path: string; message: string }) => {
      // Extract filename from path
      const fileName = data.path.split('/').pop() || data.path;

      toast.custom(
        (t) => (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => toast.dismiss(t)}
              style={{
                position: 'absolute',
                right: '-10px',
                top: '-10px',
                background: 'hsl(225, 25%, 12%)',
                border: '1px solid hsl(225, 15%, 18%)',
                borderRadius: '0.375rem',
                width: '20px',
                height: '20px',
                color: 'hsl(210, 40%, 92%)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0.8,
                transition: 'opacity 0.2s',
                zIndex: 10,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.8')}
            >
              <X size={12} />
            </button>
            <div
              style={{
                background: 'hsl(225, 25%, 12%, 0.95)',
                border: '1px solid hsl(0, 85%, 60%, 0.6)',
                borderRadius: '0.5rem',
                padding: '0.875rem 1rem',
                color: 'hsl(210, 40%, 92%)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                boxShadow: '0 0 12px hsl(0, 85%, 60%, 0.3), 0 0 4px hsl(0, 85%, 60%, 0.2)',
                fontSize: '0.875rem',
                minWidth: '356px',
                maxWidth: '356px',
              }}
            >
              <Trash2 size={18} style={{ color: 'hsl(0, 85%, 60%)', flexShrink: 0 }} />
              <span>
                <strong style={{ color: 'hsl(0, 85%, 60%)', fontWeight: 600 }}>{fileName}</strong> deleted via SSH.
              </span>
            </div>
          </div>
        ),
        { duration: 8000 }
      );
    });

    return () => {
      socket.off('file:changed');
      socket.off('file:added');
      socket.off('file:deleted');
    };
  }, []);

  // Check for URL parameter to open New User dialog
  useEffect(() => {
    const openNewUser = searchParams.get('openNewUser');
    if (openNewUser === 'true') {
      setIsNewUserDialogOpen(true);
      // Remove the parameter from URL
      router.replace('/');
    }
  }, [searchParams, router]);

  const handleNewUserSuccess = async (username: string) => {
    customToast.success(`User "${username}" created successfully`);

    // Reload file tree immediately to show new file in command palette
    try {
      const updatedTree = await getFileTree();
      setFileTree(updatedTree);
      console.log('File tree refreshed after user creation');

      // Automatically open the newly created user file in editor
      const userFilePath = `/etc/freeradius/3.0/mods-config/files/users.d/${username}`;
      setActiveFile(userFilePath);
      console.log('Opened newly created user file:', userFilePath);
    } catch (error) {
      console.error('Failed to refresh file tree:', error);
    }
  };

  const handleNewUserError = (message: string, validationOutput?: string) => {
    customToast.error(message);
    if (validationOutput && deployConsoleRef.current) {
      deployConsoleRef.current.showValidationError(validationOutput, message);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <StatusHeader
        currentFile={activeFile}
        onNewUserClick={() => setIsNewUserDialogOpen(true)}
      />

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
            <EditorPanel
              filePath={activeFile}
              deployConsoleRef={deployConsoleRef}
            />
          </div>

          {/* Deploy Console */}
          <DeployConsole ref={deployConsoleRef} />
        </div>
      </div>

      {/* Command Palette */}
      <CommandPalette onFileSelect={setActiveFile} fileTree={fileTree} />

      {/* New User Dialog */}
      <NewUserDialog
        isOpen={isNewUserDialogOpen}
        onClose={() => setIsNewUserDialogOpen(false)}
        onSuccess={handleNewUserSuccess}
        onError={handleNewUserError}
      />
    </div>
  );
}
