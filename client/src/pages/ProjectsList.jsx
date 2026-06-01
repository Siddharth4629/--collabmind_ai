import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';
import { 
  Plus, FolderKanban, Calendar, DollarSign, Users, Sparkles, FolderLock, 
  ChevronDown, User, LogOut, X, Check, Mail, Phone, MapPin, Github, Linkedin, 
  FileText, Sun, Moon, LayoutGrid, Brain, AlertCircle, TrendingUp, CheckSquare,
  Code
} from 'lucide-react';
import confetti from 'canvas-confetti';

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

export default function ProjectsList() {
  const { user, logout, updateProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const { connected } = useSocket();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dropdown states
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Create Project Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [error, setError] = useState('');

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

  // Refs for click outside
  const profileRef = useRef();

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        
        // Celebrate
        confetti({
          particleCount: 50,
          spread: 45,
          origin: { y: 0.65 },
          colors: ['#dfc384', '#c5a880']
        });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create project');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Calculate statistics totals
  const totalBudget = projects.reduce((acc, p) => acc + (p.budget?.total || 0), 0);
  const totalSpent = projects.reduce((acc, p) => acc + (p.budget?.spent || 0), 0);
  const totalMembersCount = projects.reduce((acc, p) => acc + (p.members?.length || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col transition-colors duration-300">
      
      {/* 1. TOP NAVBAR HEADER */}
      <header className="h-16 navbar-custom flex items-center justify-between px-6 fixed top-0 left-0 right-0 z-40 transition-all">
        
        {/* Left Side: Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[var(--gold-primary)] to-[var(--gold-secondary)] flex items-center justify-center shadow">
            <Brain className="w-5 h-5 text-slate-950" />
          </div>
          <div className="text-left">
            <span className="font-bold text-white tracking-tight text-sm">CollabMind</span>
            <span className="text-[9px] uppercase font-bold tracking-widest text-[var(--gold-primary)] block -mt-1 font-mono">Ecosystem Hub</span>
          </div>
        </div>

        {/* Center Side: Active Section Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-850 text-xs font-semibold text-slate-350">
          <LayoutGrid className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
          <span>Active Hub Overview</span>
        </div>

        {/* Right Side: Sync status, Theme, User Avatar */}
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

          {/* User profile dropdown */}
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

      {/* 2. MAIN CONTENT SLOTS */}
      <main className="flex-1 pt-20 pb-12 px-6 max-w-[1600px] w-full mx-auto space-y-6 overflow-x-auto text-left">
        
        {/* Welcome Hero Banner */}
        <div className="p-6 md:p-8 bg-slate-900 border border-slate-850 rounded-2xl relative overflow-hidden shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-[var(--gold-glow)] to-transparent pointer-events-none" />
          
          <div className="space-y-2 max-w-xl">
            <span className="text-[9px] uppercase font-bold tracking-widest text-[var(--gold-primary)] bg-[var(--gold-glow)] px-2.5 py-1 rounded-md font-mono">Ecosystem Dashboard</span>
            <h2 className="text-2xl font-bold text-white tracking-tight font-sans mt-2">
              Welcome back, <span className="bg-gradient-to-r from-[var(--gold-primary)] to-[var(--gold-secondary)] bg-clip-text text-transparent">{user?.name}</span>
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed mt-1">
              Select one of your active collaborative project workspace boards below, or initialize a new project workspace container using the launch buttons.
            </p>
          </div>
        </div>

        {/* Dashboard Metrics Panels */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="bg-slate-900/40 border border-slate-850/65 rounded-xl p-5 hover:border-slate-800 transition flex items-center gap-4">
            <div className="p-2.5 bg-slate-950 border border-slate-850 text-[var(--gold-primary)] rounded-xl">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Total Projects</p>
              <h3 className="text-xl font-bold text-white mt-0.5">{projects.length}</h3>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-850/65 rounded-xl p-5 hover:border-slate-800 transition flex items-center gap-4">
            <div className="p-2.5 bg-slate-950 border border-slate-850 text-[var(--gold-primary)] rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Allocated Budgets</p>
              <h3 className="text-xl font-bold text-white mt-0.5">${totalBudget.toLocaleString()}</h3>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-850/65 rounded-xl p-5 hover:border-slate-800 transition flex items-center gap-4">
            <div className="p-2.5 bg-slate-950 border border-slate-850 text-[var(--gold-primary)] rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Spent Resources</p>
              <h3 className="text-xl font-bold text-white mt-0.5">${totalSpent.toLocaleString()}</h3>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-850/65 rounded-xl p-5 hover:border-slate-800 transition flex items-center gap-4">
            <div className="p-2.5 bg-slate-950 border border-slate-850 text-[var(--gold-primary)] rounded-xl">
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
            <h2 className="text-base font-bold text-white uppercase tracking-wider">Active Workspace Boards</h2>
            <p className="text-slate-500 text-xs mt-0.5 font-medium">Select a project container to enter its multiplayer environment</p>
          </div>
          
          {user?.role !== 'Viewer' ? (
            <button
              onClick={() => setModalOpen(true)}
              className="bg-indigo-650 hover:bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-semibold text-xs transition active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              <span>Create Project</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold border border-slate-850 px-3.5 py-2 rounded-xl">
              <FolderLock className="w-4 h-4 text-slate-500" />
              <span>Viewer account</span>
            </div>
          )}
        </div>

        {/* Projects Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-60 rounded-2xl bg-slate-900 border border-slate-850 animate-pulse"></div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center border border-slate-850 max-w-xl mx-auto mt-8">
            <FolderKanban className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white">No active workspaces</h3>
            <p className="text-slate-500 text-xs mt-1 leading-relaxed">
              Create a new project workspace container using the button above to begin collaborating.
            </p>
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
                  className="bg-slate-900/40 border border-slate-850/80 hover:border-[var(--gold-primary)] hover:glow-gold transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col justify-between rounded-2xl p-6 group h-60"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-850 text-slate-400 flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${proj.status === 'Completed' ? 'bg-emerald-500' : 'bg-indigo-400'}`}></span>
                        {proj.status}
                      </span>
                      
                      <div className="flex items-center gap-1 text-slate-500 text-xs font-semibold">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        <span>{proj.members?.length || 0}</span>
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-white group-hover:text-[var(--gold-primary)] transition truncate">
                      {proj.name}
                    </h3>
                    <p className="text-slate-400 text-xs line-clamp-3 leading-relaxed font-medium">
                      {proj.description}
                    </p>
                  </div>

                  {/* Budget utilization indicator */}
                  <div className="pt-4 border-t border-slate-850/60 mt-4 space-y-2">
                    <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 tracking-wider">
                      <span>BUDGET UTILIZATION</span>
                      <span className={percentUsed >= 100 ? 'text-red-400' : percentUsed >= 80 ? 'text-amber-400' : 'text-[var(--gold-primary)]'}>
                        {percentUsed}%
                      </span>
                    </div>
                    
                    <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden border border-slate-850">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          percentUsed >= 100
                            ? 'bg-red-500'
                            : percentUsed >= 80
                            ? 'bg-amber-500'
                            : 'bg-[var(--gold-primary)]'
                        }`}
                        style={{ width: `${percentUsed}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1 font-semibold">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{proj.deadline ? new Date(proj.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No deadline'}</span>
                      </div>
                      <span className="font-bold text-slate-400">
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

      {/* 3. CREATE PROJECT DIALOG MODAL */}
      {modalOpen && (
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
                  onClick={() => setModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-200 text-xs py-3 px-4 rounded-lg mb-6">
                  {error}
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
                      value={name}
                      onChange={(e) => setName(e.target.value)}
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
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
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
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-[var(--gold-primary)] rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-100 placeholder-slate-600 focus:ring-2 focus:ring-[var(--gold-primary)]/10 transition-all duration-300"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-slate-400 text-[10px] font-extrabold uppercase tracking-widest">Deadline</label>
                    <CalendarPicker
                      value={deadline}
                      onChange={setDeadline}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 justify-end">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
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

    </div>
  );
}
