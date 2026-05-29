import React, { useState } from 'react';
import axios from 'axios';
import { Sparkles, Plus, Check, Send, Lightbulb, Rocket, Settings, AlertTriangle } from 'lucide-react';

export default function Ideator({ projectId, onTaskAdded }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState([]);
  const [addedIndexes, setAddedIndexes] = useState({});
  const [error, setError] = useState(null);

  const PRESETS = [
    { text: 'Develop launch & marketing roadmap', icon: Rocket },
    { text: 'Detail technical architecture & setup', icon: Settings },
    { text: 'Identify project risk factors & mitigations', icon: AlertTriangle }
  ];

  const handleBrainstorm = async (customPrompt) => {
    const finalPrompt = customPrompt || prompt;
    if (!finalPrompt.trim()) return;

    setLoading(true);
    setError(null);
    setIdeas([]);
    setAddedIndexes({});
    
    try {
      const res = await axios.post('/api/ai/generate', {
        projectId,
        prompt: finalPrompt
      });

      if (res.data.success) {
        setIdeas(res.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'AI generation timed out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToKanban = async (idea, index) => {
    try {
      const finalDescription = `[${idea.category || 'AI Idea'}] ${idea.description}`;
      const res = await axios.post('/api/tasks', {
        title: idea.title,
        description: finalDescription,
        status: 'Todo',
        priority: ['Low', 'Medium', 'High'].includes(idea.priority) ? idea.priority : 'Medium',
        project: projectId
      });

      if (res.data.success) {
        setAddedIndexes(prev => ({ ...prev, [index]: true }));
        if (onTaskAdded) {
          onTaskAdded(); // Triggers kanban/dashboard refresh
        }
      }
    } catch (err) {
      console.error('Failed to create task from idea:', err);
    }
  };

  return (
    <div className="space-y-6 scrollbar-thin">
      
      {/* Search/Brainstorm Card */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -z-10" />
        
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
            <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">AI Ideas Brainstorming</h2>
            <p className="text-xs text-slate-400 mt-0.5">Let Gemini analyze your project scope and generate structured, actionable tasks.</p>
          </div>
        </div>

        {/* Shortcut Pills */}
        <div className="flex flex-wrap gap-2 mb-4">
          {PRESETS.map((preset, idx) => {
            const Icon = preset.icon;
            return (
              <button
                key={idx}
                onClick={() => {
                  setPrompt(preset.text);
                  handleBrainstorm(preset.text);
                }}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950/40 hover:bg-slate-800/60 border border-slate-850 hover:border-slate-800 rounded-xl text-xs text-slate-350 transition-all focus:outline-none"
              >
                <Icon className="w-3.5 h-3.5 text-indigo-400" />
                <span>{preset.text}</span>
              </button>
            );
          })}
        </div>

        {/* Input Form */}
        <div className="flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask Gemini to generate tasks (e.g. 'Brainstorm security protocols' or 'Outline design guidelines')..."
            className="flex-1 bg-slate-950/70 border border-slate-850 hover:border-slate-800 focus:border-indigo-500/80 text-slate-100 placeholder-slate-650 rounded-xl px-4 py-2.5 text-xs focus:outline-none transition-all focus:ring-1 focus:ring-indigo-500/30"
            onKeyDown={(e) => e.key === 'Enter' && handleBrainstorm()}
            disabled={loading}
          />
          <button
            onClick={() => handleBrainstorm()}
            disabled={loading || !prompt.trim()}
            className="bg-indigo-650 hover:bg-indigo-600 disabled:bg-slate-850 text-white px-5 rounded-xl text-xs font-semibold shadow-[0_0_15px_rgba(99,102,241,0.2)] disabled:shadow-none hover:shadow-[0_0_20px_rgba(99,102,241,0.35)] transition-all flex items-center justify-center gap-1.5 shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Generate</span>
          </button>
        </div>

        {error && <p className="text-xs text-rose-400 mt-3">{error}</p>}
      </div>

      {/* Loading Placeholder */}
      {loading && (
        <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800/60 flex flex-col items-center justify-center text-center space-y-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            <Sparkles className="w-5 h-5 text-indigo-400 absolute inset-0 m-auto animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-200">Consulting AI Knowledgebase</h4>
            <p className="text-xs text-slate-500 mt-1">Generating structure cards, setting categories and mapping priority indexes...</p>
          </div>
        </div>
      )}

      {/* Ideas Card Output Grid */}
      {ideas.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ideas.map((idea, index) => {
            const isAdded = addedIndexes[index];
            
            // Priority styles
            let priorityBadge = 'text-blue-400 bg-blue-500/10 border-blue-500/20';
            if (idea.priority === 'High') {
              priorityBadge = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
            } else if (idea.priority === 'Medium') {
              priorityBadge = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            }

            return (
              <div 
                key={index} 
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md hover:border-slate-700/80 transition-all flex flex-col justify-between shadow-lg relative group overflow-hidden"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <span className="text-[10px] px-2 py-0.5 rounded-full border border-slate-750 bg-slate-850 text-slate-350 font-semibold uppercase tracking-wider">
                      {idea.category || 'General'}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${priorityBadge} font-semibold uppercase tracking-wider`}>
                      {idea.priority || 'Medium'} Priority
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-100 group-hover:text-indigo-400 transition-colors leading-snug">{idea.title}</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">{idea.description}</p>
                </div>

                <div className="mt-5 border-t border-slate-850 pt-3 flex justify-end">
                  {isAdded ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/25">
                      <Check className="w-3.5 h-3.5" /> Added to Kanban
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAddToKanban(idea, index)}
                      className="inline-flex items-center gap-1.5 text-xs text-slate-300 font-semibold hover:text-slate-100 bg-slate-950/60 hover:bg-indigo-650 px-3 py-1.5 rounded-xl border border-slate-800 hover:border-indigo-600 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Task
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && ideas.length === 0 && (
        <div className="p-10 rounded-2xl bg-slate-900/40 border border-slate-800/60 flex flex-col items-center justify-center text-center">
          <Lightbulb className="w-12 h-12 text-slate-700 mb-3" />
          <h3 className="text-slate-300 font-medium mb-1">Need project ideas?</h3>
          <p className="text-xs text-slate-500 max-w-sm">Enter a brainstorming query above or click a prompt shortcut to populate initial tasks.</p>
        </div>
      )}

    </div>
  );
}
