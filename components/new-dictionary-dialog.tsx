'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface NewDictionaryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
  existingDictionaries?: string[];
}

export function NewDictionaryDialog({
  isOpen,
  onClose,
  onConfirm,
  existingDictionaries = [],
}: NewDictionaryDialogProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setValue('');
      setError('');
    }
  }, [isOpen]);

  // Real-time validation
  useEffect(() => {
    if (!value.trim()) {
      setError('');
      return;
    }

    // Convert to lowercase
    const lowerValue = value.toLowerCase();

    // Check for spaces
    if (/\s/.test(lowerValue)) {
      setError('Dictionary name cannot contain spaces');
      return;
    }

    // Check for dots (extensions)
    if (lowerValue.includes('.')) {
      setError('Dictionary name cannot contain dots');
      return;
    }

    // Check for valid characters: ONLY lowercase letters and numbers (no hyphens, no underscores)
    if (!/^[a-z0-9]+$/.test(lowerValue)) {
      setError('Only lowercase letters and numbers allowed');
      return;
    }

    // Check length (dictionary. is 11 chars, so min suffix is 1)
    if (lowerValue.length < 1 || lowerValue.length > 53) { // 53 + "dictionary." = 64 max
      setError('Name must be 1-53 characters');
      return;
    }

    // Check for duplicates - IMPORTANT: Check if dictionary file already exists
    const fullName = `dictionary.${lowerValue}`;
    if (existingDictionaries.some(f => f.toLowerCase() === fullName.toLowerCase())) {
      setError('Dictionary already exists');
      return;
    }

    // Check reserved names
    const reserved = ['freeradius', 'rfc2865', 'rfc2866', 'rfc2867', 'rfc2868', 'rfc2869'];
    if (reserved.includes(lowerValue)) {
      setError('Reserved name');
      return;
    }

    setError('');
  }, [value, existingDictionaries]);

  const handleConfirm = () => {
    const lowerValue = value.trim().toLowerCase();
    if (lowerValue && !error) {
      onConfirm(lowerValue);
      onClose();
      setValue('');
      setError('');
    }
  };

  const handleClose = () => {
    setValue('');
    setError('');
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      handleClose();
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
            onClick={handleClose}
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
                  background: 'linear-gradient(45deg, #7aa2f7, #bb9af7, #7aa2f7, #bb9af7)',
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
                  onClick={handleClose}
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
                  Create New Dictionary
                </motion.h2>

                {/* Description */}
                <motion.p
                  className="text-sm mb-5"
                  style={{ color: '#8b949e' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.15 }}
                >
                  Enter a name for the new FreeRADIUS dictionary file.
                </motion.p>

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
                    onChange={(e) => setValue(e.target.value.toLowerCase())}
                    onKeyDown={handleKeyDown}
                    placeholder="e.g., myvendor, custom, company"
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
                    • Only lowercase letters and numbers allowed<br />
                    • No spaces, dots, or special characters<br />
                    • Will be saved as: <span style={{ color: '#7aa2f7' }}>dictionary.{value || 'myvendor'}</span>
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
                    onClick={handleClose}
                    className="px-4 py-2 text-sm rounded-lg transition-all hover:bg-white/5"
                    style={{ color: '#8b949e' }}
                  >
                    Cancel
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
                    <span className="relative z-10">
                      Create Dictionary
                    </span>
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
