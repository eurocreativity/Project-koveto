# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Projekt Követő Rendszer** (Project Tracker System) - A real-time project and task tracking web application with Socket.IO-based synchronization.

This is a **Node.js + Express + Socket.IO backend** with a **single-page HTML frontend** (~65KB), featuring MySQL database integration and JWT authentication.

## Development Commands

### Backend Development
```bash
# Install dependencies
cd backend
npm install

# Start development server (with nodemon)
npm run dev

# Start production server
npm start

# Mock API server (no MySQL required - for testing)
node test-server.js
```

### Frontend Development
```bash
# Serve frontend on http://localhost:8000
cd frontend
python -m http.server 8000
```

### Testing
```bash
cd backend

# Run all Playwright tests (48 tests)
npx playwright test --reporter=list

# Run specific test suites
npx playwright test api-tests.spec.js --reporter=list          # REST API tests (20)
npx playwright test socket-tests.spec.js --reporter=list       # Socket.IO tests (8)
npx playwright test user-tests.spec.js --reporter=list         # User management tests
npx playwright test frontend-tests.spec.js --reporter=list     # E2E frontend tests (15)
npx playwright test quick-tests.spec.js --reporter=list        # Quick E2E tests (10)

# Run tests in headed mode (with browser UI)
npx playwright test --headed

# Run single test
npx playwright test -g "should login successfully"

# Show test report
npx playwright show-report
```

### Database Setup
```bash
# Login to MySQL/MariaDB
mysql -u root -p

# Create database and user
CREATE DATABASE project_tracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'project_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON project_tracker.* TO 'project_user'@'localhost';
FLUSH PRIVILEGES;
exit;

# Import schema
mysql -u project_user -p project_tracker < backend/schema.sql

# OR import seed data (includes demo users and projects)
mysql -u project_user -p project_tracker < backend/seed-demo-data.sql
```

### Production Deployment (PM2)
```bash
# Start backend with PM2
cd backend
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

# Monitor
pm2 status
pm2 logs project-tracker-api
pm2 monit

# Restart
pm2 restart project-tracker-api
```

## Architecture Overview

### Tech Stack

**Backend:**
- **Runtime:** Node.js 20.x
- **Framework:** Express.js 4.18
- **Real-time:** Socket.IO 4.6 (WebSocket)
- **Database:** MySQL 8.0 / MariaDB 10.x
- **Authentication:** JWT + bcrypt
- **Security:** Helmet, CORS, Rate limiting
- **Email:** Nodemailer (with node-cron for deadline reminders)

**Frontend:**
- **Core:** Vanilla JavaScript (ES6+) - Single HTML file
- **UI:** HTML5 + CSS3 (Glassmorphism design)
- **Calendar:** FullCalendar.js 6.1 (with drag & drop)
- **Real-time:** Socket.IO client 4.6
- **Charts:** Chart.js (dashboard visualizations)

**Testing:**
- **Framework:** Playwright
- **Coverage:** REST API + Socket.IO + Frontend E2E
- **Total Tests:** 48 (28 backend + 15 frontend + 5 quick)

### Project Structure

```
project-koveto/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js          # MySQL connection pool
│   │   │   └── jwt.js               # JWT utilities
│   │   ├── controllers/
│   │   │   ├── authController.js    # Login, register, logout
│   │   │   ├── projectController.js # Project CRUD
│   │   │   ├── taskController.js    # Task CRUD (with email)
│   │   │   └── userController.js    # User management
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js    # JWT verification
│   │   │   └── errorHandler.js      # Global error handling
│   │   ├── routes/
│   │   │   ├── auth.js              # POST /api/auth/login, register
│   │   │   ├── projects.js          # CRUD /api/projects
│   │   │   ├── tasks.js             # CRUD /api/tasks
│   │   │   ├── users.js             # GET /api/users
│   │   │   └── calendar.js          # GET /api/calendar/events
│   │   ├── services/
│   │   │   ├── emailService.js      # Nodemailer (Gmail SMTP)
│   │   │   └── deadlineChecker.js   # Cron job (daily 8:00)
│   │   ├── sockets/
│   │   │   └── projectSocket.js     # Socket.IO real-time handlers
│   │   └── server.js                # Express + Socket.IO setup
│   ├── test-server.js               # Mock API (no MySQL)
│   ├── *.spec.js                    # Playwright tests
│   ├── schema.sql                   # Database schema
│   ├── seed-demo-data.sql           # Demo data (3 users, 3 projects, 13 tasks)
│   ├── package.json
│   ├── .env.example
│   └── ecosystem.config.js          # PM2 config
├── frontend/
│   ├── index.html                   # Single-page app (~65KB)
│   └── index-*.html                 # Backup files
├── project-summary.md               # Full documentation (Hungarian)
├── NEXT-SESSION.md                  # Development roadmap
└── README.md
```

