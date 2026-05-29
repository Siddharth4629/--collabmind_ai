import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Layout/Sidebar';
import Navbar from '../components/Layout/Navbar';
import Overview from '../components/Dashboard/Overview';
import Board from '../components/Kanban/Board';
import Canvas from '../components/Whiteboard/Canvas';
import ChatBox from '../components/Chat/ChatBox';
import Editor from '../components/Notes/Editor';
import Tracker from '../components/Budget/Tracker';
import Ideator from '../components/AI/Ideator';
import CodeWorkspace from '../components/Code/CodeWorkspace';
import { 
  BarChart2, KanbanSquare, Edit, MessageSquare, Paintbrush, 
  DollarSign, Sparkles, Settings, Plus, Trash2, Mail, ShieldAlert,
  Calendar, CheckCircle, Info, Code
} from 'lucide-react';

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Member');
  const [inviteError, setInviteError] = useState(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);

  const fetchProjectDetails = async () => {
    try {
      const res = await axios.get(`/api/projects/${id}`);
      if (res.data.success) {
        setProject(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load project details:', err);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProjectDetails();
    }
  }, [id]);

  const handleProjectUpdate = (updatedProject) => {
    setProject(updatedProject);
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviteError(null);
    setInviteSuccess(false);
    setSettingsLoading(true);

    try {
      const res = await axios.post(`/api/projects/${project._id}/members`, {
        email: inviteEmail.trim(),
        role: inviteRole
      });

      if (res.data.success) {
        setInviteSuccess(true);
        setInviteEmail('');
        setInviteRole('Member');
        fetchProjectDetails();
      }
    } catch (err) {
      setInviteError(err.response?.data?.error || 'Failed to invite user');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member from the project?')) return;
    setSettingsLoading(true);
    setInviteError(null);
    setInviteSuccess(false);

    try {
      const res = await axios.delete(`/api/projects/${project._id}/members/${userId}`);
      if (res.data.success) {
        fetchProjectDetails();
      }
    } catch (err) {
      setInviteError(err.response?.data?.error || 'Failed to remove member');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('WARNING: Are you sure you want to permanently delete this project? This action cannot be undone.')) return;
    setSettingsLoading(true);

    try {
      const res = await axios.delete(`/api/projects/${project._id}`);
      if (res.data.success) {
        navigate('/');
      }
    } catch (err) {
      setInviteError(err.response?.data?.error || 'Failed to delete project');
    } finally {
      setSettingsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-slate-950">
        <Sidebar />
        <div className="flex-1 pl-64">
          <Navbar title="Loading project..." />
          <main className="pt-16 p-8 flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
              <p className="text-sm text-slate-400">Loading project environment...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!project) return null;

  // Tabs layout mapping
  const TABS = [
    { id: 'Overview', label: 'Dashboard', icon: BarChart2 },
    { id: 'Board', label: 'Kanban Board', icon: KanbanSquare },
    { id: 'Whiteboard', label: 'Whiteboard', icon: Paintbrush },
    { id: 'Code', label: 'Code Workspace', icon: Code },
    { id: 'Notes', label: 'Note Editor', icon: Edit },
    { id: 'Chat', label: 'Chat Room', icon: MessageSquare },
    { id: 'Budget', label: 'Budget Tracker', icon: DollarSign },
    { id: 'AI', label: 'AI Ideation', icon: Sparkles },
    { id: 'Settings', label: 'Settings', icon: Settings }
  ];

  // Auth roles helper
  const isOwner = project.owner === user._id || project.owner?._id === user._id;
  const isProjAdmin = project.members?.some(
    (m) => (m.user?._id === user._id || m.user === user._id) && m.role === 'Admin'
  );
  const canManageSettings = isOwner || isProjAdmin || user.role === 'Admin';

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Sidebar />

      <div className="flex-1 pl-64 flex flex-col">
        <Navbar title={project.name} />

        <main className="flex-1 pt-16 p-6 space-y-6 overflow-x-hidden">
          
          {/* Project Details Banner subheader */}
          <div className="p-6 bg-slate-900/40 rounded-2xl border border-slate-800/80 backdrop-blur-md relative overflow-hidden shadow-lg flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-slate-100 tracking-tight">{project.name}</h1>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {project.status || 'Active'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-2 max-w-2xl leading-relaxed">
                {project.description || 'Collaborative workspace container.'}
              </p>
            </div>

            {/* Deadline / members summary indicator */}
            <div className="flex flex-wrap items-center gap-6 text-xs shrink-0 bg-slate-950/40 p-3.5 rounded-xl border border-slate-850">
              {project.deadline && (
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  <div>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wide">Target Deadline</p>
                    <p className="font-semibold text-slate-200 mt-0.5">{new Date(project.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-slate-400">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <div>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wide">Team Size</p>
                  <p className="font-semibold text-slate-200 mt-0.5">{(project.members?.length || 0) + 1} users</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sub Tab Navigation */}
          <div className="flex border-b border-slate-850 overflow-x-auto pb-px scrollbar-none">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all duration-200 shrink-0 ${
                    isActive 
                      ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
                      : 'border-transparent text-slate-500 hover:text-slate-350 hover:bg-slate-900/30'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Screen Assembly */}
          <div className="mt-6 flex-1 min-h-[350px]">
            {activeTab === 'Overview' && (
              <Overview projectId={project._id} />
            )}

            {activeTab === 'Board' && (
              <Board projectId={project._id} />
            )}

            {activeTab === 'Whiteboard' && (
              <Canvas projectId={project._id} />
            )}

            {activeTab === 'Code' && (
              <CodeWorkspace projectId={project._id} />
            )}

            {activeTab === 'Notes' && (
              <Editor projectId={project._id} />
            )}

            {activeTab === 'Chat' && (
              <ChatBox projectId={project._id} />
            )}

            {activeTab === 'Budget' && (
              <Tracker project={project} onProjectUpdate={handleProjectUpdate} />
            )}

            {activeTab === 'AI' && (
              <Ideator projectId={project._id} onTaskAdded={fetchProjectDetails} />
            )}

            {activeTab === 'Settings' && (
              <div className="space-y-6">
                
                {/* 1. Member Management Panel */}
                <div className="p-6 bg-slate-900/60 border border-slate-800/80 rounded-2xl backdrop-blur-md">
                  <h3 className="text-sm font-semibold text-slate-200 mb-4">Invite Project Team Members</h3>
                  
                  {canManageSettings ? (
                    <form onSubmit={handleInviteMember} className="flex flex-col sm:flex-row gap-3 max-w-xl">
                      <div className="flex-1 relative">
                        <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                        <input
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="Team member's email address..."
                          className="w-full bg-slate-950/70 border border-slate-850 hover:border-slate-800 focus:border-indigo-500 focus:outline-none rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-650 transition"
                          required
                        />
                      </div>
                      
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value)}
                        className="bg-slate-950/70 border border-slate-850 focus:border-indigo-500 focus:outline-none rounded-xl px-3.5 py-2 text-xs text-slate-300"
                      >
                        <option value="Member">Member (Read & Write)</option>
                        <option value="Viewer">Viewer (Read Only)</option>
                        <option value="Admin">Admin (Full Control)</option>
                      </select>

                      <button
                        type="submit"
                        disabled={settingsLoading || !inviteEmail}
                        className="bg-indigo-650 hover:bg-indigo-600 disabled:bg-slate-850 text-white px-5 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" /> Invite
                      </button>
                    </form>
                  ) : (
                    <div className="p-3 bg-slate-950/40 border border-slate-850 text-xs text-slate-500 rounded-xl flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      Only Project Admins or Owner can invite members.
                    </div>
                  )}

                  {inviteError && <p className="text-xs text-rose-400 mt-2">{inviteError}</p>}
                  {inviteSuccess && <p className="text-xs text-emerald-400 mt-2">Member added successfully!</p>}

                  {/* Team Members List */}
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-8 mb-4">Active Team Roster</h4>
                  <div className="space-y-2 max-w-2xl">
                    
                    {/* Owner detail row */}
                    <div className="p-3 bg-slate-950/30 border border-slate-850/80 rounded-xl flex justify-between items-center text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
                          {project.owner?.name?.charAt(0) || 'O'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-200">{project.owner?.name || 'Owner'}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{project.owner?.email || ''}</p>
                        </div>
                      </div>
                      <span className="text-[9px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        Owner
                      </span>
                    </div>

                    {/* Member rows */}
                    {project.members && project.members.map((member) => {
                      const mUser = member.user || {};
                      return (
                        <div 
                          key={mUser._id || Math.random()} 
                          className="p-3 bg-slate-950/30 border border-slate-850/80 rounded-xl flex justify-between items-center text-xs hover:border-slate-800 transition"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-850 text-slate-400 flex items-center justify-center font-semibold border border-slate-800">
                              {mUser.name?.charAt(0) || 'M'}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-200">{mUser.name || 'Anonymous User'}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">{mUser.email || ''}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span className="text-[9px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
                              {member.role}
                            </span>
                            
                            {canManageSettings && mUser._id !== user._id && (
                              <button
                                onClick={() => handleRemoveMember(mUser._id)}
                                disabled={settingsLoading}
                                className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 rounded transition"
                                title="Remove team member"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                  </div>
                </div>

                {/* 2. Critical Actions / Deletion */}
                {isOwner || user.role === 'Admin' ? (
                  <div className="p-6 bg-slate-900/60 border border-rose-950/40 rounded-2xl backdrop-blur-md">
                    <h3 className="text-sm font-semibold text-rose-400 mb-2 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4" /> Danger Zone
                    </h3>
                    <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                      Permanently delete this project. All tasks, whiteboard elements, chat messages, notes, and activity logs will be destroyed. This cannot be undone.
                    </p>
                    <button
                      onClick={handleDeleteProject}
                      disabled={settingsLoading}
                      className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold py-2.5 px-5 rounded-xl transition shadow-[0_0_15px_rgba(239,68,68,0.15)]"
                    >
                      Delete Project
                    </button>
                  </div>
                ) : null}

              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}
