'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle } from 'lucide-react';

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
      setError('Name cannot contain spaces');
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
      setError('Dictionary file already exists');
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
          {/* Backdrop */}
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
            {/* Dialog */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative rounded-xl overflow-hidden shadow-2xl"
              style={{
                width: '480px',
                maxWidth: '90vw',
                backgroundColor: '#0d1117',
                border: '1px solid #30363d',
              }}
            >
              {/* Header */}
              <div
                className="px-6 py-4 border-b"
                style={{
                  borderBottomColor: '#21262d',
                  background: 'linear-gradient(135deg, rgba(122, 162, 247, 0.05), rgba(187, 154, 247, 0.05))',
                }}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold" style={{ color: '#c9d1d9' }}>
                    Create New Dictionary
                  </h2>
                  <button
                    onClick={onClose}
                    className="p-1 rounded hover:bg-white/10 transition-colors"
                    style={{ color: '#8b949e' }}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#c9d1d9' }}>
                    Dictionary Name
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono" style={{ color: '#6e7681' }}>
                      dictionary.
                    </div>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => setValue(e.target.value.toLowerCase())}
                      onKeyDown={handleKeyDown}
                      placeholder="myvendor"
                      className="w-full px-3 py-2 rounded-lg border transition-all font-mono text-sm"
                      style={{
                        paddingLeft: '90px',
                        backgroundColor: '#161b22',
                        borderColor: error ? '#f85149' : '#30363d',
                        color: '#c9d1d9',
                        outline: 'none',
                      }}
                      autoFocus
                    />
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 mt-2 text-sm"
                      style={{ color: '#f85149' }}
                    >
                      <AlertCircle className="w-4 h-4" />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  <div className="text-xs mt-2" style={{ color: '#6e7681' }}>
                    • Only lowercase letters and numbers<br />
                    • Name will be saved as: dictionary.{value || 'myvendor'}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t flex items-center justify-end gap-3" style={{ borderTopColor: '#21262d', backgroundColor: '#010409' }}>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm rounded-lg transition-all hover:bg-white/5"
                  style={{ color: '#8b949e' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!value.trim() || !!error}
                  className="px-5 py-2 text-sm rounded-lg font-medium transition-all"
                  style={{
                    background: value.trim() && !error
                      ? 'linear-gradient(135deg, #7aa2f7, #bb9af7)'
                      : 'rgba(122, 162, 247, 0.3)',
                    color: value.trim() && !error ? '#0d1117' : '#8b949e',
                    cursor: value.trim() && !error ? 'pointer' : 'not-allowed',
                  }}
                >
                  Create Dictionary
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
