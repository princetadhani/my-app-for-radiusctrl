'use client';

import { motion } from 'framer-motion';
import { Radio, Command, Activity, Scroll, Wifi, Shield, User, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getRadiusStatus } from '@/lib/api';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

interface StatusHeaderProps {
  currentFile?: string;
  onNewUserClick?: () => void;
}

export function StatusHeader({ currentFile, onNewUserClick }: StatusHeaderProps) {
  const [status, setStatus] = useState<'running' | 'stopped'>('running');
  const [requestsPerSecond, setRequestsPerSecond] = useState(0);
  const router = useRouter();
  const pathname = usePathname();

  const handleNewUserClick = () => {
    // If not on home page, navigate to home with dialog trigger
    if (pathname !== '/') {
      router.push('/?openNewUser=true');
    } else {
      // Already on home page, just open dialog
      onNewUserClick?.();
    }
  };

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await getRadiusStatus();
        setStatus(data.status);
        setRequestsPerSecond((data as any).requests_per_second || 0);
      } catch (error) {
        console.error('Failed to fetch RADIUS status:', error);
        // Keep current status on error, don't crash the UI
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const isActive = status === 'running';

  return (
    <motion.header
      initial={{ y: -48, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 h-12 z-50 flex items-center justify-between px-4 border-b"
      style={{
        backgroundColor: 'rgba(15, 18, 30, 0.85)',
        backdropFilter: 'blur(24px) saturate(1.4)',
        borderBottomColor: 'hsl(225, 15%, 18%)',
      }}
    >
      {/* LEFT SECTION */}
      <div className="flex items-center gap-3">
        {/* Logo Group */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Radio className="w-4 h-4" style={{ color: 'hsl(210, 100%, 60%)' }} />
          <span className="text-sm font-semibold tracking-wide" style={{ fontFamily: 'var(--font-inter)' }}>
            <span style={{ color: 'hsl(210, 40%, 92%)' }}>RADIUS</span>
            <span style={{ color: 'hsl(210, 100%, 60%)' }}>CTRL</span>
          </span>
        </Link>

        {/* Vertical Separator */}
        <div className="w-px h-4 bg-border mx-1" style={{ backgroundColor: 'hsl(225, 15%, 18%)' }} />

        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${isActive ? 'bg-neon-green animate-pulse-green' : 'bg-neon-red animate-pulse-red'
              }`}
          />
          <span
            className="text-xs uppercase font-mono"
            style={{
              fontFamily: 'var(--font-jetbrains-mono)',
              color: isActive ? 'hsl(145, 80%, 55%)' : 'hsl(0, 85%, 60%)',
              textShadow: isActive
                ? '0 0 8px rgba(76, 217, 100, 0.5)'
                : '0 0 8px rgba(239, 68, 68, 0.5)',
            }}
          >
            {isActive ? 'ACTIVE' : 'INACTIVE'}
          </span>
        </div>

        {/* Vertical Separator */}
        <div className="w-px h-4 bg-border mx-1" style={{ backgroundColor: 'hsl(225, 15%, 18%)' }} />

        {/* Current File Path (optional) */}
        {currentFile && (
          <div
            className="text-xs font-mono truncate max-w-[300px]"
            style={{
              fontFamily: 'var(--font-jetbrains-mono)',
              color: 'hsl(215, 15%, 55%)',
            }}
          >
            {currentFile}
          </div>
        )}
      </div>

      {/* RIGHT SECTION */}
      <div className="flex items-center gap-3">
        {/* Navigation Buttons - Hidden on mobile */}
        <nav className="hidden md:flex items-center gap-3">
          {/* New User Button */}
          <button
            onClick={handleNewUserClick}
            className="flex items-center gap-1.5 px-2 py-1 rounded transition-all duration-200 text-xs"
            style={{
              fontFamily: 'var(--font-inter)',
              color: 'hsl(215, 15%, 55%)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(29, 35, 50, 0.5)';
              e.currentTarget.style.color = 'hsl(210, 40%, 92%)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'hsl(215, 15%, 55%)';
            }}
          >
            <UserPlus className="w-3 h-3" />
            <span>New User</span>
          </button>
          <Link
            href="/logs"
            className="flex items-center gap-1.5 px-2 py-1 rounded transition-all duration-200 text-xs"
            style={{
              fontFamily: 'var(--font-inter)',
              color: 'hsl(215, 15%, 55%)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(29, 35, 50, 0.5)';
              e.currentTarget.style.color = 'hsl(210, 40%, 92%)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'hsl(215, 15%, 55%)';
            }}
          >
            <Scroll className="w-3 h-3" />
            <span>Logs</span>
          </Link>
          <Link
            href="/coa"
            className="flex items-center gap-1.5 px-2 py-1 rounded transition-all duration-200 text-xs"
            style={{
              fontFamily: 'var(--font-inter)',
              color: 'hsl(215, 15%, 55%)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(29, 35, 50, 0.5)';
              e.currentTarget.style.color = 'hsl(210, 40%, 92%)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'hsl(215, 15%, 55%)';
            }}
          >
            <Wifi className="w-3 h-3" />
            <span>CoA</span>
          </Link>
        </nav>

        {/* Vertical Separator */}
        <div className="hidden md:block w-px h-4" style={{ backgroundColor: 'hsl(225, 15%, 18%)' }} />

        {/* Command Palette Button */}
        <button
          className="flex items-center gap-2 px-3 py-1.5 rounded-md border transition-all duration-200 text-xs"
          style={{
            fontFamily: 'var(--font-jetbrains-mono)',
            backgroundColor: 'rgba(29, 35, 50, 0.5)',
            borderColor: 'hsl(225, 15%, 18%)',
            color: 'hsl(215, 15%, 55%)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'hsl(225, 15%, 16%)';
            e.currentTarget.style.color = 'hsl(210, 40%, 92%)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(29, 35, 50, 0.5)';
            e.currentTarget.style.color = 'hsl(215, 15%, 55%)';
          }}
          onClick={() => {
            const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true });
            document.dispatchEvent(event);
          }}
        >
          <Command className="w-3 h-3" />
          <span>K</span>
        </button>

        {/* Vertical Separator */}
        <div className="w-px h-4" style={{ backgroundColor: 'hsl(225, 15%, 18%)' }} />

        {/* Activity/Metrics Display */}
        <div className="flex items-center gap-2">
          <Activity
            className="w-3.5 h-3.5"
            style={{ color: 'hsl(215, 15%, 55%)' }}
          />
          <span
            className="text-xs font-mono"
            style={{
              fontFamily: 'var(--font-jetbrains-mono)',
              color: 'hsl(215, 15%, 55%)',
            }}
          >
            <span style={{ color: 'hsl(145, 80%, 55%)' }}>
              {requestsPerSecond.toLocaleString()}
            </span>
            {' req/s'}
          </span>
        </div>

        {/* Vertical Separator */}
        <div className="w-px h-4" style={{ backgroundColor: 'hsl(225, 15%, 18%)' }} />

        {/* User Info Section */}
        <div className="flex items-center gap-2">
          <Shield
            className="w-3.5 h-3.5"
            style={{ color: 'hsl(210, 100%, 60%)' }}
          />
          <User
            className="w-3.5 h-3.5"
            style={{ color: 'hsl(215, 15%, 55%)' }}
          />
          <span
            className="text-xs font-medium"
            style={{
              fontFamily: 'var(--font-inter)',
              color: 'hsl(210, 40%, 92%)',
            }}
          >
            root
          </span>
        </div>
      </div>
    </motion.header>
  );
}