### Data Models (MySQL)

**Key Tables:**
- `users` - User accounts (id, name, email, password_hash, role, avatar_url)
- `projects` - Projects (id, name, description, start_date, end_date, owner_id, status, color)
- `tasks` - Tasks (id, project_id, name, description, deadline, owner_id, status, priority)
- `settings` - App settings (key_name, value_text)

**Status Enums:**
- Project/Task status: `open`, `in_progress`, `completed`
- Task priority: `low`, `medium`, `high`
- User role: `admin`, `user`

### Real-time Architecture (Socket.IO)

**Server broadcasts:**
```javascript
io.emit('project:created', project);   // New project
io.emit('project:updated', project);   // Project modified
io.emit('project:deleted', { id });    // Project deleted
io.emit('task:created', task);         // New task
io.emit('task:updated', task);         // Task modified (deadline, status, etc.)
io.emit('task:deleted', { id });       // Task deleted
io.emit('user:online', { userId });    // User connected
```

**Client handlers (frontend/index.html):**
```javascript
socket.on('project:created', addProjectToDOM);
socket.on('task:updated', updateTaskInDOM);
socket.on('task:deleted', removeTaskFromDOM);
// + calendar refresh, notifications
```

### Frontend Features

**Main Sections (Tabs):**
1. **Dashboard (📊)** - Statistics, project breakdowns, Chart.js visualizations
2. **Projects (📁)** - Project cards with Edit/Delete/Details buttons
3. **Tasks (✅)** - Task list with filters (project, status, priority)
4. **Calendar (📅)** - FullCalendar with drag & drop (updates deadline via Socket.IO)
5. **New Project (➕)** - Create/Edit project form
6. **New Task (➕)** - Create/Edit task form
7. **Settings (⚙️)** - Import/Export (CSV, JSON, Full Backup), Dark mode toggle

**Key JavaScript Functions:**
- `loadProjects()` - GET /api/projects
- `saveProject(event)` - POST/PUT project (broadcasts via Socket.IO)
- `deleteProject(projectId)` - DELETE with confirmation
- `showProjectDetails(projectId)` - Modal with tasks, progress bar
- `loadTasks()` - GET /api/tasks
- `renderTasks()` - Filter by project/status/priority
- `saveTask(event)` - POST/PUT task (triggers email notification)
- `deleteTask(taskId)` - DELETE with confirmation
- `exportToCSV(data, filename)` - CSV export (projects/tasks)
- `exportAllData()` - Full JSON backup
- `performImport()` - JSON import (FileReader API)
- `toggleDarkMode()` - CSS variables + localStorage

### Email Notifications (Nodemailer)

**Environment Variables:**
```bash
EMAIL_ENABLED=false        # Set to 'true' in production
EMAIL_FROM="Projekt Követő <noreply@project.hu>"
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password  # Gmail App Password (16 chars)
```

**Email Types:**
- Task assignment (when task created/updated with new owner)
- Deadline reminders (1 day, 3 days before deadline)
- Status change notifications
- Project created notifications

**Cron Job:**
- Runs daily at 8:00 AM (deadlineChecker.js)
- Checks tasks with deadlines in 1 or 3 days
- Sends reminder emails to task owners

### Authentication Flow

1. User submits login form → `POST /api/auth/login`
2. Backend validates credentials (bcrypt compare)
3. JWT token generated (7 day expiry)
4. Token stored in `localStorage.authToken`
5. All API requests include `Authorization: Bearer <token>`
6. Socket.IO connection includes token in auth object
7. Logout clears token and redirects to login

**Demo Users (seed-demo-data.sql):**
- janos@example.com / password123 (user)
- anna@example.com / password123 (user)
- admin@example.com / password123 (admin)

## Important Notes

### Real-time Sync Pattern
- Every CRUD operation (Create/Update/Delete) triggers a Socket.IO broadcast
- Frontend listens to broadcasts and updates DOM without page reload
- Supports multiple concurrent users (2-10 recommended)
- Automatic reconnect on connection loss

