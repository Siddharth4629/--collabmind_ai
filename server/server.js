const path = require('path');
const dotenv = require('dotenv');

// Load environment variables before anything else
dotenv.config({ path: path.join(__dirname, 'config.env') });

const connectDB = require('./config/db');

async function startServer() {
  // Connect first so USE_MOCK_DB is set before models/routes load
  await connectDB();

  if (process.env.USE_MOCK_DB === 'true') {
    const mockDb = require('./config/mockDb');
    const currentDb = mockDb.loadDb();
    if (!currentDb.users || currentDb.users.length === 0) {
      console.log('Mock database is empty. Auto-running development data seeder...');
      try {
        await require('./seed');
      } catch (err) {
        console.error('Auto-seeding error:', err.message);
      }
    }
  }

  const express = require('express');
  const http = require('http');
  const socketio = require('socket.io');
  const cors = require('cors');
  const helmet = require('helmet');
  const rateLimit = require('express-rate-limit');
  const socketHandler = require('./sockets/socketHandler');

  // Import routes after database mode is resolved
  const authRoutes = require('./routes/auth');
  const projectRoutes = require('./routes/projects');
  const taskRoutes = require('./routes/tasks');
  const whiteboardRoutes = require('./routes/whiteboard');
  const noteRoutes = require('./routes/notes');
  const aiRoutes = require('./routes/ai');
  const activityRoutes = require('./routes/activities');
  const codeRoutes = require('./routes/code');

  const app = express();
  const server = http.createServer(app);

  const io = socketio(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      credentials: true
    }
  });

  app.use(express.json());

  app.use(
    cors({
      origin: 'https://collabmind-frontend.onrender.com',
      credentials: true
    })
  );

  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  }));

  const limiter = rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: {
      success: false,
      error: 'Too many requests from this IP, please try again after 15 minutes'
    }
  });
  app.use('/api/', limiter);

  app.use('/api/auth', authRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/whiteboard', whiteboardRoutes);
  app.use('/api/notes', noteRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/activity', activityRoutes);
  app.use('/api/code', codeRoutes);

  app.use('/api/health', async (req, res) => {
    res.status(200).json({
      success: true,
      status: 'Healthy',
      timestamp: new Date(),
      environment: process.env.NODE_ENV || 'development',
      database: process.env.USE_MOCK_DB === 'true' ? 'Local JSON File DB Fallback' : 'MongoDB Connection Active'
    });
  });

  const uploadPath = process.env.UPLOAD_PATH || './uploads';
  app.use('/uploads', express.static(path.join(__dirname, uploadPath)));

  socketHandler(io);

  app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err.stack);
    res.status(500).json({
      success: false,
      error: err.message || 'Server error occurred'
    });
  });

  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`\n🚀 CollabMind server is live in [${process.env.NODE_ENV || 'development'}] mode on port ${PORT}`);
    console.log(`🌐 API Health Check: http://localhost:${PORT}/api/health`);
    console.log(`🔌 WebSockets: Ready and listening`);
    console.log(`================================================================\n`);
  });

  module.exports = server;
  return server;
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
