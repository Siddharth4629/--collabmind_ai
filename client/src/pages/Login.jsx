import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Brain, User, Eye, Lock, Mail } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, error, setError } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const success = await login(email, password);
    setLoading(false);
    if (success) {
      navigate('/dashboard');
    }
  };

  // One-click demo accounts login
  const handleQuickLogin = async (demoEmail) => {
    setLoading(true);
    setEmail(demoEmail);
    setPassword('demo123');
    const success = await login(demoEmail, 'demo123');
    setLoading(false);
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-brand-darker flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Background radial highlight */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-sky-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        {/* Brand header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="w-14 h-14 bg-gradient-to-tr from-emerald-500 to-sky-400 rounded-2xl flex items-center justify-center shadow-lg glow-emerald mb-4 animate-pulse-subtle">
            <Brain className="w-8 h-8 text-slate-900" strokeWidth={2} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent font-sans">
            CollabMind
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Real-Time AI Collaborative Project Management
          </p>
        </div>

        {/* Login panel */}
        <div className="glass-panel rounded-2xl p-8 shadow-2xl relative border border-slate-800">
          <h2 className="text-xl font-semibold text-white mb-6 text-center">Welcome Back</h2>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-200 text-xs py-3 px-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="name@projecthub.com"
                  value={email}
                  onChange={(e) => {
                    setError(null);
                    setEmail(e.target.value);
                  }}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-slate-100 text-sm placeholder-slate-600 focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setError(null);
                    setPassword(e.target.value);
                  }}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-slate-100 text-sm placeholder-slate-600 focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-905 text-sm font-semibold py-3 rounded-xl shadow-lg transition active:scale-[0.98] mt-2 flex items-center justify-center"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Quick Login Shortcuts */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <p className="text-slate-500 text-xs text-center font-medium uppercase tracking-wider mb-3">Quick Login (Seeded Demo)</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleQuickLogin('admin@projecthub.com')}
                className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 py-2 px-1 rounded-xl text-[10px] font-semibold text-red-200 transition flex flex-col items-center justify-center gap-1"
              >
                <Shield className="w-4 h-4 text-red-400" />
                <span>Admin</span>
              </button>
              <button
                onClick={() => handleQuickLogin('demo@projecthub.com')}
                className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 py-2 px-1 rounded-xl text-[10px] font-semibold text-emerald-200 transition flex flex-col items-center justify-center gap-1"
              >
                <User className="w-4 h-4 text-emerald-400" />
                <span>Member</span>
              </button>
              <button
                onClick={() => handleQuickLogin('viewer@projecthub.com')}
                className="bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 py-2 px-1 rounded-xl text-[10px] font-semibold text-sky-200 transition flex flex-col items-center justify-center gap-1"
              >
                <Eye className="w-4 h-4 text-sky-400" />
                <span>Viewer</span>
              </button>
            </div>
          </div>
        </div>

        <p className="text-slate-500 text-center text-xs mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-semibold underline decoration-dotted transition">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
