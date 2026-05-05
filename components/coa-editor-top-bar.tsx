'use client';

import { motion } from 'framer-motion';
import { Copy, RotateCcw, Save, Plus, Trash2, Loader2 } from 'lucide-react';

interface CoaEditorTopBarProps {
  filePath: string;
  fileName?: string;
  isModified: boolean;
  onCopy: () => void;
  onReset: () => void;
  onSave: () => void;
  onNew: () => void;
  onDelete: () => void;
  isSaving: boolean;
  isMounted: boolean;
}

export function CoaEditorTopBar({
  filePath,
  fileName,
  isModified,
  onCopy,
  onReset,
  onSave,
  onNew,
  onDelete,
  isSaving,
  isMounted,
}: CoaEditorTopBarProps) {
  return (
    <div
      className="h-10 border-b flex items-center justify-between px-3"
      style={{
        backgroundColor: 'rgba(18, 23, 35, 0.6)',
        backdropFilter: 'blur(16px) saturate(1.2)',
        borderBottomColor: 'hsl(225, 15%, 18%)',
      }}
    >
      {/* LEFT SECTION */}
      <div className="flex items-center gap-2">
        {/* File Badge */}
        <div
          className="flex items-center gap-1.5 rounded border"
          style={{
            padding: '2px 8px',
            backgroundColor: 'hsl(225, 15%, 16%, 0.5)',
            borderColor: 'hsl(225, 15%, 18%)',
          }}
        >
          <span
            className="text-xs font-mono"
            style={{
              fontFamily: 'var(--font-jetbrains-mono)',
              color: 'hsl(210, 40%, 92%)',
            }}
          >
            {fileName || 'No file selected'}
          </span>
          {isModified && filePath && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: 'hsl(38, 95%, 60%)' }}
            />
          )}
        </div>

        {/* Copy Path Button */}
        <button
          onClick={onCopy}
          disabled={!isMounted || !filePath}
          className="p-1.5 rounded transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            backgroundColor: 'transparent',
            color: 'hsl(215, 15%, 55%)',
          }}
          onMouseEnter={(e) => {
            if (isMounted && filePath) {
              e.currentTarget.style.backgroundColor = 'hsl(225, 15%, 16%, 0.6)';
              e.currentTarget.style.color = 'hsl(210, 40%, 92%)';
            }
          }}
          onMouseLeave={(e) => {
            if (isMounted && filePath) {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'hsl(215, 15%, 55%)';
            }
          }}
          title="Copy file path"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* RIGHT SECTION - Actions */}
      <div className="flex items-center gap-2">
        {/* New Button */}
        <button
          onClick={onNew}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all relative overflow-hidden group"
          style={{
            background: 'linear-gradient(135deg, rgba(122, 162, 247, 0.15), rgba(187, 154, 247, 0.15))',
            border: '1px solid rgba(122, 162, 247, 0.3)',
            color: '#7aa2f7',
          }}
          title="Create new COA file"
        >
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <Plus className="w-3.5 h-3.5 relative z-10" />
          <span className="relative z-10">New</span>
        </button>

        {/* Delete Button */}
        <button
          onClick={onDelete}
          disabled={!isMounted || !filePath}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all relative overflow-hidden group disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: isMounted && filePath ? 'rgba(237, 135, 150, 0.15)' : 'rgba(139, 148, 158, 0.1)',
            border: isMounted && filePath ? '1px solid rgba(237, 135, 150, 0.3)' : '1px solid rgba(139, 148, 158, 0.2)',
            color: isMounted && filePath ? '#ed8796' : '#8b949e',
          }}
          title="Delete file"
        >
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <Trash2 className="w-3.5 h-3.5 relative z-10" />
          <span className="relative z-10">Delete</span>
        </button>

        {/* Reset Button */}
        <button
          onClick={onReset}
          disabled={!isModified}
          className="p-1.5 rounded transition-all duration-200"
          style={{
            backgroundColor: 'transparent',
            color: 'hsl(215, 15%, 55%)',
            opacity: isModified ? 1 : 0.5,
            cursor: isModified ? 'pointer' : 'not-allowed',
          }}
          onMouseEnter={(e) => {
            if (isModified) {
              e.currentTarget.style.backgroundColor = 'hsl(225, 15%, 16%, 0.6)';
              e.currentTarget.style.color = 'hsl(210, 40%, 92%)';
            }
          }}
          onMouseLeave={(e) => {
            if (isModified) {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'hsl(215, 15%, 55%)';
            }
          }}
          title="Reset changes"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Save Button */}
        <button
          onClick={onSave}
          disabled={!isModified || !filePath || isSaving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all relative overflow-hidden group"
          style={{
            background: isModified && filePath && !isSaving
              ? 'linear-gradient(135deg, rgba(158, 206, 106, 0.2), rgba(158, 206, 106, 0.15))'
              : 'rgba(139, 148, 158, 0.1)',
            border: isModified && filePath && !isSaving
              ? '1px solid rgba(158, 206, 106, 0.4)'
              : '1px solid rgba(139, 148, 158, 0.2)',
            color: isModified && filePath && !isSaving ? '#9ece6a' : '#8b949e',
            boxShadow: isModified && filePath && !isSaving ? '0 0 12px rgba(158, 206, 106, 0.3)' : 'none',
            cursor: isModified && filePath && !isSaving ? 'pointer' : 'not-allowed',
            opacity: !isModified || !filePath || isSaving ? 0.4 : 1,
          }}
          title="Save file (Cmd+S)"
        >
          {isModified && filePath && !isSaving && (
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          )}
          {isSaving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin relative z-10" />
          ) : (
            <Save className="w-3.5 h-3.5 relative z-10" />
          )}
          <span className="relative z-10">{isSaving ? 'Saving...' : 'Save'}</span>
        </button>
      </div>
    </div>
  );
}
