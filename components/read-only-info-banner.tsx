'use client';

import { motion } from 'framer-motion';
import { Info } from 'lucide-react';

interface ReadOnlyInfoBannerProps {
  fileName?: string;
}

export function ReadOnlyInfoBanner({ fileName }: ReadOnlyInfoBannerProps) {
  const isUsersFile = fileName === 'users';
  const isAuthorizeFile = fileName === 'authorize';

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="w-full border-b"
      style={{
        backgroundColor: 'hsl(225, 25%, 10%, 0.4)',
        borderBottomColor: 'hsl(225, 15%, 18%)',
        padding: '10px 16px',
      }}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0">
          <Info className="w-4 h-4 mt-0.5" style={{ color: 'hsl(215, 15%, 65%)' }} />
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Explanation */}
          <div
            className="text-xs leading-relaxed space-y-1.5"
            style={{
              color: 'hsl(215, 15%, 75%)',
              fontFamily: 'var(--font-inter)',
            }}
          >
            {isUsersFile && (
              <>
                <p>
                  <strong style={{ color: 'hsl(210, 100%, 60%)', fontWeight: 600 }}>This file is read-only.</strong> The <code className="px-1 py-0.5 rounded font-mono" style={{ backgroundColor: 'hsl(225, 15%, 16%)', color: 'hsl(210, 100%, 60%)' }}>/etc/freeradius/3.0/users</code> file is a core FreeRADIUS configuration file & cannot be edited directly from this interface for safety reasons.
                </p>
                <p>
                  <strong style={{ fontWeight: 600 }}>To add or manage radius users:</strong> Use the <strong style={{ color: 'hsl(210, 100%, 60%)' }}>New User</strong> button of top bar or click the <strong style={{ color: 'hsl(210, 100%, 60%)' }}>floating "+" button</strong> below. This creates individual per person user files in the <code className="px-1 py-0.5 rounded font-mono" style={{ backgroundColor: 'hsl(225, 15%, 16%)', color: 'hsl(210, 100%, 60%)' }}>users.d/</code> directory, which is the recommended approach for managing radius auth-users.
                </p>
              </>
            )}

            {isAuthorizeFile && (
              <>
                <p>
                  <strong style={{ color: 'hsl(210, 100%, 60%)', fontWeight: 600 }}>This file is read-only.</strong> The <code className="px-1 py-0.5 rounded font-mono" style={{ backgroundColor: 'hsl(225, 15%, 16%)', color: 'hsl(210, 100%, 60%)' }}>/etc/freeradius/3.0/mods-config/files/authorize</code> file is automatically managed by the system and cannot be edited directly from this interface.
                </p>
                <p>
                  <strong style={{ fontWeight: 600 }}>To add users:</strong> Use the <strong style={{ color: 'hsl(210, 100%, 60%)' }}>New User</strong> button. It will create files in <code className="px-1 py-0.5 rounded font-mono" style={{ backgroundColor: 'hsl(225, 15%, 16%)', color: 'hsl(210, 100%, 60%)' }}>users.d/</code> and automatically update this file with <code className="px-1 py-0.5 rounded font-mono" style={{ backgroundColor: 'hsl(225, 15%, 16%)' }}>$INCLUDE</code> statements.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
