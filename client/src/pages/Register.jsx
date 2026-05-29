import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Brain, User, Shield, Eye, Lock, Mail } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Member');
  const { register, error, setError } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const success = await register(name, email, password, role);
    setLoading(false);
    if (success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-brand-darker flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Background radial highlight */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="w-full max-w-md z-10">
        {/* Brand header */}
        <div className="text-center mb-6 flex flex-col items-center">
          <div className="w-12 h-12 bg-gradient-to-tr from-emerald-500 to-sky-400 rounded-xl flex items-center justify-center shadow-lg glow-emerald mb-3 animate-pulse-subtle">
            <Brain className="w-6 h-6 text-slate-900" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            CollabMind
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Real-Time AI Collaborative Project Management
          </p>
        </div>

        {/* Register panel */}
        <div className="glass-panel rounded-2xl p-8 shadow-2xl relative border border-slate-800">
          <h2 className="text-xl font-semibold text-white mb-6 text-center">Create Your Account</h2>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-200 text-xs py-3 px-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => {
                    setError(null);
                    setName(e.target.value);
                  }}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-slate-100 text-sm placeholder-slate-600 focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="name@projecthub.com"
                  value={email}
                  onChange={(e) => {
                    setError(null);
                    setEmail(e.target.value);
                  }}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-slate-100 text-sm placeholder-slate-600 focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => {
                    setError(null);
                    setPassword(e.target.value);
                  }}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-slate-100 text-sm placeholder-slate-600 focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-1">Default Account Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 px-3 text-slate-100 text-sm focus:border-emerald-500 transition"
              >
                <option value="Admin" className="bg-brand-dark">Administrator (Full Access)</option>
                <option value="Member" className="bg-brand-dark">Developer Member (Write Access)</option>
                <option value="Viewer" className="bg-brand-dark">Viewer Stakeholder (Read Only)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-905 text-sm font-semibold py-2.5 rounded-xl shadow-lg transition active:scale-[0.98] mt-4 flex items-center justify-center"
            >
              {loading ? 'Registering...' : 'Sign Up'}
            </button>
          </form>
        </div>

        <p className="text-slate-500 text-center text-xs mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-semibold underline decoration-dotted transition">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
