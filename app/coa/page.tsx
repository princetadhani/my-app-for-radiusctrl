'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { Loader2 } from 'lucide-react';
import { StatusHeader } from '@/components/status-header';
import { FileTree } from '@/components/file-tree';
import { CoaConsole, type CoaConsoleHandle } from '@/components/coa-console';
import { CoaEditorTopBar } from '@/components/coa-editor-top-bar';
import { CoaEmptyState } from '@/components/coa-empty-state';
import { CoaCommandPalette } from '@/components/coa-command-palette';
import { CustomDialog } from '@/components/custom-dialog';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { customToast } from '@/lib/custom-toast';
import {
    executeCoaCommand,
    getCoaFileTree,
    getCoaFileContent,
    createCoaFile,
    deleteCoaFile,
    type FileNode
} from '@/lib/api';

// LocalStorage keys
const STORAGE_KEYS = {
    NAS_IP: 'coa_nas_ip',
    NAS_SECRET: 'coa_nas_secret',
    REQUEST_TYPE: 'coa_request_type',
};

export default function CoaPage() {
    const [fileTree, setFileTree] = useState<FileNode[]>([]);
    const [selectedFile, setSelectedFile] = useState<string>('');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [attributes, setAttributes] = useState('');
    const [originalContent, setOriginalContent] = useState('');
    const [isModified, setIsModified] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const editorRef = useRef<any>(null);
    const [requestType, setRequestType] = useState<'coa' | 'disconnect'>('coa');
    const [nasIp, setNasIp] = useState('10.86.1.1');
    const [nasSecret, setNasSecret] = useState('');
    const consoleRef = useRef<CoaConsoleHandle>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

    // Ensure component is mounted before rendering interactive elements
    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        const savedRequestType = localStorage.getItem(STORAGE_KEYS.REQUEST_TYPE);
        const savedNasIp = localStorage.getItem(STORAGE_KEYS.NAS_IP);
        const savedNasSecret = localStorage.getItem(STORAGE_KEYS.NAS_SECRET);
        if (savedRequestType) setRequestType(savedRequestType as 'coa' | 'disconnect');
        if (savedNasIp) setNasIp(savedNasIp);
        if (savedNasSecret) setNasSecret(savedNasSecret);
    }, []);

    useEffect(() => {
        getCoaFileTree().then(setFileTree).catch(() => customToast.error('Failed to load COA files'));
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEYS.NAS_IP, nasIp);
            localStorage.setItem(STORAGE_KEYS.NAS_SECRET, nasSecret);
            localStorage.setItem(STORAGE_KEYS.REQUEST_TYPE, requestType);
        }
    }, [nasIp, nasSecret, requestType]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsCommandPaletteOpen(prev => !prev);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleFileSelect = useCallback(async (path: string) => {
        try {
            setIsLoading(true);
            setSelectedFile(path);
            const fileName = path.split('/').pop() || '';
            const content = await getCoaFileContent(fileName);
            setAttributes(content);
            setOriginalContent(content);
            setIsModified(false);
        } catch (error) {
            customToast.error('Failed to load file content');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleEditorChange = (value: string | undefined) => {
        setAttributes(value || '');
        setIsModified(true);
    };

    const handleSaveFile = useCallback(async () => {
        if (!selectedFile) return;
        try {
            setIsSaving(true);
            const fileName = selectedFile.split('/').pop() || '';
            await createCoaFile(fileName, attributes);
            setOriginalContent(attributes);
            setIsModified(false);
            customToast.success('File saved successfully');
        } catch (error) {
            customToast.error('Failed to save file');
        } finally {
            setIsSaving(false);
        }
    }, [selectedFile, attributes]);

    const handleEditorDidMount: OnMount = useCallback((editor, monaco) => {
        editorRef.current = editor;
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, async () => {
            // Call save directly without checking state inside the callback
            // The state will be checked when the function executes
            await handleSaveFile();
        });
        monaco.editor.defineTheme('radius-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
                { token: 'string', foreground: '9CDCFE' },
                { token: 'number', foreground: 'B5CEA8' },
            ],
            colors: {
                'editor.background': '#0d1117',
                'editor.foreground': '#c9d1d9',
                'editor.lineHighlightBackground': '#161b22',
                'editorLineNumber.foreground': '#6e7681',
                'editor.selectionBackground': '#1f6feb40',
                'editorCursor.foreground': '#7aa2f7',
            },
        });
        monaco.editor.setTheme('radius-dark');
    }, [handleSaveFile]);

    const handleResetClick = () => {
        setIsResetDialogOpen(true);
    };

    const handleResetConfirm = () => {
        setAttributes(originalContent);
        setIsModified(false);
        setIsResetDialogOpen(false);
        customToast.success('Changes reset');
    };

    const handleCopyPath = useCallback(async () => {
        if (!selectedFile) {
            customToast.error('No file selected');
            return;
        }

        try {
            // Use the same approach as the main editor
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(selectedFile);
                customToast.success('File path copied to clipboard');
            } else {
                // Fallback method
                const textArea = document.createElement('textarea');
                textArea.value = selectedFile;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
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
    }, [selectedFile]);

    const handleCreateFile = async (fileName: string) => {
        try {
            const fullFileName = fileName.endsWith('.txt') ? fileName : `${fileName}.txt`;
            await createCoaFile(fullFileName, '');
            const tree = await getCoaFileTree();
            setFileTree(tree);
            const coaDir = '/etc/freeradius/3.0/coa';
            const newFilePath = `${coaDir}/${fullFileName}`;
            setSelectedFile(newFilePath);
            const fileContent = await getCoaFileContent(fullFileName);
            setAttributes(fileContent);
            setOriginalContent(fileContent);
            setIsModified(false);
            customToast.success('File created successfully');
        } catch (error) {
            customToast.error('Failed to create file');
        }
    };

    const handleDeleteFile = async () => {
        if (!selectedFile) return;
        const fileName = selectedFile.split('/').pop() || '';
        try {
            await deleteCoaFile(fileName);
            const tree = await getCoaFileTree();
            setFileTree(tree);
            setSelectedFile('');
            setAttributes('');
            setOriginalContent('');
            setIsDeleteDialogOpen(false);
            customToast.success('File deleted successfully');
        } catch (error) {
            customToast.error('Failed to delete file');
        }
    };

    const handleSend = async (): Promise<{ success: boolean; output: string }> => {
        if (!selectedFile || !consoleRef.current) {
            customToast.error('Please select a COA file first');
            return { success: false, output: '' };
        }
        const fileName = selectedFile.split('/').pop() || '';
        const fullPath = `/etc/freeradius/3.0/coa/${fileName}`;
        await consoleRef.current.addLine(`$ sudo radclient -f ${fullPath} -x -r 1 ${nasIp} ${requestType} ${nasSecret}`, 'cmd', 0);
        await consoleRef.current.addLine(`Connecting to NAS ${nasIp}:3799...`, 'info', 300);
        await consoleRef.current.addLine(`Sending ${requestType.toUpperCase()} request...`, 'info', 200);
        try {
            const result = await executeCoaCommand({ type: requestType, nasIp, nasSecret, attributes, fileName });
            const outputLines = result.output.split('\n').filter(line => line.trim());
            for (const line of outputLines) {
                const lineType = line.includes('error') || line.includes('failed') ? 'error' : 'info';
                await consoleRef.current.addLine(line, lineType, 100);
            }
            if (result.success) {
                await consoleRef.current.addLine('✓ COA request sent successfully', 'final-success', 400);
                customToast.success('COA request sent successfully');
            } else {
                await consoleRef.current.addLine('✗ COA request failed', 'final-error', 300);
                customToast.error('COA request failed');
            }
            return result;
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            await consoleRef.current.addLine(`✗ Error: ${errorMsg}`, 'final-error', 100);
            customToast.error('Failed to send COA request');
            return { success: false, output: '' };
        }
    };

    return (
        <div className="h-screen flex flex-col overflow-hidden">
            <StatusHeader currentFile={selectedFile} />
            <div className="flex-1 flex overflow-hidden" style={{ paddingTop: '3rem' }}>
                <FileTree
                    nodes={fileTree}
                    activeFile={selectedFile}
                    onFileSelect={handleFileSelect}
                    isCollapsed={isSidebarCollapsed}
                    onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                />
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    <CoaEditorTopBar
                        filePath={selectedFile}
                        fileName={selectedFile ? selectedFile.split('/').pop() : undefined}
                        isModified={isModified}
                        onCopy={handleCopyPath}
                        onReset={handleResetClick}
                        onSave={handleSaveFile}
                        onNew={() => setIsCreateDialogOpen(true)}
                        onDelete={() => setIsDeleteDialogOpen(true)}
                        isSaving={isSaving}
                        isMounted={isMounted}
                    />
                    <div className="flex-1 min-h-0 overflow-hidden relative bg-card">
                        {!selectedFile ? (
                            <CoaEmptyState />
                        ) : (
                            <Editor
                                key={selectedFile}
                                height="100%"
                                width="100%"
                                defaultLanguage="ini"
                                value={attributes}
                                onChange={handleEditorChange}
                                onMount={handleEditorDidMount}
                                theme="radius-dark"
                                loading={<div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}
                                options={{
                                    fontSize: 13,
                                    fontFamily: "var(--font-jetbrains-mono), 'JetBrains Mono', monospace",
                                    fontLigatures: true,
                                    lineHeight: 20,
                                    minimap: { enabled: true, scale: 1, showSlider: "mouseover" },
                                    scrollBeyondLastLine: false,
                                    smoothScrolling: true,
                                    cursorBlinking: "smooth",
                                    cursorSmoothCaretAnimation: "on",
                                    automaticLayout: true,
                                    tabSize: 4,
                                    wordWrap: 'off',
                                    renderWhitespace: "selection",
                                    bracketPairColorization: { enabled: true },
                                    padding: { top: 12 },
                                    overviewRulerBorder: false,
                                    hideCursorInOverviewRuler: true,
                                    scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
                                }}
                            />
                        )}
                    </div>
                    <CoaConsole
                        ref={consoleRef}
                        nasIp={nasIp}
                        nasSecret={nasSecret}
                        requestType={requestType}
                        selectedFileName={selectedFile ? selectedFile.split('/').pop() : undefined}
                        onNasIpChange={setNasIp}
                        onNasSecretChange={setNasSecret}
                        onRequestTypeChange={setRequestType}
                        onSend={handleSend}
                        disabled={!selectedFile}
                    />
                </div>
            </div>
            <CoaCommandPalette
                isOpen={isCommandPaletteOpen}
                onClose={() => setIsCommandPaletteOpen(false)}
                fileTree={fileTree}
                onFileSelect={handleFileSelect}
                onCreateNew={() => { setIsCommandPaletteOpen(false); setIsCreateDialogOpen(true); }}
            />
            <CustomDialog
                isOpen={isCreateDialogOpen}
                onClose={() => setIsCreateDialogOpen(false)}
                onConfirm={handleCreateFile}
                title="Create New COA File"
                description="Enter a name for your COA configuration file. The .txt extension will be added automatically."
                placeholder="e.g. disconnect_user"
                confirmText="Create"
                cancelText="Cancel"
            />
            <ConfirmDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={handleDeleteFile}
                title="Delete COA File"
                description={`Are you sure you want to delete "${selectedFile?.split('/').pop()}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
            />
            <ConfirmDialog
                isOpen={isResetDialogOpen}
                onClose={() => setIsResetDialogOpen(false)}
                onConfirm={handleResetConfirm}
                title="Reset Changes"
                description={`Are you sure you want to reset all changes to "${selectedFile?.split('/').pop()}"? This will discard all unsaved modifications.`}
                confirmText="Reset"
                cancelText="Cancel"
                variant="warning"
            />
        </div>
    );
}
