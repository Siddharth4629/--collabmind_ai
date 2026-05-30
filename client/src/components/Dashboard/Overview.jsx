import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { Calendar, TrendingUp, CheckSquare, Sparkles, Activity } from 'lucide-react';

export default function Overview({ projectId }) {
  const [tasks, setTasks] = useState([]);
  const [project, setProject] = useState(null);
  const [activities, setActivities] = useState([]);
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
    return <div className="h-96 rounded-2xl glass-panel animate-pulse"></div>;
  }

  // Calculate task counts
  const todoCount = tasks.filter(t => t.status === 'Todo').length;
  const inProgressCount = tasks.filter(t => t.status === 'InProgress').length;
  const reviewCount = tasks.filter(t => t.status === 'Review').length;
  const doneCount = tasks.filter(t => t.status === 'Done').length;

  const taskChartData = [
    { name: 'To Do', value: todoCount, color: '#64748b' },
    { name: 'In Progress', value: inProgressCount, color: '#3b82f6' },
    { name: 'Review', value: reviewCount, color: '#f59e0b' },
    { name: 'Completed', value: doneCount, color: '#10b981' }
  ];

  const activeTaskChartData = taskChartData.filter(d => d.value > 0);

  // Budget calculations
  const totalBudget = project?.budget?.total || 0;
  const spentBudget = project?.budget?.spent || 0;
  const remainingBudget = totalBudget - spentBudget > 0 ? totalBudget - spentBudget : 0;
  
  const budgetPieData = [
    { name: 'Spent', value: spentBudget, color: '#ef4444' },
    { name: 'Remaining', value: remainingBudget, color: '#10b981' }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex justify-between items-center transition">
          <div>
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Completed Tasks</span>
            <h4 className="text-2xl font-bold text-white mt-1">
              {doneCount} <span className="text-xs font-semibold text-slate-500">/ {tasks.length}</span>
            </h4>
            <p className="text-slate-500 text-xs mt-1.5 flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>Overall progress tracking</span>
            </p>
          </div>
          <div className="w-10 h-10 bg-slate-950 border border-slate-800 text-slate-400 rounded-lg flex items-center justify-center">
            <CheckSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex justify-between items-center transition">
          <div>
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Financial Spending</span>
            <h4 className="text-2xl font-bold text-white mt-1">
              ${spentBudget.toLocaleString()}{' '}
              <span className="text-xs font-semibold text-slate-500">/ ${totalBudget.toLocaleString()}</span>
            </h4>
            <p className="text-slate-500 text-xs mt-1.5 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-red-400" />
              <span>Budget depletion metrics</span>
            </p>
          </div>
          <div className="w-10 h-10 bg-slate-950 border border-slate-800 text-slate-400 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex justify-between items-center transition">
          <div>
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Project Deadline</span>
            <h4 className="text-xl font-bold text-white mt-1.5">
              {project?.deadline ? new Date(project.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No Deadline'}
            </h4>
            <p className="text-slate-500 text-xs mt-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Target completion timeline</span>
            </p>
          </div>
          <div className="w-10 h-10 bg-slate-950 border border-slate-800 text-slate-400 rounded-lg flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Visual Analytics row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tasks Recharts */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <h3 className="text-sm font-bold text-slate-350 uppercase tracking-wider mb-4">Task Status Distribution</h3>
          <div className="h-64 w-full">
            {tasks.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-600 italic">No task statistics available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taskChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--bg-900)', border: '1px solid var(--border-850)', borderRadius: '8px' }}
                    labelStyle={{ color: 'var(--text-100)', fontSize: '12px' }}
                    itemStyle={{ color: 'var(--text-100)', fontSize: '12px' }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {taskChartData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Budget Recharts */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">Financial Allocation</h3>
          <div className="h-64 flex flex-col md:flex-row items-center justify-around">
            {totalBudget === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-600 italic">No budget details configured</div>
            ) : (
              <>
                <div className="h-48 w-48 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={budgetPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
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
                    <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Remaining</span>
                    <span className="text-md font-bold text-emerald-400">
                      ${remainingBudget.toLocaleString()}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-3 mt-4 md:mt-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3.5 h-3.5 bg-red-500 rounded-md"></div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">SPENT</p>
                      <p className="text-xs font-semibold text-white">${spentBudget.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-3.5 h-3.5 bg-emerald-500 rounded-md"></div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">REMAINING</p>
                      <p className="text-xs font-semibold text-white">${remainingBudget.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Activity Logs Feed */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 border-b border-slate-900 pb-4 mb-4">
          <Activity className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Workspace Activity Log</h3>
        </div>
        <div className="max-h-60 overflow-y-auto space-y-4 pr-2">
          {activities.length === 0 ? (
            <p className="text-slate-600 text-xs italic py-4">No recent activity logs recorded in this workspace.</p>
          ) : (
            activities.map((act) => (
              <div key={act._id} className="flex gap-4 items-start text-xs border-b border-slate-900/60 pb-3 last:border-0">
                <div className="bg-slate-900 px-2.5 py-1 text-slate-500 font-bold rounded-lg border border-slate-800">
                  {act.user?.name?.charAt(0) || 'U'}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-200">{act.user?.name || 'Unknown User'}</span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(act.createdAt).toLocaleString(undefined, { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-slate-400 mt-1 font-medium">{act.action}: <span className="text-slate-300 font-normal">{act.details}</span></p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
