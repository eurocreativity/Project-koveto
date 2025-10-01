# 📡 Project Tracker Backend API

Node.js + Express + Socket.IO + MySQL backend for the Project Tracker application.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your database credentials
```

### 3. Create Database
```bash
# Login to MySQL
mysql -u root -p

# Create database and user
CREATE DATABASE project_tracker;
CREATE USER 'project_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON project_tracker.* TO 'project_user'@'localhost';
FLUSH PRIVILEGES;
exit;

# Import schema
mysql -u project_user -p project_tracker < schema.sql
```

### 4. Run Development Server
```bash
npm run dev
# or
npm start
```

Server will start on `http://localhost:3001`

---

## 📋 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user (returns JWT token)
- `GET /api/auth/me` - Get current user info (requires auth)
- `POST /api/auth/logout` - Logout user

### Projects
- `GET /api/projects` - Get all projects (with filters)
- `GET /api/projects/:id` - Get project by ID (with tasks)
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Tasks
- `GET /api/tasks` - Get all tasks (with filters)
- `GET /api/tasks/:id` - Get task by ID
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

---

## 🔌 Socket.IO Events

### Client → Server
```javascript
socket.emit('join:project', projectId);
socket.emit('leave:project', projectId);
socket.emit('project:updated', project);
socket.emit('task:created', task);
```

### Server → Client (broadcasts)
```javascript
socket.on('project:updated', (project) => { ... });
socket.on('project:created', (project) => { ... });
socket.on('project:deleted', ({ id }) => { ... });
socket.on('task:updated', (task) => { ... });
socket.on('task:created', (task) => { ... });
socket.on('task:deleted', ({ id }) => { ... });
socket.on('user:online', ({ userId }) => { ... });
socket.on('user:offline', ({ socketId }) => { ... });
```

---

## 🔐 Authentication

All protected routes require JWT token in Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Example Login Request
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"janos@example.com","password":"password123"}'
```

### Example Authenticated Request
```bash
curl -X GET http://localhost:3001/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📦 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js       # MySQL connection pool
│   │   └── jwt.js            # JWT utilities
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── projectController.js
│   │   └── taskController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── errorHandler.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── projects.js
│   │   └── tasks.js
│   ├── sockets/
│   │   └── projectSocket.js  # Socket.IO handlers
│   └── server.js             # Main server file
├── schema.sql                # Database schema
├── ecosystem.config.js       # PM2 configuration
├── package.json
├── .env.example
└── README.md
```

---

## 🚢 Production Deployment (ISPConfig)

### 1. Upload Files
```bash
scp -r backend/ user@server:/var/www/clients/client1/web1/private/project-tracker-api/
```

### 2. Install Dependencies
```bash
ssh user@server
cd /var/www/clients/client1/web1/private/project-tracker-api
npm install --production
```

### 3. Configure .env
```bash
nano .env
# Set production values
```

### 4. Import Database Schema
```bash
mysql -u project_user -p project_tracker < schema.sql
```

### 5. Start with PM2
```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### 6. Configure Nginx Reverse Proxy (ISPConfig)
Add to Sites → Options → Nginx Directives:

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:3001/api/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}

location /socket.io/ {
    proxy_pass http://127.0.0.1:3001/socket.io/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

---

## 🧪 Testing

### Health Check
```bash
curl http://localhost:3001/api/health
```

### Test Socket.IO Connection
Open browser console and run:
```javascript
const socket = io('http://localhost:3001');
socket.on('connect', () => console.log('Connected!'));
```

---

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | development |
| `PORT` | Server port | 3001 |
| `DB_HOST` | MySQL host | localhost |
| `DB_USER` | MySQL username | project_user |
| `DB_PASSWORD` | MySQL password | - |
| `DB_NAME` | Database name | project_tracker |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRES_IN` | Token expiration | 7d |
| `CORS_ORIGIN` | Allowed CORS origin | http://localhost:8000 |

---

## 🛠️ Troubleshooting

### Database Connection Error
```bash
# Check MySQL is running
sudo systemctl status mysql

# Test connection
mysql -u project_user -p project_tracker
```

### PM2 Not Starting
```bash
# Check logs
pm2 logs project-tracker-api

# Restart
pm2 restart project-tracker-api
```

### Socket.IO Connection Failed
- Check CORS_ORIGIN in .env matches frontend URL
- Verify Nginx proxy configuration
- Check firewall allows port 3001 (if testing locally)

---

## 📄 License

MIT
