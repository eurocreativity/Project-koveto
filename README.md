# 📊 Projekt Követő Rendszer

Real-time projekt- és feladatkövető alkalmazás Socket.IO alapú szinkronizációval.

[![Node.js](https://img.shields.io/badge/Node.js-20.x-green)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18-blue)](https://expressjs.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.6-black)](https://socket.io/)
[![Playwright](https://img.shields.io/badge/Tests-28%20PASSED-success)](https://playwright.dev/)

---

## 🎯 Funkciók

### ✅ Készült:
- 🔐 **Multi-user authentikáció** (JWT + bcrypt)
- 📁 **Projekt kezelés** (CRUD műveletek)
- ✅ **Feladat kezelés** (CRUD műveletek)
- ⚡ **Real-time szinkronizáció** (Socket.IO WebSocket)
- 📅 **Naptár integráció** (FullCalendar.js)
- 📊 **Dashboard** (statisztikák, progress tracking)
- 🎨 **Modern UI** (Glassmorphism design)
- 🧪 **28 automatikus teszt** (Playwright)

### 🚧 Fejlesztés alatt:
- Task CRUD űrlapok frontend-en
- Projekt szerkesztés/törlés UI
- User management (admin panel)
- Export/Import (JSON, CSV, Excel)
- Email értesítések
- Dark mode

---

## 🚀 Gyors indítás

### Előfeltételek:
- Node.js 18+ telepítve
- Python 3 (HTTP szerver futtatásához)

### 1. Backend indítása
```bash
cd backend
npm install
node test-server.js
```
✅ Backend fut: http://localhost:3001

### 2. Frontend indítása
```bash
cd frontend
python -m http.server 8000
```
✅ Alkalmazás fut: http://localhost:8000

### 3. Bejelentkezés
- **Email:** janos@example.com
- **Jelszó:** password123

---

## 🧪 Tesztelés

### Backend tesztek futtatása
```bash
cd backend

# REST API tesztek (20 teszt)
npx playwright test api-tests.spec.js --reporter=list

# Socket.IO tesztek (8 teszt)
npx playwright test socket-tests.spec.js --reporter=list

# Minden teszt
npx playwright test --reporter=list
```

**Eredmény:** 28/28 PASSED ✅

---

## 📁 Projekt struktúra

```
project-tracker/
├── backend/                    # Node.js API szerver
│   ├── src/
│   │   ├── config/            # Database, JWT config
│   │   ├── controllers/       # Business logic
│   │   ├── middleware/        # Auth, error handling
│   │   ├── routes/            # API routes
│   │   ├── sockets/           # Socket.IO handlers
│   │   └── server.js          # Main server
│   ├── test-server.js         # Mock API (no MySQL)
│   ├── api-tests.spec.js      # REST API tests
│   ├── socket-tests.spec.js   # Socket.IO tests
│   ├── schema.sql             # MySQL database schema
│   └── README.md              # Backend docs
├── frontend/
│   └── index.html             # Single-page app (~19KB)
├── project-summary.md         # Full documentation (HU)
├── SESSION-STATUS.md          # Development status
├── QUICK-START.md             # Quick start guide
└── README.md                  # This file
```

---

## 🛠️ Tech Stack

### Backend:
- **Runtime:** Node.js 20.x
- **Framework:** Express.js 4.18
- **Real-time:** Socket.IO 4.6
- **Database:** MySQL 8.0 / MariaDB 10.x
- **Auth:** JWT + bcrypt
- **Security:** Helmet, CORS, Rate limiting

### Frontend:
- **Core:** Vanilla JavaScript (ES6+)
- **UI:** HTML5 + CSS3 (Glassmorphism)
- **Calendar:** FullCalendar.js 6.1
- **Real-time:** Socket.IO client 4.6

### Testing:
- **Framework:** Playwright
- **Coverage:** REST API + Socket.IO
- **Tests:** 28 (100% passing)

---

## 📖 API Dokumentáció

### Authentication
```
POST   /api/auth/register      # Create new user
POST   /api/auth/login         # Login (returns JWT)
GET    /api/auth/me            # Get current user
POST   /api/auth/logout        # Logout
```

### Projects
```
GET    /api/projects           # List all projects
GET    /api/projects/:id       # Get project details
POST   /api/projects           # Create project
PUT    /api/projects/:id       # Update project
DELETE /api/projects/:id       # Delete project
```

### Tasks
```
GET    /api/tasks              # List all tasks
GET    /api/tasks/:id          # Get task details
POST   /api/tasks              # Create task
PUT    /api/tasks/:id          # Update task
DELETE /api/tasks/:id          # Delete task
```

### Socket.IO Events
```javascript
// Server → Client broadcasts
socket.on('project:created', (project) => {})
socket.on('project:updated', (project) => {})
socket.on('project:deleted', ({ id }) => {})
socket.on('task:created', (task) => {})
socket.on('task:updated', (task) => {})
socket.on('task:deleted', ({ id }) => {})
```

**Teljes API dokumentáció:** [backend/README.md](./backend/README.md)

---

## 🎨 Screenshots

### Dashboard
![Dashboard with projects and statistics]

### Calendar View
![FullCalendar with projects and tasks]

### Real-time Sync
![Two browser tabs showing live synchronization]

*(Screenshots hozzáadandó)*

---

## 🚢 Production Deployment

### ISPConfig 3.2 + MySQL

**Részletes útmutató:** [project-summary.md](./project-summary.md) - "7. ISPConfig telepítés"

**Röviden:**
1. Node.js 20.x telepítése
2. MySQL adatbázis létrehozása + schema import
3. Backend feltöltése + npm install
4. PM2 setup (autostart)
5. Nginx reverse proxy konfiguráció
6. Frontend feltöltése web root-ba
7. SSL tanúsítvány (Let's Encrypt)

---

## 🐛 Troubleshooting

### Backend nem indul
```bash
cd backend
npm install
node test-server.js
```

### Frontend nem elérhető
```bash
cd frontend
python -m http.server 8000
# Böngészőben: http://localhost:8000
```

### Port foglalt hiba
- Backend: módosítsd a `PORT` env változót
- Frontend: használj másik portot (`python -m http.server 8080`)

### Socket.IO connection timeout
- Ellenőrizd a CORS beállítást (`.env` fájlban)
- Biztosítsd hogy mindkét szerver fut

---

## 📝 Demo Users

| Email | Password | Role |
|-------|----------|------|
| janos@example.com | password123 | user |
| anna@example.com | password123 | user |
| admin@example.com | password123 | admin |

---

## 🤝 Contributing

1. Fork the project
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details

---

## 📚 További Dokumentáció

- 📖 [project-summary.md](./project-summary.md) - Teljes projekt dokumentáció (Magyar)
- 🚀 [QUICK-START.md](./QUICK-START.md) - Gyors indítási útmutató
- 📊 [SESSION-STATUS.md](./SESSION-STATUS.md) - Fejlesztési állapot
- 🔧 [backend/README.md](./backend/README.md) - Backend dokumentáció

---

## 👨‍💻 Author

Fejlesztve Claude Code (Anthropic) segítségével

---

## 🙏 Acknowledgments

- [Express.js](https://expressjs.com/)
- [Socket.IO](https://socket.io/)
- [FullCalendar](https://fullcalendar.io/)
- [Playwright](https://playwright.dev/)

---

**⭐ Ha tetszik a projekt, adj egy csillagot! ⭐**
