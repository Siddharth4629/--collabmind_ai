import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Layout/Navbar';
import Sidebar from '../components/Layout/Sidebar';
import { Plus, FolderKanban, Calendar, DollarSign, Users, Sparkles, FolderLock, ShieldAlert } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ProjectsList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
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
  
  // Create Project Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [error, setError] = useState('');

  const fetchProjects = async () => {
    try {
      const res = await axios.get('/api/projects');
      if (res.data.success) {
        setProjects(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load projects list:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!name || !description) {
      setError('Project name and description are required.');
      return;
    }
    setError('');

    try {
      const res = await axios.post('/api/projects', {
        name,
        description,
        budget: Number(budget) || 0,
        deadline
      });

      if (res.data.success) {
        setModalOpen(false);
        setName('');
        setDescription('');
        setBudget('');
        setDeadline('');
        fetchProjects();
        
        // Trigger celebratory animation
        confetti({
          particleCount: 50,
          spread: 45,
          origin: { y: 0.65 },
          colors: ['#6366f1', '#94a3b8']
        });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create project');
    }
  };

  // Calculate statistics totals
  const totalBudget = projects.reduce((acc, p) => acc + (p.budget?.total || 0), 0);
  const totalSpent = projects.reduce((acc, p) => acc + (p.budget?.spent || 0), 0);
  const totalMembersCount = projects.reduce((acc, p) => acc + (p.members?.length || 0), 0);

  return (
    <div className="min-h-screen bg-brand-darker flex font-sans">
      <Sidebar />

      <div className={`flex-1 pt-16 transition-all duration-300 ${sidebarCollapsed ? 'pl-20' : 'pl-64'}`}>
        <Navbar title="Workspace Overview" />

        <main className="p-8 space-y-8 animate-fade-in max-w-7xl mx-auto">
          {/* Dashboard Metrics Panels */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-750 transition flex items-center gap-4">
              <div className="p-2 bg-slate-950 border border-slate-800 text-slate-400 rounded-lg">
                <FolderKanban className="w-5 h-5" />
              </div>
              <div>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Total Projects</p>
                <h3 className="text-xl font-bold text-white mt-0.5">{projects.length}</h3>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-750 transition flex items-center gap-4">
              <div className="p-2 bg-slate-950 border border-slate-800 text-slate-400 rounded-lg">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Allocated Budgets</p>
                <h3 className="text-xl font-bold text-white mt-0.5">${totalBudget.toLocaleString()}</h3>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-750 transition flex items-center gap-4">
              <div className="p-2 bg-slate-950 border border-slate-800 text-slate-400 rounded-lg">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Financial Depletion</p>
                <h3 className="text-xl font-bold text-white mt-0.5">${totalSpent.toLocaleString()}</h3>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-750 transition flex items-center gap-4">
              <div className="p-2 bg-slate-950 border border-slate-800 text-slate-400 rounded-lg">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Collaborators</p>
                <h3 className="text-xl font-bold text-white mt-0.5">{totalMembersCount}</h3>
              </div>
            </div>
          </div>

          {/* Action Header */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-900/60">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Active Project Boards</h2>
              <p className="text-slate-500 text-xs mt-1">Select a workspace to enter real-time canvas whiteboard and tasks.</p>
            </div>
            
            {user?.role !== 'Viewer' ? (
              <button
                onClick={() => setModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-semibold text-xs transition active:scale-95 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" strokeWidth={2.5} />
                <span>Create Project</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 text-slate-500 text-xs font-medium border border-slate-800 px-3 py-2 rounded-xl">
                <FolderLock className="w-4 h-4 text-slate-500" />
                <span>Viewer accounts cannot create projects</span>
              </div>
            )}
          </div>

          {/* Projects Matrix */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="glass-panel h-48 rounded-2xl border border-slate-800 animate-pulse"></div>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800">
              <FolderKanban className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white">No projects found</h3>
              <p className="text-slate-500 text-sm mt-1">Create a new project workspace or request to be added to an existing one.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {projects.map((proj) => {
                const total = proj.budget?.total || 0;
                const spent = proj.budget?.spent || 0;
                const percentUsed = total > 0 ? Math.min(100, Math.round((spent / total) * 100)) : 0;
                
                return (
                  <div
                    key={proj._id}
                    onClick={() => navigate(`/project/${proj._id}`)}
                    className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-all duration-200 cursor-pointer flex flex-col justify-between rounded-xl p-5 group relative h-60"
                  >
                    <div className="space-y-3">
                      {/* Card Top */}
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full bg-slate-950 border border-slate-850 text-slate-300 flex items-center gap-1.5 w-fit">
                          <span className={`w-1.5 h-1.5 rounded-full ${proj.status === 'Completed' ? 'bg-emerald-500' : 'bg-indigo-400'}`}></span>
                          {proj.status}
                        </span>
                        
                        <div className="flex items-center gap-1 text-slate-500 text-xs">
                          <Users className="w-3.5 h-3.5" />
                          <span>{proj.members?.length || 0}</span>
                        </div>
                      </div>

                      <h3 className="text-base font-semibold text-white group-hover:text-indigo-400 transition truncate">
                        {proj.name}
                      </h3>
                      <p className="text-slate-500 text-xs line-clamp-3 leading-relaxed">
                        {proj.description}
                      </p>
                    </div>

                    {/* Budget progress indicator */}
                    <div className="pt-4 border-t border-slate-800 mt-4 space-y-2">
                      <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 tracking-wider">
                        <span>BUDGET UTILIZATION</span>
                        <span className={percentUsed >= 100 ? 'text-red-400' : percentUsed >= 80 ? 'text-amber-400' : 'text-indigo-400'}>
                          {percentUsed}%
                        </span>
                      </div>
                      
                      <div className="w-full bg-slate-950 rounded-full h-1 overflow-hidden border border-slate-850">
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${
                            percentUsed >= 100
                              ? 'bg-red-500'
                              : percentUsed >= 80
                              ? 'bg-amber-500'
                              : 'bg-indigo-500'
                          }`}
                          style={{ width: `${percentUsed}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>{proj.deadline ? new Date(proj.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No deadline'}</span>
                        </div>
                        <span className="font-semibold text-slate-400">
                          ${spent.toLocaleString()} / ${total.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Create Project Dialog Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-8 border border-slate-800 animate-slide-up shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6">Initialize New Project</h3>
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-200 text-xs py-3 px-4 rounded-lg mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Project Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mobile Application Scaffold"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-slate-100 text-sm focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Description</label>
                <textarea
                  required
                  rows="3"
                  placeholder="Summarize the project timeline, milestones, and design goals..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-slate-100 text-sm focus:border-emerald-500 transition resize-none"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Financial Budget ($)</label>
                  <input
                    type="number"
                    placeholder="e.g. 50000"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-slate-100 text-sm focus:border-emerald-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Deadline</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-slate-100 text-sm focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4 justify-end">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-3 rounded-xl border border-slate-800 text-slate-400 hover:bg-slate-900 transition text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-905 px-6 py-3 rounded-xl font-semibold text-sm transition active:scale-95 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Launch Project</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
