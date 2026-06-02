import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { useConfirmation } from '../../context/ConfirmationContext';
import { Paintbrush, Eraser, Square, Circle, Minus, Trash2, Palette, ShieldAlert } from 'lucide-react';

const COLORS = [
  { hex: 'DEFAULT', name: 'Default' },
  { hex: '#ef4444', name: 'Red' },
  { hex: '#3b82f6', name: 'Blue' },
  { hex: '#10b981', name: 'Emerald' },
  { hex: '#f59e0b', name: 'Amber' }
];

export default function Canvas({ projectId }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { confirm } = useConfirmation();
  const canvasRef = useRef(null);
  const cursorRef = useRef(null);
  
  const [elements, setElements] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('line-draw'); // line-draw, rectangle, circle, line
  const [color, setColor] = useState('DEFAULT');
  const [lineWidth, setLineWidth] = useState(4);
  
  // Starting coordinate states for shapes
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  // Temp path coordinate tracking for freehand line drawing
  const [currentPath, setCurrentPath] = useState([]);

  const [activeDrawings, setActiveDrawings] = useState({});
  const elementsRef = useRef(elements);
  const lastEmitTimeRef = useRef(0);

  useEffect(() => {
    elementsRef.current = elements;
  }, [elements]);

  const drawColor = tool === 'eraser' ? 'eraser' : color;

  // 1. Fetch saved whiteboard drawings from database
  useEffect(() => {
    const fetchWhiteboard = async () => {
      try {
        const res = await axios.get(`/api/whiteboard/${projectId}`);
        if (res.data.success) {
          const loadedElements = res.data.data.elements || [];
          setElements(loadedElements);
          drawAll(loadedElements);
        }
      } catch (err) {
        console.error('Failed to load whiteboard drawing records:', err.message);
      }
    };
    fetchWhiteboard();
  }, [projectId]);

  // 2. Set up socket listeners for real-time draw sync
  useEffect(() => {
    if (!socket) return;

    socket.on('whiteboard-update', ({ elements: updatedElements }) => {
      setElements(updatedElements);
      setActiveDrawings({});
      drawAll(updatedElements, {});
    });

    socket.on('whiteboard-stroke-update', ({ userId, element }) => {
      setActiveDrawings((prev) => {
        const updated = { ...prev, [userId]: element };
        drawAll(elementsRef.current, updated);
        return updated;
      });
    });

    socket.on('whiteboard-cleared', () => {
      setElements([]);
      setActiveDrawings({});
      clearCanvasOnly();
    });

    return () => {
      socket.off('whiteboard-update');
      socket.off('whiteboard-stroke-update');
      socket.off('whiteboard-cleared');
    };
  }, [socket]);

  // 3. Keep canvas dimensions set correctly
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = Math.max(500, rect.height - 20);
      drawAll(elements);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [elements]);

  // Redraw canvas helper
  const drawAll = (elementsList, activeDraws = activeDrawings) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const drawElement = (el) => {
      const isEraser = el.color === 'eraser' || el.color === '#020617';
      const isDefault = el.color === '#f8fafc' || el.color === 'DEFAULT';
      
      let resolvedColor = el.color;
      if (isEraser) {
        ctx.globalCompositeOperation = 'destination-out';
        resolvedColor = 'rgba(0,0,0,1)';
      } else if (isDefault) {
        resolvedColor = document.documentElement.classList.contains('theme-light') ? '#171717' : '#ededed';
      }

      ctx.strokeStyle = resolvedColor;
      ctx.fillStyle = resolvedColor;
      ctx.lineWidth = el.lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (el.type === 'line-draw' && el.points && el.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(el.points[0].x, el.points[0].y);
        for (let i = 1; i < el.points.length; i++) {
          ctx.lineTo(el.points[i].x, el.points[i].y);
        }
        ctx.stroke();
      } else if (el.type === 'rectangle') {
        ctx.beginPath();
        ctx.strokeRect(el.x, el.y, el.width, el.height);
      } else if (el.type === 'circle') {
        ctx.beginPath();
        ctx.arc(el.cx, el.cy, el.r, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (el.type === 'line') {
        ctx.beginPath();
        ctx.moveTo(el.x1, el.y1);
        ctx.lineTo(el.x2, el.y2);
        ctx.stroke();
      }
    };

    // Draw completed elements
    elementsList.forEach(drawElement);

    // Draw active drawing strokes from other users
    Object.values(activeDraws).forEach((el) => {
      if (el) drawElement(el);
    });
  };

  const clearCanvasOnly = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Drawing event handlers
  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseDown = (e) => {
    if (user?.role === 'Viewer') return;
    const pos = getMousePos(e);
    setIsDrawing(true);
    setStartX(pos.x);
    setStartY(pos.y);

    if (tool === 'line-draw' || tool === 'eraser') {
      setCurrentPath([{ x: pos.x, y: pos.y }]);
    }

    if (cursorRef.current) {
      cursorRef.current.classList.add('scale-90', 'bg-rose-500/30', 'border-rose-400');
    }
  };

  const handleMouseMove = (e) => {
    const pos = getMousePos(e);

    // Update custom cursor positioning
    if (cursorRef.current) {
      cursorRef.current.style.left = `${pos.x - lineWidth / 2}px`;
      cursorRef.current.style.top = `${pos.y - lineWidth / 2}px`;
      cursorRef.current.style.display = 'block';
    }

    if (!isDrawing || user?.role === 'Viewer') return;

    // Clear and redraw background shapes first
    drawAll(elements);

    // Render interactive preview of actively drawn element
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const isEraser = drawColor === 'eraser' || drawColor === '#020617';
    if (isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      const resolvedDrawColor = drawColor === 'DEFAULT' 
        ? (document.documentElement.classList.contains('theme-light') ? '#171717' : '#ededed') 
        : drawColor;
      ctx.strokeStyle = resolvedDrawColor;
    }
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    let activeElement = null;

    if (tool === 'line-draw' || tool === 'eraser') {
      const nextPath = [...currentPath, { x: pos.x, y: pos.y }];
      setCurrentPath(nextPath);
      
      ctx.beginPath();
      ctx.moveTo(nextPath[0].x, nextPath[0].y);
      for (let i = 1; i < nextPath.length; i++) {
        ctx.lineTo(nextPath[i].x, nextPath[i].y);
      }
      ctx.stroke();

      activeElement = {
        type: 'line-draw',
        points: nextPath,
        color: drawColor,
        lineWidth
      };
    } else if (tool === 'rectangle') {
      ctx.beginPath();
      ctx.strokeRect(startX, startY, pos.x - startX, pos.y - startY);

      activeElement = {
        type: 'rectangle',
        x: startX,
        y: startY,
        width: pos.x - startX,
        height: pos.y - startY,
        color: drawColor,
        lineWidth
      };
    } else if (tool === 'circle') {
      const radius = Math.sqrt(Math.pow(pos.x - startX, 2) + Math.pow(pos.y - startY, 2));
      ctx.beginPath();
      ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
      ctx.stroke();

      activeElement = {
        type: 'circle',
        cx: startX,
        cy: startY,
        r: radius,
        color: drawColor,
        lineWidth
      };
    } else if (tool === 'line') {
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();

      activeElement = {
        type: 'line',
        x1: startX,
        y1: startY,
        x2: pos.x,
        y2: pos.y,
        color: drawColor,
        lineWidth
      };
    }

    // Reset composite operation to normal drawing
    ctx.globalCompositeOperation = 'source-over';

    // Broadcast current stroke to other users (throttled to ~33fps)
    if (socket && activeElement) {
      const now = Date.now();
      if (now - lastEmitTimeRef.current > 30) {
        lastEmitTimeRef.current = now;
        socket.emit('whiteboard-draw-stroke', {
          projectId,
          userId: user._id,
          element: activeElement
        });
      }
    }
  };

  const handleMouseUp = async (e) => {
    if (!isDrawing || user?.role === 'Viewer') return;
    setIsDrawing(false);
    const pos = getMousePos(e);

    if (cursorRef.current) {
      cursorRef.current.classList.remove('scale-90', 'bg-rose-500/30', 'border-rose-400');
    }

    let newElement = null;

    if ((tool === 'line-draw' || tool === 'eraser') && currentPath.length > 1) {
      newElement = {
        id: Math.random().toString(36).substring(2, 9),
        type: 'line-draw',
        points: currentPath,
        color: drawColor,
        lineWidth
      };
      setCurrentPath([]);
    } else if (tool === 'rectangle') {
      newElement = {
        id: Math.random().toString(36).substring(2, 9),
        type: 'rectangle',
        x: startX,
        y: startY,
        width: pos.x - startX,
        height: pos.y - startY,
        color: drawColor,
        lineWidth
      };
    } else if (tool === 'circle') {
      const radius = Math.sqrt(Math.pow(pos.x - startX, 2) + Math.pow(pos.y - startY, 2));
      newElement = {
        id: Math.random().toString(36).substring(2, 9),
        type: 'circle',
        cx: startX,
        cy: startY,
        r: radius,
        color: drawColor,
        lineWidth
      };
    } else if (tool === 'line') {
      newElement = {
        id: Math.random().toString(36).substring(2, 9),
        type: 'line',
        x1: startX,
        y1: startY,
        x2: pos.x,
        y2: pos.y,
        color: drawColor,
        lineWidth
      };
    }

    if (newElement) {
      const nextElementsList = [...elements, newElement];
      setElements(nextElementsList);
      drawAll(nextElementsList);

      // Save drawing state and elements to DB
      try {
        await axios.put(`/api/whiteboard/${projectId}`, { elements: nextElementsList });
        
        // Broadcast change over Sockets
        if (socket) {
          socket.emit('whiteboard-draw', { projectId, elements: nextElementsList });
        }
      } catch (err) {
        console.error('Failed to save drawing strokes:', err.message);
      }
    }
  };

  const handleClear = async () => {
    if (user?.role === 'Viewer') return;
    if (!(await confirm('Are you sure you want to clear the whiteboard?'))) return;

    setElements([]);
    clearCanvasOnly();

    try {
      await axios.put(`/api/whiteboard/${projectId}`, { elements: [] });
      if (socket) {
        socket.emit('whiteboard-clear', { projectId });
      }
    } catch (err) {
      console.error('Failed to clear canvas record:', err.message);
    }
  };

  const handleMouseLeave = (e) => {
    handleMouseUp(e);
    if (cursorRef.current) {
      cursorRef.current.style.display = 'none';
    }
  };

  const handleMouseEnter = () => {
    if (cursorRef.current) {
      cursorRef.current.style.display = 'block';
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-250px)] animate-fade-in gap-4">
      
      {/* 1. Structured Controls toolbar (Fixed Top Panel) */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg select-none">
        <div className="flex items-center gap-3.5">
          {/* Tool selector */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-850 gap-1">
            <button
              onClick={() => setTool('line-draw')}
              className={`p-1.5 rounded-lg transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                tool === 'line-draw'
                  ? 'bg-gradient-to-r from-[var(--gold-primary)] to-[var(--gold-secondary)] text-[var(--active-tab-text)] font-extrabold shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
              title="Pen Brush"
            >
              <Paintbrush className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setTool('eraser');
                setLineWidth(16); // Default to a thicker brush for erasing
              }}
              className={`p-1.5 rounded-lg transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                tool === 'eraser'
                  ? 'bg-gradient-to-r from-[var(--gold-primary)] to-[var(--gold-secondary)] text-[var(--active-tab-text)] font-extrabold shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
              title="Eraser"
            >
              <Eraser className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTool('rectangle')}
              className={`p-1.5 rounded-lg transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                tool === 'rectangle'
                  ? 'bg-gradient-to-r from-[var(--gold-primary)] to-[var(--gold-secondary)] text-[var(--active-tab-text)] font-extrabold shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
              title="Draw Rectangle"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTool('circle')}
              className={`p-1.5 rounded-lg transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                tool === 'circle'
                  ? 'bg-gradient-to-r from-[var(--gold-primary)] to-[var(--gold-secondary)] text-[var(--active-tab-text)] font-extrabold shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
              title="Draw Circle"
            >
              <Circle className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTool('line')}
              className={`p-1.5 rounded-lg transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                tool === 'line'
                  ? 'bg-gradient-to-r from-[var(--gold-primary)] to-[var(--gold-secondary)] text-[var(--active-tab-text)] font-extrabold shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
              title="Draw Straight Line"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Color Palettes */}
          <div className="flex items-center gap-2 px-3.5 border-l border-slate-850 h-7">
            {COLORS.map((col) => {
              const isDefault = col.hex === 'DEFAULT';
              const resolvedColor = isDefault 
                ? (document.documentElement.classList.contains('theme-light') ? '#171717' : '#ededed') 
                : col.hex;
              const isActive = color === col.hex;

              return (
                <button
                  key={col.hex}
                  onClick={() => {
                    setColor(col.hex);
                    if (tool === 'eraser') {
                      setTool('line-draw');
                      setLineWidth(4); // Reset brush size
                    }
                  }}
                  style={{ backgroundColor: resolvedColor }}
                  className={`w-5 h-5 rounded-full border transition-all hover:scale-110 active:scale-90 cursor-pointer relative flex items-center justify-center ${
                    isActive 
                      ? 'border-white scale-110 shadow-md ring-2 ring-[var(--gold-primary)] ring-offset-2 ring-offset-slate-900' 
                      : 'border-slate-950/20'
                  }`}
                  title={col.name}
                >
                  {isActive && <div className="w-1.5 h-1.5 rounded-full bg-slate-900" style={{ backgroundColor: resolvedColor === '#ffffff' || resolvedColor === '#ededed' ? '#000000' : '#ffffff' }} />}
                </button>
              );
            })}
          </div>

          {/* Brush stroke slider */}
          <div className="flex items-center gap-2 pl-3.5 border-l border-slate-850 h-7 text-[10px]">
            <span className="text-slate-500 font-extrabold uppercase tracking-wider">Size:</span>
            <input
              type="range"
              min="1"
              max="20"
              value={lineWidth}
              onChange={(e) => setLineWidth(Number(e.target.value))}
              className="w-20 md:w-24 accent-[var(--gold-primary)] cursor-pointer h-1 bg-slate-800 rounded-lg appearance-none"
            />
            <span className="text-[var(--gold-primary)] w-4 font-mono font-extrabold text-center bg-slate-950 px-1 py-0.5 rounded border border-slate-800">{lineWidth}</span>
          </div>
        </div>

        {/* Clear options */}
        {user?.role !== 'Viewer' ? (
          <button
            onClick={handleClear}
            className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 text-rose-400 text-[10px] font-bold py-1.5 px-3 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Canvas</span>
          </button>
        ) : (
          <div className="flex items-center gap-1 text-slate-500 text-[10px] font-semibold">
            <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
            <span>View Only</span>
          </div>
        )}
      </div>

      {/* 2. Main Canvas Workspace */}
      <div 
        className="flex-1 bg-slate-950 border-2 border-[var(--gold-primary)]/30 hover:border-[var(--gold-primary)]/60 shadow-[0_0_15px_var(--gold-glow)] rounded-2xl relative overflow-hidden group transition-all duration-300"
        style={{
          backgroundImage: document.documentElement.classList.contains('theme-light')
            ? 'radial-gradient(rgba(0, 0, 0, 0.08) 1.2px, transparent 1.2px)'
            : 'radial-gradient(rgba(255, 255, 255, 0.08) 1.2px, transparent 1.2px)',
          backgroundSize: '24px 24px'
        }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onMouseEnter={handleMouseEnter}
          className={`absolute inset-0 w-full h-full ${(tool === 'line-draw' || tool === 'eraser') && user?.role !== 'Viewer' ? 'cursor-none' : 'cursor-draw'} ${user?.role === 'Viewer' ? 'pointer-events-none opacity-90' : ''}`}
        />

        {/* Custom size-dynamic, animated cursors for Pen and Eraser */}
        {(tool === 'line-draw' || tool === 'eraser') && user?.role !== 'Viewer' && (
          <div 
            ref={cursorRef}
            className={`absolute rounded-full pointer-events-none transition-all duration-75 ${
              tool === 'eraser'
                ? 'bg-rose-500/10 border border-rose-500/80 animate-cursor-eraser'
                : 'bg-[var(--gold-glow)] border border-[var(--gold-primary)] animate-cursor-pen'
            }`}
            style={{
              width: `${lineWidth}px`,
              height: `${lineWidth}px`,
              display: 'none',
              transform: 'translate3d(0, 0, 0)'
            }}
          />
        )}
      </div>
    </div>
  );
}

