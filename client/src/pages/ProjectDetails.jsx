import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import { useConfirmation } from '../context/ConfirmationContext';
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
  Calendar, CheckCircle, Info, Code, ChevronDown, User, LogOut,
  X, Check, Phone, MapPin, Github, Linkedin, FileText, Sun, Moon, LayoutGrid, Brain,
  FolderKanban, Bot, ChevronLeft, ChevronRight
} from 'lucide-react';

const CalendarPicker = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(() => {
    return value ? new Date(value) : new Date();
  });
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const totalDays = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const days = [];
  for (let i = 0; i < firstDayIndex; i++) {
    days.push(null);
  }
  for (let i = 1; i <= totalDays; i++) {
    days.push(i);
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handleSelectDay = (day, e) => {
    e.stopPropagation();
    if (!day) return;
    const selectedDate = new Date(year, month, day);
    const yyyy = selectedDate.getFullYear();
    const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const dd = String(selectedDate.getDate()).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
    setIsOpen(false);
  };

  const isSelected = (day) => {
    if (!day || !value) return false;
    const valDate = new Date(value);
    return valDate.getDate() === day && valDate.getMonth() === month && valDate.getFullYear() === year;
  };

  const isToday = (day) => {
    if (!day) return false;
    const today = new Date();
    return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-[var(--gold-primary)] rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-100 flex items-center justify-between transition-all duration-300 cursor-pointer focus:ring-2 focus:ring-[var(--gold-primary)]/10 text-left"
      >
        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--gold-primary)] animate-pulse" />
        <span className={value ? 'text-slate-150' : 'text-slate-500'}>
          {value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Select deadline'}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 w-64 animate-fade-in text-xs select-none">
          <div className="flex justify-between items-center mb-3">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              &larr;
            </button>
            <span className="font-bold text-slate-200 uppercase tracking-wider font-sans">
              {monthNames[month]} {year}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              &rarr;
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center font-bold text-slate-500 uppercase tracking-widest text-[8px] mb-2">
            <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
          </div>

          <div key={`${month}-${year}`} className="grid grid-cols-7 gap-1 text-center font-sans animate-fade-in">
            {days.map((day, idx) => {
              const active = isSelected(day);
              const today = isToday(day);
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={!day}
                  onClick={(e) => handleSelectDay(day, e)}
                  className={`h-7 w-7 rounded-lg text-[10px] flex items-center justify-center transition-all cursor-pointer ${
                    !day 
                      ? 'bg-transparent cursor-default' 
                      : active
                      ? 'bg-gradient-to-tr from-[var(--gold-primary)] to-[var(--gold-secondary)] text-slate-950 font-bold shadow-md'
                      : today
                      ? 'border border-[var(--gold-primary)]/50 text-[var(--gold-primary)] font-bold'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout, updateProfile } = useAuth();
  const { socket, joinProject, leaveProject, connected } = useSocket();
  const { theme, setTheme } = useTheme();
  const { confirm } = useConfirmation();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Member');
  const [inviteError, setInviteError] = useState(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);

  // Dropdown states
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(localStorage.getItem('project-sidebar-collapsed') === 'true');
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('project-sidebar-width');
    return saved ? parseInt(saved, 10) : 240;
  });
  const [isResizing, setIsResizing] = useState(false);
  const [projectsList, setProjectsList] = useState([]);

  // Create Project Modal (Inside switcher)
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjBudget, setNewProjBudget] = useState('');
  const [newProjDeadline, setNewProjDeadline] = useState('');
  const [createError, setCreateError] = useState('');

  // Profile Edit Modal States
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileLocation, setProfileLocation] = useState('');
  const [profileSkills, setProfileSkills] = useState('');
  const [profileGithub, setProfileGithub] = useState('');
  const [profileLinkedin, setProfileLinkedin] = useState('');

  const [profileError, setProfileError] = useState(null);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  // Ref hooks for click outside dropdowns
  const projectRef = useRef();
  const profileRef = useRef();

  useEffect(() => {
    function handleClickOutside(event) {
      if (projectRef.current && !projectRef.current.contains(event.target)) {
        setProjectDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const startResizing = (mouseDownEvent) => {
    mouseDownEvent.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (mouseMoveEvent) => {
      const newWidth = Math.max(160, Math.min(480, mouseMoveEvent.clientX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  useEffect(() => {
    if (!isResizing) {
      localStorage.setItem('project-sidebar-width', sidebarWidth);
    }
  }, [isResizing, sidebarWidth]);

  const openProfileModal = () => {
    if (user) {
      setProfileName(user.name || '');
      setProfileEmail(user.email || '');
      setProfileBio(user.bio || '');
      setProfilePhone(user.phone || '');
      setProfileLocation(user.location || '');
      setProfileSkills(user.skills || '');
      setProfileGithub(user.github || '');
      setProfileLinkedin(user.linkedin || '');
    }
    setProfileError(null);
    setProfileSuccess(false);
    setProfileModalOpen(true);
    setProfileDropdownOpen(false);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileName || !profileEmail) {
      setProfileError('Name and email are required');
      return;
    }
    setProfileError(null);
    setProfileSuccess(false);
    setProfileSaving(true);

    try {
      const res = await updateProfile({
        name: profileName,
        email: profileEmail,
        bio: profileBio,
        phone: profilePhone,
        location: profileLocation,
        skills: profileSkills,
        github: profileGithub,
        linkedin: profileLinkedin
      });

      if (res && res.success) {
        setProfileSuccess(true);
        setTimeout(() => {
          setProfileModalOpen(false);
          setProfileSuccess(false);
        }, 1200);
      } else {
        setProfileError(res?.error || 'Failed to update profile');
      }
    } catch (err) {
      setProfileError(err.message || 'An error occurred');
    } finally {
      setProfileSaving(false);
    }
  };

  const fetchProjectDetails = async () => {
    try {
      const res = await axios.get(`/api/projects/${id}`);
      if (res.data.success) {
        setProject(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load project details:', err);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllProjects = async () => {
    try {
      const res = await axios.get('/api/projects');
      if (res.data.success) {
        setProjectsList(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load project switcher lists:', err.message);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProjectDetails();
      fetchAllProjects();
    }
  }, [id]);

  useEffect(() => {
    if (id && socket) {
      joinProject(id);
      return () => {
        leaveProject(id);
      };
    }
  }, [id, socket]);

  const handleProjectUpdate = (updatedProject) => {
    setProject(updatedProject);
  };

  const handleSelectProject = (projectId) => {
    setProjectDropdownOpen(false);
    navigate(`/project/${projectId}`);
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
    if (!(await confirm('Remove this member from the project?'))) return;
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
    if (!(await confirm('WARNING: Permanently delete this project? This action cannot be undone.'))) return;
    setSettingsLoading(true);

    try {
      const res = await axios.delete(`/api/projects/${project._id}`);
      if (res.data.success) {
        navigate('/dashboard');
      }
    } catch (err) {
      setInviteError(err.response?.data?.error || 'Failed to delete project');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjName || !newProjDesc) {
      setCreateError('Project name and description are required.');
      return;
    }
    setCreateError('');

    try {
      const res = await axios.post('/api/projects', {
        name: newProjName,
        description: newProjDesc,
        budget: Number(newProjBudget) || 0,
        deadline: newProjDeadline
      });

      if (res.data.success) {
        setCreateProjectModalOpen(false);
        setNewProjName('');
        setNewProjDesc('');
        setNewProjBudget('');
        setNewProjDeadline('');
        setProjectDropdownOpen(false);
        fetchAllProjects();
        navigate(`/project/${res.data.data._id}`);
      }
    } catch (err) {
      setCreateError(err.response?.data?.error || 'Failed to create project');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-slate-950 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-[var(--gold-primary)] rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading project environment...</p>
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
    { id: 'Chat', label: 'Team Discussion', icon: MessageSquare },
    { id: 'Budget', label: 'Budget Tracker', icon: DollarSign },
    { id: 'AI', label: 'AI Ideation', icon: Bot },
    { id: 'Settings', label: 'Settings', icon: Settings }
  ];

  // Auth roles helper
  const isOwner = project.owner === user?._id || project.owner?._id === user?._id;
  const isProjAdmin = project.members?.some(
    (m) => (m.user?._id === user?._id || m.user === user?._id) && m.role === 'Admin'
  );
  const canManageSettings = isOwner || isProjAdmin || user?.role === 'Admin';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col transition-colors duration-300">
      
      {/* 1. UNIFIED COMMAND NAVBAR HEADER */}
      <header className="h-16 navbar-custom flex items-center justify-between px-6 fixed top-0 left-0 right-0 z-40 transition-all">
        
        {/* Left Side: Brand Logo & Project Switcher Dropdown */}
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-90 transition">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[var(--gold-primary)] to-[var(--gold-secondary)] flex items-center justify-center shadow">
              <Brain className="w-5 h-5 text-[var(--active-tab-text)]" />
            </div>
            <span className="font-bold text-white tracking-tight hidden md:inline text-sm">CollabMind</span>
          </Link>
          
          <div className="h-5 w-px bg-slate-800 hidden md:block" />

          {/* Project Switcher */}
          <div className="relative" ref={projectRef}>
            <button
              onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-850 text-xs font-semibold text-slate-200 hover:border-slate-700 hover:text-white transition cursor-pointer"
            >
              <FolderKanban className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
              <span className="truncate max-w-[150px]">{project.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {projectDropdownOpen && (
              <div className="absolute left-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-fade-in text-left">
                <span className="block px-3 py-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-widest">SWITCH PROJECTS</span>
                <div className="max-h-52 overflow-y-auto space-y-0.5 mt-1">
                  {projectsList.map((p) => (
                    <button
                      key={p._id}
                      onClick={() => handleSelectProject(p._id)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center gap-2.5 transition ${
                        p._id === project._id
                          ? 'bg-gradient-to-r from-[var(--gold-primary)] to-[var(--gold-secondary)] text-[var(--active-tab-text)] font-bold'
                          : 'text-slate-350 hover:bg-slate-950 hover:text-white'
                      }`}
                    >
                      <FolderKanban className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{p.name}</span>
                    </button>
                  ))}
                </div>

                <div className="border-t border-slate-850 mt-2 pt-2 flex flex-col gap-1">
                  <Link 
                    to="/dashboard"
                    onClick={() => setProjectDropdownOpen(false)}
                    className="px-3 py-2 rounded-xl text-xs text-slate-450 hover:bg-slate-950 hover:text-white flex items-center gap-2.5 transition"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Back to Hub Overview</span>
                  </Link>

                  {user?.role !== 'Viewer' && (
                    <button
                      onClick={() => {
                        setCreateProjectModalOpen(true);
                        setProjectDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs text-[var(--gold-primary)] hover:bg-slate-950 hover:text-yellow-400 flex items-center gap-2.5 transition font-semibold cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create New Project</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Settings Tab Button (Moved from sidebar next to project switcher) */}
          {canManageSettings && (
            <button
              onClick={() => setActiveTab('Settings')}
              className={`group flex items-center gap-0 hover:gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-300 cursor-pointer ${
                activeTab === 'Settings'
                  ? 'bg-gradient-to-r from-[var(--gold-primary)] to-[var(--gold-secondary)] text-slate-950 border-[var(--gold-primary)] font-bold shadow-md shadow-yellow-950/10'
                  : 'bg-slate-900/60 border-slate-850 text-slate-455 hover:border-slate-750 hover:text-white'
              }`}
            >
              <Settings className="w-3.5 h-3.5 shrink-0" />
              <span className="max-w-0 opacity-0 group-hover:max-w-[70px] group-hover:opacity-100 transition-all duration-300 ease-in-out truncate font-bold">
                Settings
              </span>
            </button>
          )}

        </div>


        {/* Right Side: Socket Sync, Theme Toggler, User Profile Dropdown */}
        <div className="flex items-center gap-4">
          {/* Socket Connection */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-850 text-[10px] font-semibold">
            {connected ? (
              <>
                <svg className="w-3 h-3 text-emerald-400 svg-sync-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="9" strokeDasharray="12 6" />
                  <circle cx="12" cy="12" r="2.5" fill="currentColor" />
                </svg>
                <span className="text-slate-400 font-mono">Live Sync</span>
              </>
            ) : (
              <>
                <svg className="w-3 h-3 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="9" />
                  <line x1="4.9" y1="4.9" x2="19.1" y2="19.1" />
                </svg>
                <span className="text-red-400 font-bold font-mono">Offline</span>
              </>
            )}
          </div>

          {/* Theme Toggler */}
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="p-2 rounded-xl bg-slate-900/60 border border-slate-850 text-slate-400 hover:text-[var(--gold-primary)] hover:border-slate-700 transition flex items-center justify-center cursor-pointer"
            title="Toggle Theme"
          >
            {theme === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
          </button>

          {/* User Profile Switcher */}
          {user && (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 cursor-pointer hover:opacity-95 transition"
              >
                <div className="w-10 h-10 bg-slate-900 border border-slate-850 rounded-xl text-[var(--gold-primary)] flex items-center justify-center shadow hover:border-slate-700 transition">
                  <User className="w-5.5 h-5.5 text-[var(--gold-primary)]" />
                </div>
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-3 z-50 animate-fade-in text-left">
                  <div className="pb-3 border-b border-slate-850 mb-2">
                    <p className="text-xs font-bold text-white truncate">{user.name}</p>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">{user.email}</p>
                    <span className="inline-block mt-2 text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-slate-950 border border-slate-850 text-slate-400">
                      {user.role}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <button
                      onClick={openProfileModal}
                      className="w-full text-left px-3 py-2.5 rounded-xl text-xs text-slate-350 hover:bg-slate-950 hover:text-white flex items-center gap-2.5 transition font-semibold cursor-pointer"
                    >
                      <User className="w-5 h-5 text-slate-400 shrink-0" />
                      <span>Edit Profile Settings</span>
                    </button>
                    
                    <Link
                      to="/dashboard"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="w-full text-left px-3 py-2.5 rounded-xl text-xs text-slate-350 hover:bg-slate-950 hover:text-white flex items-center gap-2.5 transition font-semibold"
                    >
                      <LayoutGrid className="w-5 h-5 text-slate-400 shrink-0" />
                      <span>Workspace Overview</span>
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2.5 rounded-xl text-xs text-rose-400 hover:bg-rose-500/5 hover:text-rose-350 flex items-center gap-2.5 transition font-bold cursor-pointer"
                    >
                      <LogOut className="w-5 h-5 text-rose-500 shrink-0" />
                      <span>Sign Out Session</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </header>

      {/* Main layout container below the header */}
      <div className="flex flex-1 pt-16 relative">
        
        {/* Collapsible Left Sidebar */}
        <aside 
          className={`fixed top-16 bottom-0 left-0 z-30 bg-slate-900 border-r border-slate-850 flex flex-col select-none ${
            sidebarCollapsed ? 'overflow-visible' : ''
          } ${
            isResizing ? '' : 'transition-all duration-300'
          }`}
          style={{ width: sidebarCollapsed ? '64px' : `${sidebarWidth}px` }}
        >
          {/* Collapse SVG-only button placed at top right (or centered when collapsed) */}
          <button
            onClick={() => {
              const newVal = !sidebarCollapsed;
              setSidebarCollapsed(newVal);
              localStorage.setItem('project-sidebar-collapsed', newVal);
            }}
            className={`absolute top-3.5 z-40 text-slate-400 hover:text-[var(--gold-primary)] transition cursor-pointer focus:outline-none p-1 ${
              sidebarCollapsed ? 'left-1/2 -translate-x-1/2' : 'right-3'
            }`}
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-5 h-5 shrink-0" />
            ) : (
              <ChevronLeft className="w-5 h-5 shrink-0" />
            )}
          </button>

          {/* Navigation Tabs */}
          <div className={`flex-1 pt-12 pb-4 space-y-1.5 px-3 ${sidebarCollapsed ? 'overflow-visible' : 'overflow-y-auto'}`}>
            {TABS.filter(tab => tab.id !== 'AI' && tab.id !== 'Settings').map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group relative w-full flex items-center rounded-xl transition-all duration-200 shrink-0 cursor-pointer ${
                    sidebarCollapsed 
                      ? 'justify-center p-3 gap-0' 
                      : 'justify-start px-4 py-3 gap-3.5'
                  } ${
                    isActive 
                      ? 'bg-gradient-to-r from-[var(--gold-primary)] to-[var(--gold-secondary)] text-[var(--active-tab-text)] shadow-lg shadow-yellow-950/15 font-bold' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/60'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  
                  {sidebarCollapsed ? (
                    <span className="absolute left-16 ml-2 px-2.5 py-1.5 bg-slate-900 border border-slate-800 text-[var(--gold-primary)] text-[10px] font-bold uppercase tracking-wider rounded-xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 whitespace-nowrap shadow-xl pointer-events-none z-50">
                      {tab.label}
                    </span>
                  ) : (
                    <span className="text-xs uppercase tracking-wider font-semibold truncate">
                      {tab.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Resize Handle */}
          {!sidebarCollapsed && (
            <div
              onMouseDown={startResizing}
              className={`absolute top-0 right-0 bottom-0 w-1 cursor-col-resize hover:bg-[var(--gold-primary)]/50 active:bg-[var(--gold-primary)] transition-colors z-50 ${
                isResizing ? 'bg-[var(--gold-primary)] w-[2px]' : ''
              }`}
            />
          )}
        </aside>

        {/* Workspace Area */}
        <div 
          className={`flex-1 ${isResizing ? '' : 'transition-all duration-300'}`}
          style={{ paddingLeft: sidebarCollapsed ? '64px' : `${sidebarWidth}px` }}
        >
          <main className="py-8 px-6 max-w-[1600px] w-full mx-auto space-y-6 overflow-x-auto">

        {/* Tab Assembly Workspace Router */}
        <div className="flex-1 min-h-[350px]">
          {activeTab === 'Overview' && (
            <Overview projectId={project._id} setActiveTab={setActiveTab} />
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

          {activeTab === 'Settings' && (
            <div className="space-y-6">
              
              {/* Member Management Panel */}
              <div className="p-6 bg-slate-900/60 border border-slate-850 rounded-2xl backdrop-blur-md">
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
                        className="w-full bg-slate-950/70 border border-slate-850 hover:border-slate-800 focus:border-indigo-500 focus:outline-none rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-105 placeholder-slate-650 transition"
                        required
                      />
                    </div>
                    
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="bg-slate-950/70 border border-slate-850 focus:border-indigo-500 focus:outline-none rounded-xl px-3.5 py-2 text-xs text-slate-300 focus:bg-slate-900"
                    >
                      <option value="Member">Member (Read & Write)</option>
                      <option value="Viewer">Viewer (Read Only)</option>
                      <option value="Admin">Admin (Full Control)</option>
                    </select>

                    <button
                      type="submit"
                      disabled={settingsLoading || !inviteEmail}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-850 text-white px-5 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer h-10"
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
                  {project.members && project.members.map((member, index) => {
                    const mUser = member.user || {};
                    return (
                      <div 
                        key={member._id || mUser._id || index} 
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
                          
                          {canManageSettings && mUser._id !== user?._id && (
                            <button
                              onClick={() => handleRemoveMember(mUser._id)}
                              disabled={settingsLoading}
                              className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 rounded transition cursor-pointer"
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

              {/* Critical Actions / Deletion */}
              {(isOwner || user?.role === 'Admin') && (
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
                    className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold py-2.5 px-5 rounded-xl transition shadow-[0_0_15px_rgba(239,68,68,0.15)] cursor-pointer"
                  >
                    Delete Project
                  </button>
                </div>
              )}

            </div>
          )}
        </div>

          </main>
        </div>
      </div>

      {/* 3. SWITCHER: CREATE PROJECT MODAL */}
      {createProjectModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-3xl rounded-3xl overflow-hidden border border-slate-800 animate-slide-up shadow-2xl flex flex-col md:flex-row text-left">
            
            {/* Left Column: Premium Feature Guide */}
            <div className="md:w-5/12 bg-slate-950/50 p-8 border-r border-slate-850 flex flex-col justify-between relative overflow-hidden select-none">
              {/* Background Glow */}
              <div className="absolute -top-12 -left-12 w-40 h-40 bg-[var(--gold-primary)]/10 rounded-full blur-[60px] pointer-events-none" />
              
              <div className="space-y-6 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[var(--gold-primary)] to-[var(--gold-secondary)] flex items-center justify-center shadow-lg">
                  <Brain className="w-6 h-6 text-slate-955" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Create Workspace</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-2">
                    Initialize a unified collaboration node. Instantly equip your team with tracking metrics, multiplayer whiteboards, and AI sync.
                  </p>
                </div>
                
                {/* Features Checklist */}
                <div className="space-y-4 pt-4">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-205">Interactive Kanban Board</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Assign tasks, track status, and coordinate milestones.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-205">Shared Whiteboard</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Real-time vector canvas with true eraser synchronization.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-205">Budget Analytics</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Track financial allocation vs actual team expenditure.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pt-8 border-t border-slate-900/60 hidden md:block">
                <span className="text-[9px] uppercase font-bold tracking-widest text-[var(--gold-primary)] font-mono">CollabMind AI Engine</span>
              </div>
            </div>
            
            {/* Right Column: Form Inputs */}
            <div className="flex-1 p-8 flex flex-col justify-center">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white tracking-tight">Initialize Workspace</h3>
                <button 
                  type="button" 
                  onClick={() => setCreateProjectModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {createError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-200 text-xs py-3 px-4 rounded-lg mb-6">
                  {createError}
                </div>
              )}
              
              <form onSubmit={handleCreateProject} className="space-y-5">
                {/* Project Name Input */}
                <div className="space-y-1.5 text-left">
                  <label className="block text-slate-400 text-[10px] font-extrabold uppercase tracking-widest">Project Name</label>
                  <div className="relative">
                    <FolderKanban className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 transition-colors" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mobile Application Scaffold"
                      value={newProjName}
                      onChange={(e) => setNewProjName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-[var(--gold-primary)] rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-100 placeholder-slate-600 focus:ring-2 focus:ring-[var(--gold-primary)]/10 transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Description Input */}
                <div className="space-y-1.5 text-left">
                  <label className="block text-slate-400 text-[10px] font-extrabold uppercase tracking-widest">Description</label>
                  <div className="relative">
                    <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500 transition-colors" />
                    <textarea
                      required
                      rows="3"
                      placeholder="Summarize the project timeline, milestones, and design goals..."
                      value={newProjDesc}
                      onChange={(e) => setNewProjDesc(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-[var(--gold-primary)] rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-100 placeholder-slate-600 focus:ring-2 focus:ring-[var(--gold-primary)]/10 transition-all duration-300 resize-none"
                    />
                  </div>
                </div>

                {/* Budget and Deadline Row */}
                <div className="grid grid-cols-2 gap-4 text-left">
                  <div className="space-y-1.5">
                    <label className="block text-slate-400 text-[10px] font-extrabold uppercase tracking-widest">Financial Budget ($)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 transition-colors" />
                      <input
                        type="number"
                        placeholder="e.g. 50000"
                        value={newProjBudget}
                        onChange={(e) => setNewProjBudget(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-[var(--gold-primary)] rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-100 placeholder-slate-600 focus:ring-2 focus:ring-[var(--gold-primary)]/10 transition-all duration-300"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-slate-400 text-[10px] font-extrabold uppercase tracking-widest">Deadline</label>
                    <CalendarPicker
                      value={newProjDeadline}
                      onChange={setNewProjDeadline}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 justify-end">
                  <button
                    type="button"
                    onClick={() => setCreateProjectModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-850 text-slate-400 hover:text-white hover:bg-slate-950/60 transition text-xs font-semibold cursor-pointer active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-gold-grad px-6 py-2.5 rounded-xl font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95 text-slate-950"
                  >
                    <Sparkles className="w-4 h-4 text-slate-950 stroke-[3px]" />
                    <span>Launch Project</span>
                  </button>
                </div>
              </form>
            </div>
            
          </div>
        </div>
      )}

      {/* 4. USER PROFILE EDIT DIALOG MODAL */}
      {profileModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-xl rounded-2xl p-6 md:p-8 border border-slate-800 animate-slide-up shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-[var(--gold-primary)]" />
                <span>Edit Profile & Personal Info</span>
              </h3>
              <button 
                onClick={() => setProfileModalOpen(false)} 
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {profileError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-200 text-xs py-3 px-4 rounded-lg mb-6">
                {profileError}
              </div>
            )}

            {profileSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs py-3 px-4 rounded-lg mb-6 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Profile updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-5 text-left">
              <div className="flex flex-col items-center mb-6">
                <div className="w-16 h-16 bg-slate-900 rounded-2xl border border-slate-850 flex items-center justify-center text-[var(--gold-primary)] font-extrabold text-2xl shadow shadow-yellow-500/5 mb-2">
                  {profileName ? profileName.charAt(0).toUpperCase() : '?'}
                </div>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">{user?.role || 'Member'} Profile</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-slate-100 text-xs focus:border-[var(--gold-primary)] transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. john@company.com"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-slate-100 text-xs focus:border-[var(--gold-primary)] transition"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="e.g. +1 (555) 019-2834"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-slate-100 text-xs focus:border-[var(--gold-primary)] transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="e.g. San Francisco, CA"
                      value={profileLocation}
                      onChange={(e) => setProfileLocation(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-slate-100 text-xs focus:border-[var(--gold-primary)] transition"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">GitHub Username</label>
                  <div className="relative">
                    <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="e.g. johndoe"
                      value={profileGithub}
                      onChange={(e) => setProfileGithub(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-slate-100 text-xs focus:border-[var(--gold-primary)] transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">LinkedIn Profile URL</label>
                  <div className="relative">
                    <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="e.g. linkedin.com/in/johndoe"
                      value={profileLinkedin}
                      onChange={(e) => setProfileLinkedin(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-slate-100 text-xs focus:border-[var(--gold-primary)] transition"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Key Skills / Technologies</label>
                <div className="relative">
                  <Code className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="e.g. React, Node.js, Python, AWS (comma separated)"
                    value={profileSkills}
                    onChange={(e) => setProfileSkills(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-slate-100 text-xs focus:border-[var(--gold-primary)] transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Short Biography</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <textarea
                    rows="3"
                    placeholder="Describe your role, background, or current focus area..."
                    value={profileBio}
                    onChange={(e) => setProfileBio(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-slate-100 text-xs focus:border-[var(--gold-primary)] transition resize-none animate-none"
                  ></textarea>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-900 mt-6">
                <button
                  type="button"
                  onClick={() => setProfileModalOpen(false)}
                  className="bg-slate-900 border border-slate-800 text-slate-350 hover:text-white px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-850 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="btn-gold-grad px-5 py-2.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                >
                  {profileSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
              </form>
            </div>
          </div>
        )}

        {/* Floating AI Ideation Tab Button at Bottom-Right Corner of Global Page */}
        <button
          onClick={() => setAiAssistantOpen(!aiAssistantOpen)}
          className={`fixed bottom-6 right-6 z-40 p-3.5 rounded-full hover:rounded-2xl shadow-2xl flex items-center gap-0 hover:gap-2 border transition-all duration-300 cursor-pointer scale-100 hover:scale-105 active:scale-95 group ${
            aiAssistantOpen
              ? 'bg-gradient-to-tr from-[var(--gold-primary)] to-[var(--gold-secondary)] text-slate-950 border-[var(--gold-primary)] shadow-[0_0_20px_var(--gold-glow)] font-bold'
              : 'bg-slate-900/90 border-slate-800 text-slate-350 hover:text-[var(--gold-primary)] hover:border-[var(--gold-primary)]/40 hover:shadow-[0_0_15px_rgba(223,195,132,0.15)] backdrop-blur'
          }`}
        >
          <Bot className={`w-5 h-5 shrink-0 ${aiAssistantOpen ? 'animate-pulse' : 'group-hover:animate-bounce'}`} />
          <span className="max-w-0 opacity-0 group-hover:max-w-[100px] group-hover:opacity-100 transition-all duration-300 ease-in-out truncate font-extrabold uppercase tracking-wider text-[9px] leading-none">
            AI Ideation
          </span>
        </button>

        {/* Floating AI Ideation Helper Panel (Overlay) */}
        {aiAssistantOpen && (
          <div className="fixed bottom-24 right-6 w-[420px] bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl p-5 backdrop-blur-md z-50 animate-slide-up flex flex-col max-h-[500px] text-left">
            <div className="flex justify-between items-center border-b border-slate-850 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[var(--gold-primary)]/15 flex items-center justify-center border border-[var(--gold-primary)]/20">
                  <Bot className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
                </div>
                <span className="text-[10px] font-bold text-slate-200 uppercase tracking-widest">AI Ideation Assistant</span>
              </div>
              <button 
                onClick={() => setAiAssistantOpen(false)}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 scrollbar-thin">
              <Ideator projectId={project._id} onTaskAdded={fetchProjectDetails} />
            </div>
          </div>
        )}

      </div>
    );
  }
