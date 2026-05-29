import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { Paintbrush, Square, Circle, Minus, Trash2, Palette, ShieldAlert } from 'lucide-react';

const COLORS = [
  { hex: '#f8fafc', name: 'White' },
  { hex: '#ef4444', name: 'Red' },
  { hex: '#3b82f6', name: 'Blue' },
  { hex: '#10b981', name: 'Emerald' },
  { hex: '#f59e0b', name: 'Amber' }
];

export default function Canvas({ projectId }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const canvasRef = useRef(null);
  
  const [elements, setElements] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('line-draw'); // line-draw, rectangle, circle, line
  const [color, setColor] = useState('#10b981'); // Emerald default
  const [lineWidth, setLineWidth] = useState(4);
  
  // Starting coordinate states for shapes
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  // Temp path coordinate tracking for freehand line drawing
  const [currentPath, setCurrentPath] = useState([]);

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
      drawAll(updatedElements);
    });

    socket.on('whiteboard-cleared', () => {
      setElements([]);
      clearCanvasOnly();
    });

    return () => {
      socket.off('whiteboard-update');
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
  const drawAll = (elementsList) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    elementsList.forEach((el) => {
      ctx.strokeStyle = el.color;
      ctx.fillStyle = el.color;
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

    if (tool === 'line-draw') {
      setCurrentPath([{ x: pos.x, y: pos.y }]);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || user?.role === 'Viewer') return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getMousePos(e);

    // Clear and redraw background shapes first
    drawAll(elements);

    // Render interactive preview of actively drawn element
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'line-draw') {
      const nextPath = [...currentPath, { x: pos.x, y: pos.y }];
      setCurrentPath(nextPath);
      
      ctx.beginPath();
      ctx.moveTo(nextPath[0].x, nextPath[0].y);
      for (let i = 1; i < nextPath.length; i++) {
        ctx.lineTo(nextPath[i].x, nextPath[i].y);
      }
      ctx.stroke();
    } else if (tool === 'rectangle') {
      ctx.beginPath();
      ctx.strokeRect(startX, startY, pos.x - startX, pos.y - startY);
    } else if (tool === 'circle') {
      const radius = Math.sqrt(Math.pow(pos.x - startX, 2) + Math.pow(pos.y - startY, 2));
      ctx.beginPath();
      ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (tool === 'line') {
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
  };

  const handleMouseUp = async (e) => {
    if (!isDrawing || user?.role === 'Viewer') return;
    setIsDrawing(false);
    const pos = getMousePos(e);

    let newElement = null;

    if (tool === 'line-draw' && currentPath.length > 1) {
      newElement = {
        id: Math.random().toString(36).substring(2, 9),
        type: 'line-draw',
        points: currentPath,
        color,
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
        color,
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
        color,
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
        color,
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
    if (!window.confirm('Are you sure you want to clear the whiteboard?')) return;

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

  return (
    <div className="flex flex-col h-[calc(100vh-250px)] animate-fade-in gap-4">
      {/* Drawing Controls toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 glass-panel rounded-2xl border border-slate-800">
        <div className="flex items-center gap-4">
          {/* Tool selector */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-900 gap-1">
            <button
              onClick={() => setTool('line-draw')}
              className={`p-2 rounded-lg transition ${tool === 'line-draw' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
              title="Pen Brush"
            >
              <Paintbrush className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTool('rectangle')}
              className={`p-2 rounded-lg transition ${tool === 'rectangle' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
              title="Draw Rectangle"
            >
              <Square className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTool('circle')}
              className={`p-2 rounded-lg transition ${tool === 'circle' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
              title="Draw Circle"
            >
              <Circle className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTool('line')}
              className={`p-2 rounded-lg transition ${tool === 'line' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
              title="Draw Straight Line"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>

          {/* Color Palettes */}
          <div className="flex items-center gap-1.5 px-3 border-l border-slate-800">
            {COLORS.map((col) => (
              <button
                key={col.hex}
                onClick={() => setColor(col.hex)}
                style={{ backgroundColor: col.hex }}
                className={`w-6 h-6 rounded-full border-2 transition ${color === col.hex ? 'border-emerald-400 scale-110 shadow-md glow-emerald' : 'border-slate-950 hover:scale-105'}`}
                title={col.name}
              />
            ))}
          </div>

          {/* Brush stroke slider */}
          <div className="flex items-center gap-2 pl-3 border-l border-slate-800 text-xs">
            <span className="text-slate-400 font-semibold uppercase tracking-wider">Size:</span>
            <input
              type="range"
              min="1"
              max="20"
              value={lineWidth}
              onChange={(e) => setLineWidth(Number(e.target.value))}
              className="w-24 accent-emerald-500"
            />
            <span className="text-white w-4 font-mono font-bold">{lineWidth}</span>
          </div>
        </div>

        {/* Clear options */}
        {user?.role !== 'Viewer' ? (
          <button
            onClick={handleClear}
            className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-200 text-xs font-semibold py-2 px-4 rounded-xl flex items-center gap-2 transition"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Canvas</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 text-slate-500 text-xs">
            <ShieldAlert className="w-4 h-4" />
            <span>View Only Canvas</span>
          </div>
        )}
      </div>

      {/* Main Canvas Workspace */}
      <div className="flex-1 bg-slate-950 border border-slate-900 rounded-2xl relative overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className={`absolute inset-0 w-full h-full cursor-draw ${user?.role === 'Viewer' ? 'pointer-events-none opacity-90' : ''}`}
        />
      </div>
    </div>
  );
}
