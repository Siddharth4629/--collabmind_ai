const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables first
dotenv.config({ path: path.join(__dirname, 'config.env') });

let User, Project, Task, Note, Chat, Activity, Whiteboard;

function loadModels() {
  User = require('./models/User');
  Project = require('./models/Project');
  Task = require('./models/Task');
  Note = require('./models/Note');
  Chat = require('./models/Chat');
  Activity = require('./models/Activity');
  Whiteboard = require('./models/Whiteboard');
}

const seedData = async () => {
  try {
    console.log('Seeding database with demo data...');

    // 1. Clear database
    await User.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});
    await Note.deleteMany({});
    await Chat.deleteMany({});
    await Activity.deleteMany({});
    await Whiteboard.deleteMany({});

    // 2. Create Users (plain password — User model hashes on create)
    console.log('- Creating Users...');
    const admin = await User.create({
      name: 'Sarah Jenkins (Admin)',
      email: 'admin@projecthub.com',
      password: 'demo123',
      role: 'Admin'
    });

    const member = await User.create({
      name: 'Alex Rivera (Developer)',
      email: 'demo@projecthub.com',
      password: 'demo123',
      role: 'Member'
    });

    const viewer = await User.create({
      name: 'David Miller (Stakeholder)',
      email: 'viewer@projecthub.com',
      password: 'demo123',
      role: 'Viewer'
    });

    // 3. Create Project
    console.log('- Creating Sample Project...');
    const project = await Project.create({
      name: 'CollabMind Platform Launch',
      description: 'Building a real-time collaborative workspace featuring dynamic whiteboard sketches, interactive Kanban boards, and Gemini API project ideation.',
      owner: admin._id,
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      status: 'active',
      budget: {
        total: 25000,
        spent: 5600
      },
      members: [
        { user: admin._id, role: 'Admin' },
        { user: member._id, role: 'Member' },
        { user: viewer._id, role: 'Viewer' }
      ],
      expenses: [
        {
          _id: 'exp1',
          title: 'Gemini Generative API Tokens',
          amount: 600,
          category: 'AI Credits',
          loggedBy: member._id,
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        },
        {
          _id: 'exp2',
          title: 'Cloud VPS Node hosting (AWS)',
          amount: 5000,
          category: 'Hosting & Server',
          loggedBy: admin._id,
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
        }
      ]
    });

    // 4. Create Kanban Tasks
    console.log('- Creating Kanban Tasks...');
    await Task.create({
      title: 'Design System Architecture',
      description: 'Outline the REST endpoint structures, Socket.IO message payloads, and MongoDB schema relationships.',
      status: 'Todo',
      priority: 'High',
      project: project._id,
      assignee: member._id,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      order: 0,
      subtasks: [
        { title: 'Draft schema diagrams', isCompleted: true },
        { title: 'Create REST mapping table', isCompleted: false },
        { title: 'Define websocket message shapes', isCompleted: false }
      ]
    });

    await Task.create({
      title: 'Configure JWT & Role-Based guards',
      description: 'Implement backend authentication middleware and React protected routes filtering navigation links.',
      status: 'Todo',
      priority: 'Medium',
      project: project._id,
      assignee: admin._id,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      order: 1,
      subtasks: [
        { title: 'Configure JWT signed tokens response', isCompleted: true },
        { title: 'Create checkProjectAccess middlewares', isCompleted: true },
        { title: 'Build React client contexts', isCompleted: false }
      ]
    });

    await Task.create({
      title: 'Real-time Whiteboard Canvas Sync',
      description: 'Integrate HTML5 Canvas drawing events and broadcast line strokes to other project users via Socket.IO.',
      status: 'InProgress',
      priority: 'High',
      project: project._id,
      assignee: member._id,
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      order: 0,
      subtasks: [
        { title: 'Setup Mouse coordinates tracker', isCompleted: true },
        { title: 'Bind drawings to socket broadcasts', isCompleted: true },
        { title: 'Implement canvas shapes controls (circle, square)', isCompleted: false }
      ]
    });

    await Task.create({
      title: 'Connect Gemini Brainstorming API',
      description: 'Mount generative models routes that analyze project metadata and user prompts to suggest project milestones.',
      status: 'Review',
      priority: 'High',
      project: project._id,
      assignee: member._id,
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      order: 0,
      subtasks: [
        { title: 'Register Gemini API Developer Key', isCompleted: true },
        { title: 'Implement post-route parser controllers', isCompleted: true },
        { title: 'Build front-end prompt dialog input', isCompleted: true }
      ]
    });

    await Task.create({
      title: 'Initialize Express + React project base',
      description: 'Configure standard folders layout, Vite compiler settings, Tailwind CSS, and server node scripts.',
      status: 'Done',
      priority: 'Low',
      project: project._id,
      assignee: admin._id,
      dueDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      order: 0,
      subtasks: [
        { title: 'Run create-vite client folder scaffold', isCompleted: true },
        { title: 'Configure Tailwind layout imports', isCompleted: true },
        { title: 'Create node package.json scripts', isCompleted: true }
      ]
    });

    // 5. Create Collaborative Notes
    console.log('- Creating Notes...');
    await Note.create({
      title: 'Project Kickoff Notes',
      content: `# CollabMind Launch Guidelines\n\nWelcome team! Here are our core milestones:\n1. **Real-time collaboration**: Canvas sketch maps & chat.\n2. **AI Assistance**: Generating subtasks on demand.\n3. **Financial integrity**: Real-time budget monitoring limits.\n\nKeep updates clean and test routes locally!`,
      project: project._id,
      versions: [
        {
          content: `# Project Kickoff Notes\nInitial draft compiled for the launch.`,
          updatedBy: admin._id,
          createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
        },
        {
          content: `# CollabMind Launch Guidelines\n\nWelcome team! Here are our core milestones:\n1. **Real-time collaboration**: Canvas sketch maps & chat.`,
          updatedBy: member._id,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        }
      ]
    });

    // 6. Create Chat Logs
    console.log('- Seeding Chat History...');
    await Chat.create({
      project: project._id,
      sender: admin._id,
      message: "Hey team! Welcome to the CollabMind collaborative project workspace. Let's make this launch legendary!",
      readBy: [admin._id, member._id, viewer._id]
    });

    await Chat.create({
      project: project._id,
      sender: member._id,
      message: "Thanks Sarah! The socket integrations look solid. I am finishing up the live drawing sync on the whiteboard now.",
      readBy: [admin._id, member._id, viewer._id]
    });

    await Chat.create({
      project: project._id,
      sender: viewer._id,
      message: "Impressive progress. I really like the clean layout. Can we confirm the budget tracker charts match our spreadsheets?",
      readBy: [admin._id, member._id, viewer._id]
    });

    // 7. Seed Whiteboard Elements
    console.log('- Seeding Canvas Elements...');
    await Whiteboard.create({
      project: project._id,
      elements: [
        {
          id: 'el-1',
          type: 'rectangle',
          x: 150,
          y: 100,
          width: 200,
          height: 120,
          color: '#10b981',
          lineWidth: 4,
          fill: false
        },
        {
          id: 'el-2',
          type: 'text',
          x: 180,
          y: 160,
          text: 'Backend Server',
          color: '#f8fafc',
          fontSize: 18
        },
        {
          id: 'el-3',
          type: 'line',
          points: [350, 160, 480, 160],
          color: '#64748b',
          lineWidth: 3
        },
        {
          id: 'el-4',
          type: 'rectangle',
          x: 480,
          y: 100,
          width: 200,
          height: 120,
          color: '#0284c7',
          lineWidth: 4,
          fill: false
        },
        {
          id: 'el-5',
          type: 'text',
          x: 515,
          y: 160,
          text: 'React Client',
          color: '#f8fafc',
          fontSize: 18
        }
      ],
      updatedBy: member._id
    });

    // 8. Create Activity Logs
    console.log('- Creating Activity logs...');
    await Activity.create({
      project: project._id,
      user: admin._id,
      action: 'Project Created',
      details: 'Created project "CollabMind Platform Launch" with total budget allocation $25,000.'
    });

    await Activity.create({
      project: project._id,
      user: admin._id,
      action: 'Member Added',
      details: 'Added Alex Rivera (Developer) to the workspace with role: Member.'
    });

    await Activity.create({
      project: project._id,
      user: admin._id,
      action: 'Member Added',
      details: 'Added David Miller (Stakeholder) to the workspace with role: Viewer.'
    });

    await Activity.create({
      project: project._id,
      user: member._id,
      action: 'Expense Logged',
      details: 'Logged expense "Gemini Generative API Tokens" of $600 under category "AI Credits".'
    });

    await Activity.create({
      project: project._id,
      user: member._id,
      action: 'Task Moved',
      details: 'Moved task "Connect Gemini Brainstorming API" from "InProgress" to "Review".'
    });

    console.log('🎉 Seeding successfully completed!');
    console.log('----------------------------------------------------');
    console.log('Demo Credentials to Login:');
    console.log('🔑 Administrator: admin@projecthub.com / demo123');
    console.log('🔑 Developer:     demo@projecthub.com  / demo123');
    console.log('🔑 Stakeholder:   viewer@projecthub.com / demo123');
    console.log('----------------------------------------------------\n');

  } catch (err) {
    console.error('Seeding error:', err.message);
  }
};

// If run directly
if (require.main === module) {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/collabmind';
  
  if (process.env.USE_MOCK_DB === 'true') {
    console.log('Seeding using local mock database fallback...');
    process.env.USE_MOCK_DB = 'true';
    loadModels();
    const mockDb = require('./config/mockDb');
    mockDb.resetDb();
    seedData().then(() => process.exit(0));
  } else {
    console.log('Checking MongoDB connection...');
    mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 2000 }).then(async () => {
      console.log('MongoDB connection established successfully.');
      process.env.USE_MOCK_DB = 'false';
      loadModels();
      await seedData();
      await mongoose.disconnect();
      process.exit(0);
    }).catch(err => {
      console.warn('MongoDB not running. Seeding file database instead...');
      process.env.USE_MOCK_DB = 'true';
      loadModels();
      const mockDb = require('./config/mockDb');
      mockDb.resetDb();
      seedData().then(() => process.exit(0));
    });
  }
} else {
  // Imported by server for auto-seeding
  loadModels();
  module.exports = seedData();
}
