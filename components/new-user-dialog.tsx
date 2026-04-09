'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';

interface NewUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (username: string) => void;
  onError: (message: string, validationOutput?: string) => void;
}

export function NewUserDialog({ isOpen, onClose, onSuccess, onError }: NewUserDialogProps) {
  const [filename, setFilename] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFilename('');
      setError('');
    }
  }, [isOpen]);

  const handleCreate = async () => {
    // Clear previous errors
    setError('');

    // Basic validation
    if (!filename.trim()) {
      setError('Filename is required');
      return;
    }

    // Check for spaces
    if (/\s/.test(filename)) {
      setError('Filename cannot contain spaces');
      return;
    }

    setIsCreating(true);

    try {
      const { createNewUser } = await import('@/lib/api');
      const result = await createNewUser(filename);

      if (result.status === 'exists') {
        setError('User already exists');
        setIsCreating(false);
        return;
      }

      if (result.status === 'validation_failed') {
        setIsCreating(false);
        onClose();
        onError(result.message, result.validationError || result.validationOutput);
        return;
      }

      // Success
      setIsCreating(false);
      setFilename('');
      onClose();
      onSuccess(filename.split('.')[0].toLowerCase());
    } catch (err: any) {
      setIsCreating(false);
      setError(err.message || 'Failed to create user');
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setFilename('');
      setError('');
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isCreating) {
      handleCreate();
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
                  disabled={isCreating}
                  className="absolute top-4 right-4 p-1.5 rounded-lg transition-all hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  Create New User
                </motion.h2>

                {/* Description */}
                <motion.p
                  className="text-sm mb-5"
                  style={{ color: '#8b949e' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.15 }}
                >
                  Enter a username for the new FreeRADIUS user file.
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
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="e.g., prince, user1, testuser"
                    autoFocus
                    disabled={isCreating}
                    className="w-full px-4 py-2.5 rounded-lg text-sm transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: 'rgba(22, 27, 34, 0.8)',
                      border: '1px solid rgba(122, 162, 247, 0.3)',
                      color: '#c9d1d9',
                      fontFamily: 'JetBrains Mono, monospace',
                    }}
                    onFocus={(e) => {
                      if (!isCreating) {
                        e.target.style.borderColor = 'rgba(122, 162, 247, 0.6)';
                        e.target.style.boxShadow = '0 0 15px rgba(122, 162, 247, 0.3)';
                      }
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(122, 162, 247, 0.3)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />

                  {/* Error message */}
                  {error && (
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
                    • Letters and numbers only (no spaces)<br />
                    • Will be converted to lowercase<br />
                    • Extensions will be ignored
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
                    disabled={isCreating}
                    className="px-4 py-2 text-sm rounded-lg transition-all hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ color: '#8b949e' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={!filename.trim() || isCreating}
                    className="px-5 py-2 text-sm rounded-lg font-medium transition-all relative overflow-hidden group flex items-center gap-2"
                    style={{
                      background: filename.trim() && !isCreating
                        ? 'linear-gradient(135deg, #7aa2f7, #bb9af7)'
                        : 'rgba(122, 162, 247, 0.3)',
                      color: filename.trim() && !isCreating ? '#0d1117' : '#8b949e',
                      cursor: filename.trim() && !isCreating ? 'pointer' : 'not-allowed',
                    }}
                  >
                    {/* Shimmer effect */}
                    {filename.trim() && !isCreating && (
                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    )}
                    {isCreating && (
                      <Loader2 className="w-4 h-4 animate-spin relative z-10" />
                    )}
                    <span className="relative z-10">
                      {isCreating ? 'Creating...' : 'Create User'}
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
