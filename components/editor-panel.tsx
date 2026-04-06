'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { Loader2 } from 'lucide-react';
import { getFileContent, saveFile } from '@/lib/api';
import { customToast } from '@/lib/custom-toast';
import { EditorTopBar } from '@/components/editor-top-bar';
import { EditorEmptyState } from '@/components/editor-empty-state';
import { ConfirmDialog } from '@/components/confirm-dialog';
import type { DeployConsoleHandle } from '@/components/deploy-console';

interface EditorPanelProps {
  filePath: string;
  onConflict?: (diskContent: string, localContent: string) => void;
  deployConsoleRef?: React.RefObject<DeployConsoleHandle>;
}

export function EditorPanel({ filePath, onConflict, deployConsoleRef }: EditorPanelProps) {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModified, setIsModified] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [mtime, setMtime] = useState<number | null>(null);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const editorRef = useRef<any>(null);

  // Use refs to always have access to latest values in keyboard shortcuts
  const contentRef = useRef<string>(content);
  const mtimeRef = useRef<number | null>(mtime);
  const filePathRef = useRef<string>(filePath);

  // Keep refs in sync with state
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    mtimeRef.current = mtime;
  }, [mtime]);

  useEffect(() => {
    filePathRef.current = filePath;
  }, [filePath]);

  useEffect(() => {
    const loadFile = async () => {
      setIsLoading(true);
      console.log('Loading file:', filePath);
      try {
        const data = await getFileContent(filePath);
        console.log('API Response:', data);

        if (!data || !data.content) {
          console.error('Invalid response from API:', data);
          customToast.error('Invalid file data received');
          setContent('');
          return;
        }

        console.log('File loaded, content length:', data.content.length);
        console.log('First 100 chars:', data.content.substring(0, 100));
        setContent(data.content);
        setMtime(data.mtime);
        setIsModified(false);
      } catch (error) {
        console.error('Failed to load file:', error);
        customToast.error('Failed to load file: ' + (error instanceof Error ? error.message : String(error)));
        setContent('');
      } finally {
        setIsLoading(false);
      }
    };

    if (filePath) {
      loadFile();
    } else {
      // No file selected, reset state immediately
      setIsLoading(false);
      setContent('');
      setIsModified(false);
      setMtime(null);
    }
  }, [filePath]);

  // Updated handleSaveFile to use refs for latest values
  // This prevents stale closure issues with keyboard shortcuts
  const handleSaveFile = useCallback(async (forceOrEvent?: boolean | any) => {
    // Handle both direct calls and event handler calls
    const force = typeof forceOrEvent === 'boolean' ? forceOrEvent : false;

    // Use refs to get the LATEST values (not stale closure values)
    const currentFilePath = filePathRef.current;
    const currentContent = contentRef.current;
    const currentMtime = mtimeRef.current;

    setIsSaving(true);
    console.log('💾 Saving file:', currentFilePath, 'Content length:', currentContent.length, 'mtime:', currentMtime, 'force:', force);
    try {
      const result = await saveFile(currentFilePath, currentContent, currentMtime, force);
      console.log('💾 Save result:', result);

      if (result.status === 'conflict' && result.disk_content) {
        console.warn('⚠️  Conflict detected');
        onConflict?.(result.disk_content, currentContent);
        customToast.warning('File was modified externally. Please resolve the conflict.');
      } else if (result.status === 'validation_failed') {
        console.warn('⚠️  Validation failed');
        // Update mtime to match rolled-back file on disk
        if (result.mtime) {
          setMtime(result.mtime);
        }
        // Open deploy console with validation errors
        if (deployConsoleRef?.current) {
          deployConsoleRef.current.showValidationError(
            result.validationOutput || '',
            result.validationError
          );
        }
        customToast.error('Configuration validation failed. Changes were not saved.');
      } else if (result.status === 'success') {
        console.log('✅ File saved and validated successfully');
        setMtime(result.mtime || Date.now());
        setIsModified(false);
        customToast.success('Configuration saved and service reloaded');
      }
    } catch (error) {
      console.error('❌ Save error:', error);
      customToast.error('Failed to save file: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsSaving(false);
    }
  }, [onConflict]); // Only onConflict in dependencies now

  // Note: We removed the document-level keyboard listener to avoid conflicts
  // Monaco editor has its own keyboard shortcut system (see handleEditorDidMount)

  const handleEditorChange = (value: string | undefined) => {
    setContent(value || '');
    setIsModified(true);
  };

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Define the custom "radius-dark" theme
    monaco.editor.defineTheme("radius-dark", {
      base: "vs-dark",
      inherit: true,

      // Syntax highlighting token colors
      rules: [
        { token: "comment", foreground: "5c6a7a", fontStyle: "italic" },
        { token: "keyword", foreground: "7aa2f7" },
        { token: "string", foreground: "9ece6a" },
        { token: "number", foreground: "ff9e64" },
        { token: "variable", foreground: "bb9af7" },
      ],

      // Editor UI colors
      colors: {
        // Main editor background (deep dark navy-black)
        "editor.background": "#0d1117",

        // Text foreground (light gray-blue)
        "editor.foreground": "#c9d1d9",

        // Current line highlight (subtle dark)
        "editor.lineHighlightBackground": "#161b22",

        // Text selection (blue tint)
        "editor.selectionBackground": "#264f78",

        // Cursor color (neon blue)
        "editorCursor.foreground": "#58a6ff",

        // Selection match highlight
        "editor.selectionHighlightBackground": "#3a3d41",

        // Line numbers (muted gray)
        "editorLineNumber.foreground": "#3b4252",

        // Active line number (neon blue)
        "editorLineNumber.activeForeground": "#7aa2f7",

        // Indent guides (very subtle)
        "editorIndentGuide.background": "#1e2430",
        "editorIndentGuide.activeBackground": "#2a3040",

        // Gutter (left margin with line numbers)
        "editorGutter.background": "#0d1117",

        // Minimap background
        "minimap.background": "#0d1117",

        // Scrollbar
        "scrollbar.shadow": "#00000000",
        "scrollbarSlider.background": "#2a3040",
        "scrollbarSlider.hoverBackground": "#3a4050",
      },
    });

    // Apply the theme
    monaco.editor.setTheme("radius-dark");

    // Add keyboard shortcut for save (Ctrl/Cmd + S)
    editor.addAction({
      id: "save-file",
      label: "Save File",
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
      run: () => {
        handleSaveFile();
      },
    });

    // Set tab size
    editor.getModel()?.updateOptions({ tabSize: 4 });
  };

  // Show empty state when no file is selected
  if (!filePath) {
    return <EditorEmptyState />;
  }

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-card">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading {filePath}...</p>
        </div>
      </div>
    );
  }

  console.log('Rendering editor with content length:', content.length);
  console.log('Content preview:', content.substring(0, 200));

  const handleCopyPath = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(filePath);
        customToast.success('File path copied to clipboard');
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = filePath;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          customToast.success('File path copied to clipboard');
        } catch (err) {
          customToast.error('Failed to copy to clipboard');
        }
        document.body.removeChild(textArea);
      }
    } catch (error) {
      console.error('Failed to copy:', error);
      customToast.error('Failed to copy to clipboard');
    }
  };

  const handleResetClick = () => {
    setIsResetDialogOpen(true);
  };

  const handleResetConfirm = () => {
    // Reload file content
    getFileContent(filePath).then(data => {
      setContent(data.content);
      setIsModified(false);
      customToast.success('Changes reset');
    });
    setIsResetDialogOpen(false);
  };

  return (
    <div className="h-full w-full flex flex-col bg-card">
      {/* Editor Top Bar */}
      <EditorTopBar
        filePath={filePath}
        fileName={filePath.split('/').pop()}
        isModified={isModified}
        onCopy={handleCopyPath}
        onReset={handleResetClick}
        onSave={handleSaveFile}
        isSaving={isSaving}
      />

      {/* Monaco Editor */}
      <div className="flex-1 relative bg-[#0d1117] min-h-0">
        <Editor
          key={filePath}
          height="100%"
          width="100%"
          defaultLanguage="ini"
          value={content}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          theme="radius-dark"
          loading={
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          }
          options={{
            // Typography
            fontSize: 13,
            fontFamily: "var(--font-jetbrains-mono), 'JetBrains Mono', monospace",
            fontLigatures: true,
            lineHeight: 20,

            // Minimap
            minimap: {
              enabled: true,
              scale: 1,
              showSlider: "mouseover"
            },

            // Behavior
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            automaticLayout: true,
            tabSize: 4,
            wordWrap: 'off',
            readOnly: false,

            // Visual
            renderWhitespace: "selection",
            bracketPairColorization: { enabled: true },
            padding: { top: 12 },

            // UI Elements
            overviewRulerBorder: false,
            hideCursorInOverviewRuler: true,

            // Scrollbar
            scrollbar: {
              verticalScrollbarSize: 6,
              horizontalScrollbarSize: 6,
            },
          }}
        />
      </div>

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isResetDialogOpen}
        onClose={() => setIsResetDialogOpen(false)}
        onConfirm={handleResetConfirm}
        title="Reset Changes"
        description={`Are you sure you want to reset all changes to "${filePath.split('/').pop()}"? This will discard all unsaved modifications.`}
        confirmText="Reset"
        cancelText="Cancel"
        variant="warning"
      />
    </div>
  );
}

