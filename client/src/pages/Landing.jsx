import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Brain, LayoutGrid, FolderKanban, MessageSquare, Paintbrush, 
  DollarSign, Sparkles, Code, Edit, Sun, Moon, Mail, Lock, 
  User, ArrowRight, Star, CheckCircle2, Send, X, ShieldCheck, 
  UserCheck, Eye, Activity, Shield, Users, Trophy, TrendingUp
} from 'lucide-react';

export default function Landing({ initialAuthMode }) {
  const { user, login, register, error, setError, loading } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactSubmitting, setContactSubmitting] = useState(false);

  // Auth modal state
  const [authModal, setAuthModal] = useState({ 
    isOpen: !!initialAuthMode, 
    mode: initialAuthMode || 'login' 
  });
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authRole, setAuthRole] = useState('Member');
  const [authLoading, setAuthLoading] = useState(false);

  // Stats active state (for dynamic highlights)
  const [activeStat, setActiveStat] = useState(0);

  // Synchronize initialAuthMode prop changes with modal state
  useEffect(() => {
    if (initialAuthMode) {
      setAuthModal({ isOpen: true, mode: initialAuthMode });
    } else {
      setAuthModal({ isOpen: false, mode: 'login' });
    }
  }, [initialAuthMode]);

  const closeAuthModal = () => {
    setAuthModal({ isOpen: false, mode: 'login' });
    if (window.location.pathname !== '/') {
      navigate('/');
    }
  };

  useEffect(() => {
    // Clear errors when opening modal
    if (authModal.isOpen) {
      setError(null);
    }
  }, [authModal.isOpen, authModal.mode, setError]);

  // Handle Quick Demo Login
  const handleQuickLogin = async (demoEmail) => {
    setAuthLoading(true);
    setError(null);
    const success = await login(demoEmail, 'demo123');
    setAuthLoading(false);
    if (success) {
      setAuthModal({ isOpen: false, mode: 'login' });
      navigate('/dashboard');
    }
  };

  // Handle Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    const success = await login(authEmail, authPassword);
    setAuthLoading(false);
    if (success) {
      setAuthModal({ isOpen: false, mode: 'login' });
      navigate('/dashboard');
    }
  };

  // Handle Register Submit
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    const success = await register(authName, authEmail, authPassword, authRole);
    setAuthLoading(false);
    if (success) {
      setAuthModal({ isOpen: false, mode: 'login' });
      navigate('/dashboard');
    }
  };

  // Handle Contact Submit
  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setContactSubmitting(false);
      setContactSubmitted(true);
      setContactName('');
      setContactEmail('');
      setContactMessage('');
      setTimeout(() => setContactSubmitted(false), 5000);
    }, 1000);
  };

  // Auto-scroll loop for stats section
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStat((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans transition-colors duration-300">
      {/* BACKGROUND EFFECTS */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-slate-900/40 via-transparent to-transparent pointer-events-none -z-10" />
      <div className="absolute top-48 left-1/4 -translate-x-1/2 w-[400px] h-[400px] bg-[var(--gold-glow)] rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-96 right-1/4 translate-x-1/2 w-[350px] h-[350px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* HEADER NAVBAR */}
      <header className="fixed top-0 left-0 right-0 h-20 navbar-custom z-40 px-6 md:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[var(--gold-primary)] to-[var(--gold-secondary)] flex items-center justify-center shadow-lg glow-gold animate-float-slow">
            <Brain className="w-6 h-6 text-slate-950" strokeWidth={2} />
          </div>
          <div>
            <span className="text-xl font-bold text-white tracking-tight">CollabMind</span>
            <span className="text-[9px] uppercase font-bold tracking-widest text-[var(--gold-primary)] block -mt-1 font-mono">AI Ecosystem</span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <a href="#about" className="hover:text-[var(--gold-primary)] transition-all duration-200">About</a>
          <a href="#benefits" className="hover:text-[var(--gold-primary)] transition-all duration-200">Benefits</a>
          <a href="#growth" className="hover:text-[var(--gold-primary)] transition-all duration-200">Growth</a>
          <a href="#reviews" className="hover:text-[var(--gold-primary)] transition-all duration-200">Reviews</a>
          <a href="#contact" className="hover:text-[var(--gold-primary)] transition-all duration-200">Contact</a>
        </nav>

        {/* Right CTA / Theme Toggle */}
        <div className="flex items-center gap-4">
          {/* Theme Toggler */}
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-[var(--gold-primary)] hover:border-slate-700 transition-all flex items-center justify-center cursor-pointer"
            title="Toggle Theme"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          {user ? (
            <Link
              to="/dashboard"
              className="px-5 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-200 hover:text-white hover:border-slate-750 transition text-xs font-semibold"
            >
              Enter Dashboard
            </Link>
          ) : (
            <>
              <button
                onClick={() => setAuthModal({ isOpen: true, mode: 'login' })}
                className="hidden sm:block text-xs font-semibold uppercase tracking-wider text-slate-300 hover:text-white hover:underline transition px-3"
              >
                Sign In
              </button>
              <button
                onClick={() => setAuthModal({ isOpen: true, mode: 'register' })}
                className="px-5 py-2.5 rounded-xl btn-gold-grad text-xs font-semibold text-slate-950 tracking-wide cursor-pointer"
              >
                Get Started
              </button>
            </>
          )}
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="pt-36 pb-20 px-6 md:px-12 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Intro Column */}
        <div className="lg:col-span-6 space-y-8 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] uppercase font-bold tracking-widest text-[var(--gold-primary)]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>New Generation AI Workspace</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-white font-sans">
            Where Teams Align & <br />
            <span className="bg-gradient-to-r from-[var(--gold-primary)] via-amber-200 to-[var(--gold-secondary)] bg-clip-text text-transparent">
              AI Synchronizes
            </span>
          </h1>

          <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-xl">
            Unify whiteboard sketching, Kanban tasks, note taking, budget tracking, and real-time coding with our integrated cognitive AI companion. Connect, sync, and deliver faster.
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
            {user ? (
              <Link
                to="/dashboard"
                className="px-8 py-3.5 rounded-xl btn-gold-grad text-sm font-bold shadow-lg shadow-yellow-950/10 flex items-center gap-2 cursor-pointer"
              >
                Go to Workspace <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <button
                onClick={() => setAuthModal({ isOpen: true, mode: 'register' })}
                className="px-8 py-3.5 rounded-xl btn-gold-grad text-sm font-bold shadow-lg shadow-yellow-950/10 flex items-center gap-2 cursor-pointer"
              >
                Start Collaborating <ArrowRight className="w-4 h-4" />
              </button>
            )}
            <a
              href="#about"
              className="px-8 py-3.5 rounded-xl border border-slate-800 bg-slate-900/40 text-slate-300 hover:text-white hover:border-slate-700 transition text-sm font-semibold flex items-center gap-2"
            >
              Learn Concept
            </a>
          </div>

          {/* Quick trust metrics */}
          <div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-900 max-w-md">
            <div>
              <p className="text-2xl font-bold text-white font-mono">10x</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Velocity Boost</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white font-mono">100%</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Multiplayer Sync</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white font-mono">0ms</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Database Latency</p>
            </div>
          </div>
        </div>

        {/* Right Animated SVG Column */}
        <div className="lg:col-span-6 flex justify-center items-center relative">
          {/* Radial gold backing glow */}
          <div className="absolute w-72 h-72 bg-[var(--gold-glow)] rounded-full blur-[80px] -z-10 animate-pulse-subtle" />

          {/* Large Custom Animated Collaborative SVG */}
          <svg className="w-full max-w-[480px] h-auto drop-shadow-2xl animate-float-slow" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Outer Rotating Grid Mesh Ring */}
            <circle cx="200" cy="200" r="160" stroke="rgba(223, 195, 132, 0.08)" strokeWidth="1.5" strokeDasharray="8 8" className="animate-spin-slow" />
            <circle cx="200" cy="200" r="120" stroke="rgba(223, 195, 132, 0.04)" strokeWidth="1" />
            
            {/* Central Node (CollabMind AI) */}
            <g className="animate-pulse-gold">
              <circle cx="200" cy="200" r="28" fill="url(#goldGrad)" className="glow-gold" />
              <Brain className="w-8 h-8 text-slate-950" x="184" y="184" />
            </g>

            {/* Connecting streams (Ants animated marching lines) */}
            {/* Central Node -> Notes */}
            <path d="M 200 172 L 200 90" stroke="var(--gold-primary)" strokeWidth="1.5" className="animate-marching" />
            {/* Central Node -> Whiteboard */}
            <path d="M 175 185 L 100 145" stroke="var(--gold-primary)" strokeWidth="1.5" className="animate-marching" />
            {/* Central Node -> Board */}
            <path d="M 225 185 L 300 145" stroke="var(--gold-primary)" strokeWidth="1.5" className="animate-marching" />
            {/* Central Node -> Code */}
            <path d="M 175 215 L 100 255" stroke="var(--gold-primary)" strokeWidth="1.5" className="animate-marching" />
            {/* Central Node -> Budget */}
            <path d="M 225 215 L 300 255" stroke="var(--gold-primary)" strokeWidth="1.5" className="animate-marching" />
            {/* Central Node -> Chat */}
            <path d="M 200 228 L 200 310" stroke="var(--gold-primary)" strokeWidth="1.5" className="animate-marching" />

            {/* Surrounding Components Nodes */}
            {/* Notes Component (Top) */}
            <g transform="translate(200, 80)" className="cursor-pointer">
              <circle cx="0" cy="0" r="20" fill="var(--bg-900)" stroke="var(--border-850)" strokeWidth="1.5" className="hover:stroke-[var(--gold-primary)] transition-all duration-200" />
              <Edit className="w-5 h-5 text-slate-350" x="-10" y="-10" />
              <circle cx="0" cy="-20" r="3" fill="var(--gold-primary)" className="animate-ping" />
            </g>

            {/* Whiteboard Component (Left-Top) */}
            <g transform="translate(90, 140)">
              <circle cx="0" cy="0" r="20" fill="var(--bg-900)" stroke="var(--border-850)" strokeWidth="1.5" />
              <Paintbrush className="w-5 h-5 text-slate-350" x="-10" y="-10" />
            </g>

            {/* Kanban Board Component (Right-Top) */}
            <g transform="translate(310, 140)">
              <circle cx="0" cy="0" r="20" fill="var(--bg-900)" stroke="var(--border-850)" strokeWidth="1.5" />
              <FolderKanban className="w-5 h-5 text-slate-350" x="-10" y="-10" />
            </g>

            {/* Code Workspace Component (Left-Bottom) */}
            <g transform="translate(90, 260)">
              <circle cx="0" cy="0" r="20" fill="var(--bg-900)" stroke="var(--border-850)" strokeWidth="1.5" />
              <Code className="w-5 h-5 text-slate-350" x="-10" y="-10" />
            </g>

            {/* Budget Component (Right-Bottom) */}
            <g transform="translate(310, 260)">
              <circle cx="0" cy="0" r="20" fill="var(--bg-900)" stroke="var(--border-850)" strokeWidth="1.5" />
              <DollarSign className="w-5 h-5 text-slate-350" x="-10" y="-10" />
            </g>

            {/* Chat Box Component (Bottom) */}
            <g transform="translate(200, 320)">
              <circle cx="0" cy="0" r="20" fill="var(--bg-900)" stroke="var(--border-850)" strokeWidth="1.5" />
              <MessageSquare className="w-5 h-5 text-slate-350" x="-10" y="-10" />
            </g>

            {/* Inner Floating Decorative Sparkles */}
            <g className="animate-pulse-subtle">
              <circle cx="150" cy="110" r="2.5" fill="var(--gold-primary)" />
              <circle cx="250" cy="110" r="2" fill="var(--gold-secondary)" />
              <circle cx="130" cy="210" r="1.5" fill="var(--gold-primary)" />
              <circle cx="270" cy="210" r="3" fill="var(--gold-secondary)" />
              <circle cx="160" cy="280" r="2" fill="var(--gold-primary)" />
              <circle cx="240" cy="280" r="1.5" fill="var(--gold-secondary)" />
            </g>

            {/* SVG Definitions */}
            <defs>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--gold-primary)" />
                <stop offset="100%" stopColor="var(--gold-secondary)" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </section>

      {/* ABOUT (CONCEPT) SECTION */}
      <section id="about" className="py-24 border-t border-slate-900/60 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--gold-primary)] font-mono">The Core Concept</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-3 font-sans">A Single Cohesive Workplace Hub</h2>
          <p className="text-slate-400 mt-4 text-sm md:text-base leading-relaxed">
            Stop juggling six different browser tabs. CollabMind AI aggregates all tools essential for product delivery and software engineering teams into a single, real-time multiplayer space.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: AI Ideator */}
          <div className="p-6 bg-slate-900/30 border border-slate-850 rounded-2xl card-hover-gold text-left relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[var(--gold-glow)] to-transparent pointer-events-none transition duration-300 opacity-0 group-hover:opacity-100" />
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-6 text-[var(--gold-primary)] transition duration-300 group-hover:scale-110">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">AI Ideation Companion</h3>
            <p className="text-slate-400 text-xs mt-3 leading-relaxed">
              Inject intelligent recommendations, generate checklist tasks from outlines, and brainstorm feature roadmaps with custom AI tokens.
            </p>
          </div>

          {/* Card 2: Whiteboard */}
          <div className="p-6 bg-slate-900/30 border border-slate-850 rounded-2xl card-hover-gold text-left relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[var(--gold-glow)] to-transparent pointer-events-none transition duration-300 opacity-0 group-hover:opacity-100" />
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-6 text-[var(--gold-primary)] transition duration-300 group-hover:scale-110">
              <Paintbrush className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Multiplayer Whiteboard</h3>
            <p className="text-slate-400 text-xs mt-3 leading-relaxed">
              Draw shapes, wireframes, and flows together with zero latency. Seamlessly review systems architectures with your entire team.
            </p>
          </div>

          {/* Card 3: Kanban */}
          <div className="p-6 bg-slate-900/30 border border-slate-850 rounded-2xl card-hover-gold text-left relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[var(--gold-glow)] to-transparent pointer-events-none transition duration-300 opacity-0 group-hover:opacity-100" />
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-6 text-[var(--gold-primary)] transition duration-300 group-hover:scale-110">
              <FolderKanban className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Kanban Task Boards</h3>
            <p className="text-slate-400 text-xs mt-3 leading-relaxed">
              Track project milestones, assign developers, drag-and-drop progress lanes, and sync sprint task cards dynamically.
            </p>
          </div>

          {/* Card 4: Code Editor */}
          <div className="p-6 bg-slate-900/30 border border-slate-850 rounded-2xl card-hover-gold text-left relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[var(--gold-glow)] to-transparent pointer-events-none transition duration-300 opacity-0 group-hover:opacity-100" />
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-6 text-[var(--gold-primary)] transition duration-300 group-hover:scale-110">
              <Code className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Collaborative Coding</h3>
            <p className="text-slate-400 text-xs mt-3 leading-relaxed">
              Write, compile, and debug scripts inside an integrated code workspace. Share live files and edit lines concurrently.
            </p>
          </div>

          {/* Card 5: Documents / Notes */}
          <div className="p-6 bg-slate-900/30 border border-slate-850 rounded-2xl card-hover-gold text-left relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[var(--gold-glow)] to-transparent pointer-events-none transition duration-300 opacity-0 group-hover:opacity-100" />
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-6 text-[var(--gold-primary)] transition duration-300 group-hover:scale-110">
              <Edit className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Interactive Note Editor</h3>
            <p className="text-slate-400 text-xs mt-3 leading-relaxed">
              Compose product requirements, save rich text markdown documents, and brainstorm team meeting logs side-by-side.
            </p>
          </div>

          {/* Card 6: Budgeting */}
          <div className="p-6 bg-slate-900/30 border border-slate-850 rounded-2xl card-hover-gold text-left relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[var(--gold-glow)] to-transparent pointer-events-none transition duration-300 opacity-0 group-hover:opacity-100" />
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-6 text-[var(--gold-primary)] transition duration-300 group-hover:scale-110">
              <DollarSign className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Budget & Cost Tracker</h3>
            <p className="text-slate-400 text-xs mt-3 leading-relaxed">
              Allocate resource funding, log workspace expenses, track invoice logs, and check margins in visual budget tables.
            </p>
          </div>
        </div>
      </section>

      {/* BENEFITS TO USE IT */}
      <section id="benefits" className="py-20 bg-slate-950/40 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Left illustration */}
          <div className="lg:col-span-5 flex justify-center order-2 lg:order-1 relative">
            <div className="absolute inset-0 bg-[var(--gold-glow)] rounded-full blur-[90px] pointer-events-none animate-pulse-subtle" />
            
            {/* Visual SVG representing task completion and timeline alignment */}
            <svg className="w-full max-w-[380px] h-auto drop-shadow-xl animate-float-slow" viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="10" y="10" width="280" height="280" rx="20" fill="var(--bg-900)" stroke="var(--border-850)" strokeWidth="1.5" />
              
              {/* Task Header */}
              <text x="30" y="45" fill="white" fontSize="12" fontWeight="bold" fontFamily="system-ui">Sprint Milestone Status</text>
              <line x1="30" y1="60" x2="270" y2="60" stroke="var(--border-800)" strokeWidth="1.5" />
              
              {/* Line items representing tasks */}
              {/* Item 1 */}
              <g transform="translate(30, 80)">
                <rect x="0" y="0" width="16" height="16" rx="4" fill="rgba(223, 195, 132, 0.15)" stroke="var(--gold-primary)" strokeWidth="1.5" />
                <path d="M 4 8 L 7 11 L 12 5" stroke="var(--gold-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <text x="26" y="12" fill="var(--text-100)" fontSize="10" fontFamily="system-ui">Finalize AI Prompt System</text>
                <text x="200" y="12" fill="var(--gold-primary)" fontSize="9" fontWeight="bold" fontFamily="system-ui">DONE</text>
              </g>

              {/* Item 2 */}
              <g transform="translate(30, 115)">
                <rect x="0" y="0" width="16" height="16" rx="4" fill="rgba(223, 195, 132, 0.15)" stroke="var(--gold-primary)" strokeWidth="1.5" />
                <path d="M 4 8 L 7 11 L 12 5" stroke="var(--gold-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <text x="26" y="12" fill="var(--text-100)" fontSize="10" fontFamily="system-ui">Set socket sync middleware</text>
                <text x="200" y="12" fill="var(--gold-primary)" fontSize="9" fontWeight="bold" fontFamily="system-ui">DONE</text>
              </g>

              {/* Item 3 */}
              <g transform="translate(30, 150)">
                <rect x="0" y="0" width="16" height="16" rx="4" fill="var(--bg-950)" stroke="var(--border-850)" strokeWidth="1.5" />
                <text x="26" y="12" fill="var(--text-200)" fontSize="10" fontFamily="system-ui">Integrate Monaco Workspace</text>
                <text x="195" y="12" fill="rgba(223, 195, 132, 0.4)" fontSize="9" fontWeight="bold" fontFamily="system-ui">IN DEV</text>
              </g>

              {/* Dynamic visual graph below */}
              <g transform="translate(30, 190)">
                <rect x="0" y="0" width="240" height="70" rx="12" fill="var(--bg-950)" stroke="var(--border-850)" strokeWidth="1" />
                
                {/* Simulated Chart Paths */}
                <path d="M 10 50 Q 50 20 90 40 T 170 15 T 230 10" fill="none" stroke="var(--gold-primary)" strokeWidth="2" />
                <path d="M 10 50 Q 50 20 90 40 T 170 15 T 230 10 L 230 60 L 10 60 Z" fill="url(#goldChartGrad)" opacity="0.1" />
                
                {/* Pulse marker */}
                <circle cx="170" cy="15" r="4" fill="var(--gold-primary)" />
                <circle cx="170" cy="15" r="8" stroke="var(--gold-primary)" strokeWidth="1" className="animate-ping" />
              </g>

              <defs>
                <linearGradient id="goldChartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="var(--gold-primary)" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Right text details */}
          <div className="lg:col-span-7 space-y-6 text-left order-1 lg:order-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--gold-primary)] font-mono">Why Choose CollabMind</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white font-sans">Streamlined Benefits for Modern Teams</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Managing complex milestones across developers, designers, and managers shouldn't require complex integrations. Our workspace maximizes speed by eliminating platform switches.
            </p>

            <div className="space-y-4 pt-4">
              <div className="flex gap-4 items-start">
                <div className="w-5 h-5 rounded-full bg-[var(--gold-glow)] flex items-center justify-center shrink-0 mt-1">
                  <CheckCircle2 className="w-4 h-4 text-[var(--gold-primary)]" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Enhanced Context Preservation</h4>
                  <p className="text-slate-400 text-xs mt-1">Chat threads, whiteboard design charts, and source codes reside inside the same database document. Context remains completely intact.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-5 h-5 rounded-full bg-[var(--gold-glow)] flex items-center justify-center shrink-0 mt-1">
                  <CheckCircle2 className="w-4 h-4 text-[var(--gold-primary)]" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Cognitive AI Task Injection</h4>
                  <p className="text-slate-400 text-xs mt-1">Stop writing tickets manually. Let the AI agent generate structured sub-tasks directly into your board from requirements notes.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-5 h-5 rounded-full bg-[var(--gold-glow)] flex items-center justify-center shrink-0 mt-1">
                  <CheckCircle2 className="w-4 h-4 text-[var(--gold-primary)]" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Real-Time Team Synchronization</h4>
                  <p className="text-slate-400 text-xs mt-1">Built entirely on high-performance WebSocket channels. Edits on whiteboards or Monaco code buffers reflect in milliseconds.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT HELPS GROW BUSINESS */}
      <section id="growth" className="py-24 px-6 md:px-12 max-w-7xl mx-auto border-t border-slate-900/60">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--gold-primary)] font-mono">Business Acceleration</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-3 font-sans">Maximize Delivery Velocity</h2>
          <p className="text-slate-400 mt-4 text-sm md:text-base leading-relaxed">
            By consolidating communication buffers and using integrated AI scaffolding, business units deliver products up to 4x faster with 60% less coordination overhead.
          </p>
        </div>

        {/* Dynamic Metric Scaffolding */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Metric 1 */}
          <div className={`p-8 rounded-2xl border transition-all duration-300 text-left ${
            activeStat === 0 
              ? 'bg-slate-900 border-[var(--gold-primary)] glow-gold' 
              : 'bg-slate-900/20 border-slate-850'
          }`}>
            <div className="flex justify-between items-center mb-6">
              <div className="w-10 h-10 rounded-xl bg-slate-950/80 flex items-center justify-center text-[var(--gold-primary)]">
                <Trophy className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Metric #01</span>
            </div>
            <p className="text-4xl font-extrabold text-white font-mono">40%</p>
            <h4 className="text-sm font-bold text-white mt-3">Reduction in Meeting Iterations</h4>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
              Teams draw UI layouts and draft documents concurrently on the whiteboard rather than holding status reports.
            </p>
            <div className="w-full bg-slate-950 h-1.5 rounded-full mt-6 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-[var(--gold-primary)] to-[var(--gold-secondary)] h-full transition-all duration-1000"
                style={{ width: activeStat === 0 ? '40%' : '10%' }}
              />
            </div>
          </div>

          {/* Metric 2 */}
          <div className={`p-8 rounded-2xl border transition-all duration-300 text-left ${
            activeStat === 1 
              ? 'bg-slate-900 border-[var(--gold-primary)] glow-gold' 
              : 'bg-slate-900/20 border-slate-850'
          }`}>
            <div className="flex justify-between items-center mb-6">
              <div className="w-10 h-10 rounded-xl bg-slate-950/80 flex items-center justify-center text-[var(--gold-primary)]">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Metric #02</span>
            </div>
            <p className="text-4xl font-extrabold text-white font-mono">4.2x</p>
            <h4 className="text-sm font-bold text-white mt-3">Faster Task Scaffolding</h4>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
              AI triggers generate full software checklists and breakdown modules automatically based on brief natural sentences.
            </p>
            <div className="w-full bg-slate-950 h-1.5 rounded-full mt-6 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-[var(--gold-primary)] to-[var(--gold-secondary)] h-full transition-all duration-1000"
                style={{ width: activeStat === 1 ? '84%' : '10%' }}
              />
            </div>
          </div>

          {/* Metric 3 */}
          <div className={`p-8 rounded-2xl border transition-all duration-300 text-left ${
            activeStat === 2 
              ? 'bg-slate-900 border-[var(--gold-primary)] glow-gold' 
              : 'bg-slate-900/20 border-slate-850'
          }`}>
            <div className="flex justify-between items-center mb-6">
              <div className="w-10 h-10 rounded-xl bg-slate-950/80 flex items-center justify-center text-[var(--gold-primary)]">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Metric #03</span>
            </div>
            <p className="text-4xl font-extrabold text-white font-mono">98%</p>
            <h4 className="text-sm font-bold text-white mt-3">Roster Alignment & Velocity</h4>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
              Integrated developer sandboxes ensure engineers, stakeholders, and project managers speak the exact same language.
            </p>
            <div className="w-full bg-slate-950 h-1.5 rounded-full mt-6 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-[var(--gold-primary)] to-[var(--gold-secondary)] h-full transition-all duration-1000"
                style={{ width: activeStat === 2 ? '98%' : '10%' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* REVIEWS & FEEDBACKS SECTION */}
      <section id="reviews" className="py-20 bg-slate-950/40 border-t border-slate-900 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--gold-primary)] font-mono">User Reviews</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-3 font-sans">Trusted by Product Leaders</h2>
            <p className="text-slate-400 mt-4 text-sm md:text-base leading-relaxed">
              Here is how engineering teams and project managers around the globe use CollabMind AI to streamline milestones.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Review 1 */}
            <div className="p-6 bg-slate-900/30 border border-slate-850 rounded-2xl text-left hover:border-slate-700 transition flex flex-col justify-between">
              <div>
                <div className="flex gap-1 mb-4 text-[var(--gold-primary)]">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-slate-350 text-xs italic leading-relaxed">
                  "Having our Monaco workspace code buffers, socket chats, and Whiteboards loaded inside one container is a developer's dream. We eliminated three Slack channels instantly."
                </p>
              </div>
              <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-900">
                <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-[var(--gold-primary)] border border-slate-700">
                  SM
                </div>
                <div>
                  <h5 className="font-bold text-white text-xs">Sarah Myers</h5>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Lead Architect, CoreTech</p>
                </div>
              </div>
            </div>

            {/* Review 2 */}
            <div className="p-6 bg-slate-900/30 border border-slate-850 rounded-2xl text-left hover:border-slate-700 transition flex flex-col justify-between">
              <div>
                <div className="flex gap-1 mb-4 text-[var(--gold-primary)]">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-slate-350 text-xs italic leading-relaxed">
                  "The AI checklisting integration is stellar. I can write down a simple product specifications doc and hit the generate button, and it instantly builds standard Kanban cards for developers."
                </p>
              </div>
              <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-900">
                <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-[var(--gold-primary)] border border-slate-700">
                  DK
                </div>
                <div>
                  <h5 className="font-bold text-white text-xs">Devon Kross</h5>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">VP of Product, CloudScale</p>
                </div>
              </div>
            </div>

            {/* Review 3 */}
            <div className="p-6 bg-slate-900/30 border border-slate-850 rounded-2xl text-left hover:border-slate-700 transition flex flex-col justify-between">
              <div>
                <div className="flex gap-1 mb-4 text-[var(--gold-primary)]">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-slate-350 text-xs italic leading-relaxed">
                  "Budget planning matches sprint progress perfectly. We log contractor invoices in the Tracker module directly as cards move to done. Absolute dashboard clarity."
                </p>
              </div>
              <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-900">
                <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-[var(--gold-primary)] border border-slate-700">
                  AP
                </div>
                <div>
                  <h5 className="font-bold text-white text-xs">Amit Patel</h5>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Managing Director, ScaleFlow</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT SECTION */}
      <section id="contact" className="py-24 px-6 md:px-12 max-w-7xl mx-auto border-t border-slate-900/60">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Columns (Details) */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--gold-primary)] font-mono">Let's Connect</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white font-sans">Reach Out for Demos & Custom Integrations</h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-md">
              Need custom enterprise deployment on-premise, security certifications, or want a customized walk-through demo? Send us a message and our team will respond within 4 hours.
            </p>

            <div className="space-y-4 pt-4">
              <div className="flex gap-3 items-center text-xs text-slate-400">
                <Mail className="w-4 h-4 text-[var(--gold-primary)]" />
                <span>enterprise@collabmind.ai</span>
              </div>
              <div className="flex gap-3 items-center text-xs text-slate-400">
                <Activity className="w-4 h-4 text-[var(--gold-primary)]" />
                <span>Global Status: Operational (99.98% Uptime)</span>
              </div>
            </div>
          </div>

          {/* Right Columns (Form) */}
          <div className="lg:col-span-7">
            <div className="glass-panel p-8 rounded-2xl border border-slate-850 shadow-2xl relative">
              
              {contactSubmitted ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 mb-2">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-white text-lg">Inquiry Sent Successfully</h4>
                  <p className="text-slate-400 text-xs max-w-xs leading-relaxed">
                    Thank you! We've received your query and one of our solution specialists will reach out to you shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-5 text-left">
                  <h3 className="text-lg font-bold text-white mb-4">Send a Message</h3>
                  
                  <div>
                    <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">Your Name</label>
                    <input 
                      type="text" 
                      required 
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="John Doe" 
                      className="w-full bg-slate-950/60 border border-slate-850 rounded-xl py-3 px-4 text-slate-100 text-xs focus:border-[var(--gold-primary)] glow-gold-hover transition" 
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">Email Address</label>
                    <input 
                      type="email" 
                      required 
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="john@company.com" 
                      className="w-full bg-slate-950/60 border border-slate-850 rounded-xl py-3 px-4 text-slate-100 text-xs focus:border-[var(--gold-primary)] glow-gold-hover transition" 
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">Message</label>
                    <textarea 
                      rows="4" 
                      required
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="Hello, I'd like to arrange an enterprise team demo for..." 
                      className="w-full bg-slate-950/60 border border-slate-850 rounded-xl py-3 px-4 text-slate-100 text-xs focus:border-[var(--gold-primary)] glow-gold-hover transition resize-none" 
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={contactSubmitting}
                    className="w-full btn-gold-grad py-3 rounded-xl text-xs font-bold tracking-wider uppercase transition flex items-center justify-center gap-2 cursor-pointer mt-4"
                  >
                    {contactSubmitting ? 'Sending...' : 'Send Message'} <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 border-t border-slate-900/60 text-center px-6 md:px-12 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--gold-primary)] flex items-center justify-center shadow">
              <Brain className="w-5 h-5 text-slate-950" />
            </div>
            <span className="font-bold text-white text-sm">CollabMind AI</span>
          </div>

          <p className="text-slate-500 text-[11px] font-medium tracking-wide">
            © 2026 CollabMind Technologies, Inc. All rights reserved. Professional Real-Time Collaborative Ecosystem.
          </p>

          <div className="flex items-center gap-6 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
            <a href="#about" className="hover:text-slate-350 transition">Privacy</a>
            <a href="#benefits" className="hover:text-slate-350 transition">Terms</a>
            <a href="#contact" className="hover:text-slate-350 transition">Support</a>
          </div>
        </div>
      </footer>

      {/* AUTH MODAL OVERLAY */}
      {authModal.isOpen && (
        <div 
          onClick={closeAuthModal}
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
          {/* Modal Container */}
          <div 
            onClick={(e) => e.stopPropagation()}
            className="glass-panel w-full max-w-md rounded-2xl p-8 border border-slate-800 shadow-2xl relative animate-slide-up"
          >
            
            {/* Close Button */}
            <button 
              onClick={closeAuthModal}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-450 hover:text-white hover:bg-slate-900 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Logo in Modal */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-tr from-[var(--gold-primary)] to-[var(--gold-secondary)] rounded-xl flex items-center justify-center shadow shadow-yellow-950/20 mb-3">
                <Brain className="w-7 h-7 text-slate-950" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                {authModal.mode === 'login' ? 'Welcome to CollabMind' : 'Create Ecosystem Account'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {authModal.mode === 'login' ? 'Sign in to access your multiplayer boards' : 'Set up your workspace credentials'}
              </p>
            </div>

            {/* Error notifications */}
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs py-2.5 px-4 rounded-xl mb-5 text-left">
                {error}
              </div>
            )}

            {/* Forms */}
            {authModal.mode === 'login' ? (
              /* Login Form */
              <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
                <div>
                  <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                    <input 
                      type="email" 
                      required
                      value={authEmail}
                      onChange={(e) => {
                        setError(null);
                        setAuthEmail(e.target.value);
                      }}
                      placeholder="name@company.com" 
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-slate-100 text-xs focus:border-[var(--gold-primary)] transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                    <input 
                      type="password" 
                      required
                      value={authPassword}
                      onChange={(e) => {
                        setError(null);
                        setAuthPassword(e.target.value);
                      }}
                      placeholder="••••••••" 
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-slate-100 text-xs focus:border-[var(--gold-primary)] transition"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={authLoading}
                  className="w-full btn-gold-grad py-3 rounded-xl text-xs font-bold tracking-wider uppercase transition flex items-center justify-center gap-1.5 mt-2 cursor-pointer"
                >
                  {authLoading ? 'Signing In...' : 'Sign In'}
                </button>

                <p className="text-[11px] text-slate-500 text-center font-medium mt-4">
                  New to CollabMind?{' '}
                  <button 
                    type="button" 
                    onClick={() => setAuthModal({ isOpen: true, mode: 'register' })}
                    className="text-[var(--gold-primary)] hover:underline font-bold"
                  >
                    Create account
                  </button>
                </p>
              </form>
            ) : (
              /* Register Form */
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-left">
                <div>
                  <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input 
                      type="text" 
                      required
                      value={authName}
                      onChange={(e) => {
                        setError(null);
                        setAuthName(e.target.value);
                      }}
                      placeholder="John Doe" 
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-slate-100 text-xs focus:border-[var(--gold-primary)] transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input 
                      type="email" 
                      required
                      value={authEmail}
                      onChange={(e) => {
                        setError(null);
                        setAuthEmail(e.target.value);
                      }}
                      placeholder="name@company.com" 
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-slate-100 text-xs focus:border-[var(--gold-primary)] transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input 
                      type="password" 
                      required
                      value={authPassword}
                      onChange={(e) => {
                        setError(null);
                        setAuthPassword(e.target.value);
                      }}
                      placeholder="At least 6 characters" 
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-slate-100 text-xs focus:border-[var(--gold-primary)] transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Ecosystem Role</label>
                  <select
                    value={authRole}
                    onChange={(e) => setAuthRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-slate-350 text-xs focus:border-[var(--gold-primary)] transition focus:outline-none"
                  >
                    <option value="Admin">Administrator (Full Access)</option>
                    <option value="Member">Developer Member (Write Access)</option>
                    <option value="Viewer">Viewer Stakeholder (Read Only)</option>
                  </select>
                </div>

                <button 
                  type="submit" 
                  disabled={authLoading}
                  className="w-full btn-gold-grad py-3 rounded-xl text-xs font-bold tracking-wider uppercase transition flex items-center justify-center gap-1.5 mt-3 cursor-pointer"
                >
                  {authLoading ? 'Registering...' : 'Sign Up'}
                </button>

                <p className="text-[11px] text-slate-500 text-center font-medium mt-4">
                  Already have an ecosystem account?{' '}
                  <button 
                    type="button" 
                    onClick={() => setAuthModal({ isOpen: true, mode: 'login' })}
                    className="text-[var(--gold-primary)] hover:underline font-bold"
                  >
                    Sign In
                  </button>
                </p>
              </form>
            )}

            {/* SEEDED DEMO SIGN-INS */}
            <div className="mt-6 pt-5 border-t border-slate-900 text-left">
              <span className="block text-slate-500 text-[9px] font-bold uppercase tracking-widest text-center mb-3">Quick Demo Authentication (Seeded Users)</span>
              
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleQuickLogin('admin@projecthub.com')}
                  disabled={authLoading}
                  className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 py-2 px-1 rounded-xl text-[10px] font-semibold text-red-200 transition flex flex-col items-center justify-center gap-1 cursor-pointer"
                >
                  <Shield className="w-4 h-4 text-red-400" />
                  <span>Admin</span>
                </button>
                <button
                  onClick={() => handleQuickLogin('demo@projecthub.com')}
                  disabled={authLoading}
                  className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 py-2 px-1 rounded-xl text-[10px] font-semibold text-emerald-200 transition flex flex-col items-center justify-center gap-1 cursor-pointer"
                >
                  <User className="w-4 h-4 text-emerald-400" />
                  <span>Member</span>
                </button>
                <button
                  onClick={() => handleQuickLogin('viewer@projecthub.com')}
                  disabled={authLoading}
                  className="bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 py-2 px-1 rounded-xl text-[10px] font-semibold text-sky-200 transition flex flex-col items-center justify-center gap-1 cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-sky-400" />
                  <span>Viewer</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
