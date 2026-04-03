'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { Loader2 } from 'lucide-react';
import { getFileContent, saveFile } from '@/lib/api';
import { toast } from 'sonner';
import { EditorTopBar } from '@/components/editor-top-bar';

interface EditorPanelProps {
  filePath: string;
  onConflict?: (diskContent: string, localContent: string) => void;
}

export function EditorPanel({ filePath, onConflict }: EditorPanelProps) {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModified, setIsModified] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [mtime, setMtime] = useState<number | null>(null);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    const loadFile = async () => {
      setIsLoading(true);
      console.log('Loading file:', filePath);
      try {
        const data = await getFileContent(filePath);
        console.log('API Response:', data);

        if (!data || !data.content) {
          console.error('Invalid response from API:', data);
          toast.error('Invalid file data received');
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
        toast.error('Failed to load file: ' + (error instanceof Error ? error.message : String(error)));
        setContent('');
      } finally {
        setIsLoading(false);
      }
    };

    if (filePath) {
      loadFile();
    }
  }, [filePath]);

  const handleSaveFile = useCallback(async (forceOrEvent?: boolean | any) => {
    // Handle both direct calls and event handler calls
    const force = typeof forceOrEvent === 'boolean' ? forceOrEvent : false;

    setIsSaving(true);
    console.log('💾 Saving file:', filePath, 'Content length:', content.length, 'mtime:', mtime, 'force:', force);
    try {
      const result = await saveFile(filePath, content, mtime, force);
      console.log('💾 Save result:', result);

      if (result.status === 'conflict' && result.disk_content) {
        console.warn('⚠️  Conflict detected');
        onConflict?.(result.disk_content, content);
        toast.warning('File was modified externally. Please resolve the conflict.');
      } else if (result.status === 'success') {
        console.log('✅ File saved successfully');
        setMtime(result.mtime || Date.now());
        setIsModified(false);
        toast.success('File saved successfully');
      }
    } catch (error) {
      console.error('❌ Save error:', error);
      toast.error('Failed to save file: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsSaving(false);
    }
  }, [filePath, content, mtime, onConflict]);

  useEffect(() => {
    const handleSave = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSaveFile();
      }
    };

    document.addEventListener('keydown', handleSave);
    return () => document.removeEventListener('keydown', handleSave);
  }, [handleSaveFile]);

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

  const handleCopyPath = () => {
    navigator.clipboard.writeText(filePath);
    toast.success('File path copied to clipboard');
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all changes?')) {
      // Reload file content
      getFileContent(filePath).then(data => {
        setContent(data.content);
        setIsModified(false);
        toast.success('Changes reset');
      });
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-card">
      {/* Editor Top Bar */}
      <EditorTopBar
        filePath={filePath}
        fileName={filePath.split('/').pop()}
        isModified={isModified}
        onCopy={handleCopyPath}
        onReset={handleReset}
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
    </div>
  );
}

