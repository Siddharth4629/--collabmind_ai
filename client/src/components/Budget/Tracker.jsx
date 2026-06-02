import React, { useState } from 'react';
import axios from 'axios';
import { 
  DollarSign, Plus, Trash2, AlertTriangle, AlertOctagon, TrendingUp, BarChart2, ChevronDown, Sparkles
} from 'lucide-react';
import { useConfirmation } from '../../context/ConfirmationContext';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip 
} from 'recharts';

export default function Tracker({ project, onProjectUpdate }) {
  const { confirm } = useConfirmation();
  const [totalBudget, setTotalBudget] = useState(project.budget?.total || 0);
  const [editingBudget, setEditingBudget] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Development');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [alertInfo, setAlertInfo] = useState(null);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [showAllExpenses, setShowAllExpenses] = useState(false);

  // Derive values
  const totalLimit = project.budget?.total || 0;
  const spent = project.budget?.spent || 0;
  const remaining = totalLimit - spent;
  const utilizationRatio = totalLimit > 0 ? spent / totalLimit : 0;
  const utilizationPercent = Math.min(100, Math.round(utilizationRatio * 100));

  // Determine alert status (using gold/bronze values for normal, amber for warning, rose for critical)
  let statusColor = 'text-[var(--gold-primary)] bg-[var(--gold-primary)]/10 border-[var(--gold-primary)]/20';
  let barColor = 'bg-gradient-to-r from-[var(--gold-secondary)] to-[var(--gold-primary)] shadow-[0_0_12px_var(--gold-glow)]';
  if (utilizationRatio >= 1.0) {
    statusColor = 'text-rose-400 bg-rose-500/10 border-rose-500/30 animate-pulse';
    barColor = 'bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_12px_rgba(239,68,68,0.5)]';
  } else if (utilizationRatio >= 0.8) {
    statusColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    barColor = 'bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)]';
  }

  // Categories list
  const CATEGORIES = ['Development', 'Design', 'Infrastructure', 'Marketing', 'Legal', 'General'];
  // Remapped COLORS to premium gold/bronze spectrum matching Nordic Gold Theme
  const COLORS = ['#dfc384', '#c5a880', '#a78b68', '#8e7352', '#735c3e', '#58452c'];

  // Prepare chart data
  const categoryTotals = {};
  CATEGORIES.forEach(cat => { categoryTotals[cat] = 0; });
  
  if (project.expenses && Array.isArray(project.expenses)) {
    project.expenses.forEach(exp => {
      const cat = exp.category || 'General';
      if (categoryTotals[cat] !== undefined) {
        categoryTotals[cat] += exp.amount;
      } else {
        categoryTotals[cat] = exp.amount;
      }
    });
  }

  const chartData = Object.entries(categoryTotals)
    .filter(([_, value]) => value > 0)
    .map(([name, value]) => ({ name, value }));

  const handleUpdateBudget = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`/api/projects/${project._id}/budget`, {
        total: Number(totalBudget)
      });
      if (res.data.success) {
        onProjectUpdate(res.data.data);
        setEditingBudget(false);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update budget limit');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!expenseTitle.trim() || !expenseAmount) return;
    setLoading(true);
    setError(null);
    setAlertInfo(null);
    try {
      const res = await axios.post(`/api/projects/${project._id}/expenses`, {
        title: expenseTitle.trim(),
        amount: Number(expenseAmount),
        category: expenseCategory
      });
      if (res.data.success) {
        onProjectUpdate(res.data.data);
        setExpenseTitle('');
        setExpenseAmount('');
        setExpenseCategory('Development');
        if (res.data.alert) {
          setAlertInfo(res.data.alert);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add expense item');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!(await confirm('Delete this expense item?'))) return;
    setLoading(true);
    setError(null);
    setAlertInfo(null);
    try {
      const res = await axios.delete(`/api/projects/${project._id}/expenses/${expenseId}`);
      if (res.data.success) {
        onProjectUpdate(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete expense item');
    } finally {
      setLoading(false);
    }
  };

  // Find member name by ID to show loggedBy
  const getMemberName = (id) => {
    if (!project.members || !Array.isArray(project.members)) return 'Unknown User';
    
    // Check owner
    const ownerId = typeof project.owner === 'object' ? project.owner._id : project.owner;
    if (ownerId === id) return 'Owner';

    const match = project.members.find(m => {
      const mId = typeof m.user === 'object' ? m.user._id : m.user;
      return mId === id;
    });

    if (match && typeof match.user === 'object') return match.user.name;
    return 'Team Member';
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  // Sort expenses to display newest first
  const reversedExpenses = project.expenses ? [...project.expenses].reverse() : [];
  // Slice visible expenses based on toggle
  const visibleExpenses = showAllExpenses ? reversedExpenses : reversedExpenses.slice(0, 5);

  return (
    <div className="space-y-6 scrollbar-thin text-left">
      
      {/* Top Banner Alert alerts */}
      {alertInfo && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm flex items-center gap-3 animate-pulse">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
          <span>{alertInfo}</span>
        </div>
      )}

      {/* Row 1: Stat Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Total Budget Card */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md relative overflow-hidden shadow-lg group hover:border-[var(--gold-primary)]/30 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Allocated Budget</p>
              <h3 className="text-2xl font-extrabold text-slate-100 mt-2">{formatCurrency(totalLimit)}</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--gold-primary)]/10 border border-[var(--gold-primary)]/20 text-[var(--gold-primary)] shadow-[0_0_15px_rgba(223,195,132,0.1)] group-hover:scale-105 transition-transform">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            {editingBudget ? (
              <form onSubmit={handleUpdateBudget} className="flex gap-2 w-full mt-2 animate-fade-in">
                <input
                  type="number"
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-800 focus:border-[var(--gold-primary)] focus:outline-none rounded-lg px-2.5 py-1.5 text-xs text-slate-100 h-[32px]"
                  placeholder="Budget limit..."
                  min="0"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-gold-grad text-slate-950 px-3 py-1.5 rounded-lg text-[9px] font-extrabold transition-all shrink-0 uppercase tracking-wider cursor-pointer"
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={() => setEditingBudget(false)}
                  className="bg-slate-800 hover:bg-slate-750 text-slate-350 px-2 py-1.5 rounded-lg text-[9px] font-extrabold transition-all shrink-0 uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <button
                onClick={() => setEditingBudget(true)}
                className="text-[9px] text-[var(--gold-primary)] hover:text-white font-extrabold uppercase tracking-widest transition-colors cursor-pointer"
              >
                Modify Allocation
              </button>
            )}
          </div>
        </div>

        {/* Spent Card */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md relative overflow-hidden shadow-lg group hover:border-[var(--gold-primary)]/30 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Expenses Logged</p>
              <h3 className="text-2xl font-extrabold text-slate-100 mt-2">{formatCurrency(spent)}</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5">
            <span className={`text-[9px] px-2.5 py-0.5 rounded-full border ${statusColor} font-bold uppercase tracking-wider`}>
              {utilizationPercent}% Logged
            </span>
          </div>
        </div>

        {/* Available Funds Card */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md relative overflow-hidden shadow-lg group hover:border-[var(--gold-primary)]/30 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Available Funds</p>
              <h3 className={`text-2xl font-extrabold mt-2 ${remaining < 0 ? 'text-rose-455' : 'text-emerald-455'}`}>
                {formatCurrency(remaining)}
              </h3>
            </div>
            <div className={`p-2.5 rounded-xl group-hover:scale-105 transition-transform ${remaining < 0 ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
              {remaining < 0 ? <AlertOctagon className="w-5 h-5 animate-bounce" /> : <DollarSign className="w-5 h-5" />}
            </div>
          </div>
          <div className="mt-4 text-[9px] font-bold uppercase tracking-wider text-slate-500">
            {remaining < 0 ? 'Exceeded threshold limits!' : 'Within financial safety margin'}
          </div>
        </div>

      </div>

      {/* Row 2: Depletion Progress Bar */}
      <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/60">
        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
          <span>Depletion Tracker</span>
          <span className="font-mono text-slate-200">{formatCurrency(spent)} / {formatCurrency(totalLimit)} ({utilizationPercent}%)</span>
        </div>
        <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-850">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${barColor}`} 
            style={{ width: `${utilizationPercent}%` }} 
          />
        </div>
      </div>

      {/* Row 3: Dynamic Middle split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Log Expense Form */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md relative overflow-hidden">
          {/* Settings SVG (left top near dropdown menu/form elements) */}
          <div className="absolute -top-6 -left-6 w-24 h-24 text-[var(--gold-primary)]/10 animate-spin-slow opacity-15 pointer-events-none -z-10">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-slate-200 mb-4 uppercase tracking-wider text-xs border-b border-slate-850 pb-2 flex items-center gap-2">
            <Plus className="w-4 h-4 text-[var(--gold-primary)]" /> Log Expense Item
          </h3>
          
          <form onSubmit={handleAddExpense} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1.5">Item Description</label>
                <input
                  type="text"
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  placeholder="e.g. Server hosting"
                  className="w-full bg-slate-950/70 border border-slate-850 hover:border-slate-800 focus:border-[var(--gold-primary)] text-slate-100 placeholder-slate-650 rounded-xl px-3.5 py-2 text-xs focus:outline-none transition-all focus:ring-1 focus:ring-[var(--gold-primary)]/20 h-[38px]"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1.5">Amount (USD)</label>
                <input
                  type="number"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  placeholder="e.g. 150"
                  className="w-full bg-slate-950/70 border border-slate-855 hover:border-slate-800 focus:border-[var(--gold-primary)] text-slate-100 placeholder-slate-650 rounded-xl px-3.5 py-2 text-xs focus:outline-none transition-all focus:ring-1 focus:ring-[var(--gold-primary)]/20 h-[38px]"
                  min="1"
                  required
                />
              </div>

            </div>

            {/* Custom Selector Dropdown */}
            <div className="relative">
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1.5">Category</label>
              <button
                type="button"
                onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                className="w-full bg-slate-950/70 border border-slate-850 hover:border-slate-800 rounded-xl py-2 px-3.5 text-slate-300 text-xs focus:border-[var(--gold-primary)] transition flex items-center justify-between text-left h-[38px] cursor-pointer"
              >
                <span>{expenseCategory}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 transition-transform duration-200" style={{ transform: categoryDropdownOpen ? 'rotate(180deg)' : 'none' }} />
              </button>
              {categoryDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setCategoryDropdownOpen(false)} />
                  <div className="absolute top-full left-0 right-0 mt-2 p-1.5 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 animate-fade-in text-xs space-y-1">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setExpenseCategory(cat);
                          setCategoryDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                          expenseCategory === cat
                            ? 'bg-gradient-to-r from-[var(--gold-primary)] to-[var(--gold-secondary)] text-slate-950 font-extrabold shadow-sm'
                            : 'text-slate-350 hover:bg-slate-850 hover:text-white'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {error && <p className="text-xs text-rose-450">{error}</p>}

            <button
              type="submit"
              disabled={loading || !expenseTitle.trim() || !expenseAmount}
              className="w-full btn-gold-grad disabled:opacity-50 text-slate-950 py-2 rounded-xl text-xs font-bold shadow-[0_0_15px_var(--gold-glow)] disabled:shadow-none transition-all flex items-center justify-center gap-1.5 cursor-pointer h-[38px] uppercase tracking-wider font-extrabold"
            >
              <Plus className="w-4 h-4 text-slate-950 stroke-[3px]" /> Add Expense
            </button>
          </form>
        </div>

        {/* Dynamic Display: Pie Chart or Getting Started Card */}
        {chartData.length > 0 ? (
          /* Recharts Pie Chart Panel */
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex flex-col justify-between hover:border-[var(--gold-primary)]/20 transition-all duration-300 h-full">
            <h3 className="text-xs font-semibold text-slate-200 mb-4 flex items-center gap-2 border-b border-slate-855 pb-2 uppercase tracking-wider">
              <BarChart2 className="w-4 h-4 text-[var(--gold-primary)]" /> Cost Distribution
            </h3>
            <div className="flex-1 min-h-[190px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => {
                      const catIdx = CATEGORIES.indexOf(entry.name);
                      return <Cell key={`cell-${index}`} fill={COLORS[catIdx !== -1 ? catIdx : 5]} />;
                    })}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#090d16', border: '1px solid #1e293b', borderRadius: '12px' }}
                    itemStyle={{ color: '#cbd5e1', fontSize: '11px' }}
                    formatter={(value) => [`$${value}`, 'Expense']}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          /* Custom Gold-accented Getting Started Card when no records exist */
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex flex-col justify-between hover:border-[var(--gold-primary)]/20 transition-all duration-300 h-full select-none text-left">
            <div>
              <h3 className="text-xs font-semibold text-slate-200 mb-4 uppercase tracking-wider flex items-center gap-2 border-b border-slate-855 pb-2">
                <Sparkles className="w-4 h-4 text-[var(--gold-primary)]" /> Track Project Costs
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mt-2.5">
                Welcome to your team's financial command center. Track your infrastructure spend, design asset purchases, and legal allocations in real-time.
              </p>
              <ul className="mt-4 space-y-2 text-slate-500 text-[11px] list-disc list-inside">
                <li>Log server nodes, API credits, and hosting fees.</li>
                <li>Get alerts when your budget utilization exceeds threshold margins.</li>
                <li>Distribute costs dynamically among project members.</li>
              </ul>
            </div>
            <div className="mt-6 border-t border-slate-855 pt-4 text-[9px] text-[var(--gold-primary)]/70 font-bold uppercase tracking-widest">
              Add your first expense item to activate analytics
            </div>
          </div>
        )}

      </div>

      {/* Row 4: Expense Ledger Table (Full Width) */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md overflow-hidden relative">
        {/* AI Ideation SVG (bottom right corner) */}
        <div className="absolute -bottom-8 -right-8 w-28 h-28 text-[var(--gold-primary)]/10 opacity-15 pointer-events-none -z-10 animate-pulse">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
            <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A5 5 0 0 0 8 8c0 1 .3 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
            <path d="M9 18h6" />
            <path d="M10 22h4" />
            <path d="M12 2v2M22 12h-2M4 12H2M18.36 5.64l-1.42 1.42M7.05 16.95l-1.42 1.42M18.36 18.36l-1.42-1.42M7.05 7.05L5.64 5.64" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-slate-200 mb-4 uppercase tracking-wider text-xs border-b border-slate-850 pb-2">
          Expense Ledger
        </h3>
        
        <div className={`overflow-x-auto transition-all ${showAllExpenses ? 'max-h-[350px] overflow-y-auto scrollbar-thin pr-1' : ''}`}>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 pb-3 font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-3">Item Description</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Logged By</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 px-3 text-right w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {visibleExpenses.length > 0 ? (
                visibleExpenses.map((exp) => (
                  <tr key={exp._id} className="text-slate-350 hover:bg-slate-800/20 transition-all">
                    <td className="py-3 px-3 font-medium text-slate-200">{exp.title}</td>
                    <td className="py-3 px-3">
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full border border-[var(--gold-primary)]/20 bg-slate-950/40 text-[var(--gold-primary)] font-semibold uppercase tracking-wide">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500">{new Date(exp.date).toLocaleDateString()}</td>
                    <td className="py-3 px-3 text-slate-400">{getMemberName(exp.loggedBy)}</td>
                    <td className="py-3 px-3 text-right text-[var(--gold-primary)] font-bold">{formatCurrency(exp.amount)}</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleDeleteExpense(exp._id)}
                        className="p-1 hover:bg-rose-500/10 rounded-md text-slate-600 hover:text-rose-400 transition-all cursor-pointer"
                        title="Delete expense item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-655 font-semibold uppercase text-[10px] tracking-wider">No expense items logged under this project.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Dynamic Show More Toggle to avoid disrupting layout */}
        {reversedExpenses.length > 5 && (
          <div className="mt-4 flex justify-center border-t border-slate-850 pt-4">
            <button
              onClick={() => setShowAllExpenses(!showAllExpenses)}
              className="text-[10px] text-[var(--gold-primary)] hover:text-white font-extrabold transition-all flex items-center gap-1.5 cursor-pointer uppercase tracking-widest bg-slate-950/50 border border-[var(--gold-primary)]/20 hover:border-[var(--gold-primary)]/50 px-4 py-2 rounded-xl hover:shadow-[0_0_12px_rgba(223,195,132,0.15)]"
            >
              {showAllExpenses ? 'Collapse Ledger View' : `Show More Expenses (${reversedExpenses.length - 5} items)`}
            </button>
          </div>
        )}

      </div>

    </div>
  );
}
