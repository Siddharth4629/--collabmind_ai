import React, { useState } from 'react';
import axios from 'axios';
import { 
  DollarSign, Plus, Trash2, AlertTriangle, AlertOctagon, TrendingUp, BarChart2
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip 
} from 'recharts';

export default function Tracker({ project, onProjectUpdate }) {
  const [totalBudget, setTotalBudget] = useState(project.budget?.total || 0);
  const [editingBudget, setEditingBudget] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Development');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [alertInfo, setAlertInfo] = useState(null);

  // Derive values
  const totalLimit = project.budget?.total || 0;
  const spent = project.budget?.spent || 0;
  const remaining = totalLimit - spent;
  const utilizationRatio = totalLimit > 0 ? spent / totalLimit : 0;
  const utilizationPercent = Math.min(100, Math.round(utilizationRatio * 100));

  // Determine alert status
  let statusColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  let barColor = 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]';
  if (utilizationRatio >= 1.0) {
    statusColor = 'text-rose-400 bg-rose-500/10 border-rose-500/30 animate-pulse';
    barColor = 'bg-rose-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]';
  } else if (utilizationRatio >= 0.8) {
    statusColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    barColor = 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]';
  }

  // Categories list
  const CATEGORIES = ['Development', 'Design', 'Infrastructure', 'Marketing', 'Legal', 'General'];
  const COLORS = ['#6366f1', '#10b981', '#f55f15', '#f5a623', '#ec4899', '#94a3b8'];

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
    if (!window.confirm('Delete this expense item?')) return;
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

  return (
    <div className="space-y-6 scrollbar-thin">
      
      {/* Top Banner Alert alerts */}
      {alertInfo && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm flex items-center gap-3 animate-pulse">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
          <span>{alertInfo}</span>
        </div>
      )}

      {/* Overview Stat Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Total Budget Card */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md relative overflow-hidden shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Allocated Budget</p>
              <h3 className="text-2xl font-bold text-slate-100 mt-2">{formatCurrency(totalLimit)}</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            {editingBudget ? (
              <form onSubmit={handleUpdateBudget} className="flex gap-2 w-full mt-2">
                <input
                  type="number"
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-800 focus:border-indigo-500 focus:outline-none rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                  placeholder="Budget limit..."
                  min="0"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all shrink-0"
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={() => setEditingBudget(false)}
                  className="bg-slate-800 hover:bg-slate-750 text-slate-300 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all shrink-0"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <button
                onClick={() => setEditingBudget(true)}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold uppercase tracking-wider"
              >
                Modify Allocation
              </button>
            )}
          </div>
        </div>

        {/* Spent Card */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md relative overflow-hidden shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Expenses Logged</p>
              <h3 className="text-2xl font-bold text-slate-100 mt-2">{formatCurrency(spent)}</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5">
            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusColor} font-semibold uppercase tracking-wider`}>
              {utilizationPercent}% Logged
            </span>
          </div>
        </div>

        {/* Remaining Card */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md relative overflow-hidden shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Available Funds</p>
              <h3 className={`text-2xl font-bold mt-2 ${remaining < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {formatCurrency(remaining)}
              </h3>
            </div>
            <div className={`p-2.5 rounded-xl ${remaining < 0 ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
              {remaining < 0 ? <AlertOctagon className="w-5 h-5 animate-bounce" /> : <DollarSign className="w-5 h-5" />}
            </div>
          </div>
          <div className="mt-4 text-[10px] text-slate-500">
            {remaining < 0 ? 'Exceeded threshold limits!' : 'Within financial safety margin'}
          </div>
        </div>

      </div>

      {/* Progress indicators */}
      <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/60">
        <div className="flex justify-between text-xs font-medium text-slate-300 mb-2">
          <span>Depletion Tracker</span>
          <span>{formatCurrency(spent)} / {formatCurrency(totalLimit)} ({utilizationPercent}%)</span>
        </div>
        <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800/60">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${barColor}`} 
            style={{ width: `${utilizationPercent}%` }} 
          />
        </div>
      </div>

      {/* Chart and Logging form side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Expenses List & Form */}
        <div className="space-y-6">
          
          {/* Add Expense Form */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
            <h3 className="text-sm font-semibold text-slate-200 mb-4">Log Expense Item</h3>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1.5">Item Description</label>
                  <input
                    type="text"
                    value={expenseTitle}
                    onChange={(e) => setExpenseTitle(e.target.value)}
                    placeholder="e.g. Server hosting"
                    className="w-full bg-slate-950/70 border border-slate-850 hover:border-slate-800 focus:border-indigo-500/80 text-slate-100 placeholder-slate-650 rounded-xl px-3.5 py-2 text-xs focus:outline-none transition-all focus:ring-1 focus:ring-indigo-500/30"
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
                    className="w-full bg-slate-950/70 border border-slate-850 hover:border-slate-800 focus:border-indigo-500/80 text-slate-100 placeholder-slate-650 rounded-xl px-3.5 py-2 text-xs focus:outline-none transition-all focus:ring-1 focus:ring-indigo-500/30"
                    min="1"
                    required
                  />
                </div>

              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1.5">Category</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-850 focus:border-indigo-500 focus:outline-none rounded-xl px-3.5 py-2 text-xs text-slate-300"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {error && <p className="text-xs text-rose-400">{error}</p>}

              <button
                type="submit"
                disabled={loading || !expenseTitle.trim() || !expenseAmount}
                className="w-full bg-indigo-650 hover:bg-indigo-600 disabled:bg-slate-850 text-white py-2 rounded-xl text-xs font-semibold shadow-[0_0_15px_rgba(99,102,241,0.2)] disabled:shadow-none hover:shadow-[0_0_20px_rgba(99,102,241,0.35)] transition-all flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add Expense
              </button>
            </form>
          </div>

        </div>

        {/* Category Breakdown Recharts Chart */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex flex-col">
          <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-indigo-400" /> Cost Distribution
          </h3>
          <div className="flex-1 min-h-[220px] flex items-center justify-center">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => {
                      const catIdx = CATEGORIES.indexOf(entry.name);
                      return <Cell key={`cell-${index}`} fill={COLORS[catIdx !== -1 ? catIdx : 5]} />;
                    })}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#090d16', border: '1px solid #1e293b', borderRadius: '8px' }}
                    itemStyle={{ color: '#cbd5e1', fontSize: '11px' }}
                    formatter={(value) => [`$${value}`, 'Expense']}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '10px', color: '#94a3b8' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-xs text-slate-600 flex flex-col items-center py-8">
                <BarChart2 className="w-8 h-8 text-slate-800 mb-2" />
                No expenses logged to plot distribution.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Expense ledger breakdown */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md overflow-hidden">
        <h3 className="text-sm font-semibold text-slate-200 mb-4">Expense Ledger</h3>
        <div className="overflow-x-auto">
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
              {project.expenses && project.expenses.length > 0 ? (
                project.expenses.slice().reverse().map((exp) => (
                  <tr key={exp._id} className="text-slate-350 hover:bg-slate-800/20 transition-all">
                    <td className="py-3 px-3 font-medium text-slate-200">{exp.title}</td>
                    <td className="py-3 px-3">
                      <span className="text-[10px] px-2 py-0.5 rounded-full border border-slate-750 bg-slate-800/50 text-slate-300">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500">{new Date(exp.date).toLocaleDateString()}</td>
                    <td className="py-3 px-3 text-slate-400">{getMemberName(exp.loggedBy)}</td>
                    <td className="py-3 px-3 text-right text-orange-400 font-bold">{formatCurrency(exp.amount)}</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleDeleteExpense(exp._id)}
                        className="p-1 hover:bg-rose-500/10 rounded-md text-slate-600 hover:text-rose-400 transition-all"
                        title="Delete expense item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-6 text-slate-600">No expense items logged under this project.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
