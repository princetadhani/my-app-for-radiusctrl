'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus } from 'lucide-react';
import { useState } from 'react';

interface FloatingActionButtonProps {
  onClick?: () => void;
  expandedLabel?: string;
}

export function FloatingActionButton({ onClick, expandedLabel = 'New User' }: FloatingActionButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.5, y: 20 }}
      transition={{ duration: 0.3, type: 'spring', stiffness: 260, damping: 20 }}
      className="absolute z-30"
      style={{
        bottom: '20px',
        right: '20px',
      }}
    >
      <motion.button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="group relative flex items-center gap-2.5 rounded-full font-medium transition-all duration-300 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, hsl(210, 100%, 60%), hsl(210, 100%, 52%))',
          padding: isHovered ? '12px 20px 12px 14px' : '14px',
          boxShadow: isHovered
            ? '0 4px 16px hsl(210, 100%, 60%, 0.3), 0 0 20px hsl(210, 100%, 60%, 0.15)'
            : '0 2px 8px hsl(210, 100%, 60%, 0.25), 0 0 12px hsl(210, 100%, 60%, 0.1)',
          border: '1px solid hsl(210, 100%, 60%, 0.2)',
        }}
      >
        {/* Icon Container */}
        <div className="relative flex items-center justify-center">
          <UserPlus
            className="w-5 h-5"
            style={{
              color: 'hsl(225, 25%, 10%)',
              strokeWidth: 2.5,
            }}
          />
        </div>

        {/* Label - expands on hover */}
        <AnimatePresence>
          {isHovered && (
            <motion.span
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 'auto', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden whitespace-nowrap text-xs font-semibold"
              style={{
                color: 'hsl(225, 25%, 10%)',
                fontFamily: 'var(--font-inter)',
              }}
            >
              {expandedLabel}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </motion.div>
  );
}
