'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      const handler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }
  }, [isOpen, onClose]);

  const gradientColors = variant === 'danger'
    ? '#ed8796, #c94f62'
    : variant === 'warning'
      ? '#f5a97f, #ee99a0'
      : '#7aa2f7, #bb9af7';

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
              onKeyDown={handleKeyDown}
            >
              {/* Animated gradient border glow */}
              <motion.div
                className="absolute -inset-0.5 rounded-xl opacity-75 blur-sm"
                style={{
                  background: `linear-gradient(45deg, ${gradientColors}, ${gradientColors.split(',')[0]})`,
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
                  border: `1px solid ${variant === 'danger' ? 'rgba(237, 135, 150, 0.3)' : 'rgba(122, 162, 247, 0.3)'}`,
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

                {/* Icon and Title */}
                <div className="flex items-start gap-3 mb-4">
                  {variant === 'danger' && (
                    <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(237, 135, 150, 0.15)' }}>
                      <AlertTriangle className="w-5 h-5" style={{ color: '#ed8796' }} />
                    </div>
                  )}
                  <motion.h2
                    className="text-xl font-bold flex-1"
                    style={{
                      background: `linear-gradient(135deg, ${gradientColors})`,
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
                </div>

                {/* Description */}
                {description && (
                  <motion.p
                    className="text-sm mb-6"
                    style={{ color: '#c9d1d9' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 }}
                  >
                    {description}
                  </motion.p>
                )}

                {/* Actions */}
                <motion.div
                  className="flex items-center justify-end gap-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
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
                    className="px-5 py-2 text-sm rounded-lg font-medium transition-all relative overflow-hidden group"
                    style={{
                      background: `linear-gradient(135deg, ${gradientColors})`,
                      color: '#0d1117',
                    }}
                  >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
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
