import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { 
  FileText, Plus, Save, Trash2, History, X, Sparkles, Check, FileCode, RotateCcw
} from 'lucide-react';

export default function Editor({ projectId }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeEditor, setActiveEditor] = useState(null); // Tracks who else is editing
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [noteDetails, setNoteDetails] = useState(null); // Detailed note with versions
  const [compareVersion, setCompareVersion] = useState(null); // Version object to compare
  const [diffView, setDiffView] = useState(false);
  const [isPreview, setIsPreview] = useState(false);

  const saveTimeoutRef = useRef(null);

  // Load all project notes
  const fetchNotes = async (selectId = null) => {
    try {
      const res = await axios.get(`/api/notes?project=${projectId}`);
      if (res.data.success) {
        setNotes(res.data.data);
        if (res.data.data.length > 0) {
          // If a specific ID is requested, select it. Otherwise select the first note.
          const noteToSelect = selectId 
            ? res.data.data.find(n => n._id === selectId) 
            : res.data.data[0];
          
          handleSelectNote(noteToSelect || res.data.data[0]);
        } else {
          setSelectedNote(null);
          setNoteTitle('');
          setNoteContent('');
        }
      }
    } catch (err) {
      console.error('Error loading notes:', err);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchNotes();
    }
  }, [projectId]);

  // Listen to socket note updates
  useEffect(() => {
    if (!socket) return;

    const handleNoteUpdated = ({ noteId, content, title, editorName }) => {
      if (selectedNote && selectedNote._id === noteId) {
        if (content !== undefined) setNoteContent(content);
        if (title !== undefined) setNoteTitle(title);
        setActiveEditor(editorName);
        
        // Clear active editor notice after 2 seconds
        setTimeout(() => {
          setActiveEditor(null);
        }, 2000);
      }
      
      // Update the title/content in the list too
      setNotes((prev) =>
        prev.map((n) => (n._id === noteId ? { ...n, title, content } : n))
      );
    };

    socket.on('note-updated', handleNoteUpdated);

    return () => {
      socket.off('note-updated', handleNoteUpdated);
    };
  }, [socket, selectedNote]);

  const handleSelectNote = async (note) => {
    setSelectedNote(note);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setShowHistory(false);
    setCompareVersion(null);
    setDiffView(false);
    
    // Fetch details to get versions list
    try {
      setHistoryLoading(true);
      const res = await axios.get(`/api/notes/${note._id}`);
      if (res.data.success) {
        setNoteDetails(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching note details:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleCreateNote = async () => {
    try {
      const res = await axios.post('/api/notes', {
        title: 'Untitled Note',
        content: '',
        project: projectId
      });
      if (res.data.success) {
        await fetchNotes(res.data.data._id);
      }
    } catch (err) {
      console.error('Error creating note:', err);
    }
  };

  const saveNote = async (overrideContent, overrideTitle) => {
    if (!selectedNote) return;
    setSaving(true);
    try {
      const finalTitle = overrideTitle !== undefined ? overrideTitle : noteTitle;
      const finalContent = overrideContent !== undefined ? overrideContent : noteContent;

      const res = await axios.put(`/api/notes/${selectedNote._id}`, {
        title: finalTitle,
        content: finalContent
      });

      if (res.data.success) {
        // Update list
        setNotes((prev) =>
          prev.map((n) => (n._id === selectedNote._id ? res.data.data : n))
        );
        // Refresh details (specifically the versions list)
        const detailsRes = await axios.get(`/api/notes/${selectedNote._id}`);
        if (detailsRes.data.success) {
          setNoteDetails(detailsRes.data.data);
        }
      }
    } catch (err) {
      console.error('Error saving note:', err);
    } finally {
      setSaving(false);
    }
  };

  // Auto-save logic
  const handleContentChange = (e) => {
    const val = e.target.value;
    setNoteContent(val);

    // Broadcast edit via socket
    if (socket && selectedNote) {
      socket.emit('note-edit', {
        projectId,
        noteId: selectedNote._id,
        content: val,
        title: noteTitle,
        editorName: user.name
      });
    }

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveNote(val, undefined);
    }, 1000);
  };

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setNoteTitle(val);

    // Broadcast edit via socket
    if (socket && selectedNote) {
      socket.emit('note-edit', {
        projectId,
        noteId: selectedNote._id,
        content: noteContent,
        title: val,
        editorName: user.name
      });
    }

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveNote(undefined, val);
    }, 1000);
  };

  const handleDeleteNote = async () => {
    if (!selectedNote || !window.confirm(`Are you sure you want to delete "${noteTitle}"?`)) return;

    try {
      const res = await axios.delete(`/api/notes/${selectedNote._id}`);
      if (res.data.success) {
        fetchNotes();
      }
    } catch (err) {
      console.error('Error deleting note:', err);
    }
  };

  // Simple custom line-by-line diff algorithm
  const computeDiff = (oldText, newText) => {
    const oldLines = (oldText || '').split('\n');
    const newLines = (newText || '').split('\n');
    const diff = [];
    
    let i = 0;
    let j = 0;
    
    while (i < oldLines.length || j < newLines.length) {
      if (i < oldLines.length && j < newLines.length) {
        if (oldLines[i] === newLines[j]) {
          diff.push({ type: 'normal', value: oldLines[i] });
          i++;
          j++;
        } else {
          // Simple lookahead match
          let foundMatch = false;
          for (let k = 1; k < 5; k++) {
            if (i + k < oldLines.length && oldLines[i + k] === newLines[j]) {
              // Lines from i to i+k-1 are deleted
              for (let m = 0; m < k; m++) {
                diff.push({ type: 'removed', value: oldLines[i + m] });
              }
              i += k;
              foundMatch = true;
              break;
            }
            if (j + k < newLines.length && oldLines[i] === newLines[j + k]) {
              // Lines from j to j+k-1 are added
              for (let m = 0; m < k; m++) {
                diff.push({ type: 'added', value: newLines[j + m] });
              }
              j += k;
              foundMatch = true;
              break;
            }
          }
          if (!foundMatch) {
            diff.push({ type: 'removed', value: oldLines[i] });
            diff.push({ type: 'added', value: newLines[j] });
            i++;
            j++;
          }
        }
      } else if (i < oldLines.length) {
        diff.push({ type: 'removed', value: oldLines[i] });
        i++;
      } else if (j < newLines.length) {
        diff.push({ type: 'added', value: newLines[j] });
        j++;
      }
    }
    return diff;
  };

  const handleRestoreVersion = async (versionContent) => {
    setNoteContent(versionContent);
    await saveNote(versionContent, undefined);
    setCompareVersion(null);
    setDiffView(false);
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex h-[calc(100vh-14rem)] bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl relative">
      
      {/* Sidebar List */}
      <div className="w-64 bg-slate-950/40 border-r border-slate-800/80 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-800/80 flex justify-between items-center bg-slate-900/40">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" /> Notes
          </h3>
          <button 
            onClick={handleCreateNote}
            className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 transition-all shadow-[0_0_10px_rgba(99,102,241,0.1)]"
            title="Create Note"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
          {notes.map((n) => (
            <button
              key={n._id}
              onClick={() => handleSelectNote(n)}
              className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-start gap-3 border ${
                selectedNote?._id === n._id
                  ? 'bg-indigo-500/10 border-indigo-500/30 text-slate-100 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <FileCode className={`w-4 h-4 mt-0.5 shrink-0 ${selectedNote?._id === n._id ? 'text-indigo-400' : 'text-slate-500'}`} />
              <div className="overflow-hidden">
                <p className="text-xs font-semibold truncate leading-tight">{n.title || 'Untitled Note'}</p>
                <p className="text-[10px] text-slate-500 truncate mt-1">{n.content ? n.content.substring(0, 45) : 'Empty note'}</p>
              </div>
            </button>
          ))}
          {notes.length === 0 && (
            <div className="text-center py-8 text-xs text-slate-600">No notes found. Create one to begin.</div>
          )}
        </div>
      </div>

      {/* Editor Main Pane */}
      {selectedNote ? (
        <div className="flex-1 flex flex-col bg-slate-900/30">
          
          {/* Editor Header controls */}
          <div className="px-6 py-3 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 mr-4">
              <input
                type="text"
                value={noteTitle}
                onChange={handleTitleChange}
                placeholder="Title..."
                className="bg-transparent text-slate-100 font-semibold text-base border-b border-transparent focus:border-indigo-500 focus:outline-none py-0.5 px-1 w-full max-w-sm transition-all placeholder-slate-600"
              />
              {saving && <span className="text-[10px] text-slate-500 italic animate-pulse">Autosaving...</span>}
              {!saving && <span className="text-[10px] text-slate-500 flex items-center gap-1"><Check className="w-3 h-3 text-emerald-500" /> Saved</span>}
              {activeEditor && (
                <span className="text-[10px] text-indigo-400 bg-indigo-500/10 border border-indigo-500/25 px-2 py-0.5 rounded-full">
                  {activeEditor} is typing...
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPreview(!isPreview)}
                className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                  isPreview
                    ? 'bg-slate-800 border-slate-700 text-slate-100 font-medium'
                    : 'bg-slate-950/40 border-slate-850 text-slate-400 hover:text-slate-200'
                }`}
              >
                {isPreview ? 'Edit Mode' : 'Preview MD'}
              </button>
              
              <button
                onClick={() => {
                  setShowHistory(!showHistory);
                  setCompareVersion(null);
                  setDiffView(false);
                }}
                className={`p-2 rounded-lg border transition-all ${
                  showHistory 
                    ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.15)]' 
                    : 'bg-slate-950/40 border-slate-850 text-slate-400 hover:text-slate-200'
                }`}
                title="Version History"
              >
                <History className="w-4 h-4" />
              </button>

              <button
                onClick={handleDeleteNote}
                className="p-2 bg-slate-950/40 border border-slate-850 hover:border-rose-500/30 hover:bg-rose-500/5 hover:text-rose-400 rounded-lg text-slate-400 transition-all"
                title="Delete Note"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Editor Workspace */}
            <div className="flex-1 flex flex-col p-6 overflow-hidden">
              {isPreview ? (
                <div className="flex-1 overflow-y-auto bg-slate-950/30 rounded-xl border border-slate-850 p-6 text-slate-300 prose prose-invert max-w-none scrollbar-thin">
                  {noteContent ? (
                    noteContent.split('\n').map((line, idx) => {
                      if (line.startsWith('# ')) {
                        return <h1 key={idx} className="text-2xl font-bold text-slate-100 mt-4 mb-2">{line.replace('# ', '')}</h1>;
                      }
                      if (line.startsWith('## ')) {
                        return <h2 key={idx} className="text-xl font-bold text-slate-200 mt-3 mb-2">{line.replace('## ', '')}</h2>;
                      }
                      if (line.startsWith('### ')) {
                        return <h3 key={idx} className="text-lg font-semibold text-slate-200 mt-2 mb-1">{line.replace('### ', '')}</h3>;
                      }
                      if (line.startsWith('- ') || line.startsWith('* ')) {
                        return <li key={idx} className="list-disc ml-5 mt-1 text-sm text-slate-300">{line.substring(2)}</li>;
                      }
                      if (line.startsWith('> ')) {
                        return <blockquote key={idx} className="border-l-4 border-slate-700 pl-4 py-1 italic text-slate-400 my-2 bg-slate-900/30 rounded-r-md">{line.replace('> ', '')}</blockquote>;
                      }
                      return <p key={idx} className="text-sm my-1 min-h-[1.25rem] leading-relaxed">{line}</p>;
                    })
                  ) : (
                    <span className="text-slate-600 italic text-sm">Nothing to preview. Start writing markdown structure.</span>
                  )}
                </div>
              ) : (
                <textarea
                  value={noteContent}
                  onChange={handleContentChange}
                  placeholder="Start collaborating here... supports basic markdown previewing (# Headers, - bullets)"
                  className="flex-1 bg-slate-950/20 border border-slate-850 hover:border-slate-800 focus:border-indigo-500/80 text-slate-100 placeholder-slate-600 rounded-xl p-5 text-sm focus:outline-none resize-none transition-all focus:ring-1 focus:ring-indigo-500/30 leading-relaxed font-mono"
                />
              )}
            </div>

            {/* Version History Sidebar panel */}
            {showHistory && (
              <div className="w-80 border-l border-slate-800/80 bg-slate-950/50 flex flex-col shrink-0 overflow-hidden animate-slide-in">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-indigo-400" /> Version History
                  </h4>
                  <button 
                    onClick={() => {
                      setShowHistory(false);
                      setCompareVersion(null);
                      setDiffView(false);
                    }}
                    className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {historyLoading ? (
                  <div className="flex-1 flex items-center justify-center p-4">
                    <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
                    <div className="p-2.5 rounded-lg bg-indigo-500/5 border border-indigo-500/20 flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-200">Current Draft</span>
                        <span className="text-[10px] text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded-full">ACTIVE</span>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1">Updates saved dynamically</span>
                    </div>

                    {noteDetails?.versions?.slice().reverse().map((version, vIdx) => (
                      <div 
                        key={version._id || vIdx}
                        className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                          compareVersion?._id === version._id
                            ? 'bg-slate-800/80 border-indigo-500/50'
                            : 'bg-slate-900/40 border-slate-850 hover:border-slate-700/80'
                        }`}
                        onClick={() => {
                          setCompareVersion(version);
                          setDiffView(true);
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-slate-300">
                              Revision #{noteDetails.versions.length - vIdx}
                            </span>
                            <span className="text-[10px] text-slate-500 mt-1">
                              {formatDateTime(version.createdAt)}
                            </span>
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm("Restore this historical revision? Current draft will be saved to history.")) {
                                handleRestoreVersion(version.content);
                              }
                            }}
                            className="p-1 rounded bg-slate-800 hover:bg-indigo-600 text-slate-400 hover:text-white transition-all"
                            title="Restore version"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {(!noteDetails?.versions || noteDetails.versions.length === 0) && (
                      <div className="text-center py-6 text-[11px] text-slate-600">No revisions captured yet.</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <FileText className="w-16 h-16 text-slate-800 mb-4 animate-pulse" />
          <h3 className="text-slate-300 font-medium mb-1 text-base">Select or Create a Note</h3>
          <p className="text-xs text-slate-500 max-w-sm mb-4">Store documentation, project requirements, meeting items, and compare previous revisions.</p>
          <button
            onClick={handleCreateNote}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.2)] hover:shadow-[0_0_20px_rgba(99,102,241,0.35)] transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create First Note
          </button>
        </div>
      )}

      {/* Diff Compare Modal overlay */}
      {diffView && compareVersion && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-400" /> Comparing Revision Changes
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Comparing older version ({formatDateTime(compareVersion.createdAt)}) with current active draft.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (window.confirm("Restore this version?")) {
                    handleRestoreVersion(compareVersion.content);
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Restore This Version
              </button>
              <button
                onClick={() => {
                  setDiffView(false);
                  setCompareVersion(null);
                }}
                className="p-1.5 bg-slate-800 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Diff View Box */}
          <div className="flex-1 overflow-y-auto bg-slate-950/50 rounded-xl border border-slate-850 p-4 font-mono text-xs leading-relaxed scrollbar-thin">
            {computeDiff(compareVersion.content, noteContent).map((line, idx) => {
              let bgClass = 'text-slate-400';
              let prefix = ' ';
              if (line.type === 'added') {
                bgClass = 'bg-emerald-500/10 border-l-2 border-emerald-500 text-emerald-300 px-1 py-0.5';
                prefix = '+';
              } else if (line.type === 'removed') {
                bgClass = 'bg-rose-500/10 border-l-2 border-rose-500 text-rose-300 px-1 py-0.5 line-through';
                prefix = '-';
              }
              return (
                <div key={idx} className={`${bgClass} whitespace-pre-wrap min-h-[1.25rem] flex gap-2`}>
                  <span className="text-slate-600 select-none w-4 inline-block">{prefix}</span>
                  <span>{line.value}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
