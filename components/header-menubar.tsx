'use client';

import { Radio, ScrollText, Wifi, Command, Activity, Shield, User } from 'lucide-react';
import Link from 'next/link';

export function HeaderMenubar() {
  return (
    <header className="h-12 flex items-center justify-between px-4 border-b border-border glass-panel-strong z-50 shrink-0">
      {/* LEFT SECTION */}
      <div className="flex items-center gap-3">
        {/* Logo Group */}
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-primary" />
          <div className="font-semibold text-sm tracking-wide text-foreground">
            RADIUS<span className="text-primary">CTRL</span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-4 w-px bg-border" />

        {/* Status Group */}
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-neon-green animate-pulse-green" />
          <span className="text-xs font-mono neon-text-green">ACTIVE</span>
        </div>

        {/* Divider */}
        <div className="h-4 w-px bg-border" />

        {/* Config Path */}
        <div className="text-xs font-mono text-muted-foreground truncate max-w-[300px]">
          /etc/freeradius/3.0/radiusd.conf
        </div>
      </div>

      {/* RIGHT SECTION */}
      <div className="flex items-center gap-3">
        {/* Logs Button */}
        <Link 
          href="/logs" 
          className="flex items-center gap-1.5 px-2 py-1 rounded text-xs hover:bg-secondary/50 hover:text-foreground transition-colors"
        >
          <ScrollText className="h-3 w-3" />
          <span>Logs</span>
        </Link>

        {/* CoA Button */}
        <Link 
          href="/coa" 
          className="flex items-center gap-1.5 px-2 py-1 rounded text-xs hover:bg-secondary/50 hover:text-foreground transition-colors"
        >
          <Wifi className="h-3 w-3" />
          <span>CoA</span>
        </Link>

        {/* Divider */}
        <div className="h-4 w-px bg-border" />

        {/* Command K Button */}
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/50 border border-border rounded hover:bg-secondary hover:border-primary/30 transition-colors">
          <Command className="h-3 w-3" />
          <span className="font-mono text-xs">K</span>
        </button>

        {/* Divider */}
        <div className="h-4 w-px bg-border" />

        {/* Activity Metrics */}
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-muted-foreground" />
          <div className="text-xs font-mono">
            <span className="text-neon-green">1,247</span> req/s
          </div>
        </div>

        {/* Divider */}
        <div className="h-4 w-px bg-border" />

        {/* User Info */}
        <div className="flex items-center gap-2">
          <Shield className="h-3.5 w-3.5 text-primary" />
          <User className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-foreground">root</span>
        </div>
      </div>
    </header>
  );
}
