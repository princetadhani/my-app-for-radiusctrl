'use client';

import { motion } from 'framer-motion';
import { Copy, RotateCcw, Save, Check, Eye } from 'lucide-react';
import { useState } from 'react';

interface EditorTopBarProps {
  filePath?: string;
  fileName?: string;
  isModified?: boolean;
  isReadOnly?: boolean;
  onCopy?: () => void;
  onReset?: () => void;
  onSave?: () => void;
  isSaving?: boolean;
}

export function EditorTopBar({
  filePath,
  fileName,
  isModified = false,
  isReadOnly = false,
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
          {isModified && !isReadOnly && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: 'hsl(38, 95%, 60%)' }}
            />
          )}
        </div>

        {/* Read-Only Badge */}
        {isReadOnly && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-1.5 rounded border"
            style={{
              padding: '2px 8px',
              backgroundColor: 'hsl(210, 100%, 60%, 0.1)',
              borderColor: 'hsl(210, 100%, 60%, 0.3)',
            }}
          >
            <Eye className="w-3 h-3" style={{ color: 'hsl(210, 100%, 60%)' }} />
            <span
              className="text-xs font-mono font-semibold"
              style={{
                fontFamily: 'var(--font-jetbrains-mono)',
                color: 'hsl(210, 100%, 60%)',
              }}
            >
              READ-ONLY
            </span>
          </motion.div>
        )}

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
        {!isReadOnly && (
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
        )}

        {/* Save Button - Matching COA page style */}
        {!isReadOnly && (
          <button
            onClick={onSave}
            disabled={!isModified || isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all relative overflow-hidden group"
            style={{
              background: isModified && !isSaving
                ? 'linear-gradient(135deg, rgba(158, 206, 106, 0.2), rgba(158, 206, 106, 0.15))'
                : 'rgba(139, 148, 158, 0.1)',
              border: isModified && !isSaving
                ? '1px solid rgba(158, 206, 106, 0.4)'
                : '1px solid rgba(139, 148, 158, 0.2)',
              color: isModified && !isSaving ? '#9ece6a' : '#8b949e',
              boxShadow: isModified && !isSaving ? '0 0 12px rgba(158, 206, 106, 0.3)' : 'none',
              cursor: isModified && !isSaving ? 'pointer' : 'not-allowed',
              opacity: !isModified || isSaving ? 0.4 : 1,
            }}
          >
            {/* Shimmer effect */}
            {isModified && !isSaving && (
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            )}
            <Save className="w-3.5 h-3.5 relative z-10" />
            <span className="relative z-10">{isSaving ? 'Saving...' : 'Save'}</span>
          </button>
        )}
      </div>
    </motion.div>
  );
}
