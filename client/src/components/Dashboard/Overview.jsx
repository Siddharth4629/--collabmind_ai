import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { 
  Calendar, TrendingUp, CheckSquare, Trophy, DollarSign, Activity, AlertCircle, ChevronRight
} from 'lucide-react';

export default function Overview({ projectId, setActiveTab }) {
  const [tasks, setTasks] = useState([]);
  const [project, setProject] = useState(null);
  const [activities, setActivities] = useState([]);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOverviewData = async () => {
      try {
        const [projRes, tasksRes, actRes] = await Promise.all([
          axios.get(`/api/projects/${projectId}`),
          axios.get(`/api/tasks?project=${projectId}`),
          axios.get(`/api/activity/project/${projectId}`)
        ]);

        if (projRes.data.success) setProject(projRes.data.data);
        if (tasksRes.data.success) setTasks(tasksRes.data.data);
        if (actRes.data.success) setActivities(actRes.data.data);
      } catch (err) {
        console.error('Failed to load dashboard overview statistics:', err.message);
      } finally {
        setLoading(false);
      }
    };

    loadOverviewData();
  }, [projectId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-44 rounded-2xl bg-slate-900 border border-slate-800 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="h-28 rounded-xl bg-slate-900 border border-slate-800 animate-pulse"></div>
          <div className="h-28 rounded-xl bg-slate-900 border border-slate-800 animate-pulse"></div>
          <div className="h-28 rounded-xl bg-slate-900 border border-slate-800 animate-pulse"></div>
        </div>
        <div className="h-96 rounded-2xl bg-slate-900 border border-slate-800 animate-pulse"></div>
      </div>
    );
  }

  // Calculate task counts
  const todoCount = tasks.filter(t => t.status === 'Todo').length;
  const inProgressCount = tasks.filter(t => t.status === 'InProgress').length;
  const reviewCount = tasks.filter(t => t.status === 'Review').length;
  const doneCount = tasks.filter(t => t.status === 'Done').length;

  const totalTasks = tasks.length;
  const progressPercent = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;

  // Chart data
  const taskChartData = [
    { name: 'To Do', value: todoCount, color: 'var(--text-300)' },
    { name: 'In Progress', value: inProgressCount, color: 'var(--gold-secondary)' },
    { name: 'Review', value: reviewCount, color: '#f59e0b' },
    { name: 'Completed', value: doneCount, color: '#10b981' }
  ];

  // Budget calculations
  const totalBudget = project?.budget?.total || 0;
  const spentBudget = project?.budget?.spent || 0;
  const remainingBudget = totalBudget - spentBudget > 0 ? totalBudget - spentBudget : 0;
  const budgetPercent = totalBudget > 0 ? Math.round((spentBudget / totalBudget) * 100) : 0;

  const budgetPieData = [
    { name: 'Spent', value: spentBudget, color: '#ef4444' },
    { name: 'Remaining', value: remainingBudget, color: '#10b981' }
  ];

  // Get pending milestones (tasks not Done yet)
  const pendingTasks = tasks.filter(t => t.status !== 'Done').slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in text-left">
      
      {/* 1. COMMAND HUB WELCOME BANNER (Unified structure with metadata) */}
      <div className="p-6 md:p-8 bg-slate-900 border border-slate-850 rounded-2xl relative overflow-hidden shadow">
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-[var(--gold-glow)] to-transparent pointer-events-none" />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
          <div className="lg:col-span-2 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[9px] uppercase font-bold tracking-widest text-[var(--gold-primary)] bg-[var(--gold-glow)] px-2.5 py-1 rounded-md font-mono">WORKSPACE COMMAND CENTER</span>
              <span className="text-[9px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono font-bold">
                {project?.status || 'Active'}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight font-sans">
              Ecosystem Hub: <span className="bg-gradient-to-r from-[var(--gold-primary)] to-[var(--gold-secondary)] bg-clip-text text-transparent">{project?.name}</span>
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
              {project?.description || 'Active collaborative space. Monitor milestones, edit code, and brainstorm workflows concurrently.'}
            </p>
          </div>

          <div className="w-full bg-slate-950/40 p-5 rounded-xl border border-slate-850/80 flex flex-col justify-center">
            <div className="flex justify-between items-center text-xs font-semibold mb-2">
              <span className="text-slate-400">Task Completion Progress</span>
              <span className="text-[var(--gold-primary)]">{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-[var(--gold-primary)] to-[var(--gold-secondary)] h-full transition-all duration-1000"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1.5 font-medium">
              <CheckSquare className="w-3.5 h-3.5 text-[var(--gold-primary)] shrink-0" />
              <span>{doneCount} of {totalTasks} milestones complete</span>
            </p>
          </div>
        </div>
      </div>

      {/* 2. CORE METRICS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Completed Tasks */}
        <div className="bg-slate-900/50 border border-slate-850/70 p-5 rounded-xl flex justify-between items-center hover:border-slate-800 transition">
          <div>
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Completed Tasks</span>
            <h4 className="text-2xl font-bold text-white mt-1">
              {doneCount} <span className="text-xs font-semibold text-slate-500">/ {totalTasks}</span>
            </h4>
            <p className="text-slate-500 text-xs mt-2 flex items-center gap-1.5 font-medium">
              <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
              <span>Overall sprint checklist progress</span>
            </p>
          </div>
          <div className="w-11 h-11 bg-slate-950 border border-slate-850 text-slate-400 rounded-xl flex items-center justify-center">
            <Trophy className="w-5 h-5 text-indigo-400" />
          </div>
        </div>

        {/* Financial Spending */}
        <div className="bg-slate-900/50 border border-slate-850/70 p-5 rounded-xl flex justify-between items-center hover:border-slate-800 transition">
          <div>
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Budget Outlay</span>
            <h4 className="text-2xl font-bold text-white mt-1">
              ${spentBudget.toLocaleString()}{' '}
              <span className="text-xs font-semibold text-slate-500">/ ${totalBudget.toLocaleString()}</span>
            </h4>
            <p className="text-slate-500 text-xs mt-2 flex items-center gap-1.5 font-medium">
              <TrendingUp className="w-3.5 h-3.5 text-rose-500" />
              <span>{budgetPercent}% total resource depletion</span>
            </p>
          </div>
          <div className="w-11 h-11 bg-slate-950 border border-slate-850 text-slate-400 rounded-xl flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
        </div>

        {/* Project Deadline */}
        <div className="bg-slate-900/50 border border-slate-850/70 p-5 rounded-xl flex justify-between items-center hover:border-slate-800 transition">
          <div>
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Target Deadline</span>
            <h4 className="text-xl font-bold text-white mt-1.5">
              {project?.deadline ? new Date(project.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No Deadline Assigned'}
            </h4>
            <p className="text-slate-500 text-xs mt-2 flex items-center gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
              <span>Scheduled completion milestones</span>
            </p>
          </div>
          <div className="w-11 h-11 bg-slate-950 border border-slate-850 text-slate-400 rounded-xl flex items-center justify-center">
            <Calendar className="w-5 h-5 text-amber-500" />
          </div>
        </div>
      </div>

      {/* 3. ANALYTICS & TIMELINES GRID WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Visual Analytics Columns (Pie & Bar charts) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Task Velocity */}
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-850/70 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-350 uppercase tracking-wider">Milestone Velocity Status</h3>
                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Task card counts mapped across sprint lanes</p>
              </div>
              
              <div className="h-56 w-full pt-4">
                {totalTasks === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-xs text-slate-500 gap-2">
                    <AlertCircle className="w-5 h-5 text-slate-600" />
                    <span className="italic font-medium">No task milestone records found.</span>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={taskChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <XAxis dataKey="name" stroke="var(--text-300)" fontSize={9} tickLine={false} />
                      <YAxis stroke="var(--text-300)" fontSize={9} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'var(--bg-900)', border: '1px solid var(--border-850)', borderRadius: '12px' }}
                        labelStyle={{ color: 'var(--text-100)', fontSize: '11px', fontWeight: 'bold' }}
                        itemStyle={{ color: 'var(--text-100)', fontSize: '11px' }}
                      />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={30}>
                        {taskChartData.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Budget pie */}
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-850/70 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Ecosystem Funds Outlay</h3>
                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Depletion ratios showing remaining contract margins</p>
              </div>

              <div className="h-56 flex flex-col sm:flex-row items-center justify-around pt-2">
                {totalBudget === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-xs text-slate-500 gap-2">
                    <AlertCircle className="w-5 h-5 text-slate-600" />
                    <span className="italic font-medium">No financial layout configured.</span>
                  </div>
                ) : (
                  <>
                    <div className="h-36 w-36 relative shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={budgetPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={36}
                            outerRadius={54}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {budgetPieData.map((entry, idx) => (
                              <Cell key={`cell-${idx}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Remaining</span>
                        <span className="text-xs font-bold text-emerald-400 mt-0.5">
                          ${remainingBudget.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-3 mt-4 sm:mt-0 max-w-[120px] text-left">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 bg-red-500 rounded-md shrink-0"></div>
                        <div>
                          <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wide">SPENT</p>
                          <p className="text-[10px] font-semibold text-white mt-0.5">${spentBudget.toLocaleString()} ({budgetPercent}%)</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-md shrink-0"></div>
                        <div>
                          <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wide">REMAINING</p>
                          <p className="text-[10px] font-semibold text-white mt-0.5">${remainingBudget.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Pending Milestones Checklist Panel */}
          <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-850/70">
            <div className="flex items-center justify-between border-b border-slate-850 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-[var(--gold-primary)]" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Milestones Checklist (Pending)</h3>
              </div>
              <button 
                onClick={() => setActiveTab('Board')}
                className="text-[10px] text-[var(--gold-primary)] hover:underline flex items-center gap-1 font-bold cursor-pointer"
              >
                Go to Kanban Board <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2.5">
              {pendingTasks.length === 0 ? (
                <p className="text-slate-500 text-xs italic py-4">No pending milestones or tasks. Work is all caught up!</p>
              ) : (
                pendingTasks.map((task) => (
                  <div key={task._id} className="p-3 bg-slate-950/40 border border-slate-850/60 rounded-xl flex justify-between items-center text-xs hover:border-slate-800 transition">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        task.status === 'Todo' ? 'bg-slate-600' :
                        task.status === 'InProgress' ? 'bg-[var(--gold-secondary)] animate-pulse' : 'bg-yellow-500'
                      }`} />
                      <span className="font-semibold text-slate-200 truncate">{task.title}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase ${
                        task.priority === 'High' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                        task.priority === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {task.priority || 'Normal'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">
                        {task.status === 'Todo' ? 'To Do' : task.status === 'InProgress' ? 'In Progress' : 'Review'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Activity Timeline */}
        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-850/70 h-[480px] lg:h-auto flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-850 pb-3 mb-4 shrink-0">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[var(--gold-primary)]" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Ecosystem Activity</h3>
            </div>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest font-mono">Live updates</span>
          </div>

          <div className={`flex-1 space-y-4 pr-1 ${showAllActivities ? 'max-h-[380px] overflow-y-auto' : ''}`}>
            {activities.length === 0 ? (
              <p className="text-slate-500 text-xs italic py-4">No recent activity logs recorded in this workspace environment.</p>
            ) : (
              (showAllActivities ? activities : activities.slice(0, 5)).map((act) => (
                <div key={act._id} className="flex gap-3 items-start text-xs border-b border-slate-950 pb-3 last:border-0 hover:bg-slate-950/20 rounded-lg p-1 transition duration-150">
                  <div className="bg-slate-950 w-7 h-7 text-[var(--gold-primary)] font-bold rounded-lg border border-slate-850/60 font-mono shrink-0 flex items-center justify-center text-[10px]">
                    {act.user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-200 truncate">{act.user?.name || 'Anonymous User'}</span>
                      <span className="text-[9px] text-slate-500 shrink-0 font-medium ml-2">
                        {new Date(act.createdAt).toLocaleString(undefined, { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-slate-400 mt-1 font-medium leading-relaxed">{act.action}: <span className="text-slate-350 font-normal">{act.details}</span></p>
                  </div>
                </div>
              ))
            )}
          </div>

          {activities.length > 5 && (
            <div className="mt-3 pt-3 border-t border-slate-850/60 flex justify-center shrink-0">
              <button
                onClick={() => setShowAllActivities(!showAllActivities)}
                className="text-[10px] text-[var(--gold-primary)] hover:text-[var(--gold-secondary)] font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 focus:outline-none"
              >
                <span>{showAllActivities ? 'Show Less' : 'Show More'}</span>
                <span className={`transform transition-transform duration-250 ${showAllActivities ? 'rotate-90' : ''}`}>
                  <ChevronRight className="w-3 h-3" />
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
