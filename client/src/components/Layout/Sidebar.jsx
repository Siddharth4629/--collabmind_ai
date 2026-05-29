import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Brain, LogOut, LayoutGrid, FolderKanban, ShieldCheck, UserCheck, Eye } from 'lucide-react';
import axios from 'axios';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await axios.get('/api/projects');
        if (res.data.success) {
          setProjects(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load project switcher lists:', err.message);
      }
    };
    if (user) {
      fetchProjects();
    }
  }, [user, location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleIcon = () => {
    if (!user) return null;
    switch (user.role) {
      case 'Admin':
        return <ShieldCheck className="w-4 h-4 text-red-400" />;
      case 'Member':
        return <UserCheck className="w-4 h-4 text-emerald-400" />;
      default:
        return <Eye className="w-4 h-4 text-sky-400" />;
    }
  };

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 z-20 font-sans">
      {/* Brand Header */}
      <div className="h-16 px-6 border-b border-slate-900 flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-tr from-emerald-500 to-sky-400 rounded-lg flex items-center justify-center shadow shadow-emerald-500/20">
          <Brain className="w-5 h-5 text-slate-950" strokeWidth={2.5} />
        </div>
        <span className="font-bold text-white tracking-wide text-lg bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
          CollabMind
        </span>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 px-4 py-6 overflow-y-auto space-y-6">
        <div>
          <span className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-3">WORKSPACE</span>
          <Link
            to="/"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
              location.pathname === '/'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100 border border-transparent'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Overview Dashboard</span>
          </Link>
        </div>

        {/* Dynamic Project Switcher List */}
        <div>
          <span className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-3">YOUR PROJECTS</span>
          <div className="space-y-1">
            {projects.length === 0 ? (
              <p className="px-3 text-xs text-slate-600 italic">No active projects</p>
            ) : (
              projects.map((proj) => {
                const isActive = location.pathname.startsWith(`/project/${proj._id}`);
                return (
                  <Link
                    key={proj._id}
                    to={`/project/${proj._id}`}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition border ${
                      isActive
                        ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100 border-transparent'
                    }`}
                  >
                    <FolderKanban className="w-4 h-4" />
                    <span className="truncate">{proj.name}</span>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* User Session card footer */}
      <div className="p-4 border-t border-slate-900 bg-slate-950/40">
        {user && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              <div className="w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center text-emerald-400 font-bold text-sm border border-slate-700">
                {user.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {getRoleIcon()}
                  <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">{user.role}</span>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition w-full"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
