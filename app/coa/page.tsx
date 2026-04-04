'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { StatusHeader } from '@/components/status-header';
import { FileTree } from '@/components/file-tree';
import { CoaConsole, type CoaConsoleHandle } from '@/components/coa-console';
import { CustomDialog } from '@/components/custom-dialog';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { toast } from 'sonner';
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
    // File tree state
    const [fileTree, setFileTree] = useState<FileNode[]>([]);
    const [selectedFile, setSelectedFile] = useState<string>('');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // Editor state
    const [attributes, setAttributes] = useState('User-Name = "testuser"\nFramed-IP-Address = "192.168.1.100"');
    const [isModified, setIsModified] = useState(false);
    const editorRef = useRef<any>(null);

    // COA request state - Initialize with defaults first (to avoid hydration mismatch)
    const [requestType, setRequestType] = useState<'coa' | 'disconnect'>('disconnect');
    const [nasIp, setNasIp] = useState('192.168.1.1');
    const [nasSecret, setNasSecret] = useState('testing123');

    // Console ref
    const consoleRef = useRef<CoaConsoleHandle>(null);

    // Dialog state
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // Load from localStorage after hydration (client-side only)
    useEffect(() => {
        // Load saved values from localStorage
        const savedRequestType = localStorage.getItem(STORAGE_KEYS.REQUEST_TYPE);
        const savedNasIp = localStorage.getItem(STORAGE_KEYS.NAS_IP);
        const savedNasSecret = localStorage.getItem(STORAGE_KEYS.NAS_SECRET);

        if (savedRequestType) {
            setRequestType(savedRequestType as 'coa' | 'disconnect');
        }
        if (savedNasIp) {
            setNasIp(savedNasIp);
        }
        if (savedNasSecret) {
            setNasSecret(savedNasSecret);
        }
    }, []);

    // Load COA file tree on mount
    useEffect(() => {
        const loadFileTree = async () => {
            try {
                const tree = await getCoaFileTree();
                setFileTree(tree);
            } catch (error) {
                console.error('Failed to load COA file tree:', error);
                toast.error('Failed to load COA files');
            }
        };

        loadFileTree();
    }, []);

    // Save settings to localStorage when they change
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEYS.NAS_IP, nasIp);
        }
    }, [nasIp]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEYS.NAS_SECRET, nasSecret);
        }
    }, [nasSecret]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEYS.REQUEST_TYPE, requestType);
        }
    }, [requestType]);



    // Handle file selection
    const handleFileSelect = async (path: string) => {
        try {
            setSelectedFile(path);
            // Extract filename from full path
            const fileName = path.split('/').pop() || '';
            const content = await getCoaFileContent(fileName);
            setAttributes(content);
            setIsModified(false);
        } catch (error) {
            console.error('Failed to load file:', error);
            toast.error('Failed to load file content');
        }
    };

    // Handle editor changes
    const handleEditorChange = (value: string | undefined) => {
        setAttributes(value || '');
        setIsModified(true);
    };

    const handleEditorDidMount = (editor: any, monaco: any) => {
        editorRef.current = editor;

        // Add Cmd+S / Ctrl+S keyboard shortcut to save
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
            if (selectedFile && isModified) {
                handleSaveFile();
            }
        });

        // Define custom theme matching dark navy blue
        monaco.editor.defineTheme('radius-theme', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
                { token: 'string', foreground: '9CDCFE' },
                { token: 'number', foreground: 'B5CEA8' },
            ],
            colors: {
                'editor.background': '#0d1117',
                'editor.lineHighlightBackground': '#161b22',
                'editorLineNumber.foreground': '#8b949e',
                'editor.selectionBackground': '#1f6feb40',
            },
        });
        monaco.editor.setTheme('radius-theme');
    };

    // Save file
    const handleSaveFile = async () => {
        if (!selectedFile) {
            toast.error('No file selected');
            return;
        }

        try {
            const fileName = selectedFile.split('/').pop() || '';
            await createCoaFile(fileName, attributes);
            setIsModified(false);
            toast.success('File saved successfully');
        } catch (error) {
            console.error('Failed to save file:', error);
            toast.error('Failed to save file');
        }
    };

    // Create new file
    const handleCreateFile = async (fileName: string) => {
        try {
            const fullFileName = fileName.endsWith('.txt') ? fileName : `${fileName}.txt`;
            await createCoaFile(fullFileName, attributes);

            // Reload file tree
            const tree = await getCoaFileTree();
            setFileTree(tree);

            // Auto-load the created file
            const coaDir = '/etc/freeradius/3.0/coa';
            const newFilePath = `${coaDir}/${fullFileName}`;
            setSelectedFile(newFilePath);
            setIsModified(false);

            toast.success('File created successfully');
        } catch (error) {
            console.error('Failed to create file:', error);
            toast.error('Failed to create file');
        }
    };

    // Delete file
    const handleDeleteFile = async () => {
        if (!selectedFile) {
            toast.error('No file selected');
            return;
        }

        const fileName = selectedFile.split('/').pop() || '';

        try {
            await deleteCoaFile(fileName);

            // Reload file tree
            const tree = await getCoaFileTree();
            setFileTree(tree);

            setSelectedFile('');
            setAttributes('');
            setIsDeleteDialogOpen(false);
            toast.success('File deleted successfully');
        } catch (error) {
            console.error('Failed to delete file:', error);
            toast.error('Failed to delete file');
        }
    };

    // Send COA command
    const handleSend = async (): Promise<{ success: boolean; output: string }> => {
        if (!selectedFile) {
            toast.error('Please select a COA file first');
            return { success: false, output: '' };
        }

        if (!consoleRef.current) {
            return { success: false, output: '' };
        }

        const fileName = selectedFile.split('/').pop() || '';
        const fullPath = `/etc/freeradius/3.0/coa/${fileName}`;

        // Show command
        await consoleRef.current.addLine(`$ sudo radclient -f ${fullPath} -x -r 1 ${nasIp} ${requestType} ${nasSecret}`, 'cmd', 0);
        await consoleRef.current.addLine(`Connecting to NAS ${nasIp}:3799...`, 'info', 300);
        await consoleRef.current.addLine(`Sending ${requestType.toUpperCase()} request...`, 'info', 200);

        try {
            const result = await executeCoaCommand({
                type: requestType,
                nasIp,
                nasSecret,
                attributes,
                fileName,
            });

            // Parse and display output
            const outputLines = result.output.split('\n').filter(line => line.trim());
            for (const line of outputLines) {
                const lineType = line.includes('error') || line.includes('failed') ? 'error' : 'info';
                await consoleRef.current.addLine(line, lineType, 100);
            }

            if (result.success) {
                await consoleRef.current.addLine('✓ COA request sent successfully', 'final-success', 400);
                toast.success('COA request sent successfully');
            } else {
                await consoleRef.current.addLine('✗ COA request failed', 'final-error', 300);
                toast.error('COA request failed');
            }

            return result;
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            await consoleRef.current.addLine(`✗ Error: ${errorMsg}`, 'final-error', 100);
            toast.error('Failed to send COA request');
            return { success: false, output: '' };
        }
    };



    return (
        <div className="h-screen flex flex-col overflow-hidden">
            {/* Header */}
            <StatusHeader currentFile={selectedFile} />

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden" style={{ paddingTop: '3rem' }}>
                {/* Sidebar - File Tree */}
                <FileTree
                    nodes={fileTree}
                    activeFile={selectedFile}
                    onFileSelect={handleFileSelect}
                    isCollapsed={isSidebarCollapsed}
                    onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                />

                {/* Editor Area */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    {/* Top Toolbar */}
                    <div
                        className="h-10 border-b flex items-center justify-between px-4"
                        style={{
                            backgroundColor: 'rgba(18, 23, 35, 0.6)',
                            backdropFilter: 'blur(16px) saturate(1.2)',
                            borderBottomColor: 'hsl(225, 15%, 18%)',
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-mono" style={{ color: '#c9d1d9' }}>
                                {selectedFile ? selectedFile.split('/').pop() : 'No file selected'}
                            </span>
                            {isModified && (
                                <span className="text-xs" style={{ color: '#ff9e64' }}>● Modified</span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {/* New Button */}
                            <button
                                onClick={() => setIsCreateDialogOpen(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all relative overflow-hidden group"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(122, 162, 247, 0.15), rgba(187, 154, 247, 0.15))',
                                    border: '1px solid rgba(122, 162, 247, 0.3)',
                                    color: '#7aa2f7',
                                }}
                                title="Create new COA file (Ctrl+N)"
                            >
                                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                <Plus className="w-3.5 h-3.5 relative z-10" />
                                <span className="relative z-10">New</span>
                            </button>

                            {/* Delete Button */}
                            <button
                                onClick={() => setIsDeleteDialogOpen(true)}
                                disabled={!selectedFile}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all relative overflow-hidden group disabled:opacity-40 disabled:cursor-not-allowed"
                                style={{
                                    background: selectedFile ? 'rgba(237, 135, 150, 0.15)' : 'rgba(139, 148, 158, 0.1)',
                                    border: selectedFile ? '1px solid rgba(237, 135, 150, 0.3)' : '1px solid rgba(139, 148, 158, 0.2)',
                                    color: selectedFile ? '#ed8796' : '#8b949e',
                                }}
                                title="Delete selected file (Del)"
                            >
                                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                <Trash2 className="w-3.5 h-3.5 relative z-10" />
                                <span className="relative z-10">Delete</span>
                            </button>

                            {/* Save Button */}
                            <button
                                onClick={handleSaveFile}
                                disabled={!isModified || !selectedFile}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all relative overflow-hidden group disabled:opacity-40 disabled:cursor-not-allowed"
                                style={{
                                    background: isModified && selectedFile
                                        ? 'linear-gradient(135deg, rgba(158, 206, 106, 0.2), rgba(158, 206, 106, 0.15))'
                                        : 'rgba(139, 148, 158, 0.1)',
                                    border: isModified && selectedFile
                                        ? '1px solid rgba(158, 206, 106, 0.4)'
                                        : '1px solid rgba(139, 148, 158, 0.2)',
                                    color: isModified && selectedFile ? '#9ece6a' : '#8b949e',
                                    boxShadow: isModified && selectedFile ? '0 0 12px rgba(158, 206, 106, 0.3)' : 'none',
                                }}
                                title="Save file (Cmd+S / Ctrl+S)"
                            >
                                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                <Save className="w-3.5 h-3.5 relative z-10" />
                                <span className="relative z-10">Save</span>
                            </button>
                        </div>
                    </div>

                    {/* Monaco Editor */}
                    <div className="flex-1 min-h-0 overflow-hidden" style={{ backgroundColor: '#0d1117' }}>
                        <Editor
                            height="100%"
                            language="ini"
                            value={attributes}
                            onChange={handleEditorChange}
                            onMount={handleEditorDidMount}
                            theme="radius-theme"
                            loading={
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    Loading editor...
                                </div>
                            }
                            options={{
                                minimap: { enabled: false },
                                fontSize: 13,
                                lineNumbers: 'on',
                                renderWhitespace: 'selection',
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                tabSize: 2,
                                wordWrap: 'off',
                                fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
                                readOnly: !selectedFile,
                            }}
                        />
                    </div>

                    {/* COA Console */}
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

            {/* Create File Dialog */}
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

            {/* Delete File Dialog */}
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


        </div>
    );
}