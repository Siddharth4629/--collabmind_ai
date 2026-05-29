import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { Plus, User, Calendar, CheckSquare, MessageSquare, AlertCircle, X, Check, Trash } from 'lucide-react';
import confetti from 'canvas-confetti';

const COLUMNS = [
  { id: 'Todo', title: 'To Do', color: 'border-t-slate-500 bg-slate-900/40' },
  { id: 'InProgress', title: 'In Progress', color: 'border-t-blue-500 bg-blue-950/10' },
  { id: 'Review', title: 'In Review', color: 'border-t-amber-500 bg-amber-950/10' },
  { id: 'Done', title: 'Completed', color: 'border-t-emerald-500 bg-emerald-950/10' }
];

export default function Board({ projectId }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [tasks, setTasks] = useState([]);
  const [projectMembers, setProjectMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Task creation
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createColumnId, setCreateColumnId] = useState('Todo');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');

  // Task detail card popup
  const [activeTask, setActiveTask] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [newSubtask, setNewSubtask] = useState('');

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
        dueDate: taskDueDate || null
      });

      if (res.data.success) {
        setCreateModalOpen(false);
        setTaskTitle('');
        setTaskDesc('');
        setTaskPriority('Medium');
        setTaskAssignee('');
        setTaskDueDate('');
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
    if (!window.confirm('Are you sure you want to delete this task?')) return;

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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Task Board Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[calc(100vh-250px)] overflow-y-auto pr-2">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          
          return (
            <div
              key={col.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`rounded-2xl border-t-4 ${col.color} p-4 flex flex-col min-h-[350px] border border-slate-900`}
            >
              {/* Column Header */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white font-sans">{col.title}</h3>
                  <span className="bg-slate-950/60 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-800">
                    {colTasks.length}
                  </span>
                </div>
                
                {user?.role !== 'Viewer' && (
                  <button
                    onClick={() => {
                      setCreateColumnId(col.id);
                      setCreateModalOpen(true);
                    }}
                    className="p-1 text-slate-400 hover:bg-slate-900 rounded-lg hover:text-white transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Task Cards Stack */}
              <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                {colTasks.length === 0 ? (
                  <div className="h-full border border-dashed border-slate-900 rounded-xl flex items-center justify-center p-6 text-center">
                    <span className="text-[10px] text-slate-600 font-semibold tracking-wider uppercase">Drag Tasks Here</span>
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const completedSubtasks = task.subtasks?.filter(s => s.isCompleted).length || 0;
                    const totalSubtasks = task.subtasks?.length || 0;
                    
                    return (
                      <div
                        key={task._id}
                        draggable={user?.role !== 'Viewer'}
                        onDragStart={(e) => handleDragStart(e, task._id, task.status)}
                        onClick={() => {
                          // Find local populated task for modal detail view
                          setActiveTask(task);
                        }}
                        className="glass-panel hover:border-slate-700/60 rounded-xl p-4 cursor-pointer hover:shadow-lg transition select-none flex flex-col gap-3 group relative"
                      >
                        {/* Priority Badge */}
                        <div className="flex justify-between items-center">
                          <span
                            className={`text-[9px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-md border ${
                              task.priority === 'High'
                                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                : task.priority === 'Medium'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-white group-hover:text-emerald-400 transition leading-tight">
                          {task.title}
                        </h4>

                        {task.description && (
                          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                            {task.description}
                          </p>
                        )}

                        {/* Card footer details */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-950 mt-1 text-[10px] text-slate-500">
                          <div className="flex items-center gap-2.5">
                            {totalSubtasks > 0 && (
                              <div className="flex items-center gap-1 text-slate-400 font-medium">
                                <CheckSquare className="w-3 h-3 text-emerald-400" />
                                <span>{completedSubtasks}/{totalSubtasks}</span>
                              </div>
                            )}

                            {task.comments?.length > 0 && (
                              <div className="flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" />
                                <span>{task.comments.length}</span>
                              </div>
                            )}
                          </div>

                          {task.dueDate && (
                            <div className="flex items-center gap-1 text-slate-400">
                              <Calendar className="w-3 h-3 text-slate-500" />
                              <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-slate-100 text-sm focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Description</label>
                <textarea
                  rows="3"
                  placeholder="Describe task actions..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-slate-100 text-sm focus:border-emerald-500 transition resize-none"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-slate-100 text-sm focus:border-emerald-500 transition"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Assignee</label>
                  <select
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-slate-100 text-sm focus:border-emerald-500 transition"
                  >
                    <option value="">Unassigned</option>
                    {projectMembers.map((m) => (
                      <option key={m.user?._id || m.user} value={m.user?._id || m.user}>
                        {m.user?.name || 'Unknown User'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Due Date</label>
                <input
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-slate-100 text-sm focus:border-emerald-500 transition"
                />
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
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-905 px-5 py-2.5 rounded-xl font-semibold text-sm transition"
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
            </div>

            {/* Modal Body (Scrollable contents) */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-2 mb-4">
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
                <div className="space-y-2 mb-3">
                  {(!activeTask.subtasks || activeTask.subtasks.length === 0) ? (
                    <p className="text-slate-600 text-xs italic">No checklist subtasks declared.</p>
                  ) : (
                    activeTask.subtasks.map((sub, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleToggleSubtask(idx)}
                        className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs cursor-pointer select-none transition ${
                          sub.isCompleted
                            ? 'bg-emerald-500/5 border-emerald-500/10 text-slate-400 line-through'
                            : 'bg-slate-950/50 border-slate-900 text-slate-200 hover:border-slate-800'
                        }`}
                      >
                        <div className={`w-4.5 h-4.5 rounded-md flex items-center justify-center border transition ${
                          sub.isCompleted ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'border-slate-700'
                        }`}>
                          {sub.isCompleted && <Check className="w-3 h-3" strokeWidth={3} />}
                        </div>
                        <span>{sub.title}</span>
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
                      className="flex-1 bg-slate-950 border border-slate-900 rounded-xl py-2 px-3 text-xs text-slate-100 placeholder-slate-600 focus:border-emerald-500 transition"
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
                      className="flex-1 bg-slate-950 border border-slate-900 rounded-xl py-2 px-3 text-xs text-slate-100 placeholder-slate-600 focus:border-emerald-500 transition"
                    />
                    <button
                      type="submit"
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-905 px-4 rounded-xl text-xs font-semibold transition"
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
