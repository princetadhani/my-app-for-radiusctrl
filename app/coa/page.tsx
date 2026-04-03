'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Plus, Trash2, FileText, Save, Terminal, ChevronUp, ChevronDown, PanelLeftClose, PanelLeft } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { StatusHeader } from '@/components/status-header';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface CoaTemplate {
  id: string;
  name: string;
  type: 'coa' | 'disconnect';
  nasIp: string;
  nasSecret: string;
  attributes: string;
}

export default function CoaPage() {
  const [templates, setTemplates] = useState<CoaTemplate[]>([
    {
      id: '1',
      name: 'Disconnect User',
      type: 'disconnect',
      nasIp: '192.168.1.1',
      nasSecret: 'testing123',
      attributes: 'Acct-Session-Id = "12345"\nFramed-IP-Address = "192.168.1.100"',
    },
    {
      id: '2',
      name: 'Change Bandwidth',
      type: 'coa',
      nasIp: '192.168.1.1',
      nasSecret: 'testing123',
      attributes: 'User-Name = "john@example.com"\nFilter-Id = "bandwidth-limit-1M"',
    },
  ]);

  const [selectedTemplate, setSelectedTemplate] = useState<CoaTemplate | null>(templates[0]);
  const [requestType, setRequestType] = useState<'coa' | 'disconnect'>('disconnect');
  const [nasIp, setNasIp] = useState('192.168.1.1');
  const [nasSecret, setNasSecret] = useState('testing123');
  const [attributes, setAttributes] = useState('Acct-Session-Id = "12345"\nFramed-IP-Address = "192.168.1.100"');
  const [response, setResponse] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [isModified, setIsModified] = useState(false);
  const consoleRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [response]);

  const handleSend = async () => {
    setIsConsoleOpen(true);
    setIsSending(true);
    setResponse('$ echo-coa-client\n');

    await new Promise(resolve => setTimeout(resolve, 300));
    setResponse(prev => prev + `Connecting to NAS ${nasIp}:3799...\n`);

    await new Promise(resolve => setTimeout(resolve, 400));
    setResponse(prev => prev + `Sending ${requestType.toUpperCase()} request...\n`);

    await new Promise(resolve => setTimeout(resolve, 600));

    // Simulate success 80% of the time
    if (Math.random() < 0.8) {
      setResponse(prev => prev + `\n✓ CoA-ACK received from NAS\n`);
      setResponse(prev => prev + `Request processed successfully.\n`);
      toast.success('CoA request sent successfully');
    } else {
      setResponse(prev => prev + `\n✗ CoA-NAK received from NAS\n`);
      setResponse(prev => prev + `Error: Session not found or invalid attributes.\n`);
      toast.error('CoA request failed');
    }

    setIsSending(false);
  };

  const handleAddTemplate = () => {
    const newTemplate: CoaTemplate = {
      id: Date.now().toString(),
      name: 'New Template',
      type: requestType,
      nasIp,
      nasSecret,
      attributes,
    };
    setTemplates([...templates, newTemplate]);
    setIsModified(false);
    toast.success('Template saved');
  };

  const handleDeleteTemplate = (id: string) => {
    setTemplates(templates.filter(t => t.id !== id));
    if (selectedTemplate?.id === id) {
      setSelectedTemplate(null);
      setAttributes('');
    }
    toast.success('Template deleted');
  };

  const handleSelectTemplate = (template: CoaTemplate) => {
    setSelectedTemplate(template);
    setRequestType(template.type);
    setNasIp(template.nasIp);
    setNasSecret(template.nasSecret);
    setAttributes(template.attributes);
    setIsModified(false);
  };

  const handleEditorChange = (value: string | undefined) => {
    setAttributes(value || '');
    setIsModified(true);
  };

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <StatusHeader currentFile={selectedTemplate ? `coa/${selectedTemplate.name.toLowerCase().replace(/\s+/g, '-')}.conf` : undefined} />

      {/* Main Content - 3 Panel IDE Layout */}
      <div className="flex-1 flex pt-12 overflow-hidden">
        {/* Sidebar - Template File Tree */}
        <motion.div
          initial={{ x: -280, opacity: 0 }}
          animate={{
            x: 0,
            opacity: 1,
            width: isSidebarCollapsed ? 48 : 256
          }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="h-full glass-panel border-r border-border overflow-hidden"
        >
          {/* Toggle Button */}
          <div className="h-12 border-b border-border flex items-center justify-between px-2">
            {!isSidebarCollapsed && (
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                Templates
              </h3>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="h-8 w-8 hover:bg-secondary"
              title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isSidebarCollapsed ? (
                <PanelLeft className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Sidebar Content */}
          <AnimatePresence>
            {!isSidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="p-2 overflow-y-auto"
                style={{ height: 'calc(100% - 48px)' }}
              >
                {/* Add Template Button */}
                <motion.button
                  onClick={handleAddTemplate}
                  whileHover={{ x: 2 }}
                  transition={{ duration: 0.15 }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 mb-2 rounded bg-neon-green/20 hover:bg-neon-green/30 border border-neon-green/40 text-neon-green text-sm transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>New Template</span>
                </motion.button>

                {/* Template List */}
                <div className="space-y-1">
                  {templates.map(template => (
                    <motion.div
                      key={template.id}
                      whileHover={{ x: 2 }}
                      transition={{ duration: 0.15 }}
                      className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-colors ${selectedTemplate?.id === template.id
                        ? 'bg-primary/10 border-l-2 border-primary'
                        : 'hover:bg-secondary/50'
                        }`}
                      onClick={() => handleSelectTemplate(template)}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-foreground truncate">{template.name}</div>
                          <div className="text-[10px] text-muted-foreground uppercase">{template.type}</div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTemplate(template.id);
                        }}
                        className="p-1 hover:bg-destructive/20 rounded transition-colors"
                      >
                        <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Center Panel - Monaco Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex flex-col bg-card overflow-hidden">
            {/* Toolbar */}
            <div className="h-10 border-b border-border flex items-center justify-between px-4 bg-secondary/30">
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono text-foreground">
                  {selectedTemplate ? selectedTemplate.name : 'CoA Configuration'}
                </span>
                {isModified && (
                  <span className="text-xs text-neon-amber">● Modified</span>
                )}
              </div>
              <button
                onClick={handleAddTemplate}
                disabled={!isModified}
                className="flex items-center gap-2 px-3 py-1 rounded bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
              >
                <Save className="w-3 h-3" />
                <span>Save Template</span>
              </button>
            </div>

            {/* Monaco Editor */}
            <div className="flex-1">
              <Editor
                height="100%"
                language="ini"
                value={attributes}
                onChange={handleEditorChange}
                onMount={handleEditorDidMount}
                theme="vs-dark"
                loading={<div className="flex items-center justify-center h-full text-muted-foreground">Loading editor...</div>}
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
                }}
              />
            </div>
          </div>

          {/* Bottom Console - CoA Controls */}
          <div className="relative">
            {/* Toggle Bar */}
            <div className="h-10 border-t border-border glass-panel flex items-center justify-between px-4">
              <button
                onClick={() => setIsConsoleOpen(!isConsoleOpen)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Terminal className="w-4 h-4" />
                <span>CoA Console</span>
                {isConsoleOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              </button>

              <div className="flex items-center gap-3">
                {/* Request Type Selector */}
                <div className="flex items-center gap-2 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="requestType"
                      value="coa"
                      checked={requestType === 'coa'}
                      onChange={() => setRequestType('coa')}
                      className="w-3 h-3"
                    />
                    <span>CoA</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="requestType"
                      value="disconnect"
                      checked={requestType === 'disconnect'}
                      onChange={() => setRequestType('disconnect')}
                      className="w-3 h-3"
                    />
                    <span>Disconnect</span>
                  </label>
                </div>

                {/* NAS IP Input */}
                <input
                  type="text"
                  value={nasIp}
                  onChange={(e) => setNasIp(e.target.value)}
                  placeholder="NAS IP"
                  className="w-32 px-2 py-1 text-xs bg-secondary border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                />

                {/* NAS Secret Input */}
                <input
                  type="password"
                  value={nasSecret}
                  onChange={(e) => setNasSecret(e.target.value)}
                  placeholder="Secret"
                  className="w-24 px-2 py-1 text-xs bg-secondary border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                />

                {/* Send Button */}
                <Button
                  onClick={handleSend}
                  disabled={isSending}
                  className="flex items-center gap-2 px-4 py-1.5 h-auto rounded bg-neon-green/20 hover:bg-neon-green/30 border border-neon-green/40 text-neon-green font-medium text-xs transition-colors neon-glow-green"
                >
                  <Send className="w-3 h-3" />
                  <span>{isSending ? 'Sending...' : 'Send'}</span>
                </Button>
              </div>
            </div>

            {/* Console Panel */}
            <AnimatePresence>
              {isConsoleOpen && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 200 }}
                  exit={{ height: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden border-t border-border"
                >
                  <div
                    ref={consoleRef}
                    className="h-full bg-card p-4 font-mono text-xs overflow-y-auto"
                  >
                    {response.length === 0 ? (
                      <div className="text-muted-foreground">
                        Configure NAS settings and click "Send" to transmit CoA/Disconnect request.
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap">{response}</div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

