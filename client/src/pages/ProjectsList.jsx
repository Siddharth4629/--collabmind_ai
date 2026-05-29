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
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#10b981', '#0ea5e9']
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

      <div className="flex-1 pl-64 pt-16">
        <Navbar title="Workspace Overview" />

        <main className="p-8 space-y-8 animate-fade-in max-w-7xl mx-auto">
          {/* Dashboard Metrics Panels */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex items-center gap-4 hover:border-slate-700 transition">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <FolderKanban className="w-6 h-6" />
              </div>
              <div>
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Total Projects</p>
                <h3 className="text-2xl font-bold text-white mt-1">{projects.length}</h3>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex items-center gap-4 hover:border-slate-700 transition">
              <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Allocated Budgets</p>
                <h3 className="text-2xl font-bold text-white mt-1">${totalBudget.toLocaleString()}</h3>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex items-center gap-4 hover:border-slate-700 transition">
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Financial Depletion</p>
                <h3 className="text-2xl font-bold text-white mt-1">${totalSpent.toLocaleString()}</h3>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex items-center gap-4 hover:border-slate-700 transition">
              <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Total Collaborators</p>
                <h3 className="text-2xl font-bold text-white mt-1">{totalMembersCount}</h3>
              </div>
            </div>
          </div>

          {/* Action Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Active Project Boards</h2>
              <p className="text-slate-400 text-xs mt-1">Select a workspace to enter real-time canvas whiteboard and tasks.</p>
            </div>
            
            {user?.role !== 'Viewer' ? (
              <button
                onClick={() => setModalOpen(true)}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-905 px-4 py-2.5 rounded-xl font-semibold text-sm shadow flex items-center gap-2 transition active:scale-95"
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
                    className="glass-panel rounded-2xl p-6 border border-slate-800 hover:border-emerald-500/50 hover:glow-emerald transition duration-350 cursor-pointer flex flex-col justify-between group relative overflow-hidden h-60"
                  >
                    <div className="space-y-3">
                      {/* Card Top */}
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {proj.status}
                        </span>
                        
                        <div className="flex items-center gap-1 text-slate-500 text-xs">
                          <Users className="w-3.5 h-3.5" />
                          <span>{proj.members?.length || 0}</span>
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition truncate">
                        {proj.name}
                      </h3>
                      <p className="text-slate-400 text-xs line-clamp-3 leading-relaxed">
                        {proj.description}
                      </p>
                    </div>

                    {/* Budget progress indicator */}
                    <div className="pt-4 border-t border-slate-900 mt-4 space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-semibold text-slate-500">
                        <span>BUDGET UTILIZATION</span>
                        <span className={percentUsed >= 100 ? 'text-red-400 font-bold' : percentUsed >= 80 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                          {percentUsed}%
                        </span>
                      </div>
                      
                      <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-900">
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${
                            percentUsed >= 100
                              ? 'bg-gradient-to-r from-red-500 to-rose-600'
                              : percentUsed >= 80
                              ? 'bg-gradient-to-r from-amber-500 to-yellow-600'
                              : 'bg-gradient-to-r from-emerald-500 to-teal-600'
                          }`}
                          style={{ width: `${percentUsed}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>{proj.deadline ? new Date(proj.deadline).toLocaleDateString() : 'No date'}</span>
                        </div>
                        <span className="font-semibold text-slate-300">
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
