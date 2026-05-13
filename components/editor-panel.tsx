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
  deployConsoleRef?: React.RefObject<DeployConsoleHandle>;
  onDeleteDictionary?: (fileName: string) => void;
}

export function EditorPanel({ filePath, deployConsoleRef, onDeleteDictionary }: EditorPanelProps) {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModified, setIsModified] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [mtime, setMtime] = useState<number | null>(null);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
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

        // Check if response is valid (content can be empty string for new files)
        if (!data || data.content === undefined || data.content === null) {
          console.error('Invalid response from API:', data);
          customToast.error('Invalid file data received');
          setContent('');
          return;
        }

        console.log('File loaded, content length:', data.content.length);
        if (data.content.length > 0) {
          console.log('First 100 chars:', data.content.substring(0, 100));
        } else {
          console.log('File is empty (new file)');
        }

        // Warn for large files (> 5MB)
        const sizeInMB = data.content.length / (1024 * 1024);
        if (sizeInMB > 5) {
          customToast.warning(
            `Large file detected (${sizeInMB.toFixed(1)}MB). Save operations may take 1-2 minutes.`,
            8000
          );
        }
        setContent(data.content);
        setMtime(data.mtime);
        setIsReadOnly(data.readOnly || false);
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
      setIsReadOnly(false);
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

    // Check file size and show appropriate message
    const sizeInMB = currentContent.length / (1024 * 1024);
    if (sizeInMB > 5) {
      customToast.info(
        `Saving large file (${sizeInMB.toFixed(1)}MB)... This may take up to 2 minutes. Please wait.`,
        10000
      );
    }

    setIsSaving(true);
    console.log('💾 Saving file:', currentFilePath, 'Content length:', currentContent.length, 'mtime:', currentMtime);
    try {
      const result = await saveFile(currentFilePath, currentContent, currentMtime, force);
      console.log('💾 Save result:', result);

      if (result.status === 'validation_failed') {
        console.warn('⚠️  Validation failed');
        // Update mtime to match rolled-back file on disk
        // This is critical: when validation fails, the backend rolls back the file
        // We need to update our mtime to match the rolled-back version
        // Otherwise the next save attempt would think there's a conflict
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
        // Reset console back to deploy mode after successful save
        if (deployConsoleRef?.current) {
          deployConsoleRef.current.resetToDeployMode();
        }
        customToast.success('Configuration saved and service reloaded');
      }
    } catch (error) {
      console.error('❌ Save error:', error);
      customToast.error('Failed to save file: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsSaving(false);
    }
  }, []); // No dependencies needed - we use refs for all values

  // Note: We removed the document-level keyboard listener to avoid conflicts
  // Monaco editor has its own keyboard shortcut system (see handleEditorDidMount)

  const handleEditorChange = (value: string | undefined) => {
    // Prevent changes to read-only files
    if (isReadOnly) {
      return;
    }
    const newValue = value || '';
    // Only update state if the value actually changed
    // This prevents unnecessary re-renders that can cause the first character skip bug
    if (newValue !== content) {
      setContent(newValue);
      setIsModified(true);
    }
  };

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Set initial content programmatically to avoid controlled component issues
    // This prevents the first character skip bug
    if (content && editor.getValue() !== content) {
      editor.setValue(content);
    }

    // Configure INI language to properly recognize comments after whitespace
    monaco.languages.setLanguageConfiguration('ini', {
      comments: {
        lineComment: '#',
      },
    });

    // Register custom tokenizer for INI files to handle comments properly
    monaco.languages.setMonarchTokensProvider('ini', {
      tokenizer: {
        root: [
          // Comments (# at start of line or after whitespace)
          [/^\s*#.*$/, 'comment'],
          [/#.*$/, 'comment'],

          // Section headers [section]
          [/^\s*\[.*\]/, 'keyword'],

          // Key-value pairs
          [/^\s*[\w\-\.]+\s*[:=]/, 'variable'],

          // Strings (quoted)
          [/"([^"\\]|\\.)*$/, 'string.invalid'],
          [/'([^'\\]|\\.)*$/, 'string.invalid'],
          [/"/, 'string', '@string_double'],
          [/'/, 'string', '@string_single'],

          // Numbers
          [/\d+/, 'number'],
        ],
        string_double: [
          [/[^\\"]+/, 'string'],
          [/\\./, 'string.escape'],
          [/"/, 'string', '@pop'],
        ],
        string_single: [
          [/[^\\']+/, 'string'],
          [/\\./, 'string.escape'],
          [/'/, 'string', '@pop'],
        ],
      },
    });

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

        // Scrollbar (hidden but functional)
        "scrollbar.shadow": "#00000000",
        "scrollbarSlider.background": "transparent",
        "scrollbarSlider.hoverBackground": "transparent",
        "scrollbarSlider.activeBackground": "transparent",
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

    // Add keyboard shortcut for command palette (Ctrl/Cmd + K)
    // This allows the command palette to work even when the editor is focused
    editor.addAction({
      id: "toggle-command-palette",
      label: "Toggle Command Palette",
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK],
      run: () => {
        // Dispatch custom event to toggle command palette
        window.dispatchEvent(new CustomEvent('toggleCommandPalette'));
      },
    });

    // Set tab size
    editor.getModel()?.updateOptions({ tabSize: 4 });

    // Hide scrollbars completely (cross-browser)
    const editorDomNode = editor.getDomNode();
    if (editorDomNode) {
      const style = editorDomNode.style;
      style.setProperty('scrollbar-width', 'none', 'important'); // Firefox
      style.setProperty('-ms-overflow-style', 'none', 'important'); // IE/Edge

      // Hide scrollbars for all child elements
      const scrollableElements = editorDomNode.querySelectorAll('.monaco-scrollable-element');
      scrollableElements.forEach((el: Element) => {
        if (el instanceof HTMLElement) {
          el.style.setProperty('scrollbar-width', 'none', 'important');
          el.style.setProperty('-ms-overflow-style', 'none', 'important');
        }
      });
    }
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
      // Also update editor directly to ensure sync
      if (editorRef.current) {
        editorRef.current.setValue(data.content);
      }
      setIsModified(false);
      customToast.success('Changes reset');
    });
    setIsResetDialogOpen(false);
  };

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!filePath) return;
    const fileName = filePath.split('/').pop();
    if (fileName && onDeleteDictionary) {
      onDeleteDictionary(fileName);
      setIsDeleteDialogOpen(false);
    }
  };

  // Check if this is a dictionary file
  const isDictionaryFile = filePath.includes('/dictionary.d/') && filePath.split('/').pop()?.startsWith('dictionary.');

  return (
    <div className="h-full w-full flex flex-col bg-card">
      {/* Editor Top Bar */}
      <EditorTopBar
        filePath={filePath}
        fileName={filePath.split('/').pop()}
        isModified={isModified}
        isReadOnly={isReadOnly}
        onCopy={handleCopyPath}
        onReset={handleResetClick}
        onSave={handleSaveFile}
        onDelete={isDictionaryFile ? handleDeleteClick : undefined}
        isSaving={isSaving}
      />

      {/* Monaco Editor */}
      <div className="flex-1 relative bg-[#0d1117] min-h-0">
        <Editor
          key={filePath}
          height="100%"
          width="100%"
          defaultLanguage="ini"
          defaultValue={content}
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

            // Minimap - Disable for very large files (> 10k lines) for better performance
            minimap: {
              enabled: content.split('\n').length < 10000,
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
            readOnly: isReadOnly,

            // Visual
            renderWhitespace: "selection",
            bracketPairColorization: { enabled: true },
            padding: { top: 12 },

            // UI Elements
            overviewRulerBorder: false,
            hideCursorInOverviewRuler: true,

            // Performance optimizations for large files
            // These settings improve rendering performance significantly
            largeFileOptimizations: content.length > 1024 * 1024, // Enable for files > 1MB

            // Scrollbar (hidden but functional)
            scrollbar: {
              vertical: 'hidden',
              horizontal: 'hidden',
              verticalScrollbarSize: 0,
              horizontalScrollbarSize: 0,
              useShadows: false,
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Dictionary File"
        description={`Are you sure you want to delete "${filePath.split('/').pop()}"? This will also remove it from the main dictionary file. This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}

