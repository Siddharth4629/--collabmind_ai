import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useTheme } from '../../context/ThemeContext';
import { Radio, ShieldAlert, Palette, Sun, Moon, Check } from 'lucide-react';

export default function Navbar({ title }) {
  const { user } = useAuth();
  const { connected } = useSocket();
  const { theme, setTheme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    localStorage.getItem('sidebar-collapsed') === 'true'
  );

  useEffect(() => {
    const handleToggle = () => {
      setSidebarCollapsed(localStorage.getItem('sidebar-collapsed') === 'true');
    };
    window.addEventListener('sidebar-toggle', handleToggle);
    return () => window.removeEventListener('sidebar-toggle', handleToggle);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <header className={`h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-8 fixed top-0 right-0 z-10 transition-all duration-300 ${sidebarCollapsed ? 'left-20' : 'left-64'}`}>
      {/* Page Title */}
      <h2 className="text-lg font-bold text-slate-100 tracking-tight font-sans">
        {title || 'Overview'}
      </h2>

      {/* Real-time Connection, Theme, & Profile indicators */}
      <div className="flex items-center gap-6">
        {/* Socket Status Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950 border border-slate-800 text-[11px] font-medium transition duration-200">
          {connected ? (
            <>
              <svg className="w-3.5 h-3.5 text-emerald-400 svg-sync-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="9" strokeDasharray="12 6" />
                <circle cx="12" cy="12" r="2.5" fill="currentColor" />
              </svg>
              <span className="text-slate-400">Live Sync Connected</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="9" />
                <line x1="4.9" y1="4.9" x2="19.1" y2="19.1" />
              </svg>
              <span className="text-red-400 font-semibold">Disconnected</span>
            </>
          )}
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-450 hover:text-slate-200 hover:border-slate-700 transition-all flex items-center justify-center cursor-pointer"
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? (
            <Moon className="w-4 h-4 text-indigo-400" />
          ) : (
            <Sun className="w-4 h-4 text-amber-500" />
          )}
        </button>

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
