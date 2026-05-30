import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  FileCode, Play, Terminal, Eye, FilePlus, Trash2, Loader2,
  RefreshCw, Check, AlertCircle, Users, Code, ChevronRight
} from 'lucide-react';

export default function CodeWorkspace({ projectId }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { theme } = useTheme();
  const [files, setFiles] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [loadingFiles, setLoadingFiles] = useState(true);
  
  // Editor and terminal states
  const [codeContent, setCodeContent] = useState('');
  const [terminalOutput, setTerminalOutput] = useState('Terminal ready. Click "Run Code" to compile/execute.');
  const [runningCode, setRunningCode] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState('terminal'); // 'terminal' or 'preview'
  
  // Dialog states
  const [newFilename, setNewFilename] = useState('');
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [fileError, setFileError] = useState('');
  const [savingFile, setSavingFile] = useState(false);
  
  // Collaborative indicators
  const [activeCollaborators, setActiveCollaborators] = useState([]);
  const activeFileRef = useRef(null);
  
  // Update ref to avoid stale socket closures
  useEffect(() => {
    activeFileRef.current = activeFile;
  }, [activeFile]);

  // Load project code files
  const fetchFiles = async (selectFileId = null) => {
    try {
      setLoadingFiles(true);
      const res = await axios.get(`/api/code/${projectId}`);
      if (res.data.success) {
        setFiles(res.data.data);
        if (res.data.data.length > 0) {
          // Keep active file selection or default to first file
          const toSelect = selectFileId 
            ? res.data.data.find(f => f._id === selectFileId) || res.data.data[0]
            : res.data.data[0];
          setActiveFile(toSelect);
          setCodeContent(toSelect.content);
        }
      }
    } catch (err) {
      console.error('Failed to load code workspace files:', err);
      setTerminalOutput('Failed to fetch workspace files. Check backend connection.');
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchFiles();
    }
  }, [projectId]);

  // Handle Socket events for collaborative code updates
  useEffect(() => {
    if (!socket) return;

    const handleCodeUpdate = (data) => {
      const { fileId, content, filename, language, editorName } = data;
      
      // Update background list of files
      setFiles(prev => prev.map(f => f._id === fileId ? { ...f, content, filename, language } : f));
      
      // If the update belongs to our active file, update editor content
      if (activeFileRef.current && activeFileRef.current._id === fileId) {
        setCodeContent(content);
      }

      // Briefly log collaborator name to list
      setActiveCollaborators(prev => {
        if (prev.includes(editorName)) return prev;
        return [...prev, editorName];
      });

      // Clear collaborator notification after 3 seconds
      setTimeout(() => {
        setActiveCollaborators(prev => prev.filter(name => name !== editorName));
      }, 3000);
    };

    socket.on('code-updated', handleCodeUpdate);

    return () => {
      socket.off('code-updated', handleCodeUpdate);
    };
  }, [socket]);

  // Handle local text edits inside Monaco Editor
  const handleEditorChange = (value) => {
    if (!activeFile) return;
    setCodeContent(value);
    
    // Broadcast changes to Socket room members
    if (socket) {
      socket.emit('code-edit', {
        projectId,
        fileId: activeFile._id,
        content: value,
        filename: activeFile.filename,
        language: activeFile.language,
        editorName: user.name
      });
    }

    // Auto-save debounced handler (simulated by updating local state array to avoid rapid server requests)
    setFiles(prev => prev.map(f => f._id === activeFile._id ? { ...f, content: value } : f));
  };

  // Explicit Save to Backend
  const handleSaveFile = async () => {
    if (!activeFile) return;
    setSavingFile(true);
    try {
      const res = await axios.put(`/api/code/${projectId}/${activeFile._id}`, {
        content: codeContent
      });
      if (res.data.success) {
        // Success indicator
        setSavingFile(false);
      }
    } catch (err) {
      console.error('Failed to save file contents:', err);
      setSavingFile(false);
    }
  };

  // Run/Execute script in sandbox
  const handleRunCode = async () => {
    if (!activeFile) return;
    setRunningCode(true);
    setTerminalOutput('Compiling and executing code in sandbox environment...');
    setActiveTab('terminal');

    try {
      const res = await axios.post(`/api/code/${projectId}/run`, {
        content: codeContent,
        language: activeFile.language
      });
      
      if (res.data.success) {
        setTerminalOutput(`[Process Complete]\n\n${res.data.output}`);
      } else {
        setTerminalOutput(`[Process Failed / Compilation Error]\n\n${res.data.output}`);
      }
    } catch (err) {
      setTerminalOutput(`[Compilation Connection Timeout]\n\nFailed to reach compile runner: ${err.response?.data?.error || err.message}`);
    } finally {
      setRunningCode(false);
    }
  };

  // Create new file
  const handleCreateFile = async (e) => {
    e.preventDefault();
    if (!newFilename.trim()) return;
    setFileError('');

    try {
      const isPython = newFilename.trim().toLowerCase().endsWith('.py');
      const commentChar = isPython ? '#' : '//';
      const res = await axios.post(`/api/code/${projectId}`, {
        filename: newFilename.trim(),
        content: `${commentChar} Code file: ${newFilename.trim()}\n`
      });

      if (res.data.success) {
        setShowNewFileDialog(false);
        setNewFilename('');
        // Reload files list and select newly created file
        await fetchFiles(res.data.data._id);
      }
    } catch (err) {
      setFileError(err.response?.data?.error || 'Failed to create file');
    }
  };

  // Delete file
  const handleDeleteFile = async (fileId, filename) => {
    if (files.length <= 1) {
      alert('Workspace requires at least 1 active code file.');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete "${filename}"?`)) return;

    try {
      const res = await axios.delete(`/api/code/${projectId}/${fileId}`);
      if (res.data.success) {
        // If deleted active file, select another file first
        const remaining = files.filter(f => f._id !== fileId);
        setActiveFile(remaining[0]);
        setCodeContent(remaining[0].content);
        setFiles(remaining);
      }
    } catch (err) {
      console.error('Failed to delete file:', err);
    }
  };

  // Helper to compile workspace sources to an iframe source string
  const compileSrcDoc = () => {
    const htmlFile = files.find(f => f.filename.toLowerCase() === 'index.html') || { content: '<h1>No index.html found</h1>' };
    const cssFile = files.find(f => f.filename.toLowerCase() === 'style.css') || { content: '' };
    const jsFile = files.find(f => f.filename.toLowerCase() === 'script.js') || { content: '' };

    let doc = htmlFile.content;

    // Inject CSS
    if (doc.includes('style.css')) {
      doc = doc.replace(/<link.*href=["']style\.css["'].*>/g, `<style>${cssFile.content}</style>`);
    } else {
      doc = doc.replace('</head>', `<style>${cssFile.content}</style></head>`);
    }

    // Inject JavaScript (with a custom script error logger to render errors inside our console wrapper)
    const errorHook = `
      <script>
        window.addEventListener('error', function(e) {
          window.parent.postMessage({ type: 'LIVE_PREVIEW_ERROR', message: e.message }, '*');
        });
      </script>
    `;

    doc = doc.replace('<head>', `<head>${errorHook}`);

    if (doc.includes('script.js')) {
      doc = doc.replace(/<script.*src=["']script\.js["'].*><\/script>/g, `<script>${jsFile.content}</script>`);
    } else {
      doc = doc.replace('</body>', `<script>${jsFile.content}</script></body>`);
    }

    return doc;
  };

  // Setup preview listener to catch console.log/errors inside Live Preview iframe
  useEffect(() => {
    const handleMessage = (e) => {
      if (e.data && e.data.type === 'LIVE_PREVIEW_ERROR') {
        setTerminalOutput(prev => prev + `\n[Live Preview Error] ${e.data.message}`);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const selectFile = (file) => {
    setActiveFile(file);
    setCodeContent(file.content);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-250px)] min-h-[550px] relative">
      
      {/* 1. File Explorer Navigation Panel (Left) */}
      <div className="lg:col-span-1 bg-slate-900/60 border border-slate-800/80 rounded-2xl flex flex-col backdrop-blur-md overflow-hidden">
        <div className="p-4 border-b border-slate-850 flex justify-between items-center bg-slate-950/40">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-emerald-400" />
            <span className="text-xs uppercase font-bold tracking-wider text-slate-350">Workspace Explorer</span>
          </div>
          <button 
            onClick={() => setShowNewFileDialog(true)}
            className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition duration-150"
            title="Create new file"
          >
            <FilePlus className="w-4 h-4" />
          </button>
        </div>

        {/* Dialog to create file */}
        {showNewFileDialog && (
          <form onSubmit={handleCreateFile} className="p-3 bg-slate-950 border-b border-slate-850 space-y-2">
            <input 
              type="text"
              value={newFilename}
              onChange={(e) => setNewFilename(e.target.value)}
              placeholder="e.g., app.js, script.js, main.py"
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none placeholder-slate-600"
              autoFocus
            />
            {fileError && <p className="text-[10px] text-rose-400">{fileError}</p>}
            <div className="flex justify-end gap-2 text-[10px]">
              <button 
                type="button" 
                onClick={() => { setShowNewFileDialog(false); setNewFilename(''); }}
                className="px-2 py-1 text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold"
              >
                Create
              </button>
            </div>
          </form>
        )}

        {/* Explorer File list */}
        <div className="flex-1 p-3 overflow-auto space-y-1.5">
          {loadingFiles ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
            </div>
          ) : (
            files.map(file => {
              const isActive = activeFile && activeFile._id === file._id;
              const isHtml = file.filename.endsWith('.html');
              const isCss = file.filename.endsWith('.css');
              const isJs = file.filename.endsWith('.js');
              const isPy = file.filename.endsWith('.py');
              
              let extBg = 'bg-slate-800 text-slate-400';
              if (isHtml) extBg = 'bg-orange-500/10 text-orange-400';
              if (isCss) extBg = 'bg-blue-500/10 text-blue-400';
              if (isJs) extBg = 'bg-yellow-500/10 text-yellow-400';
              if (isPy) extBg = 'bg-cyan-500/10 text-cyan-400';

              return (
                <div 
                  key={file._id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer group transition-all duration-150 min-w-full w-max gap-4 ${
                    isActive 
                      ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-400 font-semibold' 
                      : 'bg-slate-950/20 border-transparent text-slate-400 hover:bg-slate-900/40 hover:text-slate-200'
                  }`}
                  onClick={() => selectFile(file)}
                >
                  <div className="flex items-center gap-2.5 whitespace-nowrap">
                    <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wide font-bold ${extBg} shrink-0`}>
                      {file.filename.split('.').pop()}
                    </span>
                    <span>{file.filename}</span>
                  </div>

                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteFile(file._id, file.filename); }}
                    className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Real-time users typing alerts */}
        {activeCollaborators.length > 0 && (
          <div className="p-3 bg-slate-950 border-t border-slate-850 flex items-center gap-2 text-[10px] text-emerald-400">
            <Users className="w-3.5 h-3.5 animate-pulse" />
            <span className="truncate font-medium">{activeCollaborators.join(', ')} typing...</span>
          </div>
        )}
      </div>

      {/* 2. Editor & Executed Panel Container (Right/Center Split) */}
      <div className="lg:col-span-3 flex flex-col gap-6">
        
        {/* Editor Toolbar */}
        <div className="flex justify-between items-center p-3 bg-slate-900/40 border border-slate-800/80 rounded-2xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-950 rounded-xl border border-slate-850 text-slate-400">
              <FileCode className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">{activeFile ? activeFile.filename : 'Workspace'}</p>
              <p className="text-[9px] uppercase tracking-widest text-slate-500 mt-0.5">
                Language: {activeFile ? activeFile.language : 'Unknown'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Auto Save indicators */}
            <button 
              onClick={handleSaveFile}
              className={`p-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition ${
                savingFile 
                  ? 'bg-slate-900 border-slate-800 text-slate-500' 
                  : 'bg-slate-950 hover:bg-slate-900 border-slate-850 hover:border-slate-800 text-slate-300'
              }`}
            >
              {savingFile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Save Workspace
            </button>

            {/* Run Code sandbox action */}
            {activeFile && activeFile.language !== 'html' && activeFile.language !== 'css' && activeFile.language !== 'json' && (
              <button 
                onClick={handleRunCode}
                disabled={runningCode}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950/20 transition flex items-center gap-1.5"
              >
                {runningCode ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                Run Code
              </button>
            )}
          </div>
        </div>

        {/* Coding Area Split Pane */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[350px]">
          
          {/* Monaco IDE canvas */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-md relative flex flex-col shadow-inner">
            <div className="bg-slate-950/50 p-2 border-b border-slate-850 flex justify-between items-center text-[10px] text-slate-500 font-mono">
              <span>{activeFile ? `EDITOR // ${activeFile.filename}` : 'EDITOR'}</span>
              <span className="text-emerald-500">Live Sync</span>
            </div>
            
            <div className="flex-1 w-full relative pt-2">
              {activeFile ? (
                <Editor
                  height="100%"
                  language={activeFile.language}
                  value={codeContent}
                  onChange={handleEditorChange}
                  theme={theme === 'light' ? 'light' : 'vs-dark'}
                  options={{
                    fontSize: 13,
                    minimap: { enabled: false },
                    automaticLayout: true,
                    tabSize: 4,
                    padding: { top: 10, bottom: 10 },
                    cursorBlinking: 'smooth',
                    lineNumbersMinChars: 3,
                    scrollBeyondLastLine: false,
                    scrollbar: {
                      verticalScrollbarSize: 8,
                      horizontalScrollbarSize: 8
                    }
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-650 text-xs">
                  Create or select a file to begin coding.
                </div>
              )}
            </div>
          </div>

          {/* Console / Output Dock */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-md flex flex-col">
            
            {/* Terminal vs Iframe Selector */}
            <div className="flex border-b border-slate-850 bg-slate-950/40 text-[10px] uppercase font-bold tracking-wider font-mono">
              <button 
                onClick={() => setActiveTab('terminal')}
                className={`flex-1 py-3 border-b-2 text-center flex items-center justify-center gap-1.5 transition ${
                  activeTab === 'terminal' 
                    ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' 
                    : 'border-transparent text-slate-500 hover:text-slate-400 hover:bg-slate-900/20'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                Terminal Log
              </button>

              <button 
                onClick={() => setActiveTab('preview')}
                className={`flex-1 py-3 border-b-2 text-center flex items-center justify-center gap-1.5 transition ${
                  activeTab === 'preview' 
                    ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' 
                    : 'border-transparent text-slate-500 hover:text-slate-400 hover:bg-slate-900/20'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Live HTML Preview
              </button>
            </div>

            {/* Tab screen rendering */}
            <div className="flex-1 relative overflow-hidden bg-slate-950 p-4 font-mono text-xs">
              
              {/* Output log */}
              {activeTab === 'terminal' && (
                <textarea 
                  value={terminalOutput}
                  readOnly
                  wrap="off"
                  className="w-full h-full bg-transparent text-slate-350 resize-none font-mono focus:outline-none leading-relaxed border-none whitespace-pre overflow-auto select-text"
                />
              )}

              {/* HTML frame renderer */}
              {activeTab === 'preview' && (
                <div className="w-full h-full rounded-lg bg-white relative overflow-hidden">
                  <iframe 
                    title="Code live sandbox preview"
                    srcDoc={compileSrcDoc()}
                    sandbox="allow-scripts"
                    className="w-full h-full border-none bg-white"
                  />
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
