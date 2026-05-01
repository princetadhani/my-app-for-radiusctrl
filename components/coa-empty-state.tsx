'use client';

import { motion } from 'framer-motion';
import { Zap, Network, FileText, Sparkles } from 'lucide-react';

export function CoaEmptyState() {
  return (
    <div className="h-full w-full flex items-center justify-center bg-card">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md px-6"
      >
        {/* Icon Group */}
        <div className="relative flex items-center justify-center mb-6">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="relative"
          >
            <div
              className="w-24 h-24 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(122, 162, 247, 0.2), rgba(187, 154, 247, 0.2))',
                border: '1px solid rgba(122, 162, 247, 0.3)',
              }}
            >
              <Zap
                className="w-12 h-12"
                style={{ color: 'hsl(210, 100%, 60%)' }}
              />
            </div>
          </motion.div>

          {/* Floating Icons */}
          <motion.div
            animate={{ y: [-10, 10, -10], x: [-5, 5, -5] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-2 -right-2"
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{
                background: 'rgba(158, 206, 106, 0.2)',
                border: '1px solid rgba(158, 206, 106, 0.3)',
              }}
            >
              <Network className="w-5 h-5" style={{ color: 'hsl(145, 80%, 55%)' }} />
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [10, -10, 10], x: [5, -5, 5] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            className="absolute -bottom-2 -left-2"
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{
                background: 'rgba(187, 154, 247, 0.2)',
                border: '1px solid rgba(187, 154, 247, 0.3)',
              }}
            >
              <FileText className="w-5 h-5" style={{ color: 'hsl(270, 80%, 65%)' }} />
            </div>
          </motion.div>
        </div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold mb-3"
          style={{
            background: 'linear-gradient(135deg, #7aa2f7, #bb9af7)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          COA Command Manager
        </motion.h2>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-sm mb-6"
          style={{ color: 'hsl(215, 15%, 55%)', lineHeight: '1.6' }}
        >
          Send Change-of-Authorization (COA) and Disconnect requests to your NAS devices.
          Create, edit, and execute RADIUS commands in real-time.
        </motion.p>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-3 text-left"
        >
          {[
            { icon: Zap, text: 'Execute COA & Disconnect commands', color: 'hsl(210, 100%, 60%)' },
            { icon: FileText, text: 'Create and manage command templates', color: 'hsl(270, 80%, 65%)' },
            { icon: Sparkles, text: 'Real-time command execution console', color: 'hsl(145, 80%, 55%)' },
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="flex items-center gap-3 px-4 py-2 rounded-lg"
              style={{
                backgroundColor: 'rgba(122, 162, 247, 0.05)',
                border: '1px solid rgba(122, 162, 247, 0.1)',
              }}
            >
              <feature.icon className="w-4 h-4 flex-shrink-0" style={{ color: feature.color }} />
              <span className="text-sm" style={{ color: 'hsl(210, 40%, 92%)' }}>
                {feature.text}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* Hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 flex items-center justify-center gap-2 text-xs"
          style={{ color: 'hsl(215, 15%, 55%)' }}
        >
          <kbd
            className="px-2 py-1 rounded font-mono"
            style={{ backgroundColor: 'hsl(225, 15%, 16%)', border: '1px solid hsl(225, 15%, 18%)' }}
          >
            Cmd
          </kbd>
          <span>+</span>
          <kbd
            className="px-2 py-1 rounded font-mono"
            style={{ backgroundColor: 'hsl(225, 15%, 16%)', border: '1px solid hsl(225, 15%, 18%)' }}
          >
            K
          </kbd>
          <span>to search files</span>
        </motion.div>
      </motion.div>
    </div>
  );
}