### Testing Strategy
1. **Backend API tests** - REST endpoints (Playwright)
2. **Socket.IO tests** - Real-time events (Playwright with socket.io-client)
3. **Frontend E2E tests** - User flows (Playwright headed mode)
4. **Quick tests** - Critical paths (login, dashboard, calendar)

### Production Deployment (ISPConfig)
- Backend runs on PM2 (port 3001, not exposed)
- Nginx reverse proxy: `/api/` → `http://127.0.0.1:3001/api/`
- WebSocket proxy: `/socket.io/` → `http://127.0.0.1:3001/socket.io/`
- Frontend served from web root (Apache/Nginx)
- MySQL database with connection pooling
- SSL via Let's Encrypt (automatic in ISPConfig)

### Database Connection
- Uses `mysql2` connection pool (max 10 connections)
- Automatic reconnect on disconnect
- Prepared statements (SQL injection protection)
- UTF-8 encoding (utf8mb4_unicode_ci)

### Security Features
- JWT tokens (7 day expiry, configurable)
- bcrypt password hashing (10 rounds)
- Helmet.js security headers
- CORS origin validation
- Rate limiting (100 req/15min per IP)
- SQL injection protection (prepared statements)
- XSS protection (input sanitization)

## Common Development Tasks

### Adding a New API Endpoint
1. Create route handler in `backend/src/routes/`
2. Implement controller logic in `backend/src/controllers/`
3. Add Socket.IO broadcast if real-time sync needed
4. Update frontend API calls and event listeners
5. Write Playwright test in `backend/*.spec.js`

### Adding a New Frontend Feature
1. Edit `frontend/index.html` (single file)
2. Add HTML markup in appropriate section
3. Implement JavaScript logic (async/await for API calls)
4. Add Socket.IO event listeners if needed
5. Test in browser with DevTools Console

### Debugging Real-time Issues
```bash
# Backend Socket.IO logs
pm2 logs project-tracker-api | grep "socket"

# Frontend Socket.IO status (browser console)
socket.connected  // true/false
socket.id         // socket ID

# Monitor WebSocket frames (Chrome DevTools)
Network tab → WS → socket.io → Frames
```

### Database Migrations
- Manually create SQL migration files
- Apply with: `mysql -u project_user -p project_tracker < migration.sql`
- No ORM used (raw SQL + mysql2)

## Environment Setup

**Minimum Requirements:**
- Node.js 18+ (recommend 20.x)
- npm 9+
- MySQL 8.0 or MariaDB 10.4+
- Python 3 (for frontend HTTP server)

**Development .env:**
```bash
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_USER=project_user
DB_PASSWORD=your_password
DB_NAME=project_tracker
JWT_SECRET=dev_secret_change_in_production
CORS_ORIGIN=http://localhost:8000
EMAIL_ENABLED=false
```

**Production .env:**
```bash
NODE_ENV=production
PORT=3001
DB_HOST=localhost
DB_USER=project_user
DB_PASSWORD=strong_random_password
DB_NAME=project_tracker
JWT_SECRET=random_64_char_secret
CORS_ORIGIN=https://project.yourdomain.com
EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
```

## Troubleshooting

### Backend won't start
```bash
# Check MySQL connection
mysql -u project_user -p project_tracker

# Check port availability
lsof -i :3001

# Check logs
pm2 logs project-tracker-api
```

### Socket.IO connection failed
- Verify CORS_ORIGIN matches frontend URL
- Check Nginx proxy configuration (in ISPConfig)
- Check firewall allows port 3001 (dev) or 443/80 (prod)
- Browser console: `socket.on('connect_error', (err) => console.log(err))`

### Tests failing
```bash
# Ensure servers are running
node backend/test-server.js  # Port 3001
python -m http.server 8000   # Frontend port 8000

# Run single test with debug
npx playwright test -g "should login" --headed --debug

# Check Playwright browser installation
npx playwright install
```

### Email not sending
- Check `EMAIL_ENABLED=true` in .env
- Verify Gmail App Password (16 chars, no spaces)
- Test SMTP connection: `node -e "require('./backend/src/services/emailService').sendTaskAssignmentEmail(...)"`
- Check Gmail "Less secure app access" or use App Passwords

## Documentation

- **Full Documentation:** [project-summary.md](./project-summary.md) (Hungarian)
- **Backend API:** [backend/README.md](./backend/README.md)
- **Next Session:** [NEXT-SESSION.md](./NEXT-SESSION.md) (Development roadmap)
- **Quick Start:** [README.md](./README.md)
