import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Brain, LogOut, LayoutGrid, FolderKanban, ShieldCheck, UserCheck, Eye, ChevronLeft, ChevronRight, User, Mail, Phone, MapPin, Github, Linkedin, Code, FileText, Check, X } from 'lucide-react';
import axios from 'axios';

export default function Sidebar() {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [projects, setProjects] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(
    localStorage.getItem('sidebar-collapsed') === 'true'
  );

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

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', String(newState));
    // Dispatch custom event to notify other components (e.g. Navbar, layout pages)
    window.dispatchEvent(new Event('sidebar-toggle'));
  };

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
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-slate-950 border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 z-20 font-sans transition-all duration-300`}>
      {/* Brand Header */}
      <div className={`h-16 border-b border-slate-900 flex items-center justify-between ${isCollapsed ? 'px-4 justify-center' : 'px-6'}`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center shrink-0">
            <svg className="w-4.5 h-4.5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="2.5" className="svg-draw-path" fill="currentColor" />
              <line x1="12" y1="12" x2="12" y2="4.5" className="svg-draw-path" />
              <line x1="12" y1="12" x2="5.5" y2="18.5" className="svg-draw-path" />
              <line x1="12" y1="12" x2="18.5" y2="18.5" className="svg-draw-path" />
              <circle cx="12" cy="4.5" r="1.5" className="svg-draw-path" fill="currentColor" />
              <circle cx="5.5" cy="18.5" r="1.5" className="svg-draw-path" fill="currentColor" />
              <circle cx="18.5" cy="18.5" r="1.5" className="svg-draw-path" fill="currentColor" />
            </svg>
          </div>
          {!isCollapsed && (
            <span className="font-bold text-white tracking-tight text-[15px] font-sans truncate">
              CollabMind
            </span>
          )}
        </div>
        
        {/* Toggle Button */}
        <button 
          onClick={toggleCollapse}
          className="p-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition duration-200 shrink-0 ml-1"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Navigation */}
      <div className={`flex-1 py-6 overflow-y-auto space-y-6 ${isCollapsed ? 'px-2' : 'px-4'}`}>
        <div>
          {!isCollapsed && (
            <span className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-3">WORKSPACE</span>
          )}
          <Link
            to="/"
            className={`flex items-center rounded-xl text-sm font-medium transition ${isCollapsed ? 'justify-center py-3' : 'gap-3 px-3 py-2.5'} ${
              location.pathname === '/'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100 border border-transparent'
            }`}
            title={isCollapsed ? "Overview Dashboard" : undefined}
          >
            <LayoutGrid className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Overview Dashboard</span>}
          </Link>
        </div>

        {/* Dynamic Project Switcher List */}
        <div>
          {!isCollapsed && (
            <span className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-3">YOUR PROJECTS</span>
          )}
          <div className="space-y-1">
            {projects.length === 0 ? (
              !isCollapsed && <p className="px-3 text-xs text-slate-600 italic">No active projects</p>
            ) : (
              projects.map((proj) => {
                const isActive = location.pathname.startsWith(`/project/${proj._id}`);
                return (
                  <Link
                    key={proj._id}
                    to={`/project/${proj._id}`}
                    className={`flex items-center rounded-xl text-sm font-medium transition border ${isCollapsed ? 'justify-center py-3 border-transparent' : 'gap-3 px-3 py-2.5'} ${
                      isActive
                        ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100 border-transparent'
                    }`}
                    title={isCollapsed ? proj.name : undefined}
                  >
                    <FolderKanban className="w-4 h-4 shrink-0" />
                    {!isCollapsed && <span className="truncate">{proj.name}</span>}
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* User Session card footer */}
      <div className={`p-4 border-t border-slate-900 bg-slate-950/40 ${isCollapsed ? 'px-2' : ''}`}>
        {user && (
          <div className="flex flex-col gap-3">
            {isCollapsed ? (
              <div className="flex flex-col items-center gap-3">
                <div 
                  onClick={openProfileModal}
                  className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center text-emerald-400 font-bold text-sm border border-slate-800 cursor-pointer hover:bg-slate-800 transition"
                  title="Click to view/edit profile"
                >
                  {user.name.charAt(0)}
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <div 
                  onClick={openProfileModal}
                  className="flex items-center gap-3 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 cursor-pointer hover:bg-slate-900 transition"
                  title="Click to view/edit profile"
                >
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
                
                <div className="flex flex-col gap-1">
                  <button
                    onClick={openProfileModal}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:bg-slate-900 hover:text-slate-100 transition w-full"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </button>
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition w-full"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Profile Edit Dialog Modal */}
      {profileModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-xl rounded-2xl p-6 md:p-8 border border-slate-800 animate-slide-up shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-400" />
                <span>Edit Profile & Personal Info</span>
              </h3>
              <button 
                onClick={() => setProfileModalOpen(false)} 
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition"
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

            <form onSubmit={handleSaveProfile} className="space-y-5">
              {/* Avatar Initial Display */}
              <div className="flex flex-col items-center mb-6">
                <div className="w-16 h-16 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-center text-emerald-400 font-extrabold text-2xl shadow shadow-emerald-500/10 mb-2">
                  {profileName ? profileName.charAt(0).toUpperCase() : '?'}
                </div>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">{user?.role || 'Member'} Profile</span>
              </div>

              {/* Name & Email Grid */}
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
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-slate-100 text-sm focus:border-emerald-500 transition"
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
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-slate-100 text-sm focus:border-emerald-500 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Phone & Location Grid */}
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
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-slate-100 text-sm focus:border-emerald-500 transition"
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
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-slate-100 text-sm focus:border-emerald-500 transition"
                    />
                  </div>
                </div>
              </div>

              {/* GitHub & LinkedIn Grid */}
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
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-slate-100 text-sm focus:border-emerald-500 transition"
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
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-slate-100 text-sm focus:border-emerald-500 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Skills Field */}
              <div>
                <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Key Skills / Technologies</label>
                <div className="relative">
                  <Code className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="e.g. React, Node.js, Python, AWS (comma separated)"
                    value={profileSkills}
                    onChange={(e) => setProfileSkills(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-slate-100 text-sm focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              {/* Bio Field */}
              <div>
                <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Short Biography</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <textarea
                    rows="3"
                    placeholder="Describe your role, background, or current focus area..."
                    value={profileBio}
                    onChange={(e) => setProfileBio(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-slate-100 text-sm focus:border-emerald-500 transition resize-none"
                  ></textarea>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-900 mt-6">
                <button
                  type="button"
                  onClick={() => setProfileModalOpen(false)}
                  className="bg-slate-900 border border-slate-800 text-slate-300 hover:text-white px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 px-5 py-2.5 rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950/20 transition active:scale-[0.98] flex items-center gap-1.5"
                >
                  {profileSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
}
