'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CustomDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void;
  title: string;
  description?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
  existingFiles?: string[]; // For duplicate check
}

export function CustomDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  placeholder = 'Enter value...',
  defaultValue = '',
  confirmText = 'Create',
  cancelText = 'Cancel',
  existingFiles = [],
}: CustomDialogProps) {
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState('');

  // Validation regex: alphanumeric, underscores, hyphens only
  const fileNameRegex = /^[a-zA-Z0-9_-]+$/;

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
      setError('');
    }
  }, [isOpen, defaultValue]);

  // Real-time validation
  useEffect(() => {
    if (!value.trim()) {
      setError('');
      return;
    }

    // Check for spaces
    if (/\s/.test(value)) {
      setError('Filename cannot contain spaces');
      return;
    }

    // Check for dots (extensions)
    if (value.includes('.')) {
      setError('Filename cannot contain dots');
      return;
    }

    // Check for special characters
    if (!fileNameRegex.test(value)) {
      setError('Special characters are not allowed');
      return;
    }

    // Check for duplicates
    const fileNameWithExt = value.endsWith('.txt') ? value : `${value}.txt`;
    if (existingFiles.some(f => f.toLowerCase() === fileNameWithExt.toLowerCase())) {
      setError('File already exists');
      return;
    }

    setError('');
  }, [value, existingFiles, fileNameRegex]);

  const handleConfirm = () => {
    if (value.trim() && !error) {
      onConfirm(value.trim());
      onClose();
      setValue('');
      setError('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
            }}
            onClick={onClose}
          >
            {/* Dialog with gradient border */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="relative w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Animated gradient border glow */}
              <motion.div
                className="absolute -inset-0.5 rounded-xl opacity-75 blur-sm"
                style={{
                  background: 'linear-gradient(45deg, #7aa2f7, #bb9af7, #9ece6a, #7aa2f7)',
                  backgroundSize: '300% 300%',
                }}
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />

              {/* Dialog content */}
              <div
                className="relative p-6 rounded-xl shadow-2xl"
                style={{
                  backgroundColor: '#0d1117',
                  border: '1px solid rgba(122, 162, 247, 0.3)',
                }}
              >
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-1.5 rounded-lg transition-all hover:bg-white/10"
                  style={{ color: '#8b949e' }}
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Title with gradient */}
                <motion.h2
                  className="text-xl font-bold mb-2"
                  style={{
                    background: 'linear-gradient(135deg, #7aa2f7, #bb9af7)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  {title}
                </motion.h2>

                {/* Description */}
                {description && (
                  <motion.p
                    className="text-sm mb-5"
                    style={{ color: '#8b949e' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 }}
                  >
                    {description}
                  </motion.p>
                )}

                {/* Input with glow on focus */}
                <motion.div
                  className="mb-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    autoFocus
                    className="w-full px-4 py-2.5 rounded-lg text-sm transition-all focus:outline-none"
                    style={{
                      backgroundColor: 'rgba(22, 27, 34, 0.8)',
                      border: error && value.trim() ? '1px solid rgba(237, 135, 150, 0.5)' : '1px solid rgba(122, 162, 247, 0.3)',
                      color: '#c9d1d9',
                      fontFamily: 'JetBrains Mono, monospace',
                    }}
                    onFocus={(e) => {
                      if (!error || !value.trim()) {
                        e.target.style.borderColor = 'rgba(122, 162, 247, 0.6)';
                        e.target.style.boxShadow = '0 0 15px rgba(122, 162, 247, 0.3)';
                      }
                    }}
                    onBlur={(e) => {
                      if (!error || !value.trim()) {
                        e.target.style.borderColor = 'rgba(122, 162, 247, 0.3)';
                        e.target.style.boxShadow = 'none';
                      }
                    }}
                  />

                  {/* Error message */}
                  {error && value.trim() && (
                    <motion.p
                      className="text-xs mt-2"
                      style={{ color: '#ed8796' }}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {error}
                    </motion.p>
                  )}

                  {/* Helper text */}
                  <motion.div
                    className="text-xs mt-2"
                    style={{ color: '#6e7681' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    • Only letters, numbers, underscores, and hyphens<br />
                    • No spaces or special characters<br />
                    • .txt extension will be added automatically
                  </motion.div>
                </motion.div>

                {/* Actions */}
                <motion.div
                  className="flex items-center justify-end gap-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm rounded-lg transition-all hover:bg-white/5"
                    style={{ color: '#8b949e' }}
                  >
                    {cancelText}
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={!value.trim() || !!error}
                    className="px-5 py-2 text-sm rounded-lg font-medium transition-all relative overflow-hidden group"
                    style={{
                      background: value.trim() && !error
                        ? 'linear-gradient(135deg, #7aa2f7, #bb9af7)'
                        : 'rgba(122, 162, 247, 0.3)',
                      color: value.trim() && !error ? '#0d1117' : '#8b949e',
                      cursor: value.trim() && !error ? 'pointer' : 'not-allowed',
                    }}
                  >
                    {/* Shimmer effect */}
                    {value.trim() && !error && (
                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    )}
                    <span className="relative z-10">{confirmText}</span>
                  </button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
