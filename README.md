🚀 CollabMind - AI-Powered Collaborative Project Management Platform

CollabMind is a modern full-stack collaborative project management platform that combines real-time teamwork, AI-powered ideation, and advanced project tracking into one seamless experience.
Built using the MERN Stack, it enables teams to manage projects, collaborate live, track budgets, and generate AI-driven ideas efficiently.

## 🚀 Features

### Backend (Node.js + Express + MongoDB)
- **Authentication & RBAC**: JWT-based authentication with role-based access control (Admin, Member, Viewer)
- **Projects CRUD**: Complete project management with member-based access control
- **Tasks CRUD**: Kanban-style task management with drag & drop ordering
- **Whiteboard**: Real-time collaborative whiteboard with Socket.IO
- **AI Ideation**: Gemini API integration for AI-powered brainstorming
- **Chat & Comments**: Real-time messaging with typing indicators and read receipts
- **Notes**: Rich text editor with version control and comparison
- **Analytics**: Project statistics, user progress, financial utilization, and AI-generated insights
- **Budget Management**: End-to-end financial tracking with expense logging and budget utilization alerts
- **Activity Feed**: Real-time project-wide activity tracking to keep teams synced on all changes

### Frontend (React + Vite)
- **Role-based UI**: Protected routes and navigation based on user roles
- **Modern Design**: Clean, responsive interface with Tailwind CSS
- **Real-time Updates**: Socket.IO integration for live collaboration
- **Kanban Board**: Drag & drop task management with react-beautiful-dnd
- **Rich Text Editor**: Notes with version history and comparison
- **Analytics Dashboard**: Comprehensive charts for task progress and financial health using Recharts
- **Activity Feed UI**: Real-time notification system for project updates and team actions
- **Financial Tracker**: Dedicated budget management interface with interactive utilization meters

## 🛠️ Tech Stack

### Backend
🔧 Backend
Runtime: Node.js
Framework: Express.js
Database: MongoDB with Mongoose ODM
Authentication: JWT + bcrypt
Real-time Communication: Socket.IO
AI Integration: Gemini API
Validation: Joi
Security: Helmet, CORS, Rate Limiting

### Frontend
Framework: React 18
Build Tool: Vite
Styling: Tailwind CSS
State Management: React Context API + Hooks
Routing: React Router v6
Real-time Communication: Socket.IO Client
UI Components: Lucide React Icons
Forms Handling: React Hook Form
Charts & Analytics: Recharts

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or yarn package manager

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <https://github.com/your-username/collabmind.git>
cd collabmind
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install all dependencies (backend + frontend)
npm run install-all
```

### 3. Environment Configuration

#### Backend (.env)
Create `server/config.env`:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=your_mongodb_connection_string_here

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Frontend
The frontend is configured to proxy API calls to the backend automatically.

### 4. Start the Application

#### Development Mode (Both Backend & Frontend)
```bash
npm run dev
```

#### Backend Only
```bash
npm run server
```

#### Frontend Only
```bash
npm run client
```

### 5. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

## 🔧 Configuration

### MongoDB Setup
1. Create a MongoDB database (local or Atlas)
2. Update `MONGODB_URI` in `server/config.env`
3. The application will automatically create collections and indexes

### Gemini AI Setup
1. Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add it to `GEMINI_API_KEY` in `server/config.env`

### JWT Secret
1. Generate a secure random string for `JWT_SECRET`
2. Use a strong secret in production

## 📱 Usage

### 1. User Registration & Login
- Navigate to `/register` to create a new account
- Use `/login` to access existing accounts
- Demo account: `demo@projecthub.com` / `demo123`

### 2. Project Management
- Create projects with different visibility levels
- Invite team members with specific roles
- Set project priorities and deadlines

### 3. Task Management
- Use Kanban board for visual task organization
- Drag & drop tasks between status columns
- Assign tasks to team members
- Track time and progress

### 4. Real-time Collaboration
- Whiteboard collaboration with multiple users
- Live chat with typing indicators
- Real-time project updates

### 5. AI Ideation
- Generate ideas using Gemini AI
- Save and organize AI-generated content
- Track implementation progress
  
### 6. Authentication & Authorization
- JWT-based Authentication
- Secure Password Hashing with bcrypt
- Role-Based Access Control (Admin, Member, Viewer)

### 7. Notes & Documentation
- Rich Text Notes Editor
- Version History & Comparison

### 8. Analytics Dashboard
- Project Progress Visualization
- Financial Utilization Tracking
- AI-generated Insights
- Recharts-based Graphs

### 9. Budget & Expense Management
- Budget Allocation
- Expense Tracking
- Utilization Alerts
- Financial Monitoring Dashboard

## 🔒 Role-Based Access Control

### Admin
- Full system access
- User management
- System settings
- All project permissions

### Member
- Create and manage projects
- Full task management
- Whiteboard collaboration
- Chat and notes access

### Viewer
- View projects and tasks
- Read-only access to most features
- Limited collaboration tools

## 🧪 Testing

### Backend Tests
```bash
cd server
npm test
```

### Frontend Tests
```bash
cd client
npm test
```

### Run All Tests
```bash
npm run test
```

## 📦 Build & Deployment

### Frontend Build
```bash
npm run build
```

### Production Deployment
1. Set `NODE_ENV=production` in environment
2. Update MongoDB connection string
3. Configure production JWT secret
4. Set up reverse proxy (nginx recommended)
5. Use PM2 or similar for process management

## 🔍 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/me` - Update profile

