'use client';

import { useEffect, useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
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
        console.log('File loaded, content length:', data.content.length);
        console.log('First 100 chars:', data.content.substring(0, 100));
        setContent(data.content);
        setMtime(data.mtime);
        setIsModified(false);
      } catch (error) {
        console.error('Failed to load file:', error);
        toast.error('Failed to load file');
      } finally {
        setIsLoading(false);
      }
    };

    loadFile();
  }, [filePath]);

  useEffect(() => {
    const handleSave = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSaveFile();
      }
    };

    document.addEventListener('keydown', handleSave);
    return () => document.removeEventListener('keydown', handleSave);
  }, [content, mtime]);

  const handleSaveFile = async (force = false) => {
    setIsSaving(true);
    try {
      const result = await saveFile(filePath, content, mtime, force);

      if (result.status === 'conflict' && result.disk_content) {
        onConflict?.(result.disk_content, content);
      } else if (result.status === 'success') {
        setMtime(result.mtime || Date.now());
        setIsModified(false);
        toast.success('File saved successfully');
      }
    } catch (error) {
      toast.error('Failed to save file');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    setContent(value || '');
    setIsModified(true);
  };

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;

    // Define custom theme
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
      <div className="flex-1 relative bg-[#1e1e1e] min-h-0">
        <Editor
          key={filePath}
          height="100%"
          width="100%"
          defaultLanguage="ini"
          value={content}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          loading={
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          }
          options={{
            minimap: { enabled: true },
            fontSize: 13,
            lineNumbers: 'on',
            renderWhitespace: 'selection',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            wordWrap: 'off',
            fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
            readOnly: false,
          }}
        />
        {/* Debug overlay */}
        <div className="absolute top-2 right-2 z-10 text-xs text-white bg-black/80 px-2 py-1 rounded border border-gray-600">
          {content.length} chars | {filePath.split('/').pop()}
        </div>
      </div>
    </div>
  );
}

