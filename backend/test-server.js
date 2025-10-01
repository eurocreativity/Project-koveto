/**
 * Mock API server for testing (no database required)
 * This server simulates the API endpoints with in-memory data
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:8000',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

app.use(cors());
app.use(express.json());

const JWT_SECRET = 'test_secret_key';

// In-memory data storage
let users = [
  { id: 1, name: 'Admin User', email: 'admin@example.com', password_hash: bcrypt.hashSync('password123', 10), role: 'admin' },
  { id: 2, name: 'Kovács János', email: 'janos@example.com', password_hash: bcrypt.hashSync('password123', 10), role: 'user' },
  { id: 3, name: 'Nagy Anna', email: 'anna@example.com', password_hash: bcrypt.hashSync('password123', 10), role: 'user' }
];

let projects = [
  { id: 1, name: 'E-commerce platform', description: 'Online webshop', start_date: '2025-01-15', end_date: '2025-04-30', owner_id: 2, status: 'in_progress', color: '#667eea', owner_name: 'Kovács János' },
  { id: 2, name: 'Mobile UI design', description: 'iOS/Android design', start_date: '2025-02-01', end_date: '2025-03-15', owner_id: 3, status: 'in_progress', color: '#764ba2', owner_name: 'Nagy Anna' }
];

let tasks = [
  { id: 1, project_id: 1, name: 'Backend API', description: 'REST API', start_date: '2025-01-15', deadline: '2025-02-15', owner_id: 2, status: 'completed', priority: 'high', owner_name: 'Kovács János', project_name: 'E-commerce platform' },
  { id: 2, project_id: 1, name: 'Frontend components', description: 'React components', start_date: '2025-02-16', deadline: '2025-03-30', owner_id: 2, status: 'in_progress', priority: 'high', owner_name: 'Kovács János', project_name: 'E-commerce platform' }
];

let nextProjectId = 3;
let nextTaskId = 3;
let nextUserId = 4;

// Auth middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Mock API is running', timestamp: new Date().toISOString() });
});

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (users.find(u => u.email === email)) {
    return res.status(400).json({ success: false, message: 'Email already registered' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = { id: nextUserId++, name, email, password_hash: passwordHash, role: 'user' };
  users.push(user);

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);

  res.status(201).json({
    success: true,
    message: 'User registered',
    data: { user: { id: user.id, name: user.name, email: user.email, role: user.role }, token }
  });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  const user = users.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);

  res.json({
    success: true,
    message: 'Login successful',
    data: { user: { id: user.id, name: user.name, email: user.email, role: user.role }, token }
  });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  res.json({
    success: true,
    data: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
});

// Project routes
app.get('/api/projects', authMiddleware, (req, res) => {
  res.json({ success: true, data: projects });
});

app.get('/api/projects/:id', authMiddleware, (req, res) => {
  const project = projects.find(p => p.id === parseInt(req.params.id));
  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found' });
  }

  const projectTasks = tasks.filter(t => t.project_id === project.id);
  const completedTasks = projectTasks.filter(t => t.status === 'completed').length;
  const progress = projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : 0;

  res.json({
    success: true,
    data: { ...project, tasks: projectTasks, task_count: projectTasks.length, completed_tasks: completedTasks, progress }
  });
});

app.post('/api/projects', authMiddleware, (req, res) => {
  const { name, description, start_date, end_date, owner_id, status = 'open', color = '#667eea' } = req.body;

  const owner = users.find(u => u.id === owner_id);
  const project = {
    id: nextProjectId++,
    name,
    description,
    start_date,
    end_date,
    owner_id,
    status,
    color,
    owner_name: owner ? owner.name : 'Unknown'
  };

  projects.push(project);
  io.emit('project:created', project);

  res.status(201).json({ success: true, message: 'Project created', data: project });
});

app.put('/api/projects/:id', authMiddleware, (req, res) => {
  const projectIndex = projects.findIndex(p => p.id === parseInt(req.params.id));
  if (projectIndex === -1) {
    return res.status(404).json({ success: false, message: 'Project not found' });
  }

  projects[projectIndex] = { ...projects[projectIndex], ...req.body };
  io.emit('project:updated', projects[projectIndex]);

  res.json({ success: true, message: 'Project updated', data: projects[projectIndex] });
});

app.delete('/api/projects/:id', authMiddleware, (req, res) => {
  const projectIndex = projects.findIndex(p => p.id === parseInt(req.params.id));
  if (projectIndex === -1) {
    return res.status(404).json({ success: false, message: 'Project not found' });
  }

  projects.splice(projectIndex, 1);
  tasks = tasks.filter(t => t.project_id !== parseInt(req.params.id));
  io.emit('project:deleted', { id: parseInt(req.params.id) });

  res.json({ success: true, message: 'Project deleted' });
});

// Task routes
app.get('/api/tasks', authMiddleware, (req, res) => {
  res.json({ success: true, data: tasks });
});

app.post('/api/tasks', authMiddleware, (req, res) => {
  const { project_id, name, description, start_date, deadline, owner_id, status = 'open', priority = 'medium' } = req.body;

  const owner = users.find(u => u.id === owner_id);
  const project = projects.find(p => p.id === project_id);

  const task = {
    id: nextTaskId++,
    project_id,
    name,
    description,
    start_date,
    deadline,
    owner_id,
    status,
    priority,
    owner_name: owner ? owner.name : 'Unknown',
    project_name: project ? project.name : 'Unknown'
  };

  tasks.push(task);
  io.emit('task:created', task);

  res.status(201).json({ success: true, message: 'Task created', data: task });
});

app.put('/api/tasks/:id', authMiddleware, (req, res) => {
  const taskIndex = tasks.findIndex(t => t.id === parseInt(req.params.id));
  if (taskIndex === -1) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  tasks[taskIndex] = { ...tasks[taskIndex], ...req.body };
  io.emit('task:updated', tasks[taskIndex]);

  res.json({ success: true, message: 'Task updated', data: tasks[taskIndex] });
});

app.delete('/api/tasks/:id', authMiddleware, (req, res) => {
  const taskIndex = tasks.findIndex(t => t.id === parseInt(req.params.id));
  if (taskIndex === -1) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  const task = tasks[taskIndex];
  tasks.splice(taskIndex, 1);
  io.emit('task:deleted', { id: parseInt(req.params.id), project_id: task.project_id });

  res.json({ success: true, message: 'Task deleted' });
});

// Socket.IO
io.on('connection', (socket) => {
  console.log(`✅ Socket connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`❌ Socket disconnected: ${socket.id}`);
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('🧪 Mock API Server for Testing');
  console.log('='.repeat(50));
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`✅ Health: http://localhost:${PORT}/api/health`);
  console.log(`⚡ Socket.IO: Enabled`);
  console.log('='.repeat(50));
});