### Project Endpoints
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Task Endpoints
- `GET /api/tasks` - List tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `PATCH /api/tasks/:id/status` - Update task status

### Activity & Financial Endpoints
- `GET /api/activity/project/:projectId` - Get project activity feed
- `POST /api/projects/:projectId/budget` - Update project budget
- `POST /api/projects/:projectId/expenses` - Add a project expense
- `DELETE /api/projects/:projectId/expenses/:expenseId` - Remove an expense

### Whiteboard Endpoints
- `GET /api/whiteboard` - List whiteboards
- `POST /api/whiteboard` - Create whiteboard
- `GET /api/whiteboard/:id` - Get whiteboard
- `PUT /api/whiteboard/:id` - Update whiteboard

### AI Ideation Endpoints
- `GET /api/ai` - List AI ideas
- `POST /api/ai` - Create AI idea
- `POST /api/ai/generate` - Generate new idea with AI

## 🚨 Security Features

- JWT Authentication
- bcrypt Password Encryption
- Role-based access control
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation with Joi
- SQL injection protection (MongoDB)

## 🔧 Customization

### Adding New Features
1. Create models in `server/models/`
2. Add routes in `server/routes/`
3. Create frontend components in `client/src/components/`
4. Add pages in `client/src/pages/`
5. Update navigation in `client/src/components/Layout/Sidebar.jsx`

### Styling
- Modify `client/tailwind.config.js` for theme changes
- Update `client/src/index.css` for custom styles
- Use Tailwind CSS utility classes for component styling

## 🐛 Troubleshooting

### Common Issues

#### MongoDB Connection Failed
- Check MongoDB service is running
- Verify connection string in `server/config.env`
- Ensure network access to MongoDB

#### Socket.IO Connection Issues
- Check backend is running on port 5000
- Verify CORS configuration
- Check browser console for errors

#### Build Errors
- Clear `node_modules` and reinstall
- Check Node.js version compatibility
- Verify all dependencies are installed

### Debug Mode
Set `NODE_ENV=development` for detailed error messages and logging.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Push to Branch
5. Open pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Express.js team for the powerful backend framework
- MongoDB team for providing a scalable NoSQL database
- React team for the modern frontend library
- Tailwind CSS for the utility-first styling framework
- Socket.IO for enabling real-time communication
- Google for Gemini AI integration and AI capabilities
- Vite for fast frontend development and optimized builds
- Recharts for analytics and data visualization components
- Lucide React for beautiful and customizable icons
- Open-source community for libraries, tools, and continuous support

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation

---

**CollabMind - Real-Time AI Assisted Collaborative Project Management Platform. 🚀
