import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Radio, ShieldAlert } from 'lucide-react';

export default function Navbar({ title }) {
  const { user } = useAuth();
  const { connected } = useSocket();

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-8 fixed top-0 right-0 left-64 z-10">
      {/* Page Title */}
      <h2 className="text-lg font-bold text-white tracking-tight font-sans">
        {title || 'Overview'}
      </h2>

      {/* Real-time Connection & Profile indicators */}
      <div className="flex items-center gap-6">
        {/* Socket Status Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950 border border-slate-800 text-[11px] font-medium">
          {connected ? (
            <>
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="text-slate-400">Live Sync Connected</span>
            </>
          ) : (
            <>
              <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
              <span className="text-red-400 font-semibold">Disconnected</span>
            </>
          )}
        </div>

        {/* User Card */}
        {user && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Welcome,</span>
            <span className="text-xs font-semibold text-emerald-400">{user.name.split(' ')[0]}</span>
          </div>
        )}
      </div>
    </header>
  );
}
