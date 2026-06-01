import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { useConfirmation } from '../../context/ConfirmationContext';
import { Plus, User, Calendar, CheckSquare, MessageSquare, AlertCircle, X, Check, Trash } from 'lucide-react';
import confetti from 'canvas-confetti';

const COLUMNS = [
  { id: 'Todo', title: 'To Do', color: 'border-t-slate-500 bg-slate-900/40' },
  { id: 'InProgress', title: 'In Progress', color: 'border-t-blue-500 bg-blue-950/10' },
  { id: 'Review', title: 'In Review', color: 'border-t-amber-500 bg-amber-950/10' },
  { id: 'Done', title: 'Completed', color: 'border-t-emerald-500 bg-emerald-950/10' }
];

const CalendarPicker = ({ value, onChange, onClose }) => {
  const [currentDate, setCurrentDate] = useState(() => {
    return value ? new Date(value) : new Date();
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Get total days in month
  const totalDays = new Date(year, month + 1, 0).getDate();
  // Get first day of month (0 = Sunday, 1 = Monday, etc.)
  const firstDayIndex = new Date(year, month, 1).getDay();

  const days = [];
  // Fill empty days for padding before the 1st of the month
  for (let i = 0; i < firstDayIndex; i++) {
    days.push(null);
  }
  // Fill days of the month
  for (let i = 1; i <= totalDays; i++) {
    days.push(i);
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handleSelectDay = (day) => {
    if (!day) return;
    const selectedDate = new Date(year, month, day);
    const yyyy = selectedDate.getFullYear();
    const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const dd = String(selectedDate.getDate()).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
    onClose();
  };

  const isSelected = (day) => {
    if (!day || !value) return false;
    const valDate = new Date(value);
    return valDate.getDate() === day && valDate.getMonth() === month && valDate.getFullYear() === year;
  };

  return (
    <div className="absolute top-full left-0 mt-2 p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 w-64 animate-fade-in text-xs select-none">
      <div className="flex justify-between items-center mb-3">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
        >
          &larr;
        </button>
        <span className="font-bold text-white uppercase tracking-wider font-mono">
          {monthNames[month]} {year}
        </span>
        <button
          type="button"
          onClick={handleNextMonth}
          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
        >
          &rarr;
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center font-bold text-slate-500 uppercase tracking-widest text-[8px] mb-2">
        <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
      </div>

      <div key={`${month}-${year}`} className="grid grid-cols-7 gap-1 text-center font-mono animate-fade-in">
        {days.map((day, idx) => (
          <button
            key={idx}
            type="button"
            disabled={!day}
            onClick={() => handleSelectDay(day)}
            className={`w-7 h-7 rounded-lg text-[10px] flex items-center justify-center transition cursor-pointer ${
              !day 
                ? 'opacity-0 cursor-default pointer-events-none' 
                : isSelected(day)
                ? 'bg-gradient-to-r from-[var(--gold-primary)] to-[var(--gold-secondary)] text-[var(--active-tab-text)] font-extrabold shadow-md'
                : 'text-slate-350 hover:bg-slate-850 hover:text-white'
            }`}
          >
            {day}
          </button>
        ))}
      </div>
    </div>
  );
};

export default function Board({ projectId }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { confirm } = useConfirmation();
  const [tasks, setTasks] = useState([]);
  const [projectMembers, setProjectMembers] = useState([]);
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  // Task creation
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createColumnId, setCreateColumnId] = useState('Todo');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskStartDate, setTaskStartDate] = useState('');
  const [startDatePickerOpen, setStartDatePickerOpen] = useState(false);
  const [dueDatePickerOpen, setDueDatePickerOpen] = useState(false);
  const [priorityDropdownOpen, setPriorityDropdownOpen] = useState(false);
  const [assigneeDropdownOpen, setAssigneeDropdownOpen] = useState(false);

  // Task detail card popup
  const [activeTask, setActiveTask] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [detailStartOpen, setDetailStartOpen] = useState(false);
  const [detailDueOpen, setDetailDueOpen] = useState(false);

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`/api/tasks?project=${projectId}`);
      if (res.data.success) {
        setTasks(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load Kanban tasks:', err.message);
    }
  };

  const fetchProjectMembers = async () => {
    try {
      const res = await axios.get(`/api/projects/${projectId}`);
      if (res.data.success) {
        setProjectMembers(res.data.data.members || []);
      }
    } catch (err) {
      console.error('Failed to fetch project members list:', err.message);
    }
  };

  useEffect(() => {
    const initBoard = async () => {
      setLoading(true);
      await Promise.all([fetchTasks(), fetchProjectMembers()]);
      setLoading(false);
    };
    initBoard();
  }, [projectId]);

  // Socket listening for task moves
  useEffect(() => {
    if (!socket) return;

    socket.on('task-moved', ({ taskId, status, order }) => {
      setTasks((prevTasks) => {
        return prevTasks.map((t) => (t._id === taskId ? { ...t, status } : t));
      });
    });

    return () => {
      socket.off('task-moved');
    };
  }, [socket]);

  const getAssigneeInitials = (assignee) => {
    if (!assignee) return null;
    if (typeof assignee === 'object' && assignee.name) {
      return assignee.name.charAt(0).toUpperCase();
    }
    if (typeof assignee === 'string') {
      const member = projectMembers.find(m => (m.user?._id || m.user) === assignee);
      if (member && member.user?.name) {
        return member.user.name.charAt(0).toUpperCase();
      }
    }
    return null;
  };

  // HTML5 Drag and Drop handlers
  const handleDragStart = (e, taskId, status) => {
    if (user?.role === 'Viewer') {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.setData('sourceStatus', status);
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    const sourceStatus = e.dataTransfer.getData('sourceStatus');

    if (sourceStatus === targetStatus) return;

    // Optimistically update frontend status state
    setTasks((prevTasks) => {
      return prevTasks.map((t) => (t._id === taskId ? { ...t, status: targetStatus } : t));
    });

    try {
      // Calculate order
      const targetCount = tasks.filter((t) => t.status === targetStatus).length;
      
      // Save changes to database
      await axios.patch(`/api/tasks/${taskId}/status`, {
        status: targetStatus,
        order: targetCount
      });

      // Emit real-time broadcast event
      if (socket) {
        socket.emit('task-move', {
          projectId,
          taskId,
          status: targetStatus,
          order: targetCount
        });
      }

      // If task is moved to Completed, trigger small confetti burst!
      if (targetStatus === 'Done') {
        confetti({
          particleCount: 50,
          spread: 45,
          origin: { y: 0.8 },
          colors: ['#10b981', '#34d399']
        });
      }
    } catch (err) {
      console.error('Failed to save task move:', err.message);
      // Revert in case of API failure
      fetchTasks();
    }
  };

  // Create Task
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskTitle) return;

    try {
      const res = await axios.post('/api/tasks', {
        title: taskTitle,
        description: taskDesc,
        status: createColumnId,
        priority: taskPriority,
        project: projectId,
        assignee: taskAssignee || null,
        dueDate: taskDueDate || null,
        startDate: taskStartDate || null
      });

      if (res.data.success) {
        setCreateModalOpen(false);
        setTaskTitle('');
        setTaskDesc('');
        setTaskPriority('Medium');
        setTaskAssignee('');
        setTaskDueDate('');
        setTaskStartDate('');
        fetchTasks();
      }
    } catch (err) {
      console.error('Failed to create task:', err.response?.data?.error || err.message);
    }
  };

  // Update Task detail card items
  const handleUpdateTaskDetail = async (updatedTask) => {
    try {
      const res = await axios.put(`/api/tasks/${updatedTask._id}`, updatedTask);
      if (res.data.success) {
        setActiveTask(res.data.data);
        fetchTasks();
      }
    } catch (err) {
      console.error('Failed to update task detail:', err.message);
    }
  };

  // Toggle Subtask check
  const handleToggleSubtask = (idx) => {
    if (user?.role === 'Viewer') return;
    const updatedSubtasks = [...activeTask.subtasks];
    updatedSubtasks[idx].isCompleted = !updatedSubtasks[idx].isCompleted;
    
    const updated = { ...activeTask, subtasks: updatedSubtasks };
    handleUpdateTaskDetail(updated);
  };

  // Add subtask
  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (!newSubtask || user?.role === 'Viewer') return;
    
    const updatedSubtasks = [...(activeTask.subtasks || []), { title: newSubtask, isCompleted: false }];
    const updated = { ...activeTask, subtasks: updatedSubtasks };
    setNewSubtask('');
    handleUpdateTaskDetail(updated);
  };

  // Add Comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText || user?.role === 'Viewer') return;

    try {
      const res = await axios.post(`/api/tasks/${activeTask._id}/comments`, {
        text: commentText
      });
      if (res.data.success) {
        setCommentText('');
        // Refresh details (re-fetch details and task lists)
        const updatedTask = res.data.data;
        setActiveTask(updatedTask);
        fetchTasks();
      }
    } catch (err) {
      console.error('Failed to post comment:', err.message);
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId) => {
    if (user?.role === 'Viewer') return;
    if (!(await confirm('Are you sure you want to delete this task?'))) return;

    try {
      const res = await axios.delete(`/api/tasks/${taskId}`);
      if (res.data.success) {
        setActiveTask(null);
        fetchTasks();
      }
    } catch (err) {
      console.error('Failed to delete task:', err.message);
    }
  };

  if (loading) {
    return <div className="h-96 rounded-2xl glass-panel animate-pulse"></div>;
  }

  const filteredTasks = priorityFilter === 'All'
    ? tasks
    : tasks.filter(t => t.priority === priorityFilter);

  return (
    <div className="space-y-6 animate-fade-in text-left">
      
      {/* Board Controls & Filters Subheader */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-850/80">
        <div>
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Ecosystem Sprint Board</h2>
          <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
            Manage, drag & drop, and track team velocity milestones ({filteredTasks.length} tasks shown)
          </p>
        </div>

        {/* Priority Filters */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-850 shrink-0">
          {['All', 'High', 'Medium', 'Low'].map((prio) => (
            <button
              key={prio}
              onClick={() => setPriorityFilter(prio)}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider transition cursor-pointer focus:outline-none ${
                priorityFilter === prio
                  ? 'bg-gradient-to-r from-[var(--gold-primary)] to-[var(--gold-secondary)] text-[var(--active-tab-text)] shadow-md font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              {prio} Priority
            </button>
          ))}
        </div>
      </div>

      {/* Task Board Matrix */}
      <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-270px)] overflow-x-auto pb-4 pr-2">
        {COLUMNS.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.id);
          
          return (
            <div
              key={col.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, col.id)}
              className="bg-slate-900/30 border border-slate-850/80 rounded-2xl p-4 flex flex-col min-h-[380px] md:h-full w-full md:w-80 md:shrink-0 transition-all duration-300 relative group"
            >
              {/* Dynamic top line divider with column accent color */}
              <div className={`absolute top-0 left-4 right-4 h-1 rounded-full ${
                col.id === 'Todo' ? 'bg-slate-500' :
                col.id === 'InProgress' ? 'bg-indigo-500' :
                col.id === 'Review' ? 'bg-amber-500' : 'bg-emerald-500'
              }`} />

              {/* Column Header */}
              <div className="flex justify-between items-center mb-4 mt-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    col.id === 'Todo' ? 'bg-slate-500' :
                    col.id === 'InProgress' ? 'bg-indigo-500 animate-pulse' :
                    col.id === 'Review' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`} />
                  <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-200">{col.title}</h3>
                  <span className="bg-slate-950/60 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-850">
                    {colTasks.length}
                  </span>
                </div>
                
                {user?.role !== 'Viewer' && (
                  <button
                    onClick={() => {
                      setCreateColumnId(col.id);
                      setCreateModalOpen(true);
                    }}
                    className="p-1 text-slate-400 hover:bg-slate-900 rounded-lg hover:text-[var(--gold-primary)] transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Task Cards Stack */}
              <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                {colTasks.length === 0 ? (
                  <div className="h-full border border-dashed border-slate-850 rounded-xl flex flex-col items-center justify-center p-6 text-center transition min-h-[160px]">
                    {user?.role !== 'Viewer' && (
                      <Plus 
                        className="w-5 h-5 text-slate-650 mb-2 cursor-pointer hover:scale-110 hover:text-[var(--gold-primary)] transition" 
                        onClick={() => {
                          setCreateColumnId(col.id);
                          setCreateModalOpen(true);
                        }} 
                      />
                    )}
                    <span className="text-[10px] text-slate-600 font-bold tracking-wider uppercase">Drag Tasks Here</span>
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const completedSubtasks = task.subtasks?.filter(s => s.isCompleted).length || 0;
                    const totalSubtasks = task.subtasks?.length || 0;
                    const initials = getAssigneeInitials(task.assignee);
                    
                    return (
                      <div
                        key={task._id}
                        draggable={user?.role !== 'Viewer'}
                        onDragStart={(e) => handleDragStart(e, task._id, task.status)}
                        onClick={() => {
                          setActiveTask(task);
                        }}
                        className="bg-slate-900/60 hover:bg-slate-900/90 border border-slate-850 hover:border-slate-700/60 rounded-xl p-4 cursor-pointer hover:shadow-lg transition select-none flex flex-col gap-2.5 group relative"
                      >
                        {/* Priority Badge */}
                        <div className="flex justify-between items-center">
                          <span
                            className={`text-[8px] uppercase font-extrabold tracking-wider px-1.5 py-0.5 rounded-md border ${
                              task.priority === 'High'
                                ? 'bg-rose-500/10 text-rose-450 border-rose-500/20'
                                : task.priority === 'Medium'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-450 border-emerald-500/20'
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-white group-hover:text-[var(--gold-primary)] transition leading-snug">
                          {task.title}
                        </h4>

                        {task.description && (
                          <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed font-medium">
                            {task.description}
                          </p>
                        )}

                        {/* Card footer details */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-950/60 mt-1 text-[10px] text-slate-500 font-medium">
                          <div className="flex items-center gap-2">
                            {totalSubtasks > 0 && (
                              <div className="flex items-center gap-0.5 text-slate-400 font-bold">
                                <CheckSquare className="w-3 h-3 text-emerald-400 shrink-0" />
                                <span>{completedSubtasks}/{totalSubtasks}</span>
                              </div>
                            )}

                            {task.comments?.length > 0 && (
                              <div className="flex items-center gap-0.5 text-slate-400">
                                <MessageSquare className="w-3 h-3 shrink-0" />
                                <span>{task.comments.length}</span>
                              </div>
                            )}

                            <div className="flex items-center gap-1.5">
                              {task.dueDate && (
                                <div className="flex items-center gap-0.5 text-slate-400" title={`Due: ${new Date(task.dueDate).toLocaleDateString()}`}>
                                  <Calendar className="w-3 h-3 text-indigo-400 shrink-0" />
                                  <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Assignee Avatar */}
                          {initials ? (
                            <div 
                              className="w-5 h-5 rounded-full bg-[var(--gold-glow)] border border-[var(--gold-primary)]/20 text-[var(--gold-primary)] font-extrabold text-[8px] flex items-center justify-center shrink-0 uppercase tracking-normal"
                              title={`Assigned to: ${typeof task.assignee === 'object' ? task.assignee.name : (projectMembers.find(m => (m.user?._id || m.user) === task.assignee)?.user?.name || 'Team Member')}`}
                            >
                              {initials}
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-slate-950 border border-slate-850 flex items-center justify-center shrink-0 text-slate-500">
                              <User className="w-3 h-3" />
                            </div>
                          )}

                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 1. Create Task Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 border border-slate-800 animate-slide-up shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Create Kanban Task</h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-500 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Build API Route guards"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-slate-100 text-sm focus:border-[var(--gold-primary)] focus:ring-1 focus:ring-[var(--gold-glow)] transition"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Description</label>
                <textarea
                  rows="3"
                  placeholder="Describe task actions..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-slate-100 text-sm focus:border-[var(--gold-primary)] focus:ring-1 focus:ring-[var(--gold-glow)] transition resize-none"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Priority</label>
                  <button
                    type="button"
                    onClick={() => setPriorityDropdownOpen(!priorityDropdownOpen)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-slate-100 text-sm focus:border-[var(--gold-primary)] transition flex items-center justify-between text-left h-[42px] cursor-pointer"
                  >
                    <span>{taskPriority}</span>
                    <span className="text-slate-500 font-extrabold text-[10px] shrink-0">&darr;</span>
                  </button>
                  {priorityDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setPriorityDropdownOpen(false)} />
                      <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 animate-fade-in text-xs space-y-1">
                        {['Low', 'Medium', 'High'].map((prio) => (
                          <button
                            key={prio}
                            type="button"
                            onClick={() => {
                              setTaskPriority(prio);
                              setPriorityDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                              taskPriority === prio
                                ? 'bg-gradient-to-r from-[var(--gold-primary)] to-[var(--gold-secondary)] text-[var(--active-tab-text)] font-bold'
                                : 'text-slate-350 hover:bg-slate-850 hover:text-white'
                            }`}
                          >
                            {prio}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <div className="relative">
                  <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Assignee</label>
                  <button
                    type="button"
                    onClick={() => setAssigneeDropdownOpen(!assigneeDropdownOpen)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-slate-100 text-sm focus:border-[var(--gold-primary)] transition flex items-center justify-between text-left h-[42px] cursor-pointer"
                  >
                    <span className="truncate">
                      {taskAssignee 
                        ? projectMembers.find((m) => (m.user?._id || m.user) === taskAssignee)?.user?.name || 'Assigned User' 
                        : 'Unassigned'}
                    </span>
                    <span className="text-slate-500 font-extrabold text-[10px] shrink-0">&darr;</span>
                  </button>
                  {assigneeDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setAssigneeDropdownOpen(false)} />
                      <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 animate-fade-in text-xs max-h-48 overflow-y-auto space-y-1">
                        <button
                          type="button"
                          onClick={() => {
                            setTaskAssignee('');
                            setAssigneeDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                            !taskAssignee
                              ? 'bg-gradient-to-r from-[var(--gold-primary)] to-[var(--gold-secondary)] text-[var(--active-tab-text)] font-bold'
                              : 'text-slate-350 hover:bg-slate-850 hover:text-white'
                          }`}
                        >
                          Unassigned
                        </button>
                        {projectMembers.map((m) => {
                          const mId = m.user?._id || m.user;
                          const mName = m.user?.name || 'Unknown User';
                          const isAssigned = taskAssignee === mId;

                          return (
                            <button
                              key={mId}
                              type="button"
                              onClick={() => {
                                setTaskAssignee(mId);
                                setAssigneeDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                                isAssigned
                                  ? 'bg-gradient-to-r from-[var(--gold-primary)] to-[var(--gold-secondary)] text-[var(--active-tab-text)] font-bold'
                                  : 'text-slate-350 hover:bg-slate-850 hover:text-white'
                              }`}
                            >
                              {mName}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Start Date</label>
                  <button
                    type="button"
                    onClick={() => setStartDatePickerOpen(!startDatePickerOpen)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-slate-100 text-sm focus:border-[var(--gold-primary)] transition flex items-center justify-between text-left h-[42px]"
                  >
                    <span className={taskStartDate ? 'text-slate-100' : 'text-slate-500'}>
                      {taskStartDate ? new Date(taskStartDate).toLocaleDateString() : 'Select date'}
                    </span>
                    <Calendar className="w-4 h-4 text-slate-450 shrink-0" />
                  </button>
                  {startDatePickerOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setStartDatePickerOpen(false)} />
                      <div className="absolute top-full left-0 mt-2 z-50">
                        <CalendarPicker
                          value={taskStartDate}
                          onChange={(date) => setTaskStartDate(date)}
                          onClose={() => setStartDatePickerOpen(false)}
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="relative">
                  <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Due Date</label>
                  <button
                    type="button"
                    onClick={() => setDueDatePickerOpen(!dueDatePickerOpen)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-slate-100 text-sm focus:border-[var(--gold-primary)] transition flex items-center justify-between text-left h-[42px]"
                  >
                    <span className={taskDueDate ? 'text-slate-100' : 'text-slate-500'}>
                      {taskDueDate ? new Date(taskDueDate).toLocaleDateString() : 'Select date'}
                    </span>
                    <Calendar className="w-4 h-4 text-slate-450 shrink-0" />
                  </button>
                  {dueDatePickerOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setDueDatePickerOpen(false)} />
                      <div className="absolute top-full left-0 mt-2 z-50">
                        <CalendarPicker
                          value={taskDueDate}
                          onChange={(date) => setTaskDueDate(date)}
                          onClose={() => setDueDatePickerOpen(false)}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:bg-slate-900 transition text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-gold-grad px-5 py-2.5 rounded-xl font-semibold text-sm transition"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Task Details Modal (Checklist, comments, delete) */}
      {activeTask && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-2xl rounded-2xl p-6 border border-slate-800 animate-slide-up shadow-2xl flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-[9px] uppercase font-extrabold tracking-widest px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {activeTask.status}
                </span>
                <h3 className="text-lg font-bold text-white mt-2 font-sans">{activeTask.title}</h3>
              </div>
              
              <div className="flex items-center gap-3">
                {user?.role !== 'Viewer' && (
                  <button
                    onClick={() => handleDeleteTask(activeTask._id)}
                    className="p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition"
                    title="Delete Task"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => setActiveTask(null)} className="text-slate-500 hover:text-white transition">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>            {/* Modal Body (Scrollable contents) */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-2 mb-4">
              
              {/* Meta Grid (Assignee, Priority, Start/Due Date Editors) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-950/30 rounded-xl border border-slate-900 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold block mb-1">Assignee</span>
                  <span className="text-slate-200">
                    {activeTask.assignee?.name || 
                      (typeof activeTask.assignee === 'string' && projectMembers.find(m => (m.user?._id || m.user) === activeTask.assignee)?.user?.name) || 
                      'Unassigned'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block mb-1">Priority</span>
                  <span className={`font-semibold ${
                    activeTask.priority === 'High' ? 'text-red-400' :
                    activeTask.priority === 'Medium' ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {activeTask.priority}
                  </span>
                </div>
                <div className="relative">
                  <span className="text-slate-400 font-semibold block mb-1">Start Date</span>
                  {user?.role === 'Viewer' ? (
                    <span className="text-slate-200">
                      {activeTask.startDate ? new Date(activeTask.startDate).toLocaleDateString() : 'Not set'}
                    </span>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setDetailStartOpen(!detailStartOpen)}
                        className="flex items-center gap-1.5 bg-transparent text-slate-200 hover:text-white transition-colors py-0.5 px-1 border-b border-dashed border-slate-700 hover:border-[var(--gold-primary)]"
                      >
                        <Calendar className="w-3.5 h-3.5 text-slate-450 shrink-0" />
                        <span>
                          {activeTask.startDate ? new Date(activeTask.startDate).toLocaleDateString() : 'Set start date'}
                        </span>
                      </button>
                      {detailStartOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setDetailStartOpen(false)} />
                          <div className="absolute top-full left-0 mt-2 z-50">
                            <CalendarPicker
                              value={activeTask.startDate}
                              onChange={(date) => {
                                const updated = { ...activeTask, startDate: date || null };
                                handleUpdateTaskDetail(updated);
                              }}
                              onClose={() => setDetailStartOpen(false)}
                            />
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
                <div className="relative">
                  <span className="text-slate-400 font-semibold block mb-1">Due Date</span>
                  {user?.role === 'Viewer' ? (
                    <span className="text-slate-200">
                      {activeTask.dueDate ? new Date(activeTask.dueDate).toLocaleDateString() : 'Not set'}
                    </span>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setDetailDueOpen(!detailDueOpen)}
                        className="flex items-center gap-1.5 bg-transparent text-slate-200 hover:text-white transition-colors py-0.5 px-1 border-b border-dashed border-slate-700 hover:border-[var(--gold-primary)]"
                      >
                        <Calendar className="w-3.5 h-3.5 text-slate-450 shrink-0" />
                        <span>
                          {activeTask.dueDate ? new Date(activeTask.dueDate).toLocaleDateString() : 'Set due date'}
                        </span>
                      </button>
                      {detailDueOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setDetailDueOpen(false)} />
                          <div className="absolute top-full left-0 mt-2 z-50">
                            <CalendarPicker
                              value={activeTask.dueDate}
                              onChange={(date) => {
                                const updated = { ...activeTask, dueDate: date || null };
                                handleUpdateTaskDetail(updated);
                              }}
                              onClose={() => setDetailDueOpen(false)}
                            />
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>

              {activeTask.description && (
                <div>
                  <h4 className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">Description</h4>
                  <p className="text-xs text-slate-350 leading-relaxed bg-slate-950/50 p-3.5 rounded-xl border border-slate-900">
                    {activeTask.description}
                  </p>
                </div>
              )}

              {/* Subtask Checklist Section */}
              <div>
                <h4 className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">Subtasks Checklist</h4>
                <div className="space-y-3 mb-4">
                  {(!activeTask.subtasks || activeTask.subtasks.length === 0) ? (
                    <p className="text-slate-600 text-xs italic">No checklist subtasks declared.</p>
                  ) : (
                    activeTask.subtasks.map((sub, idx) => (
                      <div key={idx} className="bg-slate-950/50 border border-slate-900 rounded-xl p-3.5 space-y-3">
                        {/* Subtask main row */}
                        <div className="flex items-center justify-between">
                          <div
                            onClick={() => handleToggleSubtask(idx)}
                            className="flex items-center gap-3 cursor-pointer select-none"
                          >
                            <div className={`w-4.5 h-4.5 rounded-md flex items-center justify-center border transition ${
                              sub.isCompleted ? 'bg-emerald-500 border-emerald-500 text-[var(--bg-950)]' : 'border-slate-700'
                            }`}>
                              {sub.isCompleted && <Check className="w-3 h-3 text-[var(--bg-950)]" strokeWidth={3} />}
                            </div>
                            <span className={`text-xs font-semibold ${sub.isCompleted ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                              {sub.title}
                            </span>
                          </div>

                          {/* Delete subtask action */}
                          {user?.role !== 'Viewer' && (
                            <button
                              type="button"
                              onClick={() => {
                                const updatedSubtasks = activeTask.subtasks.filter((_, sIdx) => sIdx !== idx);
                                handleUpdateTaskDetail({ ...activeTask, subtasks: updatedSubtasks });
                              }}
                              className="text-slate-600 hover:text-red-400 p-1 rounded transition"
                              title="Delete subtask"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Nested Sub-subtasks section */}
                        <div className="pl-6 space-y-2.5 border-l border-slate-800 ml-2">
                          {sub.subsubtasks?.map((subsub, ssIdx) => (
                            <div
                              key={ssIdx}
                              className="flex items-center justify-between text-[11px]"
                            >
                              <div
                                onClick={() => {
                                  if (user?.role === 'Viewer') return;
                                  const updatedSubsub = [...(sub.subsubtasks || [])];
                                  updatedSubsub[ssIdx].isCompleted = !updatedSubsub[ssIdx].isCompleted;
                                  
                                  const updatedSub = [...activeTask.subtasks];
                                  updatedSub[idx].subsubtasks = updatedSubsub;
                                  
                                  handleUpdateTaskDetail({ ...activeTask, subtasks: updatedSub });
                                }}
                                className="flex items-center gap-2.5 cursor-pointer select-none"
                              >
                                <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition ${
                                  subsub.isCompleted ? 'bg-indigo-500 border-indigo-500 text-[var(--bg-950)]' : 'border-slate-800'
                                }`}>
                                  {subsub.isCompleted && <Check className="w-2.5 h-2.5 text-[var(--bg-950)]" strokeWidth={3.5} />}
                                </div>
                                <span className={subsub.isCompleted ? 'text-slate-500 line-through' : 'text-slate-350'}>
                                  {subsub.title}
                                </span>
                              </div>

                              {/* Delete subsubtask button */}
                              {user?.role !== 'Viewer' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updatedSubsub = sub.subsubtasks.filter((_, ss) => ss !== ssIdx);
                                    const updatedSub = [...activeTask.subtasks];
                                    updatedSub[idx].subsubtasks = updatedSubsub;
                                    handleUpdateTaskDetail({ ...activeTask, subtasks: updatedSub });
                                  }}
                                  className="text-slate-600 hover:text-red-400 p-0.5 transition"
                                  title="Delete sub-subtask"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          ))}

                          {/* Add sub-subtask inline input */}
                          {user?.role !== 'Viewer' && (
                            <div className="flex gap-2 pt-0.5">
                              <input
                                type="text"
                                placeholder="Add sub-subtask..."
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const titleVal = e.target.value.trim();
                                    if (!titleVal) return;
                                    
                                    const updatedSubsub = [...(sub.subsubtasks || []), { title: titleVal, isCompleted: false }];
                                    const updatedSub = [...activeTask.subtasks];
                                    updatedSub[idx].subsubtasks = updatedSubsub;
                                    
                                    e.target.value = '';
                                    handleUpdateTaskDetail({ ...activeTask, subtasks: updatedSub });
                                  }
                                }}
                                className="flex-1 bg-transparent border-b border-slate-900 hover:border-slate-800 focus:border-indigo-500 focus:outline-none text-[11px] text-slate-300 placeholder-slate-650 py-0.5 px-1 transition"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {user?.role !== 'Viewer' && (
                  <form onSubmit={handleAddSubtask} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add a checklist item..."
                      value={newSubtask}
                      onChange={(e) => setNewSubtask(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-900 rounded-xl py-2 px-3 text-xs text-slate-100 placeholder-slate-600 focus:border-[var(--gold-primary)] transition"
                    />
                    <button
                      type="submit"
                      className="bg-slate-900 border border-slate-800 text-slate-300 hover:text-white px-3.5 rounded-xl text-xs font-semibold hover:bg-slate-800 transition"
                    >
                      Add
                    </button>
                  </form>
                )}
              </div>

              {/* Task Comments Section */}
              <div>
                <h4 className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-3">Comments Log ({activeTask.comments?.length || 0})</h4>
                
                <div className="space-y-3 mb-4 max-h-48 overflow-y-auto pr-1">
                  {(!activeTask.comments || activeTask.comments.length === 0) ? (
                    <p className="text-slate-600 text-xs italic py-2">No comments posted yet.</p>
                  ) : (
                    activeTask.comments.map((c) => (
                      <div key={c._id} className="bg-slate-950/30 border border-slate-900/60 p-3 rounded-xl flex gap-3 items-start">
                        <div className="bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-slate-500 rounded border border-slate-800">
                          {c.user?.name ? c.user.name.charAt(0) : 'U'}
                        </div>
                        <div className="flex-1 text-[11px]">
                          <div className="flex justify-between items-center text-slate-400 mb-1">
                            <span className="font-semibold text-slate-300">{c.user?.name || 'Team member'}</span>
                            <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-slate-200">{c.text}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {user?.role !== 'Viewer' && (
                  <form onSubmit={handleAddComment} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Write a comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-900 rounded-xl py-2 px-3 text-xs text-slate-100 placeholder-slate-600 focus:border-[var(--gold-primary)] transition"
                    />
                    <button
                      type="submit"
                      className="btn-gold-grad px-4 rounded-xl text-xs font-semibold transition"
                    >
                      Post
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
