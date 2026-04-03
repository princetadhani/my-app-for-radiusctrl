'use client';

import { motion } from 'framer-motion';
import { Copy, RotateCcw, Save, Check } from 'lucide-react';
import { useState } from 'react';

interface EditorTopBarProps {
  filePath?: string;
  fileName?: string;
  isModified?: boolean;
  onCopy?: () => void;
  onReset?: () => void;
  onSave?: () => void;
  isSaving?: boolean;
}

export function EditorTopBar({
  filePath,
  fileName,
  isModified = false,
  onCopy,
  onReset,
  onSave,
  isSaving = false,
}: EditorTopBarProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (onCopy) {
      onCopy();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!fileName) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-between w-full border-b"
      style={{
        height: 'auto',
        padding: '6px 12px',
        backgroundColor: 'hsl(225, 20%, 10%, 0.5)',
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
            {fileName}
          </span>
          {isModified && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: 'hsl(38, 95%, 60%)' }}
            />
          )}
        </div>

        {/* Full Path */}
        {filePath && (
          <span
            className="text-xs font-mono truncate max-w-[250px]"
            style={{
              fontFamily: 'var(--font-jetbrains-mono)',
              color: 'hsl(215, 15%, 55%)',
            }}
          >
            {filePath}
          </span>
        )}
      </div>

      {/* RIGHT SECTION */}
      <div className="flex items-center gap-1">
        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className="p-1.5 rounded transition-all duration-200"
          style={{
            backgroundColor: 'transparent',
            color: copied ? 'hsl(145, 80%, 55%)' : 'hsl(215, 15%, 55%)',
          }}
          onMouseEnter={(e) => {
            if (!copied) {
              e.currentTarget.style.backgroundColor = 'hsl(225, 15%, 16%, 0.6)';
              e.currentTarget.style.color = 'hsl(210, 40%, 92%)';
            }
          }}
          onMouseLeave={(e) => {
            if (!copied) {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'hsl(215, 15%, 55%)';
            }
          }}
          title="Copy file path"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
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
          disabled={!isModified || isSaving}
          className="flex items-center gap-1.5 rounded transition-all duration-200 text-xs font-medium"
          style={{
            padding: '4px 10px',
            fontFamily: 'var(--font-inter)',
            backgroundColor: isModified && !isSaving
              ? 'hsl(210, 100%, 60%)'
              : 'hsl(225, 15%, 16%)',
            color: isModified && !isSaving
              ? 'hsl(225, 25%, 6%)'
              : 'hsl(215, 15%, 55%)',
            cursor: isModified && !isSaving ? 'pointer' : 'not-allowed',
            boxShadow: isModified && !isSaving
              ? '0 0 20px hsl(210, 100%, 60%, 0.3)'
              : 'none',
          }}
          onMouseEnter={(e) => {
            if (isModified && !isSaving) {
              e.currentTarget.style.opacity = '0.9';
            }
          }}
          onMouseLeave={(e) => {
            if (isModified && !isSaving) {
              e.currentTarget.style.opacity = '1';
            }
          }}
        >
          <Save className="w-3 h-3" />
          <span>{isSaving ? 'Saving...' : 'Save'}</span>
        </button>
      </div>
    </motion.div>
  );
}
